<template>
  <div class="indicators-step">
    <h3 class="step-title">评估指标</h3>

    <div class="system-context" v-if="systemDetail.id">
      <div class="context-header">
        <div class="ctx-title">
          关联体系：<strong>{{ systemDetail.name }}</strong>
        </div>
        <div class="ctx-tasks">
          <span>已选子任务：</span>
          <el-tag v-for="t in selectedSubtasks" :key="t.id" size="small" type="info" class="mr-6">{{ t.name }}</el-tag>
        </div>
      </div>
      <CapabilityTree :subtasks="treeSubtasks" :root-name="systemDetail.name" />
    </div>

    <div class="indicators-info">
      <el-alert
        title="以下指标来自所选能力评估体系关联的能力与指标（叶子节点）"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <div class="indicators-filter">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索指标名称或描述..."
          style="width: 300px; margin-right: 15px"
          clearable
          @input="onSearch"
        />
        <el-select
          v-model="selectedCategory"
          placeholder="选择指标类别"
          style="width: 200px; margin-right: 15px"
          clearable
          @change="onCategoryChange"
        >
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
        <el-button
          type="primary"
          size="small"
          :disabled="filteredIndicators.length === 0"
          @click="toggleSelectAll"
        >
          {{ isAllSelected ? '取消全选' : '全选当前' }}
        </el-button>
        <span class="selected-count">
          已选择 {{ selectedIndicatorIds.length }} 项
        </span>
      </div>
    </div>

    <div class="indicators-list">
      <div class="list-container">
        <div
          v-for="indicator in filteredIndicators"
          :key="indicator.id"
          class="indicator-item"
          :class="{ selected: isSelected(indicator.id) }"
          @click="toggleIndicator(indicator.id)"
        >
          <div class="indicator-checkbox">
            <el-checkbox
              :model-value="isSelected(indicator.id)"
              @change="toggleIndicator(indicator.id)"
              @click.stop
            />
          </div>
          <div class="indicator-content">
            <div class="indicator-header">
              <div class="indicator-name">{{ indicator.name }}</div>
              <div class="indicator-level">体系指标</div>
            </div>
            <div class="indicator-desc" v-if="indicator.desc">{{ indicator.desc }}</div>
            <div class="indicator-parents" v-if="indicator.parents && indicator.parents.length">
              <el-tag
                v-for="parent in indicator.parents"
                :key="parent.id"
                size="small"
                :type="getParentTagType(parent)"
                class="parent-tag"
              >
                {{ parent.name }}
              </el-tag>
            </div>
            <div class="indicator-eval-types" v-if="indicator.evalTypes && indicator.evalTypes.length">
              <span class="eval-label">评估方式：</span>
              <el-tag
                v-for="type in indicator.evalTypes"
                :key="type"
                size="small"
                type="success"
                class="eval-tag"
              >
                {{ getEvalTypeLabel(type) }}
              </el-tag>
            </div>
          </div>
          <div class="indicator-weight" v-if="isSelected(indicator.id)" @click.stop @mousedown.stop @touchstart.stop>
            <div class="weight-label">权重</div>
            <el-slider
              v-model="indicatorWeights[indicator.id]"
              :min="0"
              :max="1"
              :step="0.1"
              :show-tooltip="false"
              @change="updateWeights"
              @input="updateWeights"
              @click.stop
              @mousedown.stop
              @touchstart.stop
            />
            <div class="weight-value">{{ indicatorWeights[indicator.id] || 0 }}</div>
          </div>
        </div>
      </div>

      <div v-if="filteredIndicators.length === 0" class="empty-state">
        <el-empty description="暂无指标数据" />
      </div>
    </div>

    <div class="indicators-summary" v-if="selectedIndicators.length > 0">
      <h4 class="section-title">已选指标摘要</h4>
      <el-card shadow="hover">
        <div class="summary-content">
          <div class="summary-item" v-for="indicator in selectedIndicators" :key="indicator.id">
            <div class="indicator-name">{{ indicator.name }}</div>
            <div class="indicator-weight">权重: {{ indicatorWeights[indicator.id] || 0 }}</div>
            <el-button type="danger" size="small" text @click="removeIndicator(indicator.id)">移除</el-button>
          </div>
        </div>
        <div class="summary-footer">
          <span class="total-weight">总权重: {{ totalWeight.toFixed(1) }}</span>
          <el-button v-if="totalWeight !== 1" type="warning" size="small" @click="normalizeWeights">权重归一化</el-button>
        </div>
      </el-card>
    </div>

    <div class="metric-params" v-if="metricsForSelectedIndicators.length > 0">
      <h4 class="section-title">数据指标参数</h4>
      <el-collapse v-model="activeMetricPanels" @change="onMetricPanelsChange">
        <el-collapse-item
          v-for="(metric, idx) in metricsForSelectedIndicators"
          :key="metric.code + '_' + idx"
          :name="metric.code"
          :title="metric.name + '（' + metric.code + '）'"
        >
          <el-descriptions :column="2" border class="metric-summary">
            <el-descriptions-item label="函数名">{{ metric.function?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所在能力">{{ metric.capabilityName || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="sub-section-title">入参</div>
          <el-table :data="metric.function?.params || []" border style="width: 100%" :key="metric.code + '_params_' + isMetricOpen(metric.code)">
            <el-table-column prop="name" label="名称" width="200" />
            <el-table-column prop="type" label="类型" width="220" />
            <el-table-column prop="description" label="说明" />
          </el-table>

          <div class="sub-section-title" style="margin-top: 14px">出参</div>
          <el-table :data="metric.function?.returns ? [metric.function.returns] : []" border style="width: 100%" :key="metric.code + '_returns_' + isMetricOpen(metric.code)">
            <el-table-column prop="type" label="类型" width="220" />
            <el-table-column prop="description" label="说明" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { debounce } from 'lodash-es'
import CapabilityTree from '@/views/capability/CapabilityTree.vue'
import { getCapabilitySystemDetail } from '@/api/capability'

const props = defineProps({
  formData: { type: Object, required: true }
})

const emit = defineEmits(['update:indicators'])

const availableIndicators = ref([])
const filteredIndicators = ref([])
const selectedIndicatorIds = ref([...props.formData.indicators.indicatorIds])
const indicatorWeights = reactive({ ...props.formData.indicators.weights })
const loading = ref(false)

const searchKeyword = ref('')
const selectedCategory = ref('')
const categories = ref([])

// 体系上下文
const systemDetail = reactive({})
const selectedSubtasks = ref([])
const treeSubtasks = computed(() => selectedSubtasks.value)

const selectedIndicators = computed(() => availableIndicators.value.filter(indicator => selectedIndicatorIds.value.includes(indicator.id)))
const isAllSelected = computed(() => filteredIndicators.value.length > 0 && filteredIndicators.value.every(indicator => selectedIndicatorIds.value.includes(indicator.id)))
const totalWeight = computed(() => selectedIndicatorIds.value.reduce((sum, id) => sum + (indicatorWeights[id] || 0), 0))

// 从体系详情中找出当前所选子任务内、且被选中的指标，附带能力名与函数定义
const metricsForSelectedIndicators = computed(() => {
  const taskIds = props.formData?.keyFactors?.tasks || []
  const selectedIds = new Set(selectedIndicatorIds.value)
  const result = []
  const subtasks = Array.isArray(systemDetail.subtasks) ? systemDetail.subtasks : []
  const usedSubtasks = (taskIds && taskIds.length) ? subtasks.filter(st => taskIds.includes(st.id)) : subtasks
  for (const st of usedSubtasks) {
    for (const cap of st.capabilities || []) {
      for (const m of cap.metrics || []) {
        if (selectedIds.has(m.code)) {
          result.push({ ...m, capabilityName: cap.name })
        }
      }
    }
  }
  return result
})

// 折叠面板控制，展开/收起后触发重算，避免 ResizeObserver 循环告警
const activeMetricPanels = ref([])
const onMetricPanelsChange = () => {
  nextTick(() => {
    try { window.dispatchEvent(new Event('resize')) } catch (e) {}
  })
}
const isMetricOpen = (code) => Array.isArray(activeMetricPanels.value) && activeMetricPanels.value.includes(code)

const fetchSystemAndBuildIndicators = async () => {
  const targetId = props.formData?.keyFactors?.targetId
  const taskIds = props.formData?.keyFactors?.tasks || []
  if (!targetId) {
    availableIndicators.value = []
    filteredIndicators.value = []
    categories.value = []
    selectedSubtasks.value = []
    Object.keys(systemDetail).forEach(k => delete systemDetail[k])
    return
  }
  loading.value = true
  try {
    const { data } = await getCapabilitySystemDetail(targetId)
    Object.assign(systemDetail, data || {})
    const subtasks = Array.isArray(systemDetail.subtasks) ? systemDetail.subtasks : []
    const filteredSt = (taskIds && taskIds.length) ? subtasks.filter(st => taskIds.includes(st.id)) : subtasks
    selectedSubtasks.value = filteredSt

    const list = []
    const categorySet = new Set()
    for (const st of filteredSt) {
      for (const cap of st.capabilities || []) {
        categorySet.add(cap.name)
        for (const m of cap.metrics || []) {
          list.push({
            id: m.code,
            name: m.name,
            desc: '',
            evalTypes: [],
            parents: [
              { id: st.id, name: st.name, level: 1 },
              { id: cap.id, name: cap.name, level: 2 },
            ],
          })
        }
      }
    }
    availableIndicators.value = list
    categories.value = Array.from(categorySet)
    // 保证所有已选指标的权重为有效数字，避免 slider 绑定 undefined 导致内部 popper 异常
    selectedIndicatorIds.value.forEach((id) => {
      if (typeof indicatorWeights[id] !== 'number' || Number.isNaN(indicatorWeights[id])) {
        indicatorWeights[id] = 0.5
      }
    })
    nextTick(() => { filterIndicators() })
  } catch (error) {
    console.error('获取体系详情失败:', error)
    availableIndicators.value = []
    filteredIndicators.value = []
    categories.value = []
    selectedSubtasks.value = []
  } finally {
    loading.value = false
  }
}

const filterIndicators = () => {
  let filtered = [...availableIndicators.value]
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(indicator => indicator.name.toLowerCase().includes(keyword) || (indicator.desc && indicator.desc.toLowerCase().includes(keyword)))
  }
  if (selectedCategory.value) {
    filtered = filtered.filter(indicator => indicator.parents && indicator.parents.some(parent => parent.name === selectedCategory.value))
  }
  filteredIndicators.value = filtered
}

const onSearch = debounce((keyword) => { searchKeyword.value = keyword; filterIndicators() }, 300)
const onCategoryChange = () => { filterIndicators() }
const isSelected = (id) => selectedIndicatorIds.value.includes(id)

const toggleIndicator = (id) => {
  const index = selectedIndicatorIds.value.indexOf(id)
  if (index > -1) { selectedIndicatorIds.value.splice(index, 1); delete indicatorWeights[id] }
  else { selectedIndicatorIds.value.push(id); indicatorWeights[id] = typeof indicatorWeights[id] === 'number' ? indicatorWeights[id] : 0.5 }
  emitUpdate()
}

const removeIndicator = (id) => {
  const index = selectedIndicatorIds.value.indexOf(id)
  if (index > -1) { selectedIndicatorIds.value.splice(index, 1); delete indicatorWeights[id]; emitUpdate() }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    filteredIndicators.value.forEach(indicator => { const idx = selectedIndicatorIds.value.indexOf(indicator.id); if (idx > -1) { selectedIndicatorIds.value.splice(idx, 1); delete indicatorWeights[indicator.id] } })
  } else {
    filteredIndicators.value.forEach(indicator => { if (!selectedIndicatorIds.value.includes(indicator.id)) { selectedIndicatorIds.value.push(indicator.id); indicatorWeights[indicator.id] = typeof indicatorWeights[indicator.id] === 'number' ? indicatorWeights[indicator.id] : 0.5 } })
  }
  emitUpdate()
}

