<template>
  <div class="runs-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">运行记录</h2>
            <p class="subtitle">查看历史运行记录与状态</p>
          </div>
          <div class="header-actions">
            <el-input v-model="query" placeholder="搜索运行ID/名称" clearable style="width: 260px" @keyup.enter="fetchData" />
            <el-select v-model="status" placeholder="状态" clearable style="width: 160px; margin-left: 10px">
              <el-option label="全部" value="" />
              <el-option label="进行中" value="running" />
              <el-option label="已完成" value="completed" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-button type="primary" style="margin-left: 10px" @click="fetchData">查询</el-button>
            <el-button style="margin-left: 6px" @click="reset">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredRuns" border stripe>
        <el-table-column prop="id" label="运行ID" width="140" />
        <el-table-column prop="planName" label="试验方案名称" min-width="220" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="开始时间" width="180" />
        <el-table-column prop="endedAt" label="结束时间" width="180">
          <template #default="{ row }">
            {{ row.endedAt || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="durationSec" label="时长" width="120">
          <template #default="{ row }">
            {{ formatDuration(row.durationSec) }}
          </template>
        </el-table-column>
        <el-table-column prop="triggeredBy" label="触发人" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="goToRun(row)">查看</el-button>
            <el-button text @click="goToExperiment(row)">试验</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const query = ref('')
const status = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const runs = ref([
  { id: 'r_1005', planName: '社交机器人V1方案', status: 'running', startedAt: '2025-01-02 09:10', endedAt: '', durationSec: 320, triggeredBy: '张三', experimentId: 'e_1001' },
  { id: 'r_1004', planName: '对话理解鲁棒性方案', status: 'completed', startedAt: '2025-01-01 10:00', endedAt: '2025-01-01 10:10', durationSec: 600, triggeredBy: '李四', experimentId: 'e_1000' },
  { id: 'r_1003', planName: '舆论引导评测方案', status: 'failed', startedAt: '2024-12-31 16:00', endedAt: '2024-12-31 16:03', durationSec: 180, triggeredBy: '王五', experimentId: 'e_0999' }
])

const filteredRuns = computed(() => {
  let data = runs.value
  if (query.value) {
    const q = query.value.toLowerCase()
    data = data.filter(r => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
  }
  if (status.value) {
    data = data.filter(r => r.status === status.value)
  }
  total.value = data.length
  const start = (page.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const getStatusType = (s) => ({ running: 'primary', completed: 'success', failed: 'danger' }[s] || 'info')
const getStatusText = (s) => ({ running: '进行中', completed: '已完成', failed: '失败' }[s] || s)

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '-'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h${Math.floor((seconds % 3600) / 60)}m`
}

const fetchData = () => { page.value = 1 }
const reset = () => { query.value = ''; status.value = ''; page.value = 1 }

const goToRun = (row) => { router.push(`/experiments/${row.experimentId}/run`) }
const goToExperiment = (row) => { router.push(`/experiments/${row.experimentId}/overview`) }
</script>

<style lang="scss" scoped>
.runs-container {
  padding: 20px;

  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
  .subtitle { font-size: 14px; color: #909399; margin: 5px 0 0; }

  .pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
}
</style>
