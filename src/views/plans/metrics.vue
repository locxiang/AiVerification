<template>
  <!-- 直接使用原 metrics 实现 -->
  <div class="experiment-metrics-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">指标配置</h2>
            <p class="subtitle">管理指标项、权重与阈值</p>
          </div>
          <div class="header-actions">
            <el-button-group>
              <el-button type="primary" :loading="saving" @click="saveMetrics">{{ saving ? '保存中...' : '保存配置' }}</el-button>
              <el-button @click="restoreDefaults">恢复模板默认</el-button>
              <el-button :icon="Star" @click="saveAsTemplate">另存为模板</el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <div class="metrics-summary">
        <div class="summary-info"><span class="info-label">指标总数：</span><span class="info-value">{{ metrics.length }}</span></div>
        <div class="summary-info" :class="{ 'weight-error': !isWeightValid }">
          <span class="info-label">权重和：</span>
          <span class="info-value">{{ totalWeight.toFixed(2) }}</span>
          <el-tooltip v-if="!isWeightValid" content="权重和应为1.0" placement="top"><el-icon class="error-icon"><Warning /></el-icon></el-tooltip>
        </div>
        <div class="summary-info"><span class="info-label">已启用：</span><span class="info-value">{{ enabledCount }}</span></div>
      </div>

      <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon style="margin-bottom: 15px;" />

      <el-table :data="metrics" style="width: 100%" border stripe>
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="category" label="类别" width="120">
          <template #default="{ row }"><el-tag :type="getCategoryType(row.category)">{{ getCategoryName(row.category) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="formula" label="公式/口径" min-width="180" />
        <el-table-column label="权重" width="120">
          <template #default="{ row }"><el-input-number v-model="row.weight" :min="0" :max="1" :step="0.05" :precision="2" :disabled="!row.enabled" size="small" style="width: 100px;" /></template>
        </el-table-column>
        <el-table-column label="阈值" width="120">
          <template #default="{ row }"><el-input-number v-model="row.threshold" :min="0" :max="1" :step="0.01" :precision="2" :disabled="!row.enabled" size="small" style="width: 100px;" /></template>
        </el-table-column>
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }"><el-button type="primary" text @click="showMetricDetails(row)">查看说明</el-button></template>
        </el-table-column>
      </el-table>

      <div class="add-metric-section"><el-button type="primary" plain :icon="Plus" @click="showAddMetricDialog">添加自定义指标</el-button></div>
    </el-card>

    <el-drawer v-model="metricDrawer.visible" :title="`指标详情：${metricDrawer.currentMetric?.name || ''}`" direction="rtl" size="400px">
      <div v-if="metricDrawer.currentMetric" class="metric-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="指标名称">{{ metricDrawer.currentMetric.name }}</el-descriptions-item>
          <el-descriptions-item label="指标类别">{{ getCategoryName(metricDrawer.currentMetric.category) }}</el-descriptions-item>
          <el-descriptions-item label="计算公式">{{ metricDrawer.currentMetric.formula }}</el-descriptions-item>
          <el-descriptions-item label="权重">{{ metricDrawer.currentMetric.weight }}</el-descriptions-item>
          <el-descriptions-item label="阈值">{{ metricDrawer.currentMetric.threshold }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ metricDrawer.currentMetric.enabled ? '已启用' : '已禁用' }}</el-descriptions-item>
        </el-descriptions>
        <div class="metric-detail-section"><h4 class="section-title">详细口径说明</h4><p class="detail-content">{{ getMetricDescription(metricDrawer.currentMetric.id) }}</p></div>
        <div class="metric-detail-section"><h4 class="section-title">示例</h4><p class="detail-content">{{ getMetricExample(metricDrawer.currentMetric.id) }}</p></div>
        <div class="metric-detail-section"><h4 class="section-title">参考标准</h4><p class="detail-content">{{ getMetricStandard(metricDrawer.currentMetric.id) }}</p></div>
        <div class="metric-detail-section"><h4 class="section-title">版本信息</h4><p class="detail-content">口径版本：v1.2.0（2025-01-01更新）</p></div>
      </div>
    </el-drawer>

    <el-dialog v-model="addMetricDialog.visible" title="添加自定义指标" width="500px">
      <el-form :model="addMetricDialog.form" label-position="top">
        <el-form-item label="指标名称" required><el-input v-model="addMetricDialog.form.name" placeholder="请输入指标名称" /></el-form-item>
        <el-form-item label="指标类别" required>
          <el-select v-model="addMetricDialog.form.category" placeholder="请选择指标类别" style="width: 100%">
            <el-option label="准确性" value="accuracy" />
            <el-option label="鲁棒性" value="robustness" />
            <el-option label="效率" value="efficiency" />
            <el-option label="用户体验" value="experience" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="计算公式/口径" required><el-input v-model="addMetricDialog.form.formula" placeholder="请输入计算公式或口径说明" /></el-form-item>
        <el-form-item label="权重" required><el-input-number v-model="addMetricDialog.form.weight" :min="0" :max="1" :step="0.05" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="阈值" required><el-input-number v-model="addMetricDialog.form.threshold" :min="0" :max="1" :step="0.01" :precision="2" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer"><el-button @click="addMetricDialog.visible = false">取消</el-button><el-button type="primary" @click="addMetric">确认</el-button></span>
      </template>
    </el-dialog>

    <el-dialog v-model="saveTemplateDialog.visible" title="另存为模板" width="400px">
      <el-form :model="saveTemplateDialog.form" label-position="top">
        <el-form-item label="模板名称" required><el-input v-model="saveTemplateDialog.form.name" placeholder="请输入模板名称" /></el-form-item>
        <el-form-item label="模板描述"><el-input v-model="saveTemplateDialog.form.description" type="textarea" :rows="3" placeholder="请输入模板描述" /></el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer"><el-button @click="saveTemplateDialog.visible = false">取消</el-button><el-button type="primary" @click="confirmSaveTemplate">确认</el-button></span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { Star, Warning, Plus } from '@element-plus/icons-vue'

