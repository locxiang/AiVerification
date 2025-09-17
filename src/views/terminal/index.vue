<template>
  <div class="terminal-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">控制枢纽终端</h2>
            <p class="subtitle">社交机器人连接与能力上报（演示占位）</p>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="mockRegisterBot">模拟机器人注册</el-button>
            <el-button @click="mockHeartbeat">模拟心跳</el-button>
            <el-button :type="isAuto ? 'danger' : 'success'" @click="isAuto ? stopAuto() : startAuto()">
              {{ isAuto ? '停止自动模拟' : '启动自动模拟' }}
            </el-button>
            <el-button @click="clearLogs">清空日志</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="bots-card">
            <template #header>
              <div class="card-title">已连接机器人</div>
            </template>
            <el-table :data="bots" border stripe>
              <el-table-column prop="id" label="机器人ID" width="160" />
              <el-table-column prop="name" label="名称" min-width="160" />
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'online' ? 'success' : 'info'">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastHeartbeat" label="最近心跳" width="180" />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button text type="primary" @click="viewBot(row)">详情</el-button>
                  <el-button text type="danger" @click="disconnectBot(row)">断开</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="capabilities-card">
            <template #header>
              <div class="card-title">能力上报</div>
            </template>
            <el-form label-position="top">
              <el-form-item label="机器人ID">
                <el-select v-model="report.botId" placeholder="选择机器人">
                  <el-option v-for="b in bots" :key="b.id" :label="b.name" :value="b.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="可执行能力">
                <el-checkbox-group v-model="report.abilities">
                  <el-checkbox label="数据采集" />
                  <el-checkbox label="内容生成" />
                  <el-checkbox label="评论回复" />
                  <el-checkbox label="舆论引导" />
                </el-checkbox-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitReport">提交上报</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="logs-card" shadow="hover" style="margin-top: 20px;">
        <template #header>
          <div class="card-title">终端日志</div>
        </template>
        <div class="logs-list">
          <div v-for="l in logs" :key="l.ts + l.message" class="log-item">
            <span class="ts">{{ l.ts }}</span>
            <span class="msg">{{ l.message }}</span>
          </div>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const bots = ref([
  { id: 'bot_1', name: '社交机器人-Alpha', status: 'online', lastHeartbeat: '2025-01-02 10:00' },
])

const logs = ref([])
const report = ref({ botId: '', abilities: [] })
const isAuto = ref(false)
const timerIds = ref([])

const pushLog = (message) => { logs.value.unshift({ ts: new Date().toLocaleString(), message }) }

const mockRegisterBot = () => {
  const id = `bot_${Math.floor(Math.random() * 1000)}`
  bots.value.push({ id, name: `机器人-${id}`, status: 'online', lastHeartbeat: new Date().toLocaleString() })
  pushLog(`机器人注册：${id}`)
  ElMessage.success('机器人注册成功（模拟）')
}

const mockHeartbeat = () => {
  if (bots.value.length === 0) return
  const idx = Math.floor(Math.random() * bots.value.length)
  bots.value[idx].lastHeartbeat = new Date().toLocaleString()
  pushLog(`心跳：${bots.value[idx].id}`)
}

const viewBot = (row) => {
  ElMessageBox.alert(`机器人 ${row.name}\n最近心跳：${row.lastHeartbeat}`, '机器人详情', { confirmButtonText: '好的' })
}

const disconnectBot = (row) => {
  ElMessageBox.confirm(`确定断开机器人 ${row.name} 吗？`, '确认', { type: 'warning' })
    .then(() => {
      bots.value = bots.value.filter(b => b.id !== row.id)
      pushLog(`断开：${row.id}`)
      ElMessage.success('已断开（模拟）')
    })
}

const submitReport = () => {
  if (!report.value.botId) { ElMessage.warning('请选择机器人'); return }
  pushLog(`能力上报：${report.value.botId} -> [${report.value.abilities.join(', ')}]`)
  ElMessage.success('能力上报成功（模拟）')
}

const clearLogs = () => { logs.value = [] }

// 随机工具
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)]

const ensureAnyBot = () => {
  if (bots.value.length === 0) {
    const id = `bot_${randomInt(100, 999)}`
    bots.value.push({ id, name: `机器人-${id}`, status: 'online', lastHeartbeat: new Date().toLocaleString() })
    pushLog(`机器人注册：${id}`)
  }
}

const simulateHeartbeat = () => {
  ensureAnyBot()
  const idx = Math.floor(Math.random() * bots.value.length)
  bots.value[idx].lastHeartbeat = new Date().toLocaleString()
  pushLog(`心跳：${bots.value[idx].id}`)
}

const simulateEvent = () => {
  ensureAnyBot()
  const bot = choice(bots.value)
  const events = [
    () => pushLog(`连接建立：${bot.id}`),
    () => pushLog(`获取任务：${bot.id} -> ${choice(['crawl_timeline', 'generate_post', 'reply_comment', 'analyze_trend'])}`),
    () => pushLog(`任务进度：${bot.id} -> ${randomInt(10, 95)}%`),
    () => pushLog(`任务完成：${bot.id} -> ${choice(['OK', 'OK', 'OK', '部分成功'])}`),
    () => pushLog(`能力上报：${bot.id} -> [${choice(['数据采集', '内容生成', '评论回复', '舆论引导'])}]`),
    () => pushLog(`断开连接：${bot.id}`),
    () => pushLog(`重连成功：${bot.id}`),
    () => pushLog(`告警：${bot.id} -> ${choice(['网络抖动', '接口超时', '速率限制'])}`)
  ]
  choice(events)()
}

const startAuto = () => {
  if (isAuto.value) return
  isAuto.value = true
  pushLog('自动模拟已启动')
  // 心跳 3-6 秒一次
  const hb = setInterval(() => simulateHeartbeat(), randomInt(3000, 6000))
  // 事件 6-10 秒一次
  const ev = setInterval(() => simulateEvent(), randomInt(6000, 10000))
  timerIds.value.push(hb, ev)
}

const stopAuto = () => {
  if (!isAuto.value) return
  isAuto.value = false
  timerIds.value.forEach((id) => clearInterval(id))
  timerIds.value = []
  pushLog('自动模拟已停止')
}

onMounted(() => {
  pushLog('终端已就绪')
})

onBeforeUnmount(() => {
  stopAuto()
})
</script>

<style lang="scss" scoped>
.terminal-container {
  padding: 20px;

  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
  .subtitle { font-size: 14px; color: #909399; margin: 5px 0 0; }

  .card-title { font-size: 16px; font-weight: 500; color: #303133; }

  .logs-list { max-height: 260px; overflow: auto; .log-item { display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px solid #EBEEF5; .ts { color: #909399; } } }
}
</style>
