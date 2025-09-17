<template>
  <div class="dataset-changes-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>数据集变更记录</span>
          <div class="actions">
            <el-select v-model="selectedDataset" placeholder="选择数据集" style="width: 220px;">
              <el-option v-for="ds in datasets" :key="ds.id" :label="ds.name" :value="ds.id" />
            </el-select>
            <el-date-picker v-model="dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="margin-left: 10px;" />
            <el-button style="margin-left: 10px;" :icon="Refresh" @click="refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="items.length === 0" description="暂无变更记录" />
      <el-timeline v-else>
        <el-timeline-item v-for="item in items" :key="item.id" :timestamp="item.time" :type="item.type" placement="top">
          <div class="change-item">
            <div class="title">{{ item.title }}</div>
            <div class="desc">{{ item.desc }}</div>
            <div class="meta">
              <el-tag size="small">{{ item.operator }}</el-tag>
              <el-tag v-if="item.datasetName" size="small" type="info" style="margin-left: 6px;">{{ item.datasetName }}</el-tag>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const datasets = ref([
  { id: 'ds_1', name: '样例数据集 #1' },
  { id: 'ds_2', name: '样例数据集 #2' },
  { id: 'ds_3', name: '社交媒体对话数据集' },
])

const selectedDataset = ref('')
const dateRange = ref('')
const items = ref([])

const mockFetch = async () => {
  await new Promise((r) => setTimeout(r, 300))
  const dsName = datasets.value.find((d) => d.id === selectedDataset.value)?.name
  items.value = [
    { id: 'chg_1', time: '2025-01-03 11:20', type: 'success', title: '字段映射更新', desc: '更新映射：新增字段 category', operator: 'alice', datasetName: dsName },
    { id: 'chg_2', time: '2025-01-02 15:06', type: 'warning', title: '数据修复', desc: '清洗 123 条异常时间戳记录', operator: 'bob', datasetName: dsName },
    { id: 'chg_3', time: '2025-01-01 09:42', type: 'info', title: '上传完成', desc: '上传初始数据集，共 32,567 条', operator: 'system', datasetName: dsName },
  ]
}

const refresh = async () => {
  await mockFetch()
  ElMessage.success('已刷新')
}

watch([selectedDataset, dateRange], () => {
  mockFetch()
})

mockFetch()
</script>

<style scoped lang="scss">
.dataset-changes-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.change-item { .title { font-weight: 600; } .desc { color: #606266; margin-top: 4px; } .meta { margin-top: 6px; } }
</style>
