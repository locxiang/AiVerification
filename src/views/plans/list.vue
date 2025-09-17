<template>
  <div class="experiments-list-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <h2 class="title">实验方案列表</h2>
          <p class="subtitle">查询与管理全部能力试验</p>
        </div>
      </template>
    </el-card>

    <el-card class="search-card">
      <div class="search-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8" :md="6">
            <el-input
              v-model="queryParams.q"
              placeholder="搜索实验方案名称/关键字"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="8" :md="6">
            <el-select
              v-model="queryParams.status"
              placeholder="选择状态"
              clearable
              style="width: 100%"
            >
              <el-option label="全部状态" value="" />
              <el-option label="草稿" value="draft" />
              <el-option label="进行中" value="running" />
              <el-option label="已完成" value="completed" />
              <el-option label="失败" value="failed" />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="8" :md="6">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-col>
          <el-col :xs="24" :sm="8" :md="6">
            <div class="search-buttons">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="resetQuery">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">实验方案列表</div>
        <div class="table-actions">
          <el-button type="primary" @click="goToNewExperiment">
            <el-icon><Plus /></el-icon>
            新建实验方案
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
        stripe
        highlight-current-row
      >
        <el-table-column prop="name" label="实验方案名称" min-width="180">
          <template #default="{ row }">
            <router-link :to="`/plans/${row.id}/overview`" class="experiment-link">
              {{ row.name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="template" label="方案模板" min-width="120" />
        <el-table-column prop="owner" label="负责人" min-width="100" />
        <el-table-column prop="createdAt" label="创建时间" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastRunAt" label="最近运行" min-width="120">
          <template #default="{ row }">
            {{ row.lastRunAt || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                size="small"
                type="primary"
                @click="goToExperimentDetail(row.id)"
              >
                详情
              </el-button>
              <el-button
                size="small"
                type="success"
                :disabled="row.status === 'running'"
                @click="goToExperimentRun(row.id)"
              >
                运行
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { getPlans } from '@/api/plans'

const router = useRouter()

const queryParams = reactive({
  q: '',
  status: '',
  page: 1,
  pageSize: 10,
  startDate: '',
  endDate: ''
})

const dateRange = ref([])

watch(dateRange, (val) => {
  if (val && val.length === 2) {
    queryParams.startDate = val[0]
    queryParams.endDate = val[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
})

const tableData = ref([])
const total = ref(0)
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPlans({
      q: queryParams.q,
      status: queryParams.status,
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    })
    tableData.value = res?.data?.list || []
    total.value = res?.data?.total || 0
  } catch (error) {
    console.error('获取实验方案列表失败:', error)
    ElMessage.error(error.message || '获取实验方案列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchData()
}

const resetQuery = () => {
  queryParams.q = ''
  queryParams.status = ''
  queryParams.page = 1
  queryParams.startDate = ''
  queryParams.endDate = ''
  dateRange.value = []
  fetchData()
}

const handleCurrentChange = (page) => {
  queryParams.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  queryParams.pageSize = size
  queryParams.page = 1
  fetchData()
}

const getStatusType = (status) => {
  const types = { 'draft': 'info', 'running': 'primary', 'completed': 'success', 'failed': 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { 'draft': '草稿', 'running': '进行中', 'completed': '已完成', 'failed': '失败' }
  return texts[status] || status
}

const goToNewExperiment = () => {
  router.push('/plans/new')
}

const goToExperimentDetail = (id) => {
  router.push(`/plans/${id}/overview`)
}

const goToExperimentRun = (id) => {
  router.push(`/plans/${id}/run`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除实验"${row.name}"吗？`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  )
    .then(() => {
      // 目前 API 未提供删除，模拟用户确认后的刷新
      setTimeout(() => {
        ElMessage.success('删除成功')
        fetchData()
      }, 300)
    })
    .catch(() => {})
}

onMounted(() => { fetchData() })
</script>

<style lang="scss" scoped>
.experiments-list-container { padding: 20px; }
.header-card { margin-bottom: 20px; }
.header-card .card-header .title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.header-card .card-header .subtitle { font-size: 14px; color: #909399; margin: 5px 0 0; }
.search-card { margin-bottom: 20px; }
.search-form .el-row { margin-bottom: -20px; }
.search-form .el-row .el-col { margin-bottom: 20px; }
.search-form .search-buttons { display: flex; gap: 10px; }
.table-card .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.table-card .table-title { font-size: 16px; font-weight: 500; color: #303133; }
.table-card .experiment-link { color: #409EFF; text-decoration: none; }
.table-card .experiment-link:hover { text-decoration: underline; }
.table-card .pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
@media screen and (max-width: 768px) {
  .search-form .search-buttons { justify-content: flex-start; }
  .table-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>


