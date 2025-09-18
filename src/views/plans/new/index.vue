<template>
  <div class="experiment-new-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <h2 class="title">新建试验方案</h2>
          <p class="subtitle">通过分步向导创建能力试验方案</p>
        </div>
      </template>
    </el-card>

    <el-card class="steps-card">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step v-for="(stepName, index) in steps" :key="index" :title="stepName" />
      </el-steps>

      <div class="step-content">
        <!-- 步骤0：基本信息 -->
        <div v-if="currentStep === 0">
          <BasicInfo
            :form-data="formData"
            :experiment-types="experimentTypes"
            :templates="templates"
            @update:form-data="updateFormData"
            @load-template="loadTemplate"
          />
        </div>

        <!-- 步骤1：试验关键因素 -->
        <div v-else-if="currentStep === 1">
          <KeyFactorsStep
            :form-data="formData"
            @update:key-factors="updateKeyFactors"
          />
        </div>

        <!-- 步骤2：评估指标 -->
        <div v-else-if="currentStep === 2">
          <IndicatorsStep
            :form-data="formData"
            @update:indicators="updateIndicators"
          />
        </div>

        <!-- 步骤3：数据需求 -->
        <div v-else-if="currentStep === 3">
          <template v-if="isStaticEvaluation">
            <DataRequirementsStep
              :form-data="formData"
              @update:data-requirements="updateDataRequirements"
            />
          </template>
          <template v-else>
            <el-alert
              title="当前评估类型无需配置数据需求，系统已自动跳过此步骤。"
              type="info"
              :closable="false"
              show-icon
            />
          </template>
        </div>

        <!-- 步骤4：资源需求 -->
        <div v-else-if="currentStep === 4">
          <ResourceRequirementsStep
            :form-data="formData"
            @update:resource-requirements="updateResourceRequirements"
          />
        </div>

        <!-- 步骤5：试验流程设计 -->
        <div v-else-if="currentStep === 5">
          <FlowDesignStep
            :form-data="formData"
            @update:flow="updateFlow"
          />
        </div>

        <!-- 步骤6：确认创建 -->
        <div v-else-if="currentStep === 6">
          <ExperimentConfirm
            :form-data="formData"
            :experiment-types="experimentTypes"
            :is-creating="isCreating"
            @update:form-data="updateFormData"
            @create="createExperiment"
          />
        </div>
      </div>

      <div class="step-actions">
        <el-button @click="prevStep" :disabled="currentStep === 0">
          上一步
        </el-button>
        <el-button
          v-if="currentStep < steps.length - 1"
          type="primary"
          @click="nextStep"
        >
          下一步
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="createExperiment"
          :loading="isCreating"
        >
          {{ isCreating ? '创建中...' : '确认创建' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPlansDb, DB_NAMES, idbPut, idbGet, idbDelete, generateLocalId } from '@/utils/indexedDb'

// 导入组件
// 这里需要创建这些组件
import BasicInfo from './BasicInfo.vue'
import KeyFactorsStep from './KeyFactorsStep.vue'
import IndicatorsStep from './IndicatorsStep.vue'
import FlowDesignStep from './FlowDesignStep.vue'
import DataRequirementsStep from './DataRequirementsStep.vue'
import ResourceRequirementsStep from './ResourceRequirementsStep.vue'
import ExperimentConfirm from './ExperimentConfirm.vue'

const router = useRouter()
const route = useRoute()

// 步骤定义（顺序：基本信息 -> 关键因素 -> 指标 -> 数据需求 -> 资源需求 -> 流程设计 -> 确认）
const steps = [
  '基本信息',
  '试验关键因素',
  '评估指标',
  '数据需求',
  '资源需求',
  '试验流程设计',
  '确认创建'
]
const currentStep = ref(0)

// 试验类型选项
const experimentTypes = [
  { id: 'static_evaluation', name: '静态评估' },
  { id: 'dynamic_evaluation', name: '动态效能评估' },
  { id: 'interactive_evaluation', name: '互动式评估' }
]

// 模板选项
const templates = [
  { id: 'tpl_1', name: '静态评估模板' },
  { id: 'tpl_2', name: '动态效能评估模板' },
  { id: 'tpl_3', name: '互动式评估模板' }
]

// 表单数据
const formData = reactive({
  // 基本信息
  name: '',
  description: '',
  type: 'static_evaluation',
  templateId: '',
  responsiblePerson: '张三', // 演示固定值
  visibility: ['group_1'],

  // 试验关键因素
  keyFactors: {
    targetId: '',
    purpose: '',
    tasks: [],
    scenario: '',
    personnel: []
  },

  // 评估指标
  indicators: {
    indicatorIds: [],
    weights: {}
  },

  // 试验流程
  // 按子任务配置的流程映射：{ [taskId]: { nodes: [], edges: [] } }
  experimentFlow: {},

  // 数据需求
  dataRequirements: {
    datasetId: 'ds_1',
    requiredFields: [],
    dataCollectionPoints: []
  },

  // 资源需求
  resourceRequirements: {
    personnel: [
      { role: '评估员', count: 1 },
      { role: '技术支持', count: 1 }
    ],
    equipment: [
      { type: 'server', spec: '8核16G', count: 1 },
      { type: 'simulation_terminal', spec: '', count: 2 }
    ],
    baseDatasets: ['user_profile_dataset']
  },

  // 其他选项
  saveAsTemplate: false,
  createTask: false
})

// 计算属性：是否为静态评估
const isStaticEvaluation = computed(() => formData.type === 'static_evaluation')

// === 本地草稿持久化（IndexedDB） ===
const DRAFT_KEY = ref('')
const draftLoaded = ref(false)
const lastSavedAt = ref(0)
const SAVE_INTERVAL_MS = 800

async function loadDraftIfAny() {
  try {
    const db = await getPlansDb()
    // 草稿 key 优先来自路由 query（如从外部传入），否则用固定 key
    DRAFT_KEY.value = String(route.query.draftId || 'current_new_plan')
    const draft = await idbGet(db, DB_NAMES.drafts, DRAFT_KEY.value)
    if (draft && draft.content) {
      Object.assign(formData, draft.content)
      ElMessage.info('已从本地草稿恢复未完成的方案')
    }
  } catch (e) {
    console.error('读取草稿失败', e)
  } finally {
    draftLoaded.value = true
  }
}

async function saveDraftThrottled() {
  const now = Date.now()
  if (now - lastSavedAt.value < SAVE_INTERVAL_MS) return
  lastSavedAt.value = now
  try {
    const db = await getPlansDb()
    const key = DRAFT_KEY.value || 'current_new_plan'
    const payload = {
      id: key,
      updatedAt: new Date().toISOString(),
      content: JSON.parse(JSON.stringify(formData))
    }
    await idbPut(db, DB_NAMES.drafts, payload)
  } catch (e) {
    console.error('保存草稿失败', e)
  }
}

onMounted(() => {
  loadDraftIfAny()
})

// 加载模板数据（从模板管理接口返回的完整 content 结构填充）
const loadTemplate = (templateId) => {
  // 这里为了演示直接与 mock 模板的 id 匹配，生产中应请求 /api/templates 获取 content
  const predefined = {
    tpl_1: {
      type: 'static_evaluation',
      keyFactors: { targetId: 'target_1', purpose: '评估社交机器人识别和反驳虚假信息的能力', tasks: ['task_1','task_2'], scenario: 'scenario_2', personnel: ['评估员A','技术支持B'] },
      indicators: { indicatorIds: ['ind_1','ind_2','ind_5'], weights: { ind_1: 0.4, ind_2: 0.4, ind_5: 0.2 } },
      experimentFlow: { nodes: [{id:'n1',type:'start',label:'开始'},{id:'n2',type:'data_collection',label:'采集数据'},{id:'n3',type:'evaluate',label:'计算指标'},{id:'n4',type:'end',label:'结束'}], edges: [{id:'e1',source:'n1',target:'n2'},{id:'e2',source:'n2',target:'n3'},{id:'e3',source:'n3',target:'n4'}] },
      dataRequirements: { datasetId: 'ds_1', requiredFields: ['user_input','expected_output','timestamp'], dataCollectionPoints: ['n2'] },
      resourceRequirements: { personnel: [{role:'评估员',count:1},{role:'技术支持',count:1}], equipment: [{type:'server',spec:'8核16G',count:1},{type:'simulation_terminal',spec:'',count:2}], baseDatasets: ['user_profile_dataset'] }
    },
    tpl_2: {
      type: 'dynamic_evaluation',
      keyFactors: { targetId: 'target_2', purpose: '评估社交机器人在复杂舆论环境中的引导能力', tasks: ['task_2','task_3'], scenario: 'scenario_1', personnel: ['评估员B','技术支持A','数据分析师C'] },
      indicators: { indicatorIds: ['ind_2','ind_3','ind_4'], weights: { ind_2: 0.3, ind_3: 0.4, ind_4: 0.3 } },
      experimentFlow: { nodes: [{id:'m1',type:'start',label:'开始'},{id:'m2',type:'data_collection',label:'实时采集'},{id:'m3',type:'evaluate',label:'动态评估'},{id:'m4',type:'end',label:'结束'}], edges: [{id:'me1',source:'m1',target:'m2'},{id:'me2',source:'m2',target:'m3'},{id:'me3',source:'m3',target:'m4'}] },
      dataRequirements: { datasetId: 'ds_2', requiredFields: ['user_input','bot_response','response_time'], dataCollectionPoints: ['m2'] },
      resourceRequirements: { personnel: [{role:'评估员',count:2},{role:'技术支持',count:1}], equipment: [{type:'server',spec:'16核32G',count:1},{type:'simulation_terminal',spec:'',count:3}], baseDatasets: ['user_profile_dataset'] }
    }
  }
  const tpl = predefined[templateId]
  if (!tpl) return
  formData.type = tpl.type
  formData.keyFactors = { ...formData.keyFactors, ...tpl.keyFactors }
  formData.indicators = { ...formData.indicators, ...tpl.indicators }
  // 模板中的单一流程结构已不再适用按子任务配置，这里忽略模板的 experimentFlow
  formData.experimentFlow = {}
  formData.dataRequirements = { ...formData.dataRequirements, ...tpl.dataRequirements }
  formData.resourceRequirements = { ...formData.resourceRequirements, ...tpl.resourceRequirements }
  ElMessage.success('已应用模板，表单已自动填充')
}

// 表单验证
const validateStep = (step) => {
  if (step === 0) {
    if (!formData.name) {
      ElMessage.warning('请填写试验方案名称')
      return false
    }
    if (!formData.type) {
      ElMessage.warning('请选择试验类型')
      return false
    }
    return true
  } else if (step === 1) {
    if (!formData.keyFactors.targetId) {
      ElMessage.warning('请选择评估对象')
      return false
    }
    if (formData.keyFactors.tasks.length === 0) {
      ElMessage.warning('请至少选择一个试验任务')
      return false
    }
    if (!formData.keyFactors.scenario) {
      ElMessage.warning('请选择试验场景')
      return false
    }
    return true
  } else if (step === 2) {
    if (formData.indicators.indicatorIds.length === 0) {
      ElMessage.warning('请至少选择一个评估指标')
      return false
    }
    return true
  }
  return true
}

// 步骤导航
const nextStep = () => {
  if (!validateStep(currentStep.value)) {
    return
  }
  // 变更步骤前保存一次草稿
  saveDraftThrottled()
  // 当为非静态评估，跳过“数据需求”（索引 3），直接到“资源需求”（索引 4）
  if (currentStep.value === 3 && !isStaticEvaluation.value) {
    currentStep.value = 4
    return
  }
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  // 非静态评估从“资源需求”（索引 4）返回应跳回“评估指标”（索引 2）
  if (currentStep.value === 4 && !isStaticEvaluation.value) {
    currentStep.value = 2
    return
  }
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 监听试验类型变化，自动调整步骤
watch(() => formData.type, (newType) => {
  // 若在“数据需求”（索引 3）时切换为非静态评估，自动跳到“资源需求”（索引 4）
  if (currentStep.value === 3 && newType !== 'static_evaluation') {
    currentStep.value = 4
  }
})

// 监听表单变化，节流保存草稿
watch(
  () => formData,
  () => {
    if (!draftLoaded.value) return
    saveDraftThrottled()
  },
  { deep: true }
)

// 更新表单数据的方法
const updateFormData = (newData) => { Object.assign(formData, newData) }
const updateKeyFactors = (factors) => { formData.keyFactors = factors }
const updateIndicators = (indicators) => { formData.indicators = indicators }
const updateFlow = (flow) => { formData.experimentFlow = flow }
const updateDataRequirements = (requirements) => { formData.dataRequirements = requirements }
const updateResourceRequirements = (requirements) => { formData.resourceRequirements = requirements }

// 创建试验
const isCreating = ref(false)
const createExperiment = async () => {
  isCreating.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))
    // 将方案写入本地 IndexedDB 的 plans 表
    const db = await getPlansDb()
    const experimentId = generateLocalId('plan_')
    const nowIso = new Date().toISOString()
    const record = {
      id: experimentId,
      name: formData.name || '未命名方案',
      owner: formData.responsiblePerson || '未知',
      status: 'draft',
      createdAt: nowIso,
      lastRunAt: null,
      description: formData.description || '',
      template: formData.templateId ? { id: formData.templateId, name: '' } : null,
      indicators: JSON.parse(JSON.stringify(formData.indicators)),
      keyFactors: JSON.parse(JSON.stringify(formData.keyFactors)),
      experimentFlow: JSON.parse(JSON.stringify(formData.experimentFlow)),
      dataRequirements: JSON.parse(JSON.stringify(formData.dataRequirements)),
      resourceRequirements: JSON.parse(JSON.stringify(formData.resourceRequirements)),
      saveAsTemplate: !!formData.saveAsTemplate,
      visibility: JSON.parse(JSON.stringify(formData.visibility)),
      type: formData.type
    }
    await idbPut(db, DB_NAMES.plans, record)

    // 写入成功后清理草稿
    try {
      const key = DRAFT_KEY.value || 'current_new_plan'
      await idbDelete(db, DB_NAMES.drafts, key)
    } catch {}

    ElMessage.success('试验创建成功')
    if (formData.createTask) {
      router.push(`/plans/${experimentId}/run`)
    } else {
      router.push(`/plans/${experimentId}/overview`)
    }
  } catch (error) {
    console.error('创建失败', error)
    ElMessage.error('创建失败，请重试')
  } finally {
    isCreating.value = false
  }
}

// 如果通过路由参数带入模板，自动加载
const tplFromQuery = route.query.templateId
if (tplFromQuery) {
  formData.templateId = String(tplFromQuery)
  loadTemplate(String(tplFromQuery))
}
</script>

<style lang="scss" scoped>
.experiment-new-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-card {
  margin-bottom: 20px;

  .card-header {
    .title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
    .subtitle { font-size: 14px; color: #909399; margin: 5px 0 0; }
  }
}

.steps-card {
  .step-content { margin-top: 30px; margin-bottom: 30px; min-height: 300px; }
  .step-actions {
    display: flex; justify-content: space-between; border-top: 1px solid #EBEEF5; padding-top: 20px;
    .el-button + .el-button { margin-left: 12px; }
  }
}
</style>


