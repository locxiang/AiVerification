<template>
  <div class="templates-page">
    <el-card>
      <template #header>
        <div class="header">
          <div>
            <h3 class="title">模板管理</h3>
            <p class="desc">复用常用配置，快速创建试验方案</p>
          </div>
          <div></div>
        </div>
      </template>

      <el-table :data="templates" border style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="140" />
        <el-table-column prop="description" label="描述" min-width="220" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="applyTemplate(row)">从模板新建</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTemplates } from '@/api/templates'

const router = useRouter()
const templates = ref([])

const load = async () => {
  const { data } = await getTemplates()
  templates.value = data || []
}

const applyTemplate = (row) => {
  router.push({ path: '/plans/new', query: { templateId: row.id } })
}

const formatTime = (ts) => {
  const d = new Date(ts)
  const pad = (n) => (n < 10 ? '0' + n : n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(load)
</script>

<style lang="scss" scoped>
.templates-page {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
.header { display: flex; justify-content: space-between; align-items: center; }
.title { margin: 0; font-size: 18px; font-weight: 600; }
.desc { margin: 4px 0 0; color: #909399; font-size: 13px; }
</style>