const updateWeights = () => { emitUpdate() }
const normalizeWeights = () => { const t = totalWeight.value; if (t > 0) { selectedIndicatorIds.value.forEach(id => { const v = (typeof indicatorWeights[id] === 'number' && !Number.isNaN(indicatorWeights[id])) ? indicatorWeights[id] : 0; indicatorWeights[id] = v / t }) ; emitUpdate() } }
const getParentTagType = (parent) => parent.level === 1 ? 'primary' : parent.level === 2 ? 'warning' : 'info'
const getEvalTypeLabel = (type) => ({ 'static': '静态评估', 'dynamic': '动态评估', 'interactive': '交互评估' }[type] || type)
const emitUpdate = () => { emit('update:indicators', { indicatorIds: [...selectedIndicatorIds.value], weights: { ...indicatorWeights } }) }

watch(() => props.formData.indicators, (newValue) => {
  selectedIndicatorIds.value = [...newValue.indicatorIds]
  Object.assign(indicatorWeights, { ...newValue.weights })
}, { deep: true })

watch(() => [props.formData.keyFactors?.targetId, JSON.stringify(props.formData.keyFactors?.tasks || [])], () => {
  fetchSystemAndBuildIndicators()
}, { immediate: true })
</script>

<style lang="scss" scoped>
.indicators-step { .step-title { font-size: 18px; font-weight: 500; color: #303133; margin-bottom: 20px; } }
.system-context { margin-bottom: 16px; }
.context-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.ctx-title { font-size: 14px; color: #303133; }
.ctx-tasks { font-size: 12px; color: #606266; }
.mr-6 { margin-right: 6px; }
.indicators-info { margin-bottom: 20px; }
.section-title { font-size: 16px; font-weight: 500; color: #303133; margin-bottom: 15px; margin-top: 25px; }
.indicators-filter { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; }
.filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.selected-count { margin-left: auto; font-size: 14px; color: #606266; font-weight: 500; }
.indicators-list .list-container { max-height: 500px; overflow-y: auto; border: 1px solid #e4e7ed; border-radius: 6px; }
.indicator-item { display: flex; align-items: flex-start; padding: 15px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: all 0.2s; background-color: #fff; }
.indicator-item:hover { background-color: #f8f9fa; }
.indicator-item.selected { background-color: #f0f9ff; border-left: 4px solid #409eff; }
.indicator-checkbox { margin-right: 12px; margin-top: 2px; }
.indicator-content .indicator-header { display: flex; align-items: center; margin-bottom: 8px; }
.indicator-name { font-size: 16px; font-weight: 500; color: #303133; margin-right: 10px; }
.indicator-level { font-size: 12px; color: #909399; background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
.indicator-desc { font-size: 14px; color: #606266; line-height: 1.4; margin-bottom: 8px; }
.indicator-parents { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.indicator-weight { min-width: 120px; margin-left: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
.weight-label { font-size: 12px; color: #606266; margin-bottom: 5px; }
.weight-value { font-size: 14px; font-weight: 500; color: #409eff; text-align: center; margin-top: 5px; }
.empty-state { text-align: center; padding: 40px; color: #909399; }
.indicators-summary .summary-content { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; }
.summary-item { background-color: #f5f7fa; border-radius: 6px; padding: 12px 15px; min-width: 200px; display: flex; align-items: center; justify-content: space-between; }
.summary-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 15px; border-top: 1px solid #e4e7ed; }
.metric-params { margin-top: 20px; }
</style>


