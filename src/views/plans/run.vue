<template>
  <div class="experiment-run-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">执行与进度</h2>
            <p class="subtitle">启动/继续试验执行，实时查看进度、资源与日志</p>
          </div>
          <div class="header-actions">
            <el-button-group>
              <el-button type="primary" :icon="VideoPlay" @click="start">开始</el-button>
              <el-button :icon="VideoPause" @click="pause">暂停</el-button>
              <el-button :icon="CaretRight" @click="resume">继续</el-button>
              <el-button :icon="Refresh" @click="retry">重试</el-button>
              <el-button :icon="Close" @click="stop">停止</el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="24" :lg="16">
          <el-card class="progress-card" shadow="hover">
            <div class="progress-header">
              <div class="left">
                <div class="progress-title">总体进度：{{ Math.round(progress * 100) }}%</div>
                <div class="progress-sub">当前步骤：{{ step }}</div>
              </div>
              <div class="right">
                <el-progress :percentage="Math.round(progress * 100)" :stroke-width="12" status="success" />
              </div>
            </div>
            <div class="progress-actions">
              <el-button type="primary" :icon="VideoPlay" @click="start">开始</el-button>
              <el-button :icon="VideoPause" @click="pause">暂停</el-button>
              <el-button :icon="CaretRight" @click="resume">继续</el-button>
              <el-button :icon="Refresh" @click="retry">重试当前步骤</el-button>
              <el-button :icon="Close" @click="stop">停止</el-button>
            </div>
          </el-card>

          <el-card class="snapshot-card" shadow="hover">
            <template #header><div class="card-title">中间结果（占位）</div></template>
            <div class="snapshot-placeholder">最近快照：{{ lastSnapshotTime }}</div>
            <div class="snapshot-logs">
              <div class="snapshot-title">活动日志</div>
              <div v-if="snapshotLogs.length === 0" class="snapshot-empty">暂无活动</div>
              <div v-else>
                <div
                  v-for="s in snapshotLogs"
                  :key="s.ts + s.message"
                  class="snapshot-log-item"
                >
                  <span class="snapshot-level">[{{ s.type }}]</span>
                  <span class="snapshot-text">{{ s.ts }} · {{ s.actor }} · {{ s.message }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card class="monitor-card" shadow="hover">
            <template #header><div class="card-title">监控面板</div></template>
            <el-row :gutter="10" class="monitor-grid">
              <el-col :span="8"><div class="monitor-item"><div class="label">Throughput</div><div class="value primary">{{ metrics.throughput }}</div></div></el-col>
              <el-col :span="8"><div class="monitor-item"><div class="label">CPU</div><div class="value primary">{{ Math.round(metrics.cpu * 100) }}%</div></div></el-col>
              <el-col :span="8"><div class="monitor-item"><div class="label">内存</div><div class="value primary">{{ Math.round(metrics.mem * 100) }}%</div></div></el-col>
            </el-row>
          </el-card>

          <el-card class="logs-card" shadow="hover">
            <template #header><div class="card-title">执行日志</div></template>
            <div class="logs-list">
              <div v-for="l in logs" :key="l.ts + l.message" class="log-item">
                <span :class="['level', levelClass(l.level)]">[{{ l.level }}]</span>
                <div class="log-main">
                  <div class="text">{{ l.ts }} · {{ l.actor }} · {{ l.message }}</div>
                  <div v-if="l.code || l.hint" class="meta">{{ l.code }} {{ l.hint }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { VideoPlay, VideoPause, CaretRight, Refresh, Close } from '@element-plus/icons-vue'

const running = ref(false)
const progress = ref(0)
const step = ref('待启动')
const metrics = ref({ throughput: 0, cpu: 0, mem: 0 })
const collected = ref({ samples: 0 })
const logs = ref([])
const snapshotLogs = ref([])
let timer = null
const lastSnapshotTime = ref(new Date().toLocaleTimeString())

function pushLog(item) { logs.value.unshift(item) }
function pushSnapshot(item) {
  snapshotLogs.value.unshift(item)
  if (snapshotLogs.value.length > 20) snapshotLogs.value.pop()
}
function tick() {
  progress.value = Math.min(1, progress.value + 0.02)
  metrics.value = { throughput: Math.round(100 + Math.random() * 50), cpu: Math.random(), mem: Math.random() }
  collected.value.samples += Math.round(50 + Math.random() * 30)
  lastSnapshotTime.value = new Date().toLocaleTimeString()
  if (Math.random() < 0.1) { pushLog({ ts: new Date().toISOString(), level: 'error', actor: 'system', message: '采集失败（模拟）', code: 'E501', hint: '检查数据源连通性' }) }
  else { pushLog({ ts: new Date().toISOString(), level: 'info', actor: 'system', message: '执行心跳' }) }
  // 生成“中间结果”活动日志（模拟）
  const activities = [
    { type: '访问', actor: 'crawler', message: '访问媒体源' },
    { type: '检索', actor: 'retriever', message: '检索相关言论' },
    { type: '分析', actor: 'analyzer', message: '进行语义分析' },
    { type: '评论', actor: 'publisher', message: '发表评论' },
    { type: '回复', actor: 'publisher', message: '回复评论' },
  ]
  const act = activities[Math.floor(Math.random() * activities.length)]
  pushSnapshot({ ts: new Date().toLocaleTimeString(), ...act })
  if (progress.value >= 1 && timer) { clearInterval(timer); timer = null; running.value = false; step.value = '完成'; pushLog({ ts: new Date().toISOString(), level: 'info', actor: 'system', message: '执行完成' }) }
}
function start() { if (running.value) return; running.value = true; step.value = '评估-对话理解'; timer = setInterval(tick, 1000) }
function pause() { if (timer) { clearInterval(timer); timer = null } ; running.value = false; pushLog({ ts: new Date().toISOString(), level: 'warn', actor: 'user', message: '已暂停' }) }
function resume() { if (!running.value && progress.value < 1) { start(); pushLog({ ts: new Date().toISOString(), level: 'info', actor: 'user', message: '继续执行' }) } }
function stop() { if (timer) { clearInterval(timer); timer = null } ; running.value = false; pushLog({ ts: new Date().toISOString(), level: 'warn', actor: 'user', message: '已停止' }) }
function retry() { pushLog({ ts: new Date().toISOString(), level: 'info', actor: 'user', message: '重试当前步骤' }); if (!running.value) start() }
function levelClass(level) { return level === 'info' ? 'info' : level === 'warn' ? 'warn' : 'error' }
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style lang="scss" scoped>
/* 样式同原实现，省略 */
</style>


