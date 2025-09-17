<template>
  <div class="key-factors-step">
    <h3 class="step-title">能力评估体系关联</h3>

    <div class="layout">
      <div class="sidebar">
        <div class="sidebar-header">
          <el-input
            v-model="systemKeyword"
            placeholder="搜索能力评估体系..."
            clearable
            @input="onRemoteSearchTargets"
          />
        </div>
        <el-scrollbar class="system-list">
          <div
            v-for="sys in targetOptions"
            :key="sys.id"
            class="system-item"
            :class="{ active: sys.id === localKeyFactors.targetId }"
            @click="selectSystem(sys.id)"
          >
            <div class="system-name">{{ sys.name }}</div>
            <div class="system-summary" v-if="sys.summary">{{ sys.summary }}</div>
          </div>
          <div v-if="!targetsLoading && targetOptions.length === 0" class="empty-state">
            <el-empty description="未找到相关体系" />
          </div>
        </el-scrollbar>
      </div>

      <div class="content">
        <template v-if="localKeyFactors.targetId">
          <div class="header-row">
            <div>
              <div class="title">{{ systemDetail.name }}</div>
              <div class="subtitle">ID：{{ systemDetail.id }}</div>
            </div>
            <el-tag type="info" v-if="systemDetail.scenarioType">{{ systemDetail.scenarioType }}</el-tag>
          </div>

          <el-descriptions :column="3" border class="desc-block">
            <el-descriptions-item label="牵头单位">{{ systemDetail.owner || '-' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ systemDetail.updatedAt || '-' }}</el-descriptions-item>
            <el-descriptions-item label="场景类型">{{ systemDetail.scenarioType || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-row :gutter="12">
            <el-col :span="12">
              <el-card class="card-block" shadow="never">
                <template #header>体系目的</template>
                <div class="para">{{ systemDetail.purpose || '—' }}</div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="card-block" shadow="never">
                <template #header>体系任务</template>
                <div class="para">{{ systemDetail.task || '—' }}</div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="12" style="margin-top: 12px">
            <el-col :span="12">
              <el-card class="card-block" shadow="never">
                <template #header>体系目标</template>
                <div class="para">{{ systemDetail.goal || '—' }}</div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="card-block" shadow="never">
                <template #header>典型场景</template>
                <div class="para">{{ systemDetail.scenario || '—' }}</div>
              </el-card>
            </el-col>
          </el-row>

          <el-card class="card-block" shadow="never" style="margin-top: 12px">
            <template #header>人员安排</template>
            <div class="para">{{ systemDetail.staffing || '—' }}</div>
          </el-card>

          <el-card class="card-block" shadow="never" style="margin-top: 16px">
            <template #header>
              <div class="subtask-header">
                <div>关联子任务</div>
                <div class="subtask-tools">
                  <el-input
                    v-model="subtaskSearchKeyword"
                    placeholder="搜索子任务..."
                    clearable
                    size="small"
                    style="width: 220px; margin-right: 8px"
                    @input="onSubtaskSearch"
                  />
                  <el-button
                    type="primary"
                    size="small"
                    :disabled="filteredSubtasks.length === 0"
                    @click="toggleSelectAll"
                  >{{ isAllSelected ? '取消全选' : '全选' }}</el-button>
                  <span class="selected-count">已选择 {{ localKeyFactors.tasks.length }} 项</span>
                </div>
              </div>
            </template>

            <div class="subtask-list">
              <el-checkbox-group v-model="localKeyFactors.tasks">
                <div
                  v-for="task in filteredSubtasks"
                  :key="task.id"
                  class="subtask-item"
                >
                  <el-checkbox :label="task.id" class="subtask-checkbox">
                    <div class="task-option">
                      <div class="task-title">{{ task.name }}</div>
                      <div class="task-summary" v-if="task.summary">{{ task.summary }}</div>
                    </div>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
              <div v-if="filteredSubtasks.length === 0" class="empty-state">
                <el-empty description="暂无子任务数据" />
              </div>
            </div>
          </el-card>
        </template>

        <template v-else>
          <div class="empty-state">
            <el-empty description="请从左侧选择一个能力评估体系" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed } from 'vue'
import { debounce } from 'lodash-es'
import { getCapabilitySystems, getCapabilitySystemDetail } from '@/api/capability'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:keyFactors'])

const targetOptions = ref([])
const subtaskOptions = ref([])
const targetsLoading = ref(false)
const subtasksLoading = ref(false)
const systemKeyword = ref('')
const systemDetail = reactive({})

const subtaskSearchKeyword = ref('')
const filteredSubtasks = ref([])

const scenarios = [
  { id: 'scenario_1', name: '政策宣示场景' },
  { id: 'scenario_2', name: '舆论斗争场景' },
  { id: 'scenario_3', name: '认知防御与干预场景' }
]

const localKeyFactors = reactive({
  targetId: props.formData.keyFactors.targetId,
  purpose: props.formData.keyFactors.purpose,
  tasks: [...props.formData.keyFactors.tasks],
  scenario: props.formData.keyFactors.scenario,
  personnel: [...props.formData.keyFactors.personnel]
})

const isUpdatingFromProps = ref(false)

watch(localKeyFactors, (newValue) => {
  if (!isUpdatingFromProps.value) {
    emit('update:keyFactors', {
      targetId: newValue.targetId,
      purpose: newValue.purpose,
      tasks: [...newValue.tasks],
      scenario: newValue.scenario,
      personnel: [...newValue.personnel]
    })
  }
}, { deep: true })

watch(() => props.formData.keyFactors, (newValue) => {
  isUpdatingFromProps.value = true
  localKeyFactors.targetId = newValue.targetId
  localKeyFactors.purpose = newValue.purpose
  localKeyFactors.tasks = [...newValue.tasks]
  localKeyFactors.scenario = newValue.scenario
  localKeyFactors.personnel = [...newValue.personnel]
  nextTick(() => { isUpdatingFromProps.value = false })
}, { deep: true })

const selectSystem = async (value) => {
  if (!value) {
    localKeyFactors.targetId = ''
    localKeyFactors.tasks = []
    subtaskOptions.value = []
    filteredSubtasks.value = []
    Object.keys(systemDetail).forEach(k => delete systemDetail[k])
    return
  }
  localKeyFactors.targetId = value
  // 先加载详情与子任务
  await loadSubtasksBySystem(value)
  // 自动从体系详情回填目的与场景（只读显示，但保存在表单数据中）
  localKeyFactors.purpose = systemDetail.purpose || ''
  localKeyFactors.scenario = mapScenarioNameToId(systemDetail.scenarioType)
  // 切换体系后清空已选子任务
  localKeyFactors.tasks = []
}

const fetchTargets = async (keyword = '') => {
  targetsLoading.value = true
  try {
    const { data } = await getCapabilitySystems({ keyword, page: 1, pageSize: 20 })
    const list = Array.isArray(data?.list) ? data.list : []
    // 适配下拉项显示结构：补充 summary 用于副标题显示
    targetOptions.value = list.map((item) => ({
      id: item.id,
      name: item.name,
      summary: item.purpose,
      purpose: item.purpose,
    }))
  } finally {
    targetsLoading.value = false
  }
}

const loadSubtasksBySystem = async (targetId) => {
  if (!targetId) { subtaskOptions.value = []; filteredSubtasks.value = []; return }
  subtasksLoading.value = true
  try {
    const { data } = await getCapabilitySystemDetail(targetId)
    // 保存体系详情（用于右侧信息展示）
    Object.assign(systemDetail, data || {})
    const subtasks = Array.isArray(data?.subtasks) ? data.subtasks : []
    // 适配子任务结构
    subtaskOptions.value = subtasks.map((st) => ({
      id: st.id,
      name: st.name,
      summary: st.description,
    }))
  } catch (error) {
    console.error('获取能力体系子任务失败:', error)
    subtaskOptions.value = []
  } finally {
    subtasksLoading.value = false
  }
}

const onRemoteSearchTargets = debounce((kw) => { fetchTargets(kw) }, 300)

const onSubtaskSearch = debounce((keyword) => {
  subtaskSearchKeyword.value = keyword
  filterSubtasks()
}, 300)

const filterSubtasks = () => {
  const keyword = subtaskSearchKeyword.value.toLowerCase()
  if (!keyword) {
    filteredSubtasks.value = [...subtaskOptions.value]
  } else {
    filteredSubtasks.value = subtaskOptions.value.filter(task =>
      task.name.toLowerCase().includes(keyword) ||
      (task.summary && task.summary.toLowerCase().includes(keyword))
    )
  }
}

const isAllSelected = computed(() => {
  return filteredSubtasks.value.length > 0 &&
    filteredSubtasks.value.every(task => localKeyFactors.tasks.includes(task.id))
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const filteredIds = filteredSubtasks.value.map(task => task.id)
    localKeyFactors.tasks = localKeyFactors.tasks.filter(id => !filteredIds.includes(id))
  } else {
    const filteredIds = filteredSubtasks.value.map(task => task.id)
    const newSelections = filteredIds.filter(id => !localKeyFactors.tasks.includes(id))
    localKeyFactors.tasks = [...localKeyFactors.tasks, ...newSelections]
  }
}

watch(subtaskOptions, () => { filterSubtasks() }, { deep: true })

fetchTargets('')
// 如果外部已有已选体系，加载其详情
if (localKeyFactors.targetId) {
  selectSystem(localKeyFactors.targetId)
}

function mapScenarioNameToId(name) {
  if (!name) return ''
  const found = scenarios.find(s => s.name === name)
  return found ? found.id : ''
}
</script>

<style lang="scss" scoped>
.key-factors-step {
  .step-title { font-size: 18px; font-weight: 500; color: #303133; margin-bottom: 12px; }
  .layout { display: grid; grid-template-columns: 320px 1fr; gap: 12px; }
  .sidebar { border: 1px solid #e4e7ed; border-radius: 4px; background: #fff; display: flex; flex-direction: column; }
  .sidebar-header { padding: 10px; border-bottom: 1px solid #ebeef5; }
  .system-list { max-height: 640px; }
  .system-item { padding: 10px 12px; border-bottom: 1px solid #f2f2f2; cursor: pointer; }
  .system-item:hover { background: #f9fafb; }
  .system-item.active { background: #ecf5ff; }
  .system-name { font-weight: 500; color: #303133; margin-bottom: 4px; }
  .system-summary { font-size: 12px; color: #909399; line-height: 1.4; }

  .content { min-height: 400px; }
  .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .title { font-size: 16px; font-weight: 600; color: #303133; }
  .subtitle { font-size: 12px; color: #909399; }

  .desc-block { margin-bottom: 12px; }
  .card-block { width: 100%; }
  .para { white-space: pre-wrap; line-height: 1.6; color: #606266; }

  .subtask-header { display: flex; align-items: center; justify-content: space-between; }
  .subtask-tools { display: flex; align-items: center; }
  .selected-count { margin-left: 8px; font-size: 12px; color: #909399; }
  .subtask-list { max-height: 320px; overflow-y: auto; }
  .subtask-item { margin-bottom: 8px; padding: 8px; border: 1px solid #e4e7ed; border-radius: 4px; background-color: #fff; transition: all 0.2s; }
  .subtask-item:hover { border-color: #409eff; box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1); }
  .subtask-item:last-child { margin-bottom: 0; }
  .subtask-checkbox { width: 100%; }
  .subtask-checkbox .el-checkbox__label { width: 100%; padding-left: 8px; }
  .empty-state { text-align: center; padding: 20px; color: #909399; }
  .task-option { display: flex; flex-direction: column; line-height: 1.4; }
  .task-title { font-weight: 500; color: #303133; margin-bottom: 2px; }
  .task-summary { font-size: 12px; color: #909399; line-height: 1.3; }
}
</style>


