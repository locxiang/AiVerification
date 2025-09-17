<template>
  <div class="metrics-library-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">指标库（三级）</h2>
            <p class="subtitle">从指标服务器获取指标树，支持按评估方式筛选与关键词过滤</p>
          </div>
          <div class="header-actions">
            <el-input v-model="keyword" placeholder="搜索指标名称" clearable style="width: 260px" @input="onFilterChange" />
            <el-select v-model="evalType" placeholder="评估方式" clearable style="width: 160px; margin-left: 10px" @change="onFilterChange">
              <el-option label="静态评估" value="static" />
              <el-option label="动态评估" value="dynamic" />
              <el-option label="互动式评估" value="interactive" />
            </el-select>
            <el-button style="margin-left: 6px" @click="reset">重置</el-button>
            <el-button type="primary" style="margin-left: 6px" @click="fitToView">全览</el-button>
          </div>
        </div>
      </template>

      <el-alert v-if="error" type="error" :closable="false" show-icon :title="error" style="margin-bottom: 12px" />

      <el-skeleton :loading="loading" animated :throttle="300">
        <template #template>
          <el-skeleton-item variant="h3" style="width: 30%; margin: 10px 0" />
          <el-skeleton-item v-for="i in 5" :key="i" variant="text" style="height: 18px; margin: 10px 0" />
        </template>
        <template #default>
          <div class="canvas-wrap">
            <canvas ref="canvasRef" class="metric-canvas"></canvas>
          </div>
        </template>
      </el-skeleton>
    </el-card>

    <el-drawer v-model="drawer.visible" :title="`指标详情：${drawer.metric?.name || ''}`" direction="rtl" size="420px">
      <div v-if="drawer.metric">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="指标名称">{{ drawer.metric.name }}</el-descriptions-item>
          <el-descriptions-item label="适用评估方式">
            <el-tag v-for="t in (drawer.metric.evalTypes || [])" :key="t" size="small" :type="tagType(t)" style="margin-right: 6px">{{ evalLabel(t) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="指标层级">{{ levelPath(drawer.metric) }}</el-descriptions-item>
        </el-descriptions>
        <div class="section">
          <div class="section-title">计算方式/口径说明</div>
          <div class="section-content">{{ drawer.metric.desc || '暂无描述' }}</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { fetchMetricTree } from '@/api/metrics'

const loading = ref(false)
const error = ref('')
const keyword = ref('')
const evalType = ref('')
const treeRef = ref(null)
const canvasRef = ref(null)
let ctx = null

// 画布状态
const viewport = ref({ x: 0, y: 0, scale: 1 })
let isPanning = false
let lastPan = { x: 0, y: 0 }
let rafId = 0

// 命中检测缓存
const drawNodes = ref([]) // { id, name, evalTypes, level, x, y, r, parents }

const treeData = ref([])
const displayTree = computed(() => {
  // 同时应用评估方式与名称关键词过滤（仅对叶子判断，通过后回溯保留父节点）
  const kw = (keyword.value || '').trim().toLowerCase()
  const type = evalType.value
  const filterTree = (nodes) => {
    const res = []
    nodes.forEach((n) => {
      if (n.children && n.children.length) {
        const children = filterTree(n.children)
        if (children.length) res.push({ ...n, children })
      } else {
        const passType = !type || (n.evalTypes || []).includes(type)
        const passKw = !kw || (n.name || '').toLowerCase().includes(kw)
        if (passType && passKw) res.push({ ...n })
      }
    })
    return res
  }
  return filterTree(treeData.value)
})

function tagType(t) {
  return { static: 'info', dynamic: 'warning', interactive: 'success' }[t] || 'default'
}
function evalLabel(t) {
  return { static: '静态评估', dynamic: '动态评估', interactive: '互动式评估' }[t] || t
}

function onFilterChange() {
  scheduleDraw()
}

const drawer = ref({ visible: false, metric: null })
function findPathById(nodes, id, path = []) {
  for (const n of nodes) {
    const nextPath = [...path, n]
    if (n.id === id) return nextPath
    if (n.children && n.children.length) {
      const found = findPathById(n.children, id, nextPath)
      if (found) return found
    }
  }
  return null
}
const showDetails = (metric) => {
  // 计算层级路径
  const path = findPathById(treeData.value, metric.id) || [metric]
  const parents = path.slice(0, -1).map(p => ({ id: p.id, name: p.name }))
  drawer.value.metric = { ...metric, parents }
  drawer.value.visible = true
}
const levelPath = (leaf) => {
  const p = leaf && leaf.parents ? leaf.parents : []
  return [...p.map(x => x.name), leaf?.name || ''].filter(Boolean).join(' / ')
}

async function loadTree() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await fetchMetricTree()
    treeData.value = Array.isArray(data) ? data : []
    scheduleDraw()
  } catch (e) {
    error.value = '指标树加载失败'
  } finally {
    loading.value = false
  }
}

function reset() {
  keyword.value = ''
  evalType.value = ''
  onFilterChange()
}

