<template>
  <div class="flow-design-step">
    <h3 class="step-title">试验流程设计</h3>

    <!-- 子任务绑定与切换（重设计：胶囊筹码 + 统计） -->
    <div class="task-bind-bar">
      <template v-if="selectedTaskIds.length === 0">
        <el-alert
          title="请先在“试验关键因素”中选择关联子任务，然后为每个子任务单独配置流程"
          type="warning"
          :closable="false"
          show-icon
        />
      </template>
      <template v-else>
        <div class="task-switch">
          <div class="left">
            <div class="section-title-inline">已选子任务</div>
            <el-scrollbar class="task-chips">
              <div
                v-for="tid in selectedTaskIds"
                :key="tid"
                class="task-chip"
                :class="{ active: currentTaskId === tid }"
                @click="switchTask(tid)"
              >
                <el-tooltip effect="dark" :content="getTaskName(tid)" placement="top">
                  <div class="chip-content">
                    <span class="dot" />
                    <span class="name">{{ getTaskName(tid) }}</span>
                  </div>
                </el-tooltip>
              </div>
            </el-scrollbar>
          </div>
          <div class="right">
            <div class="meta">
              <span class="meta-item">当前：<b>{{ currentTaskName || '—' }}</b></span>
              <span class="divider" />
              <span class="meta-item">节点：<b>{{ currentNodeCount }}</b></span>
              <span class="meta-item">连线：<b>{{ currentEdgeCount }}</b></span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="flow-design-info">
      <el-alert
        title="通过拖拽组件到画布并连线，设计试验流程。双击组件可编辑参数。每个节点只能连接一个目标节点，形成单链流程。"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <div class="flow-design-container" :class="{ disabled: !currentTaskId }">
      <div class="component-panel">
        <h4 class="panel-title">组件库</h4>
        <div class="component-list">
          <div
            v-for="component in componentLibrary"
            :key="component.type"
            class="component-item"
            :class="{ 'disabled': isComponentDisabled(component) }"
            :draggable="!!currentTaskId && !isComponentDisabled(component)"
            @dragstart="currentTaskId && handleDragStart($event, component)"
          >
            <el-icon class="component-icon" :style="{ color: component.color }">
              <component :is="component.icon" />
            </el-icon>
            <span class="component-name">{{ component.name }}</span>
            <span v-if="component.maxCount" class="component-limit">
              (最多{{ component.maxCount }}个)
            </span>
          </div>
        </div>
      </div>

      <div class="flow-canvas">
        <div class="canvas-header">
          <h4 class="panel-title">流程设计画布<span v-if="currentTaskName">（{{ currentTaskName }}）</span></h4>
          <div class="canvas-actions">
            <el-button-group>
              <el-button size="small" :disabled="!currentTaskId" @click="clearCanvas">
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
              <el-button size="small" :disabled="!currentTaskId" @click="autoLayout">
                <el-icon><Refresh /></el-icon>
                自动布局
              </el-button>
              <el-button size="small" :disabled="!currentTaskId" @click="zoomOut">
                -
              </el-button>
              <el-button size="small" :disabled="!currentTaskId" @click="zoomIn">
                +
              </el-button>
              <el-button size="small" :disabled="!currentTaskId" @click="resetZoom">
                100%
              </el-button>
              <span class="zoom-indicator" v-if="currentTaskId">{{ Math.round(canvasScale * 100) }}%</span>
            </el-button-group>
          </div>
        </div>

        <!-- 流程设计画布占位 -->
        <div
          class="canvas-placeholder"
          ref="canvasPlaceholderRef"
          @dragover.prevent
          @drop="currentTaskId && handleDrop($event)"
          @wheel.prevent="currentTaskId && handleWheel($event)"
          @mousedown="currentTaskId && startPan($event)"
        >
          <!-- 在实际实现中，这里应该是一个流程图组件，如Vue Flow或G6等 -->
          <div v-if="!currentTaskId" class="empty-canvas">
            <el-empty description="请先从上方切换到一个子任务" />
          </div>
          <div v-else-if="nodes.length === 0" class="empty-canvas">
            <el-empty description="拖拽左侧组件到此处开始设计流程" />
          </div>
          <div
            v-else
            class="mock-flow-canvas"
            :style="{
              width: VIRTUAL_CANVAS_WIDTH + 'px',
              height: VIRTUAL_CANVAS_HEIGHT + 'px',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${canvasScale})`,
              transformOrigin: '0 0'
            }"
          >
            <div
              v-for="node in nodes"
              :key="node.id"
              class="mock-node"
              :class="{
                'connecting': isConnecting && connectingFrom === node.id,
                'connect-target': isConnecting && connectingFrom !== node.id,
                'dragging': isDragging && dragNode === node.id
              }"
              :style="{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                borderColor: getComponentColor(node.type)
              }"
              @dblclick="editNode(node)"
              @mousedown="startNodeDrag($event, node)"
            >
              <div class="node-header" :style="{ backgroundColor: getComponentColor(node.type) }">
                <el-icon class="node-icon"><component :is="getComponentIcon(node.type)" /></el-icon>
                {{ getComponentName(node.type) }}
              </div>
              <div class="node-body">
                {{ node.label }}
              </div>
              <div class="node-actions">
                <el-button
                  size="small"
                  circle
                  :type="isConnecting && connectingFrom === node.id ? 'danger' : 'primary'"
                  @click.stop="startConnection(node.id)"
                  :title="isConnecting && connectingFrom === node.id ? '取消连线' : '开始连线'"
                >
                  <el-icon><Connection /></el-icon>
                </el-button>
                <el-button size="small" circle @click.stop="editNode(node)" title="配置节点">
                  <el-icon><Setting /></el-icon>
                </el-button>
                <el-button size="small" circle @click.stop="deleteNode(node.id)" title="删除节点">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 模拟连线 -->
            <svg class="mock-edges" :style="{ width: VIRTUAL_CANVAS_WIDTH + 'px', height: VIRTUAL_CANVAS_HEIGHT + 'px' }">
              <g v-for="(edge, index) in mockEdges" :key="index">
                <path
                  :d="edge.path"
                  stroke="#409EFF"
                  stroke-width="3"
                  fill="none"
                  marker-end="url(#arrowhead)"
                  class="edge-path"
                  @click="deleteEdge(edge.id)"
                />
                <circle
                  :cx="edge.midX"
                  :cy="edge.midY"
                  r="8"
                  fill="#F56C6C"
                  stroke="white"
                  stroke-width="2"
                  class="edge-delete-btn"
                  @click="deleteEdge(edge.id)"
                  title="删除连线"
                />
                <text
                  :x="edge.midX"
                  :y="edge.midY + 2"
                  text-anchor="middle"
                  fill="white"
                  font-size="10"
                  font-weight="bold"
                  class="edge-delete-text"
                  @click="deleteEdge(edge.id)"
                >×</text>
              </g>
              <defs>
                <marker
                  id="arrowhead"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#409EFF" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="flow-preview">
      <h4 class="section-title">流程预览</h4>
      <el-card shadow="hover" class="preview-card">
        <div class="preview-content">
          <div v-if="!currentTaskId" class="empty-preview">
            <el-empty description="请先选择子任务" />
          </div>
          <div v-else-if="nodes.length === 0" class="empty-preview">
            <el-empty description="暂无流程可预览" />
          </div>
          <div v-else class="preview-steps">
            <el-steps direction="vertical" :active="orderedNodes.length">
              <el-step
                v-for="node in orderedNodes"
                :key="node.id"
                :title="node.label"
                :description="getComponentDescription(node)"
              />
            </el-steps>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 节点配置抽屉 -->
    <el-drawer
      v-model="editDialogVisible"
      :title="`配置节点 - ${currentEditNode?.label || ''}`"
      direction="rtl"
      size="500px"
    >
      <el-form v-if="currentEditNode" label-position="top" class="node-config-form">
        <el-form-item label="节点名称">
          <el-input v-model="currentEditNode.label" placeholder="请输入节点名称" />
        </el-form-item>

        <!-- 关联指标（除开始/结束外均可绑定） -->
        <template v-if="!['start','end'].includes(currentEditNode.type)">
          <el-form-item label="关联指标">
            <el-select
              v-model="currentEditNode.data.indicatorIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择该环节要完成的指标（可多选）"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="ind in indicatorsForCurrentTask"
                :key="ind.code"
                :label="`${ind.name}（${ind.code}）`"
                :value="ind.code"
              />
            </el-select>
            <div class="form-tip" v-if="indicatorsForCurrentTask.length === 0">无可选项：请在“评估指标”步骤选择指标，或切换到含该指标的子任务</div>
          </el-form-item>

          <el-card v-if="currentIndicatorsMeta.length" class="indicator-meta-card" shadow="never">
            <div class="meta-list">
              <div class="meta-item" v-for="meta in currentIndicatorsMeta" :key="meta.code">
                <div class="meta-title">
                  <el-tag type="success" size="small" class="mr8">{{ meta.name }}</el-tag>
                  <span class="code">{{ meta.code }}</span>
                </div>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="函数名">{{ meta.functionName }}</el-descriptions-item>
                  <el-descriptions-item label="入参">
                    <template v-if="(meta.params || []).length">
                      <div class="fn-params">
                        <div class="fn-param" v-for="(p, idx) in meta.params" :key="idx">
                          <el-tag type="info" size="small" class="mr8">{{ p.name }}</el-tag>
                          <span class="param-type">{{ p.type || 'unknown' }}</span>
                        </div>
                      </div>
                    </template>
                    <span v-else>无</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="返回">
                    <span>{{ meta.returns?.type || 'unknown' }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-card>
        </template>

        <!-- 开始节点配置 -->
        <template v-if="currentEditNode.type === 'start'">
          <el-form-item label="描述">
            <el-input
              v-model="currentEditNode.data.description"
              type="textarea"
              :rows="3"
              placeholder="请输入流程开始描述"
            />
          </el-form-item>
          <el-form-item label="自动启动">
            <el-switch v-model="currentEditNode.data.autoStart" />
            <div class="form-tip">是否在满足条件时自动启动流程</div>
          </el-form-item>
        </template>

        <!-- 结束节点配置 -->
        <template v-else-if="currentEditNode.type === 'end'">
          <el-form-item label="描述">
            <el-input
              v-model="currentEditNode.data.description"
              type="textarea"
              :rows="3"
              placeholder="请输入流程结束描述"
            />
          </el-form-item>
          <el-form-item label="保存结果">
            <el-switch v-model="currentEditNode.data.saveResults" />
            <div class="form-tip">是否保存流程执行结果</div>
          </el-form-item>
        </template>

        <!-- 访问媒体节点配置 -->
        <template v-else-if="currentEditNode.type === 'media_access'">
          <el-form-item label="媒体平台" required>
            <el-checkbox-group v-model="currentEditNode.data.platforms">
              <el-checkbox label="weibo">微博</el-checkbox>
              <el-checkbox label="douyin">抖音</el-checkbox>
              <el-checkbox label="twitter">推特</el-checkbox>
              <el-checkbox label="youtube">YouTube</el-checkbox>
              <el-checkbox label="facebook">Facebook</el-checkbox>
              <el-checkbox label="instagram">Instagram</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="访问区域">
            <el-radio-group v-model="currentEditNode.data.region">
              <el-radio label="domestic">境内</el-radio>
              <el-radio label="overseas">境外</el-radio>
              <el-radio label="both">境内境外</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="访问类型">
            <el-select v-model="currentEditNode.data.accessType" style="width: 100%">
              <el-option label="公开内容" value="public" />
              <el-option label="需要登录" value="login" />
              <el-option label="API接口" value="api" />
            </el-select>
          </el-form-item>
          <el-form-item label="最大页数">
            <el-input-number
              v-model="currentEditNode.data.maxPages"
              :min="1"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <!-- 查找言论节点配置 -->
        <template v-else-if="currentEditNode.type === 'content_search'">
          <el-form-item label="搜索类型" required>
            <el-radio-group v-model="currentEditNode.data.searchType">
              <el-radio label="keyword">关键字搜索</el-radio>
              <el-radio label="url">URL搜索</el-radio>
              <el-radio label="id">ID搜索</el-radio>
              <el-radio label="mixed">混合搜索</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="['keyword', 'mixed'].includes(currentEditNode.data.searchType)" label="关键字">
            <el-input
              v-model="keywordInput"
              placeholder="输入关键字后按回车添加"
              @keyup.enter="addKeyword"
            />
            <div class="tag-list">
              <el-tag
                v-for="(keyword, index) in currentEditNode.data.keywords"
                :key="index"
                closable
                @close="removeKeyword(index)"
                class="keyword-tag"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item v-if="['url', 'mixed'].includes(currentEditNode.data.searchType)" label="URL列表">
            <el-input
              v-model="urlInput"
              placeholder="输入URL后按回车添加"
              @keyup.enter="addUrl"
            />
            <div class="tag-list">
              <el-tag
                v-for="(url, index) in currentEditNode.data.urls"
                :key="index"
                closable
                @close="removeUrl(index)"
                class="url-tag"
              >
                {{ url }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item v-if="['id', 'mixed'].includes(currentEditNode.data.searchType)" label="ID列表">
            <el-input
              v-model="idInput"
              placeholder="输入ID后按回车添加"
              @keyup.enter="addId"
            />
            <div class="tag-list">
              <el-tag
                v-for="(id, index) in currentEditNode.data.ids"
                :key="index"
                closable
                @close="removeId(index)"
                class="id-tag"
              >
                {{ id }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="时间范围">
            <el-select v-model="currentEditNode.data.timeRange" style="width: 100%">
              <el-option label="最近1小时" value="1h" />
              <el-option label="最近24小时" value="24h" />
              <el-option label="最近7天" value="7d" />
              <el-option label="最近30天" value="30d" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
        </template>

        <!-- 评价言论节点配置 -->
        <template v-else-if="currentEditNode.type === 'content_evaluation'">
          <el-form-item label="评价类型" required>
            <el-select v-model="currentEditNode.data.evaluationType" style="width: 100%">
              <el-option label="情感分析" value="sentiment" />
              <el-option label="内容质量" value="quality" />
              <el-option label="真实性" value="authenticity" />
              <el-option label="影响力" value="influence" />
              <el-option label="综合评估" value="comprehensive" />
            </el-select>
          </el-form-item>
          <el-form-item label="评价标准">
            <el-checkbox-group v-model="currentEditNode.data.criteria">
              <el-checkbox label="relevance">相关性</el-checkbox>
              <el-checkbox label="accuracy">准确性</el-checkbox>
              <el-checkbox label="bias">偏见程度</el-checkbox>
              <el-checkbox label="emotion">情感倾向</el-checkbox>
              <el-checkbox label="credibility">可信度</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="评价阈值">
            <el-slider
              v-model="currentEditNode.data.threshold"
              :min="0"
              :max="1"
              :step="0.1"
              show-input
            />
            <div class="form-tip">低于此阈值的言论将被标记为需要关注</div>
          </el-form-item>
          <el-form-item label="评论账号数量">
            <el-input-number
              v-model="currentEditNode.data.accountCount"
              :min="1"
              :max="100"
              style="width: 100%"
            />
            <div class="form-tip">参与评价的评论账号数量</div>
          </el-form-item>
          <el-form-item label="评论频率">
            <el-radio-group v-model="currentEditNode.data.commentFrequency">
              <el-radio label="once">每个账号评论一次</el-radio>
              <el-radio label="multiple">每个账号评论多次</el-radio>
              <el-radio label="random">随机区间评论</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="currentEditNode.data.commentFrequency === 'multiple'" label="评论次数">
            <el-input-number
              v-model="currentEditNode.data.commentTimes"
              :min="2"
              :max="10"
              style="width: 100%"
            />
            <div class="form-tip">每个账号的评论次数</div>
          </el-form-item>
          <el-form-item v-if="currentEditNode.data.commentFrequency === 'random'" label="评论次数区间">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-input-number
                v-model="currentEditNode.data.minCommentTimes"
                :min="1"
                :max="20"
                placeholder="最少"
                style="width: 100px"
              />
              <span>至</span>
              <el-input-number
                v-model="currentEditNode.data.maxCommentTimes"
                :min="1"
                :max="20"
                placeholder="最多"
                style="width: 100px"
              />
            </div>
            <div class="form-tip">每个账号的评论次数将在指定区间内随机生成</div>
          </el-form-item>
        </template>

        <!-- 回复评论节点配置 -->
        <template v-else-if="currentEditNode.type === 'comment_reply'">
          <el-form-item label="寻找相关评论的方法" required>
            <el-radio-group v-model="currentEditNode.data.findRelatedMode">
              <el-radio label="keyword">关键字匹配</el-radio>
              <el-radio label="semantic">语义匹配</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="回复延迟(秒)">
            <el-input-number
              v-model="currentEditNode.data.delay"
              :min="0"
              :max="300"
              style="width: 100%"
            />
            <div class="form-tip">避免被检测为机器人的延迟时间</div>
          </el-form-item>
          <el-form-item label="最大回复数">
            <el-input-number
              v-model="currentEditNode.data.maxReplies"
              :min="1"
              :max="50"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="评论账号数量">
            <el-input-number
              v-model="currentEditNode.data.accountCount"
              :min="1"
              :max="100"
              style="width: 100%"
            />
            <div class="form-tip">若可用评论账号不足，将在日志标记“已全部评论”。</div>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNodeEdit">保存配置</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoPlay,
  VideoPause,
  Monitor,
  Search,
  Star,
  ChatDotRound,
  Delete,
  Refresh,
  Setting,
  Connection
} from '@element-plus/icons-vue'

import { getCapabilitySystemDetail } from '@/api/capability'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:flow'])

// 子任务与流程映射
const selectedTaskIds = computed(() => Array.isArray(props.formData?.keyFactors?.tasks) ? props.formData.keyFactors.tasks : [])
const flowsByTask = ref({})
const currentTaskId = ref('')
const taskNameMap = ref({})
const currentTaskName = computed(() => getTaskName(currentTaskId.value))
const currentNodeCount = computed(() => nodes.value.length)
const currentEdgeCount = computed(() => edges.value.length)

// 指标与函数元数据（来源：能力体系详情 + 指标步骤选中项）
const systemDetail = ref(null)
const selectedIndicatorIds = computed(() => Array.isArray(props.formData?.indicators?.indicatorIds) ? props.formData.indicators.indicatorIds : [])

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

watch(() => props.formData?.keyFactors?.targetId, () => { loadSystemDetail() }, { immediate: true })

// 取当前子任务下，且在“评估指标”步骤中已选中的指标
const indicatorsForCurrentTask = computed(() => {
  const detail = systemDetail.value
  const tid = currentTaskId.value
  if (!detail || !tid) return []
  const subtasks = Array.isArray(detail.subtasks) ? detail.subtasks : []
  const st = subtasks.find(s => s.id === tid)
  if (!st) return []
  const capabilities = Array.isArray(st.capabilities) ? st.capabilities : []
  const allMetrics = []
  for (const cap of capabilities) {
    const metrics = Array.isArray(cap.metrics) ? cap.metrics : []
    for (const m of metrics) allMetrics.push(m)
  }
  const set = new Set(selectedIndicatorIds.value)
  return allMetrics.filter(m => set.has(m.code))
})

// 当前编辑节点所选指标的函数元数据
const currentIndicatorsMeta = computed(() => {
  if (!currentEditNode.value) return []
  const codes = Array.isArray(currentEditNode.value.data?.indicatorIds) ? currentEditNode.value.data.indicatorIds : []
  if (!codes.length) return []
  const list = indicatorsForCurrentTask.value
  const result = []
  for (const c of codes) {
    const m = list.find(x => x.code === c)
    if (!m) continue
    const fn = m.function || {}
    result.push({
      code: m.code,
      name: m.name,
      functionName: fn.name || m.code || 'metric',
      params: Array.isArray(fn.params) ? fn.params : [],
      returns: fn.returns || null
    })
  }
  return result
})

// 社交机器人功能组件库定义
const componentLibrary = [
  {
    type: 'start',
    name: '开始',
    icon: 'VideoPlay',
    description: '流程开始节点（只能有一个）',
    color: '#67C23A',
    maxCount: 1
  },
  {
    type: 'end',
    name: '结束',
    icon: 'VideoPause',
    description: '流程结束节点（只能有一个）',
    color: '#F56C6C',
    maxCount: 1
  },
  {
    type: 'media_access',
    name: '访问媒体',
    icon: 'Monitor',
    description: '访问指定媒体平台获取内容',
    color: '#409EFF'
  },
  {
    type: 'content_search',
    name: '查找新闻帖子',
    icon: 'Search',
    description: '根据关键字、URL、ID查找新闻、帖子内容',
    color: '#E6A23C'
  },
  {
    type: 'content_evaluation',
    name: '评价言论',
    icon: 'Star',
    description: '对言论内容进行评价分析',
    color: '#9C27B0'
  },
  {
    type: 'comment_reply',
    name: '回复评论',
    icon: 'ChatDotRound',
    description: '自动回复评论内容',
    color: '#FF9800'
  }
]

// 当前子任务的节点和边数据
const nodes = ref([])
const edges = ref([])

// 连线相关状态
const isConnecting = ref(false)
const connectingFrom = ref(null)
const connectingTo = ref(null)
const tempEdge = ref(null)

// 节点拖拽相关状态
const isDragging = ref(false)
const dragNode = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

// 画布缩放与平移
const canvasPlaceholderRef = ref(null)
const canvasScale = ref(1)
const pan = reactive({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const mouseStart = ref({ x: 0, y: 0 })
const VIRTUAL_CANVAS_WIDTH = 3000
const VIRTUAL_CANVAS_HEIGHT = 2000
const MIN_SCALE = 0.5
const MAX_SCALE = 2

// 初始化与同步 flowsByTask、任务名称
const initFlowData = async () => {
  flowsByTask.value = props.formData?.experimentFlow && typeof props.formData.experimentFlow === 'object' ? JSON.parse(JSON.stringify(props.formData.experimentFlow)) : {}
  // 任务名映射：根据选定体系加载一次
  const targetId = props.formData?.keyFactors?.targetId
  if (targetId) {
    try {
      const { data } = await getCapabilitySystemDetail(targetId)
      const subtasks = Array.isArray(data?.subtasks) ? data.subtasks : []
      taskNameMap.value = subtasks.reduce((acc, st) => { acc[st.id] = st.name || st.id; return acc }, {})
    } catch (e) {
      taskNameMap.value = {}
    }
  }
  // 选择第一个任务
  if (selectedTaskIds.value.length > 0) {
    switchTask(selectedTaskIds.value[0])
  } else {
    currentTaskId.value = ''
    nodes.value = []
    edges.value = []
  }
}

// 监听 props 中流程映射变化（来自父级覆盖）
watch(() => props.formData.experimentFlow, (newValue) => {
  if (!newValue || typeof newValue !== 'object') return
  flowsByTask.value = JSON.parse(JSON.stringify(newValue))
  if (currentTaskId.value) {
    loadCurrentTaskData()
  }
}, { deep: true })

// 监听子任务列表变化：新增/删除时同步 flowsByTask，并切换当前任务
watch(selectedTaskIds, (newIds, oldIds) => {
  const setNew = new Set(newIds)
  const setOld = new Set(oldIds || [])
  // 删除未选中的流程
  Object.keys(flowsByTask.value).forEach((tid) => {
    if (!setNew.has(tid)) delete flowsByTask.value[tid]
  })
  // 为新增任务准备空流程
  newIds.forEach((tid) => {
    if (!flowsByTask.value[tid]) flowsByTask.value[tid] = { nodes: [], edges: [] }
  })
  // 如果当前任务被移除，则切换
  if (currentTaskId.value && !setNew.has(currentTaskId.value)) {
    currentTaskId.value = newIds[0] || ''
  }
  if (currentTaskId.value) {
    loadCurrentTaskData()
  } else {
    nodes.value = []
    edges.value = []
  }
  updateFlow(true)
}, { deep: true })

const getTaskName = (taskId) => {
  if (!taskId) return ''
  return taskNameMap.value[taskId] || taskId
}

const switchTask = (taskId) => {
  // 先保存当前任务数据
  persistCurrentTaskData()
  currentTaskId.value = taskId
  loadCurrentTaskData()
}

watch(currentTaskId, (tid) => {
  if (!tid) return
  loadCurrentTaskData()
})

function loadCurrentTaskData() {
  const flow = flowsByTask.value[currentTaskId.value] || { nodes: [], edges: [] }
  nodes.value = (flow.nodes || []).map(n => ({ ...n }))
  edges.value = (flow.edges || []).map(e => ({ ...e }))
}

function persistCurrentTaskData() {
  if (!currentTaskId.value) return
  flowsByTask.value[currentTaskId.value] = {
    nodes: nodes.value.map(n => ({ ...n })),
    edges: edges.value.map(e => ({ ...e }))
  }
}

// 模拟边的路径
const mockEdges = computed(() => {
  return edges.value.map(edge => {
    const sourceNode = nodes.value.find(n => n.id === edge.source)
    const targetNode = nodes.value.find(n => n.id === edge.target)

    if (!sourceNode || !targetNode) return { path: '', midX: 0, midY: 0, id: edge.id }

    const sourceX = sourceNode.position.x + 100 // 假设节点宽度为200
    const sourceY = sourceNode.position.y + 40  // 假设节点高度一半为40
    const targetX = targetNode.position.x
    const targetY = targetNode.position.y + 40  // 假设节点高度一半为40

    // 计算中点坐标
    const midX = (sourceX + targetX) / 2
    const midY = (sourceY + targetY) / 2

    return {
      id: edge.id,
      path: `M ${sourceX} ${sourceY} C ${sourceX + 50} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`,
      midX,
      midY
    }
  })
})

// 检查组件是否禁用
const isComponentDisabled = (component) => {
  if (!component.maxCount) return false
  const existingCount = nodes.value.filter(n => n.type === component.type).length
  return existingCount >= component.maxCount
}

// 拖拽开始
const handleDragStart = (event, component) => {
  if (isComponentDisabled(component)) {
    event.preventDefault()
    return
  }
  event.dataTransfer.setData('componentType', component.type)
}

// 拖拽放置
const handleDrop = (event) => {
  const componentType = event.dataTransfer.getData('componentType')
  if (!componentType) return

  const component = componentLibrary.find(c => c.type === componentType)
  if (!component) return

  // 检查节点数量限制
  if (component.maxCount) {
    const existingCount = nodes.value.filter(n => n.type === componentType).length
    if (existingCount >= component.maxCount) {
      ElMessage.warning(`${component.name}节点最多只能添加${component.maxCount}个`)
      return
    }
  }

  // 计算放置位置
  const canvasRect = event.currentTarget.getBoundingClientRect()
  const nodeWidthHalf = 100
  const nodeHeightHalf = 40
  const worldX = (event.clientX - canvasRect.left - pan.x) / canvasScale.value
  const worldY = (event.clientY - canvasRect.top - pan.y) / canvasScale.value
  const rawX = worldX - nodeWidthHalf
  const rawY = worldY - nodeHeightHalf
  const nodeWidth = 200
  const nodeHeight = 120
  const x = Math.max(0, Math.min(rawX, VIRTUAL_CANVAS_WIDTH - nodeWidth))
  const y = Math.max(0, Math.min(rawY, VIRTUAL_CANVAS_HEIGHT - nodeHeight))

  // 创建新节点
  const newNode = {
    id: `node_${Date.now()}`,
    type: componentType,
    label: component.name,
    position: { x, y },
    data: getDefaultNodeData(componentType)
  }

  nodes.value.push(newNode)
  updateFlow()
}

// 获取默认节点数据
const getDefaultNodeData = (type) => {
  switch (type) {
    case 'start':
      return {
        description: '流程开始',
        autoStart: true
      }
    case 'end':
      return {
        description: '流程结束',
        saveResults: true
      }
    case 'media_access':
      return {
        platforms: ['weibo'],
        region: 'domestic',
        accessType: 'public',
        maxPages: 10
      }
    case 'content_search':
      return {
        searchType: 'keyword',
        keywords: [],
        urls: [],
        ids: [],
        timeRange: '24h'
      }
    case 'content_evaluation':
      return {
        evaluationType: 'sentiment',
        criteria: ['relevance', 'accuracy', 'bias'],
        threshold: 0.7,
        accountCount: 1,
        commentFrequency: 'once',
        commentTimes: 2,
        minCommentTimes: 1,
        maxCommentTimes: 3
      }
    case 'comment_reply':
      return {
        findRelatedMode: 'keyword',
        delay: 30,
        maxReplies: 5,
        accountCount: 3
      }
    default:
      return {}
  }
}

// 清空画布
const clearCanvas = () => {
  if (!currentTaskId.value) return
  nodes.value = []
  edges.value = []
  updateFlow()
}

// 自动布局
const autoLayout = () => {
  if (!currentTaskId.value || nodes.value.length === 0) return

  // 按照节点类型排序：开始 -> 其他节点 -> 结束
  const sortedNodes = [...nodes.value].sort((a, b) => {
    if (a.type === 'start') return -1
    if (b.type === 'start') return 1
    if (a.type === 'end') return 1
    if (b.type === 'end') return -1
    return 0
  })

  // 简单的自动布局，将节点垂直排列
  sortedNodes.forEach((node, index) => {
    node.position = { x: 100, y: 100 + index * 150 }
  })

  // 创建简单的连接关系（单链连接）
  edges.value = []
  for (let i = 0; i < sortedNodes.length - 1; i++) {
    edges.value.push({
      source: sortedNodes[i].id,
      target: sortedNodes[i + 1].id,
      id: `edge_${sortedNodes[i].id}_${sortedNodes[i + 1].id}`
    })
  }

  updateFlow()
}

// 删除节点
const deleteNode = (nodeId) => {
  const index = nodes.value.findIndex(n => n.id === nodeId)
  if (index !== -1) {
    nodes.value.splice(index, 1)
    // 删除相关的边
    edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
    updateFlow()
  }
}

// 节点编辑
const editDialogVisible = ref(false)
const currentEditNode = ref(null)
const originalEditNode = ref(null)

// 配置表单输入状态
const keywordInput = ref('')
const urlInput = ref('')
const idInput = ref('')
// 模板相关变量已移除

const editNode = (node) => {
  currentEditNode.value = JSON.parse(JSON.stringify(node))
  originalEditNode.value = node
  editDialogVisible.value = true
}

const saveNodeEdit = () => {
  if (!currentEditNode.value || !originalEditNode.value) return

  // 更新节点数据
  const index = nodes.value.findIndex(n => n.id === originalEditNode.value.id)
  if (index !== -1) {
    nodes.value[index] = {...currentEditNode.value}
    updateFlow()
  }

  editDialogVisible.value = false
  currentEditNode.value = null
  originalEditNode.value = null
}

// 配置表单辅助方法
const addKeyword = () => {
  if (keywordInput.value.trim() && currentEditNode.value) {
    if (!currentEditNode.value.data.keywords) {
      currentEditNode.value.data.keywords = []
    }
    currentEditNode.value.data.keywords.push(keywordInput.value.trim())
    keywordInput.value = ''
  }
}

const removeKeyword = (index) => {
  if (currentEditNode.value && currentEditNode.value.data.keywords) {
    currentEditNode.value.data.keywords.splice(index, 1)
  }
}

const addUrl = () => {
  if (urlInput.value.trim() && currentEditNode.value) {
    if (!currentEditNode.value.data.urls) {
      currentEditNode.value.data.urls = []
    }
    currentEditNode.value.data.urls.push(urlInput.value.trim())
    urlInput.value = ''
  }
}

const removeUrl = (index) => {
  if (currentEditNode.value && currentEditNode.value.data.urls) {
    currentEditNode.value.data.urls.splice(index, 1)
  }
}

const addId = () => {
  if (idInput.value.trim() && currentEditNode.value) {
    if (!currentEditNode.value.data.ids) {
      currentEditNode.value.data.ids = []
    }
    currentEditNode.value.data.ids.push(idInput.value.trim())
    idInput.value = ''
  }
}

const removeId = (index) => {
  if (currentEditNode.value && currentEditNode.value.data.ids) {
    currentEditNode.value.data.ids.splice(index, 1)
  }
}

// 模板相关方法已移除

// 获取组件名称
const getComponentName = (type) => {
  const component = componentLibrary.find(c => c.type === type)
  return component ? component.name : type
}

// 获取组件颜色
const getComponentColor = (type) => {
  const component = componentLibrary.find(c => c.type === type)
  return component ? component.color : '#909399'
}

// 获取组件图标
const getComponentIcon = (type) => {
  const component = componentLibrary.find(c => c.type === type)
  return component ? component.icon : 'QuestionFilled'
}

// 获取组件描述
const getComponentDescription = (node) => {
  const component = componentLibrary.find(c => c.type === node.type)
  if (!component) return ''

  let description = component.description

  // 根据节点类型添加特定描述
  switch (node.type) {
    case 'start':
      description += ` (${node.data.autoStart ? '自动启动' : '手动启动'})`
      break
    case 'end':
      description += ` (${node.data.saveResults ? '保存结果' : '不保存结果'})`
      break
    case 'media_access':
      const platforms = node.data.platforms || []
      description += ` (平台: ${platforms.length > 0 ? platforms.join(', ') : '未选择'})`
      break
    case 'content_search':
      const searchType = node.data.searchType || 'keyword'
      description += ` (搜索类型: ${searchType})`
      break
    case 'content_evaluation':
      const evalType = node.data.evaluationType || 'sentiment'
      description += ` (评价类型: ${evalType})`
      break
    case 'comment_reply':
      const mode = node.data.findRelatedMode || 'keyword'
      const acc = node.data.accountCount ? `, 账号数: ${node.data.accountCount}` : ''
      description += ` (寻找方式: ${mode}${acc})`
      break
  }

  return description
}

// 按照连线顺序排列节点
const orderedNodes = computed(() => {
  if (nodes.value.length === 0) return []

  // 找到开始节点
  const startNode = nodes.value.find(node => node.type === 'start')
  if (!startNode) return nodes.value

  const ordered = []
  const visited = new Set()

  // 从开始节点开始遍历
  let currentNode = startNode
  while (currentNode && !visited.has(currentNode.id)) {
    visited.add(currentNode.id)
    ordered.push(currentNode)

    // 找到当前节点的下一个节点
    const nextEdge = edges.value.find(edge => edge.source === currentNode.id)
    if (nextEdge) {
      currentNode = nodes.value.find(node => node.id === nextEdge.target)
    } else {
      currentNode = null
    }
  }

  // 添加未连接的节点
  nodes.value.forEach(node => {
    if (!visited.has(node.id)) {
      ordered.push(node)
    }
  })

  return ordered
})

// 连线功能
const startConnection = (nodeId) => {
  if (isConnecting.value) {
    // 如果已经在连线状态，则完成连线
    completeConnection(nodeId)
  } else {
    // 开始新的连线
    isConnecting.value = true
    connectingFrom.value = nodeId
    connectingTo.value = null
  }
}

const completeConnection = (targetNodeId) => {
  if (!isConnecting.value || !connectingFrom.value || connectingFrom.value === targetNodeId) {
    // 取消连线
    cancelConnection()
    return
  }

  // 检查是否已存在连线
  const existingEdge = edges.value.find(edge =>
    edge.source === connectingFrom.value && edge.target === targetNodeId
  )

  if (existingEdge) {
    ElMessage.warning('节点间已存在连线')
    cancelConnection()
    return
  }

  // 检查源节点是否已经有出线
  const sourceHasOutgoing = edges.value.find(edge => edge.source === connectingFrom.value)
  if (sourceHasOutgoing) {
    ElMessage.warning('每个节点只能连接一个目标节点')
    cancelConnection()
    return
  }

  // 检查目标节点是否已经有入线
  const targetHasIncoming = edges.value.find(edge => edge.target === targetNodeId)
  if (targetHasIncoming) {
    ElMessage.warning('每个节点只能被一个源节点连接')
    cancelConnection()
    return
  }

  // 创建新连线
  const newEdge = {
    id: `edge_${connectingFrom.value}_${targetNodeId}`,
    source: connectingFrom.value,
    target: targetNodeId,
    type: 'default'
  }

  edges.value.push(newEdge)
  updateFlow()
  cancelConnection()
}

const cancelConnection = () => {
  isConnecting.value = false
  connectingFrom.value = null
  connectingTo.value = null
  tempEdge.value = null
}

// 删除连线
const deleteEdge = (edgeId) => {
  const index = edges.value.findIndex(e => e.id === edgeId)
  if (index !== -1) {
    edges.value.splice(index, 1)
    updateFlow()
  }
}

// 节点拖拽功能
const startNodeDrag = (event, node) => {
  // 如果正在连线，不启动拖拽
  if (isConnecting.value) return

  // 如果点击的是按钮，不启动拖拽
  if (event.target.closest('.el-button')) return

  event.preventDefault()
  isDragging.value = true
  dragNode.value = node.id

  const rect = event.currentTarget.getBoundingClientRect()
  dragOffset.value = {
    x: (event.clientX - rect.left) / canvasScale.value,
    y: (event.clientY - rect.top) / canvasScale.value
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', handleNodeDrag)
  document.addEventListener('mouseup', endNodeDrag)
}

const handleNodeDrag = (event) => {
  if (!isDragging.value || !dragNode.value) return

  const canvasRect = canvasPlaceholderRef.value?.getBoundingClientRect()
  if (!canvasRect) return
  const worldX = (event.clientX - canvasRect.left - pan.x) / canvasScale.value
  const worldY = (event.clientY - canvasRect.top - pan.y) / canvasScale.value

  const rawX = worldX - dragOffset.value.x
  const rawY = worldY - dragOffset.value.y

  const nodeWidth = 200
  const nodeHeight = 120
  const constrainedX = Math.max(0, Math.min(rawX, VIRTUAL_CANVAS_WIDTH - nodeWidth))
  const constrainedY = Math.max(0, Math.min(rawY, VIRTUAL_CANVAS_HEIGHT - nodeHeight))

  const node = nodes.value.find(n => n.id === dragNode.value)
  if (node) {
    node.position.x = constrainedX
    node.position.y = constrainedY
  }
}

const endNodeDrag = () => {
  if (isDragging.value) {
    isDragging.value = false
    dragNode.value = null
    dragOffset.value = { x: 0, y: 0 }
    updateFlow()
  }

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleNodeDrag)
  document.removeEventListener('mouseup', endNodeDrag)
}

// 更新流程数据
const updateFlow = () => {
  // 持久化当前任务到映射并上抛整个映射
  persistCurrentTaskData()
  emit('update:flow', JSON.parse(JSON.stringify(flowsByTask.value)))
}

// 初始化
initFlowData()

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleNodeDrag)
  document.removeEventListener('mouseup', endNodeDrag)
})

// 缩放控制
const zoomIn = () => { canvasScale.value = Math.min(MAX_SCALE, +(canvasScale.value + 0.1).toFixed(2)) }
const zoomOut = () => { canvasScale.value = Math.max(MIN_SCALE, +(canvasScale.value - 0.1).toFixed(2)) }
const resetZoom = () => { canvasScale.value = 1; pan.x = 0; pan.y = 0 }

const handleWheel = (event) => {
  const direction = event.deltaY > 0 ? -1 : 1
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(canvasScale.value + direction * 0.1).toFixed(2)))
  const canvasRect = canvasPlaceholderRef.value?.getBoundingClientRect()
  if (!canvasRect) { canvasScale.value = newScale; return }

  // 保持鼠标位置对应的世界坐标点不动
  const cx = event.clientX - canvasRect.left
  const cy = event.clientY - canvasRect.top
  const wx = (cx - pan.x) / canvasScale.value
  const wy = (cy - pan.y) / canvasScale.value
  canvasScale.value = newScale
  pan.x = cx - wx * canvasScale.value
  pan.y = cy - wy * canvasScale.value
}

// 平移控制
const startPan = (event) => {
  // 避免在拖节点或点击节点时触发
  if (event.target.closest('.mock-node')) return
  isPanning.value = true
  mouseStart.value = { x: event.clientX, y: event.clientY }
  panStart.value = { x: pan.x, y: pan.y }
  document.addEventListener('mousemove', handlePan)
  document.addEventListener('mouseup', endPan)
}

const handlePan = (event) => {
  if (!isPanning.value) return
  const dx = event.clientX - mouseStart.value.x
  const dy = event.clientY - mouseStart.value.y
  pan.x = panStart.value.x + dx
  pan.y = panStart.value.y + dy
}

const endPan = () => {
  if (!isPanning.value) return
  isPanning.value = false
  document.removeEventListener('mousemove', handlePan)
  document.removeEventListener('mouseup', endPan)
}
</script>

<style lang="scss" scoped>
.flow-design-step {
  .step-title {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 20px;
  }

  .flow-design-info {
    margin-bottom: 20px;
  }

  .section-title, .panel-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 15px;
    margin-top: 0;
  }

  .flow-design-container {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;

    &.disabled {
      opacity: 0.6;
      pointer-events: none;
      user-select: none;
    }

    .component-panel {
      width: 200px;
      flex-shrink: 0;

      .component-list {
        border: 1px solid #DCDFE6;
        border-radius: 4px;
        padding: 10px;

        .component-item {
          display: flex;
          align-items: center;
          padding: 10px;
          margin-bottom: 8px;
          border: 1px dashed #DCDFE6;
          border-radius: 4px;
          cursor: move;
          background-color: #F5F7FA;
          transition: all 0.3s;
          position: relative;

          &:last-child {
            margin-bottom: 0;
          }

          &:hover:not(.disabled) {
            background-color: #EBEEF5;
            border-color: #C0C4CC;
          }

          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: #F5F7FA;
            border-color: #E4E7ED;
          }

          .component-icon {
            margin-right: 8px;
            font-size: 18px;
          }

          .component-name {
            font-size: 14px;
            flex: 1;
          }

          .component-limit {
            font-size: 12px;
            color: #909399;
            margin-left: 4px;
          }
        }
      }
    }

    .flow-canvas {
      flex-grow: 1;

      .canvas-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .canvas-placeholder {
        border: 1px solid #DCDFE6;
        border-radius: 4px;
        height: 500px;
        position: relative;
        background-color: #F5F7FA;
        overflow: hidden;

        .empty-canvas {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        .mock-flow-canvas {
          width: 100%;
          height: 100%;
          position: relative;

          .mock-node {
            position: absolute;
            width: 200px;
            border-radius: 8px;
            background-color: white;
            box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
            border: 2px solid transparent;
            z-index: 10;
            transition: all 0.3s ease;

            &:hover:not(.dragging) {
              box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.2);
              transform: translateY(-2px);
            }

            &:not(.dragging) {
              cursor: move;
            }

            &.connecting {
              border-color: #409EFF;
              box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
            }

            &.connect-target {
              border-color: #67C23A;
              box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
              cursor: pointer;
            }

            &.dragging {
              z-index: 1000;
              transform: rotate(2deg);
              box-shadow: 0 8px 25px 0 rgba(0, 0, 0, 0.3);
            }

            .node-header {
              padding: 10px 12px;
              border-top-left-radius: 6px;
              border-top-right-radius: 6px;
              color: white;
              font-size: 14px;
              font-weight: 500;
              display: flex;
              align-items: center;

              .node-icon {
                margin-right: 6px;
                font-size: 16px;
              }
            }

            .node-body {
              padding: 12px;
              font-size: 13px;
              color: #606266;
              min-height: 40px;
            }

            .node-actions {
              padding: 8px 12px;
              border-top: 1px solid #EBEEF5;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
          }

          .mock-edges {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 5;

            .edge-path {
              cursor: pointer;
              transition: stroke-width 0.2s;

              &:hover {
                stroke-width: 4;
              }
            }

            .edge-delete-btn {
              cursor: pointer;
              opacity: 0;
              transition: opacity 0.2s;

              &:hover {
                opacity: 1;
                fill: #F56C6C;
              }
            }

            .edge-delete-text {
              cursor: pointer;
              opacity: 0;
              transition: opacity 0.2s;
              pointer-events: none;
            }

            g:hover {
              .edge-delete-btn,
              .edge-delete-text {
                opacity: 1;
              }
            }
          }
        }
      }
    }
  }

  // 顶部任务切换 UI
  .task-bind-bar {
    margin-bottom: 12px;

    .task-switch {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border: 1px solid #DCDFE6;
      border-radius: 8px;
      background: #fff;
      padding: 10px 12px;
    }

    .left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .section-title-inline {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      white-space: nowrap;
    }

    .task-chips {
      max-width: 820px;
      .el-scrollbar__wrap { overflow-x: auto; }
      .el-scrollbar__view { display: flex; gap: 8px; }
    }

    .task-chip {
      background: #f6f9fe;
      border: 1px solid #d7e7ff;
      color: #2f5fb3;
      padding: 6px 10px;
      border-radius: 999px;
      cursor: pointer;
      transition: all .2s ease;
      user-select: none;

      &.active {
        background: #ecf5ff;
        border-color: #409eff;
        color: #1f4fa3;
        box-shadow: 0 0 0 2px rgba(64,158,255,0.08) inset;
      }

      &:hover { transform: translateY(-1px); }

      .chip-content {
        display: flex; align-items: center; gap: 6px;
        .dot { width: 6px; height: 6px; background: #409eff; border-radius: 50%; display: inline-block; }
        .name { font-size: 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      }
    }

    .right {
      .meta { display: flex; align-items: center; gap: 10px; color: #606266; font-size: 12px; }
      .meta b { color: #303133; font-weight: 600; }
      .divider { width: 1px; height: 12px; background: #e4e7ed; display: inline-block; }
    }
  }

  .flow-preview {
    .preview-card {
      .preview-content {
        min-height: 200px;

        .empty-preview {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        .preview-steps {
          padding: 10px;
        }
      }
    }
  }

  // 节点配置表单样式
  .node-config-form {
    .indicator-meta-card {
      margin-bottom: 12px;
      .mr8 { margin-right: 8px; }
      .fn-params { display: flex; flex-wrap: wrap; gap: 6px; }
      .param-type { color: #909399; font-size: 12px; margin-left: 4px; }
      .meta-list { display: flex; flex-direction: column; gap: 10px; }
      .meta-item .meta-title { margin-bottom: 6px; }
      .meta-item .code { color: #909399; font-size: 12px; }
    }
    .form-tip {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    .tag-list {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .keyword-tag {
        background-color: #E1F3D8;
        color: #67C23A;
        border-color: #B3E19D;
      }

      .url-tag {
        background-color: #E6F7FF;
        color: #409EFF;
        border-color: #91D5FF;
      }

      .id-tag {
        background-color: #FDF6EC;
        color: #E6A23C;
        border-color: #F5DAB1;
      }
    }

    .template-list {
      margin-top: 8px;

      .template-item {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        align-items: center;

        .el-input {
          flex: 1;
        }
      }
    }
  }

  .drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 0;
    border-top: 1px solid #EBEEF5;
  }
}
</style>