const saving = ref(false)
const error = ref('')
const metrics = ref([
  { id: 'm_acc', name: '准确率', category: 'accuracy', formula: 'TP+TN / ALL', weight: 0.5, threshold: 0.85, enabled: true },
  { id: 'm_rob', name: '鲁棒性', category: 'robustness', formula: 'Rob Index', weight: 0.3, threshold: 0.8, enabled: true },
  { id: 'm_eff', name: '效率', category: 'efficiency', formula: 'Throughput', weight: 0.2, threshold: 0.7, enabled: true },
  { id: 'm_exp', name: '用户满意度', category: 'experience', formula: 'Satisfaction Score', weight: 0, threshold: 0.75, enabled: false },
  { id: 'm_cov', name: '覆盖率', category: 'accuracy', formula: 'Coverage Ratio', weight: 0, threshold: 0.8, enabled: false }
])

const totalWeight = computed(() => metrics.value.reduce((sum, m) => sum + (m.enabled ? m.weight : 0), 0))
const isWeightValid = computed(() => Math.abs(totalWeight.value - 1) < 0.01)
const enabledCount = computed(() => metrics.value.filter(m => m.enabled).length)

const metricDrawer = reactive({ visible: false, currentMetric: null })
const addMetricDialog = reactive({ visible: false, form: { name: '', category: '', formula: '', weight: 0.1, threshold: 0.8 } })
const saveTemplateDialog = reactive({ visible: false, form: { name: '', description: '' } })

const getCategoryType = (c) => ({ accuracy: 'success', robustness: 'warning', efficiency: 'primary', experience: 'info', other: 'default' }[c] || 'default')
const getCategoryName = (c) => ({ accuracy: '准确性', robustness: '鲁棒性', efficiency: '效率', experience: '用户体验', other: '其他' }[c] || c)
const getMetricDescription = (id) => ({ m_acc: '准确率指标用于衡量社交机器人识别和反驳虚假信息的准确程度。', m_rob: '鲁棒性指标用于衡量在干扰输入下的稳定性。', m_eff: '效率指标衡量处理速度。', m_exp: '用户满意度来自用户评分。', m_cov: '覆盖率衡量话题范围广度。' }[id] || '暂无详细描述')
const getMetricExample = (id) => ({ m_acc: '100条中正确85条，准确率0.85。', m_rob: '标准0.9，干扰0.72，鲁棒性0.8。' }[id] || '暂无示例')
const getMetricStandard = (id) => ({ m_acc: '行业均值0.75，优秀0.85+', m_rob: '行业均值0.7，优秀0.8+' }[id] || '暂无参考标准')

const showMetricDetails = (metric) => { metricDrawer.currentMetric = metric; metricDrawer.visible = true }
const showAddMetricDialog = () => { addMetricDialog.form = { name: '', category: '', formula: '', weight: 0.1, threshold: 0.8 }; addMetricDialog.visible = true }
const addMetric = () => {
  const { name, category, formula, weight, threshold } = addMetricDialog.form
  if (!name || !category || !formula) { return }
  metrics.value.push({ id: `m_custom_${Date.now()}`, name, category, formula, weight, threshold, enabled: true })
  addMetricDialog.visible = false
}

const saveMetrics = async () => {
  error.value = ''
  if (!isWeightValid.value) { error.value = 'E301: 权重和需为 1.0（已启用指标）'; return }
  saving.value = true
  try { await new Promise(r => setTimeout(r, 500)) } finally { saving.value = false }
}

const restoreDefaults = () => {
  metrics.value = [
    { id: 'm_acc', name: '准确率', category: 'accuracy', formula: 'TP+TN / ALL', weight: 0.5, threshold: 0.85, enabled: true },
    { id: 'm_rob', name: '鲁棒性', category: 'robustness', formula: 'Rob Index', weight: 0.3, threshold: 0.8, enabled: true },
    { id: 'm_eff', name: '效率', category: 'efficiency', formula: 'Throughput', weight: 0.2, threshold: 0.7, enabled: true },
    { id: 'm_exp', name: '用户满意度', category: 'experience', formula: 'Satisfaction Score', weight: 0, threshold: 0.75, enabled: false },
    { id: 'm_cov', name: '覆盖率', category: 'accuracy', formula: 'Coverage Ratio', weight: 0, threshold: 0.8, enabled: false }
  ]
}

const saveAsTemplate = () => { saveTemplateDialog.form = { name: '', description: '' }; saveTemplateDialog.visible = true }
const confirmSaveTemplate = async () => { if (!saveTemplateDialog.form.name) return; await new Promise(r => setTimeout(r, 500)); saveTemplateDialog.visible = false }
</script>

<style lang="scss" scoped>
/* 样式同之前实现，略 */
</style>


