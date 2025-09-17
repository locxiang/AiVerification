<template>
  <div class="dashboard-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <h2 class="title">仪表盘</h2>
          <p class="subtitle">系统态势与快速入口</p>
        </div>
      </template>
    </el-card>

    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-label">总实验数</div>
              <div class="stat-value">{{ stats.total }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-label">进行中</div>
              <div class="stat-value">{{ stats.running }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-label">已完成</div>
              <div class="stat-value">{{ stats.completed }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-label">异常失败</div>
              <div class="stat-value">{{ stats.failed }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="chart-section">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>执行趋势（最近）</span>
              <el-select v-model="trendTimeRange" placeholder="选择时间范围" size="small">
                <el-option label="最近7天" value="7" />
                <el-option label="最近30天" value="30" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div v-if="loading" class="chart-loading">
              <el-skeleton :rows="6" animated />
            </div>
            <div v-else-if="trend.length === 0" class="empty-chart">
              <el-empty description="暂无趋势数据" />
            </div>
            <div v-else class="chart-placeholder">
              <p>图表占位：{{ trend.length }} 个数据点</p>
              <p class="chart-data">{{ JSON.stringify(trend) }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="recent-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近运行</span>
              <el-button type="primary" size="small" @click="goToRunsList">
                查看全部
              </el-button>
            </div>
          </template>
          <div v-if="loading" class="recent-loading">
            <el-skeleton :rows="5" animated />
          </div>
          <el-empty v-else-if="recentRuns.length === 0" description="暂无运行记录" />
          <ul v-else class="recent-list">
            <li v-for="run in recentRuns" :key="run.id" class="recent-item">
              <div class="run-info">
                <div class="run-name">{{ run.name }}</div>
                <div class="run-meta">
                  开始：{{ formatDateTime(run.startedAt) }} · 时长：{{ formatDuration(run.durationSec) }}
                </div>
              </div>
              <el-tag :type="getStatusType(run.status)" size="small">
                {{ getStatusText(run.status) }}
              </el-tag>
            </li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="actions-section">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="action-card" shadow="hover" @click="goToNewExperiment">
          <div class="action-content">
            <el-icon class="action-icon"><Plus /></el-icon>
            <div class="action-text">新建实验方案</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="action-card" shadow="hover" @click="goToExperimentsList">
          <div class="action-content">
            <el-icon class="action-icon"><List /></el-icon>
            <div class="action-text">实验方案列表</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="action-card" shadow="hover" @click="goToMetricsLibrary">
          <div class="action-content">
            <el-icon class="action-icon"><DataAnalysis /></el-icon>
            <div class="action-text">指标库</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="action-card" shadow="hover" @click="goToRunsList">
          <div class="action-content">
            <el-icon class="action-icon"><Timer /></el-icon>
            <div class="action-text">运行记录</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, List, DataAnalysis, Timer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 数据定义
const loading = ref(true)
const trendTimeRange = ref('7')
const stats = ref({ total: 0, running: 0, completed: 0, failed: 0 })
const trend = ref([])
const recentRuns = ref([])

// 获取数据
const fetchDashboardData = async () => {
  loading.value = true
  try {
    // 模拟API请求延迟
    await new Promise((resolve) => setTimeout(resolve, 600))

    // 模拟数据
    stats.value = { total: 42, running: 3, completed: 35, failed: 4 }
    trend.value = [
      { date: '2025-01-01', runs: 8, successRate: 0.88 },
      { date: '2025-01-02', runs: 10, successRate: 0.9 },
      { date: '2025-01-03', runs: 7, successRate: 0.85 },
      { date: '2025-01-04', runs: 12, successRate: 0.92 },
      { date: '2025-01-05', runs: 9, successRate: 0.89 },
    ]
    recentRuns.value = [
      { id: 'r_1001', name: '社交机器人V1综合评测', status: 'running', startedAt: '2025-01-02T09:10:00Z', durationSec: 320 },
      { id: 'r_1000', name: '对话理解-鲁棒性回归', status: 'completed', startedAt: '2025-01-01T10:00:00Z', durationSec: 580 },
      { id: 'r_999', name: '舆论引导能力测试', status: 'completed', startedAt: '2024-12-31T15:30:00Z', durationSec: 450 },
      { id: 'r_998', name: '认知防御测试', status: 'failed', startedAt: '2024-12-30T08:20:00Z', durationSec: 120 },
    ]
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error('获取仪表盘数据失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (e) {
    return dateString
  }
}

// 格式化持续时间
const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    'running': 'primary',
    'completed': 'success',
    'failed': 'danger',
    'pending': 'info'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    'running': '进行中',
    'completed': '已完成',
    'failed': '失败',
    'pending': '等待中'
  }
  return texts[status] || status
}

// 导航函数
const goToNewExperiment = () => {
  router.push('/experiments/new')
}

const goToExperimentsList = () => {
  router.push('/experiments')
}

const goToMetricsLibrary = () => {
  router.push('/metrics')
}

const goToRunsList = () => {
  router.push('/runs')
}

// 生命周期钩子
onMounted(() => {
  fetchDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;

  .card-header {
    .title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }

    .subtitle {
      font-size: 14px;
      color: #909399;
      margin: 5px 0 0;
    }
  }
}

.stats-cards {
  margin-bottom: 20px;

  .stat-card {
    height: 100px;
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .stat-content {
      width: 100%;
      text-align: center;

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #409EFF;
      }
    }
  }
}

.chart-section {
  margin-bottom: 20px;

  .chart-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-container {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;

      .chart-placeholder {
        text-align: center;
        color: #909399;

        .chart-data {
          font-size: 12px;
          color: #C0C4CC;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .empty-chart {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .recent-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .recent-list {
      padding: 0;
      margin: 0;
      list-style: none;

      .recent-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #EBEEF5;

        &:last-child {
          border-bottom: none;
        }

        .run-info {
          .run-name {
            font-size: 14px;
            color: #303133;
            margin-bottom: 4px;
          }

          .run-meta {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}

.actions-section {
  .action-card {
    margin-bottom: 20px;
    cursor: pointer;
    transition: transform 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .action-content {
      height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .action-icon {
        font-size: 36px;
        color: #409EFF;
        margin-bottom: 10px;
      }

      .action-text {
        font-size: 16px;
        color: #303133;
      }
    }
  }
}

// 响应式调整
@media screen and (max-width: 768px) {
  .stats-cards {
    .stat-card {
      height: 80px;
      margin-bottom: 15px;

      .stat-content {
        .stat-value {
          font-size: 24px;
        }
      }
    }
  }

  .chart-section {
    .chart-card {
      .chart-container {
        height: 200px;
      }
    }
  }

  .actions-section {
    .action-card {
      .action-content {
        height: 100px;

        .action-icon {
          font-size: 28px;
        }

        .action-text {
          font-size: 14px;
        }
      }
    }
  }
}
</style>
