<template>
  <div class="experiment-overview-container">
    <el-card class="header-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">{{ experiment?.name || '试验总览' }}</h2>
            <p class="subtitle">试验关键信息与快捷操作</p>
          </div>
          <div class="header-actions">
            <el-button-group>
              <el-button
                type="primary"
                :icon="CaretRight"
                @click="goToRun"
              >
                开始/继续执行
              </el-button>
              <el-button :icon="DataAnalysis" @click="goToResults">查看结果</el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-skeleton :loading="loading" animated :count="1">
        <template #default>
          <div class="experiment-info-card">
            <div class="info-header">
              <div class="info-main">
                <h3 class="experiment-name">{{ experiment?.name }}</h3>
                <div class="experiment-meta">
                  <span class="meta-item">创建：{{ experiment?.createdAt }}</span>
                  <span class="meta-item">更新：{{ experiment?.updatedAt }}</span>
                  <span class="meta-item">负责人：{{ experiment?.owner }}</span>
                </div>
              </div>
              <div class="info-status">
                <el-tag :type="getStatusType(experiment?.status)">
                  {{ getStatusText(experiment?.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>
    </el-card>

    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :lg="16">
        <el-card class="summary-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">方案摘要</span>
            </div>
          </template>

          <el-skeleton :loading="loading" animated :rows="3">
            <template #default>
              <div class="summary-content">
                <el-collapse v-model="activeNames" class="confirm-collapse">
                  <el-collapse-item title="基本信息" name="basic">
                    <el-descriptions :column="2" border>
                      <el-descriptions-item label="试验方案名称">{{ experiment?.name || '-' }}</el-descriptions-item>
                      <el-descriptions-item label="试验类型">{{ getExperimentTypeName(experiment?.type) }}</el-descriptions-item>
                      <el-descriptions-item label="负责人">{{ experiment?.owner || '-' }}</el-descriptions-item>
                      <el-descriptions-item label="使用模板">
                        {{ experiment?.template?.name ? (experiment.template.name + '（v' + experiment.template.version + '）') : '不使用模板' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="试验描述" :span="2">{{ experiment?.description || '无' }}</el-descriptions-item>
                    </el-descriptions>
                  </el-collapse-item>

                  <el-collapse-item title="试验关键因素" name="keyFactors">
                    <el-descriptions :column="2" border>
                      <el-descriptions-item label="评估对象">{{ targetNameMap[experiment?.keyFactors?.targetId] || experiment?.keyFactors?.targetId || '-' }}</el-descriptions-item>
                      <el-descriptions-item label="试验场景">{{ getScenarioName(experiment?.keyFactors?.scenario) }}</el-descriptions-item>
                      <el-descriptions-item label="试验目的" :span="2">{{ experiment?.keyFactors?.purpose || '无' }}</el-descriptions-item>
                      <el-descriptions-item label="试验任务" :span="2">
                        <template v-if="experiment?.keyFactors?.tasks?.length">
                          <el-tag v-for="tid in experiment.keyFactors.tasks" :key="tid" class="confirm-tag">{{ getSubtaskDisplayName(tid) }}</el-tag>
                        </template>
                        <span v-else class="empty-text">无</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="人员安排" :span="2">
                        <template v-if="experiment?.keyFactors?.personnel?.length">
                          <el-tag v-for="(p,idx) in experiment.keyFactors.personnel" :key="idx" class="confirm-tag">{{ p }}</el-tag>
                        </template>
                        <span v-else class="empty-text">无</span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-collapse-item>

                  <el-collapse-item title="评估指标" name="indicators">
                    <el-descriptions :column="2" border>
                      <el-descriptions-item label="指标数量">{{ experiment?.indicators?.indicatorIds?.length || 0 }}</el-descriptions-item>
                      <el-descriptions-item label="权重配置">{{ hasWeights ? '已配置' : '未配置' }}</el-descriptions-item>
                    </el-descriptions>

                    <div style="margin-top: 12px;">
                      <el-table
                        v-if="indicatorRows.length"
                        :data="indicatorRows"
                        size="small"
                        border
                        style="width: 100%"
                      >
                        <el-table-column prop="name" label="指标名称" min-width="220">
                          <template #default="{ row }">
                            <div class="indicator-name">{{ row.name }}</div>
                            <div class="indicator-desc" v-if="row.description">{{ row.description }}</div>
                          </template>
                        </el-table-column>
                        <el-table-column prop="weight" label="权重" width="100">
                          <template #default="{ row }">
                            <el-tag type="success">{{ row.weight }}</el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column label="关联流程" min-width="260">
                          <template #default="{ row }">
                            <template v-if="row.associations.length">
                              <el-tag
                                v-for="(assoc, idx) in row.associations"
                                :key="idx"
                                type="info"
                                class="confirm-tag"
                              >
                                {{ formatAssociationDisplay(assoc) }}
                              </el-tag>
                            </template>
                            <span v-else class="empty-text">无</span>
                          </template>
                        </el-table-column>
                      </el-table>
                      <div v-else class="empty-indicators">
                        <el-empty description="未选择评估指标" />
                      </div>
                      <div class="summary-actions" style="margin-top: 12px;">
                        <el-button size="small" type="primary" :icon="Edit" @click="goToMetrics">编辑指标配置</el-button>
                      </div>
                    </div>
                  </el-collapse-item>

                  <el-collapse-item title="试验流程" name="flow">
                    <div class="flow-preview">
                      <template v-if="isFlowMapping">
                        <div v-if="selectedTaskIds.length === 0" class="empty-flow">
                          <el-empty description="未选择子任务" />
                        </div>
                        <div v-else>
                          <el-card v-for="tid in selectedTaskIds" :key="tid" shadow="never" style="margin-bottom: 12px;">
                            <template #header>
                              <div>{{ getSubtaskDisplayName(tid) }}</div>
                            </template>
                            <div v-if="getTaskFlow(tid).nodes.length === 0" class="empty-flow">
                              <el-empty description="该子任务未设计流程" />
                            </div>
                            <div v-else class="flow-steps">
                              <el-steps direction="vertical" :active="getTaskFlow(tid).nodes.length">
                                <el-step v-for="node in getTaskFlow(tid).nodes" :key="node.id" :title="node.label" :description="getNodeDescription(node)" />
                              </el-steps>
                            </div>
                          </el-card>
                        </div>
                      </template>
                      <template v-else>
                        <div v-if="(experiment?.experimentFlow?.nodes || []).length === 0" class="empty-flow">
                          <el-empty description="未设计试验流程" />
                        </div>
                        <div v-else class="flow-steps">
                          <el-steps direction="vertical" :active="orderedNodes.length">
                            <el-step v-for="node in orderedNodes" :key="node.id" :title="node.label" :description="getNodeDescription(node)" />
                          </el-steps>
                        </div>
                      </template>
                    </div>
                  </el-collapse-item>

                  <el-collapse-item v-if="isStaticEvaluation" title="数据需求" name="dataRequirements">
                    <el-descriptions :column="2" border>
                      <el-descriptions-item label="数据集">{{ experiment?.dataRequirements?.datasetId || '-' }}</el-descriptions-item>
                      <el-descriptions-item label="数据采集点数量">{{ (experiment?.dataRequirements?.dataCollectionPoints || []).length }}</el-descriptions-item>
                      <el-descriptions-item label="必需字段数量">{{ getRequiredFieldsCount() }}</el-descriptions-item>
                      <el-descriptions-item label="可选字段数量">{{ getOptionalFieldsCount() }}</el-descriptions-item>
                    </el-descriptions>
                  </el-collapse-item>

                  <el-collapse-item title="资源需求" name="resourceRequirements">
                    <el-descriptions :column="3" border>
                      <el-descriptions-item label="总人员数">{{ getTotalPersonnel() }}</el-descriptions-item>
                      <el-descriptions-item label="总设备数">{{ getTotalEquipment() }}</el-descriptions-item>
                      <el-descriptions-item label="基础数据集数">{{ experiment?.resourceRequirements?.baseDatasets?.length || 0 }}</el-descriptions-item>

                      <el-descriptions-item label="人员角色" :span="3">
                        <div v-for="(item, index) in (experiment?.resourceRequirements?.personnel || [])" :key="`personnel_${index}`" class="resource-item">
                          <el-tag type="primary" class="confirm-tag">{{ item.role }}: {{ item.count }}人</el-tag>
                        </div>
                        <span v-if="!(experiment?.resourceRequirements?.personnel || []).length" class="empty-text">无</span>
                      </el-descriptions-item>

                      <el-descriptions-item label="设备需求" :span="3">
                        <div v-for="(item, index) in (experiment?.resourceRequirements?.equipment || [])" :key="`equipment_${index}`" class="resource-item">
                          <el-tag type="success" class="confirm-tag">{{ getEquipmentTypeName(item.type) }}: {{ item.count }}台 {{ item.spec ? `(${item.spec})` : '' }}</el-tag>
                        </div>
                        <span v-if="!(experiment?.resourceRequirements?.equipment || []).length" class="empty-text">无</span>
                      </el-descriptions-item>

                      <el-descriptions-item label="基础数据集" :span="3">
                        <div v-for="datasetId in (experiment?.resourceRequirements?.baseDatasets || [])" :key="`dataset_${datasetId}`" class="resource-item">
                          <el-tag type="info" class="confirm-tag">{{ getBaseDatasetName(datasetId) }}</el-tag>
                        </div>
                        <span v-if="!(experiment?.resourceRequirements?.baseDatasets || []).length" class="empty-text">无</span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-collapse-item>
                </el-collapse>








              </div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card class="runs-card" v-loading="loading">
          <template #header>
            <div class="card-header"><span class="card-title">最近运行</span></div>
          </template>

          <el-skeleton :loading="loading" animated :rows="3">
            <template #default>
              <div v-if="experiment?.recentRuns?.length" class="recent-runs-list">
                <div v-for="run in experiment.recentRuns" :key="run.id" class="run-item">
                  <div class="run-info">
                    <div class="run-id">运行 {{ run.id }}</div>
                    <div class="run-meta">
                      触发：{{ run.triggeredBy }} · 时长：{{ formatDuration(run.durationSec) }}
                      <div v-if="run.endedAt">结束：{{ formatDateTime(run.endedAt) }}</div>
                    </div>
                  </div>
                  <div class="run-status">
                    <el-tag :type="getStatusType(run.status)" size="small">{{ getStatusText(run.status) }}</el-tag>
                  </div>
                </div>
                <div class="runs-actions">
                  <el-button-group>
                    <el-button type="primary" :icon="CaretRight" @click="goToRun">开始/继续执行</el-button>
                    <el-button :icon="DataAnalysis" @click="goToResults">查看结果</el-button>
                  </el-button-group>
                </div>
              </div>
              <el-empty v-else description="暂无运行记录">
                <el-button type="primary" @click="goToRun">开始执行</el-button>
              </el-empty>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CaretRight, DataAnalysis, Edit, Collection } from '@element-plus/icons-vue'
import { getPlanDetail } from '@/api/plans'
import { fetchMetricList } from '@/api/metrics'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const experiment = ref(null)
const metricNameMap = ref({})
const metricDisplayNameMap = ref({})
const targetNameMap = ref({})
const subtaskNameMap = ref({})
const activeNames = ref(['basic'])

const fetchExperiment = async () => {
  loading.value = true
  try {
    const { data } = await getPlanDetail({ id: route.params.id })
    experiment.value = data
    // 并行补充名称映射
    await Promise.all([
      loadMetricNames(),
      loadRequirementNames(data?.keyFactors?.targetId, data?.keyFactors?.tasks || [])
    ])
  } finally {
    loading.value = false
  }
}

const loadMetricNames = async () => {
  try {
    const { data } = await fetchMetricList({})
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    const map = {}
    const displayMap = {}
    list.forEach(m => {
      map[m.id] = m.name
      const parents = Array.isArray(m.parents) ? m.parents.map(p => p.name) : []
      const full = parents.length ? `${parents.join(' / ')} / ${m.name}` : m.name
      displayMap[m.id] = full
    })
    metricNameMap.value = map
    metricDisplayNameMap.value = displayMap
  } catch (e) { /* 忽略 */ }
}

const loadRequirementNames = async (targetId, taskIds) => {
  try {
    // 目标名称
    const { data: taskRes } = await request({ url: '/requirements/tasks', method: 'get', params: { keyword: '' } })
    const list = taskRes?.data?.list || []
    const tMap = {}
    list.forEach(t => { tMap[t.id] = t.name })
    targetNameMap.value = tMap

    // 子任务名称（跨目标聚合）：遍历所有目标，统一汇总
    const sMap = {}
    await Promise.all(
      list.map(async (t) => {
        try {
          const { data: subRes } = await request({ url: '/requirements/subtasks', method: 'get', params: { targetId: t.id } })
          const subs = subRes?.data?.list || []
          subs.forEach(s => { sMap[s.id] = s.name })
        } catch (e) {}
      })
    )
    // 兜底：确保当前选中的taskIds至少有值
    ;(taskIds || []).forEach(id => { if (!sMap[id]) sMap[id] = id })
    subtaskNameMap.value = sMap
  } catch (e) { /* 忽略 */ }
}

const getStatusType = (status) => ({ draft: 'info', running: 'primary', completed: 'success', failed: 'danger' }[status] || 'info')
const getStatusText = (status) => ({ draft: '草稿', running: '进行中', completed: '已完成', failed: '失败' }[status] || status)
const getWeightName = (key) => ({ accuracy: '准确度', robustness: '鲁棒性', efficiency: '效率' }[key] || key)
const getScenarioName = (id) => ({ scenario_1: '政策宣示场景', scenario_2: '舆论斗争场景', scenario_3: '认知防御与干预场景' }[id] || id || '-')
const getExperimentTypeName = (type) => ({ static_evaluation: '静态评估', dynamic_evaluation: '动态效能评估', interactive_evaluation: '互动式评估' }[type] || (type || '-'))
const getSubtaskDisplayName = (id) => subtaskNameMap.value[id] || id
const formatAssociationDisplay = (assoc) => assoc.taskId ? `${getSubtaskDisplayName(assoc.taskId)} / ${assoc.nodeLabel}` : assoc.nodeLabel
const hasWeights = computed(() => {
  const ids = experiment.value?.indicators?.indicatorIds || []
  const weights = experiment.value?.indicators?.weights || {}
  return ids.some(id => (weights[id] || 0) > 0)
})

const getIndicatorDescription = (indicatorId) => {
  // 先使用 metrics 接口中父级路径名作为描述增强；没有则回退为空
  const fullName = metricDisplayNameMap.value[indicatorId]
  if (fullName && fullName !== metricNameMap.value[indicatorId]) return fullName
  return ''
}

// 静态评估判断
const isStaticEvaluation = computed(() => experiment.value?.type === 'static_evaluation')

// 数据需求统计（兜底为0）
const getRequiredFieldsCount = () => Array.isArray(experiment.value?.dataRequirements?.requiredFields) ? experiment.value.dataRequirements.requiredFields.length : 0
const getOptionalFieldsCount = () => Array.isArray(experiment.value?.dataRequirements?.optionalFields) ? experiment.value.dataRequirements.optionalFields.length : 0

// 资源需求合计
const getTotalPersonnel = () => (experiment.value?.resourceRequirements?.personnel || []).reduce((s, i) => s + (i.count || 0), 0)
const getTotalEquipment = () => (experiment.value?.resourceRequirements?.equipment || []).reduce((s, i) => s + (i.count || 0), 0)

// 设备与基础数据集显示名
const getEquipmentTypeName = (type) => ({ server: '服务器', simulation_terminal: '仿真终端', monitor: '监控设备', storage: '存储设备' }[type] || type)
const getBaseDatasetName = (datasetId) => datasetId
const formatDuration = (s) => s < 60 ? `${s}秒` : s < 3600 ? `${Math.floor(s/60)}分${s%60}秒` : `${Math.floor(s/3600)}时${Math.floor((s%3600)/60)}分`
const formatDateTime = (ds) => { if (!ds) return '-'; const d = new Date(ds); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }

const goToMetrics = () => { router.push(`/plans/${route.params.id}/metrics`) }
const linkedDatasetId = 'ds_1'
const goToDatasetDetail = () => { router.push(`/datasets/${linkedDatasetId}`) }
const goToRun = () => { router.push(`/plans/${route.params.id}/run`) }
const goToResults = () => { router.push(`/plans/${route.params.id}/results`) }

onMounted(() => { fetchExperiment() })

// 概览用：流程节点排序与描述
const indicatorRows = computed(() => {
  const ids = experiment.value?.indicators?.indicatorIds || []
  const weights = experiment.value?.indicators?.weights || {}

  // 构造流程映射（两种结构）
  const associationsByIndicator = {}

  const pushAssoc = (indId, assoc) => {
    if (!associationsByIndicator[indId]) associationsByIndicator[indId] = []
    associationsByIndicator[indId].push(assoc)
  }

  const flow = experiment.value?.experimentFlow
  const isMapping = flow && typeof flow === 'object' && !Array.isArray(flow) && !('nodes' in flow) && !('edges' in flow)

  if (isMapping) {
    Object.keys(flow || {}).forEach(tid => {
      const f = flow[tid] || { nodes: [], edges: [] }
      const nodes = Array.isArray(f.nodes) ? f.nodes : []
      nodes.forEach(n => {
        const indicatorIds = Array.isArray(n?.data?.indicatorIds) ? n.data.indicatorIds : []
        indicatorIds.forEach(indId => {
          pushAssoc(indId, { taskId: tid, nodeId: n.id, nodeLabel: n.label, display: `${subtaskNameMap.value[tid] || tid} / ${n.label}` })
        })
      })
    })
  } else {
    const nodes = flow?.nodes || []
    nodes.forEach(n => {
      const indicatorIds = Array.isArray(n?.data?.indicatorIds) ? n.data.indicatorIds : []
      indicatorIds.forEach(indId => {
        pushAssoc(indId, { taskId: null, nodeId: n.id, nodeLabel: n.label, display: n.label })
      })
    })
  }

  return ids.map(id => ({
    id,
    name: metricNameMap.value[id] || id,
    description: getIndicatorDescription(id),
    weight: weights[id] ?? 0,
    associations: associationsByIndicator[id] || []
  }))
})

const orderedNodes = computed(() => {
  const nodes = experiment.value?.experimentFlow?.nodes || []
  const edges = experiment.value?.experimentFlow?.edges || []
  if (nodes.length === 0) return []
  const startNode = nodes.find(n => n.type === 'start') || nodes[0]
  const ordered = []
  const visited = new Set()
  let cur = startNode
  while (cur && !visited.has(cur.id)) {
    visited.add(cur.id)
    ordered.push(cur)
    const nextEdge = edges.find(e => e.source === cur.id)
    cur = nextEdge ? nodes.find(n => n.id === nextEdge.target) : null
  }
  nodes.forEach(n => { if (!visited.has(n.id)) ordered.push(n) })
  return ordered
})

// 兼容 ExperimentConfirm 的节点描述
const getNodeDescription = (node) => {
  const type = node.type
  const d = node.data || {}
  switch (type) {
    case 'start':
      return `开始 (${d.autoStart ? '自动' : '手动'})`
    case 'end':
      return `结束 (${d.saveResults ? '保存结果' : '不保存'})`
    case 'media_access':
      return `访问媒体 (平台: ${(d.platforms||[]).join(',') || '未选'})`
    case 'content_search':
      return `查找言论 (类型: ${d.searchType || 'keyword'})`
    case 'content_evaluation':
      return `评价言论 (类型: ${d.evaluationType || 'sentiment'})`
    case 'comment_reply':
      return `回复评论 (策略: ${d.replyStrategy || 'template'})`
    default:
      return ''
  }
}

// 兼容新结构：按任务映射的流程
const isFlowMapping = computed(() => {
  const flow = experiment.value?.experimentFlow
  return flow && typeof flow === 'object' && !Array.isArray(flow) && !('nodes' in flow) && !('edges' in flow)
})

const selectedTaskIds = computed(() => Array.isArray(experiment.value?.keyFactors?.tasks) ? experiment.value.keyFactors.tasks : [])

const getTaskFlow = (taskId) => {
  const flowMap = experiment.value?.experimentFlow || {}
  const flow = flowMap[taskId] || { nodes: [], edges: [] }
  return {
    nodes: Array.isArray(flow.nodes) ? flow.nodes : [],
    edges: Array.isArray(flow.edges) ? flow.edges : []
  }
}

const totalWeight = computed(() => {
  const ids = experiment.value?.indicators?.indicatorIds || []
  const weights = experiment.value?.indicators?.weights || {}
  return ids.reduce((s, id) => s + (weights[id] || 0), 0)
})
</script>

<style lang="scss" scoped>
.experiment-overview-container { padding: 20px; }
.header-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left .title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.header-left .subtitle { font-size: 14px; color: #909399; margin: 5px 0 0; }
.experiment-info-card .info-header { display: flex; justify-content: space-between; align-items: center; }
.experiment-name { font-size: 18px; font-weight: 500; color: #303133; margin: 0 0 8px; }
.experiment-meta { font-size: 13px; color: #909399; }
.experiment-meta .meta-item { margin-right: 15px; }
.content-row .card-title { font-size: 16px; font-weight: 500; color: #303133; }
.weights-display, .thresholds-display { display: inline-flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; }
.summary-actions { margin-top: 12px; }
.summary-block { margin-top: 16px; }
.block-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #303133; }
.block-content { background: #fafafa; border: 1px solid #ebeef5; border-radius: 6px; padding: 12px; }
.kv-row { display: flex; align-items: center; margin-bottom: 8px; }
.kv-label { width: 80px; color: #909399; font-size: 13px; }
.kv-value { color: #303133; font-size: 13px; }
.kv-tags { display: inline-flex; flex-wrap: wrap; gap: 6px; }
.indicator-list { display: flex; flex-direction: column; gap: 6px; }
.indicator-item { display: flex; align-items: center; gap: 10px; }
.indicator-id { font-size: 13px; color: #303133; }
/* 删除空规则，避免linter警告 */
.total-weight { margin-top: 8px; color: #606266; font-size: 12px; }
.link { color: #409eff; cursor: pointer; }
.recent-runs-list .run-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #EBEEF5; }
.runs-actions { margin-top: 20px; }
</style>


