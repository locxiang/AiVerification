<template>
  <div class="datasets-list-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">数据集列表</h2>
            <p class="subtitle">管理与浏览所有数据集</p>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="goCreate">新增数据集</el-button>
            <el-button :icon="Refresh" @click="refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="datasets" style="width: 100%" border>
        <el-table-column type="index" width="60" label="#" />
        <el-table-column prop="name" label="数据集名称" min-width="200" />
        <el-table-column prop="source" label="来源" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === '上传' ? 'success' : 'info'">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="样本量" width="120">
          <template #default="{ row }">{{ formatNumber(row.size) }}</template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="140" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="preview(row)">预览</el-button>
            <el-button link @click="toDetail(row)">详情</el-button>
            <el-button type="danger" link @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="previewDialog.visible" :title="`数据集预览: ${previewDialog.dataset?.name || ''}`" width="80%">
      <div class="preview-dialog-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="数据集名称">{{ previewDialog.dataset?.name }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ previewDialog.dataset?.source }}</el-descriptions-item>
          <el-descriptions-item label="样本量">{{ formatNumber(previewDialog.dataset?.size) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ previewDialog.dataset?.updatedAt }}</el-descriptions-item>
        </el-descriptions>

        <div class="preview-table-container">
          <h4 class="preview-title">数据内容预览（前50行）</h4>
          <el-table :data="previewDialog.data" style="width: 100%" border max-height="400">
            <el-table-column v-for="column in previewDialog.columns" :key="column" :prop="column" :label="column" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'

const router = useRouter()

const datasets = ref([
  { id: 'ds_1', name: '样例数据集 #1', source: '上传', size: 12345, updatedAt: '2025-01-02' },
  { id: 'ds_2', name: '样例数据集 #2', source: '链接', size: 54321, updatedAt: '2025-01-01' },
  { id: 'ds_3', name: '社交媒体对话数据集', source: '上传', size: 32567, updatedAt: '2025-01-03' },
  { id: 'ds_4', name: '舆情分析数据集', source: '链接', size: 87654, updatedAt: '2024-12-28' },
])

const previewDialog = ref({
  visible: false,
  dataset: null,
  data: [],
  columns: [],
})

const formatNumber = (num) => {
  if (!num && num !== 0) return '-'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const goCreate = () => {
  router.push({ path: '/datasets/create' })
}

const toDetail = (row) => {
  router.push({ path: `/datasets/${row.id}` })
}

const refresh = async () => {
  await new Promise((r) => setTimeout(r, 300))
  ElMessage.success('已刷新')
}

const preview = (dataset) => {
  previewDialog.value.dataset = dataset
  const columns = ['id', 'text', 'label', 'timestamp', 'user_id', 'category']
  const data = []
  for (let i = 0; i < 50; i++) {
    data.push({
      id: `row_${i + 1}`,
      text: `示例文本 #${i + 1}`,
      label: Math.random() > 0.5 ? '正面' : '负面',
      timestamp: `2025-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      user_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
      category: ['政治', '经济', '社会', '文化', '科技'][Math.floor(Math.random() * 5)],
    })
  }
  previewDialog.value.data = data
  previewDialog.value.columns = columns
  previewDialog.value.visible = true
}

const confirmDelete = (dataset) => {
  ElMessageBox.confirm(`确定要删除数据集"${dataset.name}"吗？此操作不可恢复。`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      datasets.value = datasets.value.filter((d) => d.id !== dataset.id)
      ElMessage.success('数据集删除成功')
    })
    .catch(() => {})
}
</script>

<style scoped lang="scss">
.datasets-list-container {
  padding: 20px;

  .header-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        .title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
        .subtitle { font-size: 14px; color: #909399; margin: 5px 0 0; }
      }
    }
  }

  .preview-dialog-content {
    .preview-title { font-size: 16px; font-weight: 500; color: #303133; margin: 20px 0 15px; }
  }
}
</style>
