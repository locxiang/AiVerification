<template>
  <div class="experiment-results-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">结果与报告</h2>
            <p class="subtitle">展示评估结果、指标得分与对比，并支持导出报告</p>
          </div>
          <div class="header-actions">
            <el-button type="primary" :loading="exporting" @click="exportReport">{{ exporting ? '导出中...' : '导出报告(PDF)' }}</el-button>
            <el-button @click="exportExcel">导出Excel</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="24" :lg="8">
          <el-card shadow="hover" class="summary-card">
            <template #header><div class="card-title">总体评分</div></template>
            <div class="summary-content">
              <div class="score">{{ summary.score }}</div>
              <div class="level">等级：{{ summary.level }}</div>
              <div class="conclusion">结论：{{ summary.conclusion }}</div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="16">
          <el-card shadow="hover" class="chart-card">
            <template #header><div class="card-title">指标维度得分（占位）</div></template>
            <div class="chart-placeholder">雷达/柱状图占位</div>
            <div class="dimensions">
              <div v-for="d in dimensions" :key="d.id" class="dimension-item">
                <div class="name">{{ d.name }}</div>
                <div class="bar">
                  <div class="filled" :style="{ width: Math.round(d.score * 100) + '%' }"></div>
                  <div class="threshold" :style="{ left: Math.round(d.threshold * 100) + '%' }"></div>
                </div>
                <div class="values">得分 {{ Math.round(d.score * 100) }}%，阈值 {{ Math.round(d.threshold * 100) }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt-4">
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover">
            <template #header><div class="card-title">历史对比</div></template>
            <div class="history-list">
              <div v-for="h in history" :key="h.runId" class="history-item">
                <div class="left">运行 {{ h.runId }}</div>
                <div class="right">得分 {{ h.score }} · {{ h.endedAt }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="hover">
            <template #header><div class="card-title">样例分析（占位）</div></template>
            <el-table :data="samples" style="width: 100%" border size="small">
              <el-table-column prop="id" label="样例ID" width="120" />
              <el-table-column prop="input" label="输入" min-width="150" />
              <el-table-column prop="expect" label="期望" min-width="150" />
              <el-table-column prop="actual" label="实际" min-width="150" />
              <el-table-column prop="score" label="得分" width="100">
                <template #default="{ row }">{{ Math.round(row.score * 100) }}%</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const exporting = ref(false)
const summary = ref({ score: 86, level: 'A', conclusion: '满足上线要求' })
const dimensions = ref([
  { id: 'accuracy', name: '准确性', score: 0.88, threshold: 0.85 },
  { id: 'robustness', name: '鲁棒性', score: 0.81, threshold: 0.8 },
  { id: 'efficiency', name: '效率', score: 0.79, threshold: 0.75 },
  { id: 'experience', name: '用户体验', score: 0.84, threshold: 0.80 }
])
const history = ref([
  { runId: 'r_1001', score: 82, endedAt: '2025-01-01' },
  { runId: 'r_1003', score: 86, endedAt: '2025-01-02' }
])
const samples = ref([
  { id: 's_1', input: '示例输入1', expect: '示例期望1', actual: '示例实际1', score: 0.72 },
  { id: 's_2', input: '示例输入2', expect: '示例期望2', actual: '示例实际2', score: 0.85 }
])

const exportReport = async () => { exporting.value = true; try { await new Promise(r => setTimeout(r, 1200)); ElMessage.success('报告导出成功（模拟）') } catch (e) { ElMessage.error('E601: 模板生成失败（模拟）') } finally { exporting.value = false } }
const exportExcel = async () => { try { await new Promise(r => setTimeout(r, 800)); ElMessage.success('Excel 导出成功（模拟）') } catch (e) { ElMessage.error('导出失败') } }
</script>

<style lang="scss" scoped>
/* 样式同原实现，省略 */
</style>


