<template>
  <div class="experiment-confirm-step">
    <h3 class="step-title">确认创建</h3>

    <div class="confirm-info">
      <el-alert
        title='请确认以下实验方案信息，确认无误后点击“确认创建”按钮'
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <el-collapse v-model="activeNames" class="confirm-collapse">
      <el-collapse-item title="基本信息" name="basic">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="实验方案名称">{{ formData.name }}</el-descriptions-item>
          <el-descriptions-item label="实验类型">{{ getExperimentTypeName(formData.type) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ formData.responsiblePerson }}</el-descriptions-item>
          <el-descriptions-item label="使用模板">{{ getTemplateName(formData.templateId) }}</el-descriptions-item>
          <el-descriptions-item label="实验描述" :span="2">{{ formData.description || '无' }}</el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>

      <el-collapse-item title="试验关键因素" name="keyFactors">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评估对象">{{ getTargetName(formData.keyFactors.targetId) }}</el-descriptions-item>
          <el-descriptions-item label="试验场景">{{ getScenarioName(formData.keyFactors.scenario) }}</el-descriptions-item>
          <el-descriptions-item label="试验目的" :span="2">{{ formData.keyFactors.purpose || '无' }}</el-descriptions-item>
          <el-descriptions-item label="试验任务" :span="2">
            <el-tag
              v-for="taskId in formData.keyFactors.tasks"
              :key="taskId"
              class="confirm-tag"
            >
              {{ getTaskName(taskId) }}
            </el-tag>
            <span v-if="formData.keyFactors.tasks.length === 0" class="empty-text">无</span>
          </el-descriptions-item>
          <el-descriptions-item label="人员安排" :span="2">
            <el-tag
              v-for="(person, index) in formData.keyFactors.personnel"
              :key="`person_${index}`"
              class="confirm-tag"
            >
              {{ person }}
            </el-tag>
            <span v-if="formData.keyFactors.personnel.length === 0" class="empty-text">无</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>

      <el-collapse-item title="评估指标" name="indicators">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="指标数量">{{ formData.indicators.indicatorIds.length }}</el-descriptions-item>
          <el-descriptions-item label="权重配置">{{ hasWeights ? '已配置' : '未配置' }}</el-descriptions-item>
        </el-descriptions>

        <div class="indicators-list">
          <div
            v-for="indicatorId in formData.indicators.indicatorIds"
            :key="indicatorId"
            class="indicator-item"
          >
            <el-card shadow="hover">
              <div class="indicator-content">
                <div class="indicator-name">{{ getIndicatorName(indicatorId) }}</div>
                <div class="indicator-weight">权重: {{ formData.indicators.weights[indicatorId] || 0 }}</div>
                <div class="indicator-desc">{{ getIndicatorDescription(indicatorId) }}</div>
              </div>
            </el-card>
          </div>
          <div v-if="formData.indicators.indicatorIds.length === 0" class="empty-indicators">
            <el-empty description="未选择评估指标" />
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item title="试验流程" name="flow">
        <div class="flow-preview">
          <!-- 新结构：按子任务的流程映射 -->
          <template v-if="isFlowMapping">
            <div v-if="selectedTaskIds.length === 0" class="empty-flow">
              <el-empty description="未选择子任务" />
            </div>
            <div v-else>
              <el-card v-for="tid in selectedTaskIds" :key="tid" shadow="never" style="margin-bottom: 12px;">
                <template #header>
                  <div>{{ getTaskName(tid) }}</div>
                </template>
                <div v-if="getTaskFlow(tid).nodes.length === 0" class="empty-flow">
                  <el-empty description="该子任务未设计流程" />
                </div>
                <div v-else class="flow-steps">
                  <el-steps direction="vertical" :active="getTaskFlow(tid).nodes.length">
                    <el-step
                      v-for="node in getTaskFlow(tid).nodes"
                      :key="node.id"
                      :title="node.label"
                      :description="getNodeDescription(node)"
                    />
                  </el-steps>
                </div>
              </el-card>
            </div>
          </template>

          <!-- 旧结构：单一 nodes/edges（向后兼容） -->
          <template v-else>
            <div v-if="(formData.experimentFlow?.nodes || []).length === 0" class="empty-flow">
              <el-empty description="未设计试验流程" />
            </div>
            <div v-else class="flow-steps">
              <el-steps direction="vertical" :active="(formData.experimentFlow?.nodes || []).length">
                <el-step
                  v-for="node in (formData.experimentFlow?.nodes || [])"
                  :key="node.id"
                  :title="node.label"
                  :description="getNodeDescription(node)"
                />
              </el-steps>
            </div>
          </template>
        </div>
      </el-collapse-item>

      <el-collapse-item v-if="isStaticEvaluation" title="数据需求" name="dataRequirements">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="数据集">{{ getDatasetName(formData.dataRequirements.datasetId) }}</el-descriptions-item>
          <el-descriptions-item label="数据采集点数量">{{ (formData.dataRequirements.dataCollectionPoints || []).length }}</el-descriptions-item>
          <el-descriptions-item label="必需字段数量">
            {{ getRequiredFieldsCount() }}
          </el-descriptions-item>
          <el-descriptions-item label="可选字段数量">
            {{ getOptionalFieldsCount() }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>

      <el-collapse-item title="资源需求" name="resourceRequirements">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="总人员数">
            {{ getTotalPersonnel() }}
          </el-descriptions-item>
          <el-descriptions-item label="总设备数">
            {{ getTotalEquipment() }}
          </el-descriptions-item>
          <el-descriptions-item label="基础数据集数">
            {{ formData.resourceRequirements.baseDatasets.length }}
          </el-descriptions-item>

          <el-descriptions-item label="人员角色" :span="3">
            <div v-for="(item, index) in formData.resourceRequirements.personnel" :key="`personnel_${index}`" class="resource-item">
              <el-tag type="primary" class="confirm-tag">{{ item.role }}: {{ item.count }}人</el-tag>
            </div>
            <span v-if="formData.resourceRequirements.personnel.length === 0" class="empty-text">无</span>
          </el-descriptions-item>

          <el-descriptions-item label="设备需求" :span="3">
            <div v-for="(item, index) in formData.resourceRequirements.equipment" :key="`equipment_${index}`" class="resource-item">
              <el-tag type="success" class="confirm-tag">{{ getEquipmentTypeName(item.type) }}: {{ item.count }}台 {{ item.spec ? `(${item.spec})` : '' }}</el-tag>
            </div>
            <span v-if="formData.resourceRequirements.equipment.length === 0" class="empty-text">无</span>
          </el-descriptions-item>

          <el-descriptions-item label="基础数据集" :span="3">
            <div v-for="datasetId in formData.resourceRequirements.baseDatasets" :key="`dataset_${datasetId}`" class="resource-item">
              <el-tag type="info" class="confirm-tag">{{ getBaseDatasetName(datasetId) }}</el-tag>
            </div>
            <span v-if="formData.resourceRequirements.baseDatasets.length === 0" class="empty-text">无</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>

    <div class="confirm-options">
      <el-divider>创建选项</el-divider>

      <el-form label-position="top">
        <el-form-item label="保存为模板">
          <el-switch v-model="localSaveAsTemplate" />
          <div class="option-help">保存为模板后，可在创建新实验时直接使用此模板</div>
        </el-form-item>

        <el-form-item label="创建后直接进入试验任务">
          <el-switch v-model="localCreateTask" />
          <div class="option-help">开启后，创建实验完成后将直接进入试验任务页面</div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  experimentTypes: {
    type: Array,
    required: true
  },
  isCreating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:form-data', 'create'])

// 本地数据
const activeNames = ref(['basic', 'keyFactors', 'indicators'])
const localSaveAsTemplate = ref(props.formData.saveAsTemplate)
const localCreateTask = ref(props.formData.createTask)

// 监听本地数据的变化，并向父组件发送更新事件
watch(localSaveAsTemplate, (newValue) => {
  emit('update:form-data', { ...props.formData, saveAsTemplate: newValue })
})

watch(localCreateTask, (newValue) => {
  emit('update:form-data', { ...props.formData, createTask: newValue })
})

// 计算属性 - 是否为静态评估
const isStaticEvaluation = computed(() => props.formData.type === 'static_evaluation')

// 计算属性 - 是否配置了权重
const hasWeights = computed(() => {
  const weights = props.formData.indicators.weights
  return Object.keys(weights).length > 0 && props.formData.indicators.indicatorIds.some(id => weights[id] > 0)
})

// 模拟数据 - 实验类型名称映射
const getExperimentTypeName = (type) => {
  const typeMap = {
    'static_evaluation': '静态评估',
    'dynamic_evaluation': '动态效能评估',
    'interactive_evaluation': '互动式评估'
  }
  return typeMap[type] || type
}

// 模拟数据 - 模板名称映射
const getTemplateName = (templateId) => {
  if (!templateId) return '不使用模板'

  const templateMap = {
    'tpl_1': '静态评估模板',
    'tpl_2': '动态效能评估模板',
    'tpl_3': '互动式评估模板'
  }
  return templateMap[templateId] || templateId
}

// 模拟数据 - 评估对象名称映射
const getTargetName = (targetId) => {
  if (!targetId) return '未选择'

  const targetMap = {
    'target_1': '社交机器人A型',
    'target_2': '社交机器人B型',
    'target_3': '社交机器人C型'
  }
  return targetMap[targetId] || targetId
}

// 模拟数据 - 场景名称映射
const getScenarioName = (scenarioId) => {
  if (!scenarioId) return '未选择'

  const scenarioMap = {
    'scenario_1': '政策宣示场景',
    'scenario_2': '舆论斗争场景',
    'scenario_3': '认知防御与干预场景'
  }
  return scenarioMap[scenarioId] || scenarioId
}

// 模拟数据 - 任务名称映射
const getTaskName = (taskId) => {
  if (!taskId) return '未知任务'

  const taskMap = {
    'task_1': '识别虚假信息',
    'task_2': '反驳错误观点',
    'task_3': '引导正确舆论',
    'task_4': '回答用户提问',
    'task_5': '情感分析与回应'
  }
  return taskMap[taskId] || taskId
}

// 模拟数据 - 指标名称映射
const getIndicatorName = (indicatorId) => {
  if (!indicatorId) return '未知指标'

  const indicatorMap = {
    'ind_1': '信息识别准确率',
    'ind_2': '反驳有效性',
    'ind_3': '舆论引导效果',
    'ind_4': '互动响应时间',
    'ind_5': '用户满意度'
  }
  return indicatorMap[indicatorId] || indicatorId
}

// 模拟数据 - 指标描述映射
const getIndicatorDescription = (indicatorId) => {
  if (!indicatorId) return ''

  const descriptionMap = {
    'ind_1': '机器人正确识别虚假信息的比率',
    'ind_2': '机器人反驳虚假信息的有效程度',
    'ind_3': '机器人引导正确舆论方向的效果',
    'ind_4': '机器人响应用户输入的平均时间',
    'ind_5': '用户对机器人回复的满意程度'
  }
  return descriptionMap[indicatorId] || ''
}

// 模拟数据 - 节点描述
const getNodeDescription = (node) => {
  if (!node) return ''

  let description = ''

  switch (node.type) {
    case 'data_import':
      description = `数据源: ${node.data?.source || '未指定'}`
      break
    case 'bot_operation':
      description = `机器人: ${node.data?.botId || '未指定'}, 操作: ${node.data?.operation || '启动'}`
      break
    case 'data_collection':
      description = `采集指标: ${(node.data?.metrics || []).length}项`
      break
    case 'metrics_calculation':
      description = `计算指标: ${(node.data?.indicatorIds || []).length}项`
      break
    case 'monitor':
      description = `监控类型: ${node.data?.monitorType || '状态'}`
      break
    default:
      description = '未知节点类型'
  }

  return description
}

// 兼容新结构：判断 experimentFlow 是否为按子任务映射
const isFlowMapping = computed(() => {
  const flow = props.formData?.experimentFlow
  return flow && typeof flow === 'object' && !Array.isArray(flow) && !('nodes' in flow) && !('edges' in flow)
})

// 已选子任务列表
const selectedTaskIds = computed(() => Array.isArray(props.formData?.keyFactors?.tasks) ? props.formData.keyFactors.tasks : [])

// 获取子任务对应的流程（安全兜底）
const getTaskFlow = (taskId) => {
  const flowMap = props.formData?.experimentFlow || {}
  const flow = flowMap[taskId] || { nodes: [], edges: [] }
  return {
    nodes: Array.isArray(flow.nodes) ? flow.nodes : [],
    edges: Array.isArray(flow.edges) ? flow.edges : []
  }
}

// 模拟数据 - 数据集名称映射
const getDatasetName = (datasetId) => {
  if (!datasetId) return '未选择'

  const datasetMap = {
    'ds_1': '社交媒体虚假信息数据集',
    'ds_2': '政策解读问答数据集',
    'ds_3': '舆情引导数据集',
    'ds_4': '用户反馈数据集'
  }
  return datasetMap[datasetId] || datasetId
}

// 模拟数据 - 必需字段数量
const getRequiredFieldsCount = () => {
  // 实际应用中应该从formData.dataRequirements.requiredFields中过滤出必需字段
  return 4
}

// 模拟数据 - 可选字段数量
const getOptionalFieldsCount = () => {
  // 实际应用中应该从formData.dataRequirements.requiredFields中过滤出可选字段
  return 2
}

// 计算总人员数
const getTotalPersonnel = () => {
  return props.formData.resourceRequirements.personnel.reduce((sum, item) => sum + item.count, 0)
}

// 计算总设备数
const getTotalEquipment = () => {
  return props.formData.resourceRequirements.equipment.reduce((sum, item) => sum + item.count, 0)
}

// 设备类型名称映射
const getEquipmentTypeName = (type) => {
  const typeMap = {
    'server': '服务器',
    'simulation_terminal': '仿真终端',
    'monitor': '监控设备',
    'storage': '存储设备'
  }
  return typeMap[type] || type
}

// 基础数据集名称映射
const getBaseDatasetName = (datasetId) => {
  if (!datasetId) return '未知数据集'

  const datasetMap = {
    'user_profile_dataset': '用户画像数据集',
    'social_text_dataset': '社交文本数据集',
    'news_dataset': '新闻数据集',
    'qa_dataset': '问答数据集',
    'sentiment_dataset': '情感分析数据集'
  }
  return datasetMap[datasetId] || datasetId
}
</script>

<style lang="scss" scoped>
.experiment-confirm-step {
  .step-title {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 20px;
  }

  .confirm-info {
    margin-bottom: 20px;
  }

  .confirm-collapse {
    margin-bottom: 30px;

    .confirm-tag {
      margin-right: 8px;
      margin-bottom: 8px;
    }

    .empty-text {
      color: #909399;
      font-style: italic;
    }

    .indicators-list {
      margin-top: 15px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;

      .indicator-item {
        .indicator-content {
          .indicator-name {
            font-weight: 500;
            margin-bottom: 5px;
          }

          .indicator-weight {
            color: #409EFF;
            margin-bottom: 5px;
          }

          .indicator-desc {
            font-size: 13px;
            color: #606266;
          }
        }
      }

      .empty-indicators {
        grid-column: 1 / -1;
        padding: 20px;
      }
    }

    .flow-preview {
      margin-top: 15px;

      .empty-flow {
        padding: 20px;
      }
    }

    .resource-item {
      display: inline-block;
      margin-right: 10px;
      margin-bottom: 10px;
    }
  }

  .confirm-options {
    .option-help {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }
  }
}

@media (max-width: 768px) {
  .experiment-confirm-step {
    .indicators-list {
      grid-template-columns: 1fr;
    }
  }
}
</style>