onMounted(loadTree)

// ---------- Canvas 渲染 ----------
function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  resizeCanvas()
  attachEvents(canvas)
  scheduleDraw()
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.parentElement.getBoundingClientRect()
  canvas.width = Math.max(600, rect.width) * dpr
  canvas.height = Math.max(400, Math.min(1200, rect.height || 600)) * dpr
  canvas.style.width = Math.max(600, rect.width) + 'px'
  canvas.style.height = Math.max(400, Math.min(1200, rect.height || 600)) + 'px'
  if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0)
}

function scheduleDraw() {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(draw)
}

function computeBoundsWithText(nodes) {
  if (!nodes.length) return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  // 用与绘制一致的字体测量文本宽度
  if (ctx) {
    ctx.save()
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  nodes.forEach(n => {
    const label = n.name || ''
    const tw = ctx ? Math.min(600, ctx.measureText(label).width + 8) : (label.length * 7)
    const right = n.x + n.r + 8 + tw
    const left = n.x - n.r
    const top = n.y - n.r
    const bottom = n.y + n.r + 16 // 留给评估方式一行
    minX = Math.min(minX, left)
    minY = Math.min(minY, top)
    maxX = Math.max(maxX, right)
    maxY = Math.max(maxY, bottom)
  })
  if (ctx) ctx.restore()
  return { minX, minY, maxX, maxY }
}

function fitToView() {
  const canvas = canvasRef.value
  if (!canvas) return
  // 基于当前过滤后的布局计算边界
  const layout = computeLayout(displayTree.value)
  const { nodes } = layout
  const bounds = computeBoundsWithText(nodes)
  const margin = 40
  const worldW = (bounds.maxX - bounds.minX) + margin * 2
  const worldH = (bounds.maxY - bounds.minY) + margin * 2
  const cw = canvas.width
  const ch = canvas.height
  if (worldW <= 0 || worldH <= 0) return
  let s = Math.min(cw / worldW, ch / worldH)
  s = Math.max(0.5, Math.min(2.5, s))
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  viewport.value.scale = s
  viewport.value.x = (cw / s) / 2 - centerX
  viewport.value.y = (ch / s) / 2 - centerY
  scheduleDraw()
}

function computeLayout(tree) {
  // 三列布局：一级、二级、三级；垂直方向按顺序均匀分布
  const colWidth = 280
  const colGap = 120
  const r = 16
  const padding = 40
  const nodes = []
  const edges = []

  // 计算每个一级节点占据的总叶子数，用于纵向分配
  function countLeaves(n) {
    if (!n.children || n.children.length === 0) return 1
    return n.children.reduce((s, c) => s + countLeaves(c), 0)
  }

  const roots = tree
  const totalLeaves = roots.reduce((s, n) => s + countLeaves(n), 0)
  const unitY = 36
  let currentY = 0

  function placeNode(node, level, centerY) {
    const x = padding + level * (colWidth + colGap)
    const y = centerY
    nodes.push({ id: node.id, name: node.name, evalTypes: node.evalTypes || [], level, x, y, r, parents: node.parents || [] })
  }

  function walk(node, level, startY) {
    if (!node.children || node.children.length === 0) {
      const y = startY
      placeNode(node, level, y)
      return { top: y, bottom: y, center: y }
    }
    let top = Infinity
    let bottom = -Infinity
    let childStart = startY
    const childCenters = []
    node.children.forEach((c) => {
      const leaves = countLeaves(c)
      const centerY = childStart + (leaves - 1) * unitY * 0.5
      const box = walk(c, level + 1, childStart)
      childCenters.push(box.center)
      top = Math.min(top, box.top)
      bottom = Math.max(bottom, box.bottom)
      childStart += leaves * unitY
      // 记录边：从当前节点到子节点中心
      edges.push({ fromId: node.id, toId: c.id })
    })
    const center = childCenters.length ? (childCenters.reduce((a, b) => a + b, 0) / childCenters.length) : startY
    placeNode(node, level, center)
    top = Math.min(top, center)
    bottom = Math.max(bottom, center)
    return { top, bottom, center }
  }

  roots.forEach((root) => {
    const leaves = countLeaves(root)
    const startY = currentY
    const box = walk(root, 0, startY)
    currentY = startY + leaves * unitY + unitY // 区块间距
  })

  // 为 edges 计算坐标
  const idToNode = Object.fromEntries(nodes.map(n => [n.id, n]))
  const edgesWithPoints = edges.map(e => ({
    ...e,
    x1: idToNode[e.fromId].x,
    y1: idToNode[e.fromId].y,
    x2: idToNode[e.toId].x,
    y2: idToNode[e.toId].y,
  }))
  return { nodes, edges: edgesWithPoints, r, padding }
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  const dpr = window.devicePixelRatio || 1
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  const { nodes, edges } = computeLayout(displayTree.value)
  drawNodes.value = nodes

  ctx.save()
  ctx.scale(viewport.value.scale, viewport.value.scale)
  ctx.translate(viewport.value.x, viewport.value.y)

  // 边
  ctx.strokeStyle = '#dcdfe6'
  ctx.lineWidth = 1 * (window.devicePixelRatio || 1)
  edges.forEach(e => {
    ctx.beginPath()
    const mx = (e.x1 + e.x2) / 2
    ctx.moveTo(e.x1, e.y1)
    ctx.bezierCurveTo(mx, e.y1, mx, e.y2, e.x2, e.y2)
    ctx.stroke()
  })

  // 节点
  nodes.forEach(n => {
    // 节点圆
    ctx.beginPath()
    ctx.fillStyle = n.level === 0 ? '#ecf5ff' : (n.level === 1 ? '#f0f9eb' : '#fdf6ec')
    ctx.strokeStyle = '#c0c4cc'
    ctx.lineWidth = 1
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // 文本
    ctx.fillStyle = '#303133'
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(n.name, n.x + n.r + 8, n.y)
    // 评估方式小标记
    const tags = (n.evalTypes || [])
    if (tags.length) {
      const tagText = tags.map(evalLabel).join(' / ')
      ctx.fillStyle = '#909399'
      ctx.font = '11px sans-serif'
      ctx.fillText(tagText, n.x + n.r + 8, n.y + 14)
    }
  })

  ctx.restore()
}

function screenToWorld(x, y) {
  // 从屏幕坐标映射为世界坐标（应用平移缩放的逆变换）
  const scale = viewport.value.scale
  const tx = viewport.value.x
  const ty = viewport.value.y
  return { wx: (x / scale) - tx, wy: (y / scale) - ty }
}

function hitTest(clientX, clientY) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const x = (clientX - rect.left) * (window.devicePixelRatio || 1)
  const y = (clientY - rect.top) * (window.devicePixelRatio || 1)
  const { wx, wy } = screenToWorld(x, y)
  for (let i = drawNodes.value.length - 1; i >= 0; i--) {
    const n = drawNodes.value[i]
    const dx = wx - n.x
    const dy = wy - n.y
    if (dx * dx + dy * dy <= n.r * n.r) return n
  }
  return null
}

