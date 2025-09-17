<template>
  <div class="data-requirements-step">
    <h3 class="step-title">数据需求</h3>

    <div class="data-requirements-info">
      <el-alert
        title="基于选择的指标，系统自动生成所需数据项清单。您可以选择已有数据集或上传新数据集。"
        type="info"
        :closable="false"
        show-icon
      />
    </div>



    <div class="dataset-selection">
      <h4 class="section-title">数据集选择</h4>

      <el-tabs v-model="activeTab" class="dataset-tabs">
        <el-tab-pane label="选择已有数据集" name="existing" lazy>
          <el-table
            ref="existingTableRef"
            :data="availableDatasets"
            style="width: 100%"
            border
            :row-class-name="datasetRowClassName"
            @row-click="handleDatasetSelect"
          >
            <el-table-column type="selection" width="55" :selectable="() => false" />
            <el-table-column prop="id" label="数据集ID" width="120" />
            <el-table-column prop="name" label="数据集名称" min-width="180" />
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="size" label="数据量" width="120" />
            <el-table-column prop="format" label="格式" width="100" />
            <el-table-column prop="compatibility" label="兼容性" width="120">
              <template #default="{ row }">
                <el-tag :type="getCompatibilityType(row.compatibility)">
                  {{ getCompatibilityText(row.compatibility) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="selectedDatasetId === row.id"
                  @click.stop="selectDataset(row)"
                >
                  {{ selectedDatasetId === row.id ? '已选择' : '选择' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="上传新数据集" name="upload" lazy>
          <div class="upload-container">
            <el-upload
              class="dataset-upload"
              drag
              action="#"
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 .csv、.json 格式文件，最大 50MB
                </div>
              </template>
            </el-upload>

            <div class="upload-actions">
              <el-button type="primary" :disabled="!uploadFile" @click="uploadDataset">
                上传并使用
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 指标参数展示已迁移至评估指标步骤，这里不再展示 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import { getCapabilitySystemDetail } from '@/api/capability'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:data-requirements'])

// 本地数据
const activeTab = ref('existing')
const uploadFile = ref(null)
const selectedDatasetId = ref(props.formData.dataRequirements?.datasetId || '')
const existingTableRef = ref(null)

// 本地数据需求对象
const localDataRequirements = reactive({
  datasetId: props.formData.dataRequirements?.datasetId || '',
  requiredFields: props.formData.dataRequirements?.requiredFields || [],
  dataCollectionPoints: props.formData.dataRequirements?.dataCollectionPoints || []
})

// 监听props中formData的变化
watch(() => props.formData.dataRequirements, (newValue) => {
  if (newValue) {
    localDataRequirements.datasetId = newValue.datasetId || ''
    localDataRequirements.requiredFields = newValue.requiredFields || []
    localDataRequirements.dataCollectionPoints = newValue.dataCollectionPoints || []
    selectedDatasetId.value = newValue.datasetId || ''
  }
}, { deep: true })

// 监听本地数据的变化，并向父组件发送更新事件
watch(localDataRequirements, (newValue) => {
  emit('update:data-requirements', {
    datasetId: newValue.datasetId,
    requiredFields: newValue.requiredFields,
    dataCollectionPoints: newValue.dataCollectionPoints
  })
}, { deep: true })

// 监听selectedDatasetId的变化
watch(selectedDatasetId, (newValue) => {
  localDataRequirements.datasetId = newValue
})

// 监听标签切换，切到表格时强制重新布局，避免 ResizeObserver 循环告警
watch(activeTab, async (tab) => {
  if (tab === 'existing') {
    await nextTick()
    existingTableRef.value?.doLayout?.()
  }
})

// 基于能力体系 -> 子任务 -> 能力 -> 指标(metrics) 的 function 入参与出参，推导需要的数据字段
const systemDetail = ref(null)

const loadSystemDetail = async () => {
  const targetId = props.formData?.keyFactors?.targetId
  if (!targetId) { systemDetail.value = null; return }
  try {
    const { data } = await getCapabilitySystemDetail(targetId)
    systemDetail.value = data || null
  } catch (e) {
    systemDetail.value = null
  }
}

// 初始化与监听 keyFactors 变化后重新加载体系详情
watch(() => props.formData?.keyFactors?.targetId, () => { loadSystemDetail() }, { immediate: true })
watch(() => props.formData?.keyFactors?.tasks, () => { /* 仅触发下方 computed 重新计算 */ }, { deep: true })

// 计算：从选中的子任务中收集所有指标函数的 params 与 returns
const derivedRequiredFields = computed(() => {
  const detail = systemDetail.value
  if (!detail) return []
  const selectedTaskIds = props.formData?.keyFactors?.tasks || []
  const subtasks = Array.isArray(detail.subtasks) ? detail.subtasks : []
  const selectedSubtasks = subtasks.filter(st => selectedTaskIds.includes(st.id))

  const collected = []
  for (const st of selectedSubtasks) {
    const capabilities = Array.isArray(st.capabilities) ? st.capabilities : []
    for (const cap of capabilities) {
      const metrics = Array.isArray(cap.metrics) ? cap.metrics : []
      for (const m of metrics) {
        const fn = m.function || {}
        const fnName = fn.name || m.code || 'metric'
        const params = Array.isArray(fn.params) ? fn.params : []
        // 入参
        for (const p of params) {
          collected.push({
            field: p.name,
            required: true,
            source: 'function_param',
            metricCode: m.code,
            metricName: m.name,
            functionName: fnName,
            type: p.type || 'unknown'
          })
        }
        // 出参：使用合成字段名，便于与入参区分；通常不需要映射到数据集，但保留以便展示/存档
        if (fn.returns) {
          collected.push({
            field: `${fnName}_result`,
            required: false,
            source: 'function_return',
            metricCode: m.code,
            metricName: m.name,
            functionName: fnName,
            type: fn.returns.type || 'unknown'
          })
        }
      }
    }
  }

  // 去重：按 field 名，必需优先
  const map = new Map()
  for (const item of collected) {
    const exist = map.get(item.field)
    if (!exist) map.set(item.field, { ...item })
    else map.set(item.field, { ...exist, required: exist.required || item.required })
  }
  return Array.from(map.values())
})

// 同步到本地 requiredFields 与采集点
watch(derivedRequiredFields, (list) => {
  localDataRequirements.requiredFields = list.map(i => ({ field: i.field, required: !!i.required }))
}, { immediate: true })

// 模拟数据 - 可用数据集
const availableDatasets = [
  {
    id: 'ds_1',
    name: '社交媒体虚假信息数据集',
    description: '包含社交媒体上的虚假信息样本及标准回复',
    size: '10,000条',
    format: 'JSON',
    compatibility: 'high'
  },
  {
    id: 'ds_2',
    name: '政策解读问答数据集',
    description: '政策解读相关问题及标准答案',
    size: '5,000条',
    format: 'CSV',
    compatibility: 'medium'
  },
  {
    id: 'ds_3',
    name: '舆情引导数据集',
    description: '舆情引导场景下的对话数据',
    size: '8,000条',
    format: 'JSON',
    compatibility: 'high'
  },
  {
    id: 'ds_4',
    name: '用户反馈数据集',
    description: '用户对机器人回复的反馈数据',
    size: '12,000条',
    format: 'CSV',
    compatibility: 'low'
  }
]

// 显示所选子任务下的所有指标（带能力名），用于“数据指标参数”模块
const metricsForSelectedTasks = computed(() => {
  const detail = systemDetail.value
  if (!detail) return []
  const selectedTaskIds = props.formData?.keyFactors?.tasks || []
  const subtasks = Array.isArray(detail.subtasks) ? detail.subtasks : []
  const selectedSubtasks = subtasks.filter(st => selectedTaskIds.includes(st.id))
  const result = []
  for (const st of selectedSubtasks) {
    const capabilities = Array.isArray(st.capabilities) ? st.capabilities : []
    for (const cap of capabilities) {
      const metrics = Array.isArray(cap.metrics) ? cap.metrics : []
      for (const m of metrics) {
        result.push({ ...m, capabilityName: cap.name })
      }
    }
  }
  return result
})

// 获取兼容性类型
const getCompatibilityType = (compatibility) => {
  switch (compatibility) {
    case 'high':
      return 'success'
    case 'medium':
      return 'warning'
    case 'low':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取兼容性文本
const getCompatibilityText = (compatibility) => {
  switch (compatibility) {
    case 'high':
      return '高度兼容'
    case 'medium':
      return '部分兼容'
    case 'low':
      return '低度兼容'
    default:
      return '未知'
  }
}

// 处理数据集选择
const handleDatasetSelect = (row) => {
  selectDataset(row)
}

const selectDataset = (dataset) => {
  selectedDatasetId.value = dataset.id
}

// 表格行样式：高亮当前选中数据集
const datasetRowClassName = ({ row }) => {
  return row.id === selectedDatasetId.value ? 'is-selected-dataset-row' : ''
}

// 处理文件变更
const handleFileChange = (file) => {
  uploadFile.value = file
}

// 上传数据集
const uploadDataset = () => {
  // 模拟上传过程
  const newDatasetId = `ds_uploaded_${Date.now()}`
  selectedDatasetId.value = newDatasetId

  // 清空上传文件
  uploadFile.value = null
}
</script>

<style lang="scss" scoped>
.data-requirements-step {
  .step-title {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 20px;
  }

  .data-requirements-info {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 15px;
    margin-top: 25px;
  }

  .section-description {
    font-size: 14px;
    color: #606266;
    margin-bottom: 15px;
  }

  .auto-generated-requirements {
    margin-bottom: 30px;
  }

  .dataset-selection {
    margin-bottom: 30px;

    .dataset-tabs {
      .upload-container {
        .dataset-upload {
          width: 100%;
        }

        .upload-actions {
          margin-top: 20px;
          text-align: center;
        }
      }
    }
  }

  /* 高亮选中的数据集行 */
  :deep(.is-selected-dataset-row) {
    background-color: #ecf5ff; /* element-plus info-plain 背景色系 */
  }

  .data-collection-points {
    margin-bottom: 30px;

    .el-checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
    }

    .no-collection-points {
      margin-top: 15px;
    }
  }

  .metric-params {
    margin-bottom: 30px;

    .no-dataset-selected {
      margin-top: 15px;
    }
  }
}
</style>