function attachEvents(canvas) {
  const onWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY
    const scaleFactor = delta > 0 ? 0.9 : 1.1
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) * (window.devicePixelRatio || 1)
    const py = (e.clientY - rect.top) * (window.devicePixelRatio || 1)
    const { wx, wy } = screenToWorld(px, py)
    const nextScale = Math.max(0.5, Math.min(2.5, viewport.value.scale * scaleFactor))
    // 缩放围绕鼠标位置
    viewport.value.x = wx - (px / nextScale)
    viewport.value.y = wy - (py / nextScale)
    viewport.value.scale = nextScale
    scheduleDraw()
  }
  const onDown = (e) => {
    isPanning = true
    lastPan.x = e.clientX
    lastPan.y = e.clientY
  }
  const onMove = (e) => {
    if (!isPanning) return
    const dx = e.clientX - lastPan.x
    const dy = e.clientY - lastPan.y
    lastPan.x = e.clientX
    lastPan.y = e.clientY
    viewport.value.x += dx / viewport.value.scale * (window.devicePixelRatio || 1)
    viewport.value.y += dy / viewport.value.scale * (window.devicePixelRatio || 1)
    scheduleDraw()
  }
  const onUp = () => { isPanning = false }
  const onClick = (e) => {
    const hit = hitTest(e.clientX, e.clientY)
    if (hit) {
      // 需要补全父路径信息
      const path = findPathById(treeData.value, hit.id) || [hit]
      const parents = path.slice(0, -1).map(p => ({ id: p.id, name: p.name }))
      showDetails({ id: hit.id, name: hit.name, evalTypes: hit.evalTypes, parents, desc: hit.desc })
    }
  }
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('mousedown', onDown)
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  canvas.addEventListener('click', onClick)

  const onResize = () => { resizeCanvas(); scheduleDraw() }
  window.addEventListener('resize', onResize)

  // 卸载时清理
  onBeforeUnmount(() => {
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('mousedown', onDown)
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    canvas.removeEventListener('click', onClick)
    window.removeEventListener('resize', onResize)
    cancelAnimationFrame(rafId)
  })
}

watch(displayTree, () => scheduleDraw())
onMounted(() => {
  // 延迟到 DOM 渲染后初始化
  requestAnimationFrame(initCanvas)
})
</script>

<style lang="scss" scoped>
.metrics-library-container {
  padding: 20px;

  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
  .subtitle { font-size: 14px; color: #909399; margin: 5px 0 0; }

  .section { margin-top: 16px; }
  .section-title { font-weight: 500; margin-bottom: 6px; }
  .section-content { color: #606266; line-height: 1.6; }

  .metric-tree { margin-top: 8px; }
  .tree-node { display: flex; align-items: center; }
  .node-name { font-size: 14px; color: #303133; }
  .ml8 { margin-left: 8px; }
  .spacer { width: 8px; }
}
</style>
