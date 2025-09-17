<template>
  <div class="experiment-dataset-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">数据集</h2>
            <p class="subtitle">选择或上传并完成字段映射</p>
          </div>
          <div class="header-actions">
            <el-button-group>
              <el-button
                :icon="Upload"
                @click="showUploadDialog"
              >
                上传数据
              </el-button>
              <el-button
                type="primary"
                :icon="Check"
                :loading="validating"
                @click="validateMapping"
              >
                校验映射
              </el-button>
              <el-button
                type="success"
                :icon="CircleCheck"
                @click="saveDatasetMapping"
              >
                保存配置
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-alert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />

      <el-tabs v-model="activeTab" class="dataset-tabs">
        <el-tab-pane label="数据集列表" name="datasets">
          <div class="datasets-list">
            <el-table
              :data="datasets"
              style="width: 100%"
              @row-click="handleDatasetSelect"
              highlight-current-row
            >
              <el-table-column width="50" type="index" />
              <el-table-column width="60">
                <template #default="{ row }">
                  <el-radio
                    v-model="selectedDatasetId"
                    :label="row.id"
                    @change="() => {}"
                  >
                    <span class="sr-only">选择</span>
                  </el-radio>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="数据集名称" min-width="180" />
              <el-table-column prop="source" label="来源" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.source === '上传' ? 'success' : 'info'">
                    {{ row.source }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="size" label="样本量" width="120">
                <template #default="{ row }">
                  {{ formatNumber(row.size) }}
                </template>
              </el-table-column>
              <el-table-column prop="updatedAt" label="更新时间" width="120" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    @click.stop="previewDataset(row)"
                  >
                    预览
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    @click.stop="confirmDeleteDataset(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="字段映射" name="mapping">
          <div class="mapping-container">
            <el-row :gutter="20">
              <el-col :xs="24" :lg="10">
                <div class="mapping-section">
                  <h3 class="section-title">源字段 → 标准字段</h3>
                  <div class="mapping-fields">
                    <div
                      v-for="(targetField, sourceField) in mapping"
                      :key="sourceField"
                      class="mapping-field"
                    >
                      <div class="field-source">{{ sourceField }}</div>
                      <el-icon class="mapping-arrow"><ArrowRight /></el-icon>
                      <el-select
                        v-model="mapping[sourceField]"
                        placeholder="选择标准字段"
                        size="default"
                        style="width: 160px;"
                      >
                        <el-option
                          v-for="field in schema"
                          :key="field.field"
                          :label="field.field"
                          :value="field.field"
                        />
                      </el-select>
                      <el-tag
                        v-if="getFieldRequirement(sourceField)"
                        size="small"
                        type="danger"
                      >
                        必需
                      </el-tag>
                    </div>
                  </div>

                  <div class="schema-info">
                    <h4 class="info-title">标准字段说明</h4>
                    <el-descriptions :column="1" border size="small">
                      <el-descriptions-item
                        v-for="field in schema"
                        :key="field.field"
                        :label="field.field"
                      >
                        <div class="field-info">
                          <span class="field-type">类型：{{ field.type }}</span>
                          <el-tag
                            v-if="field.required"
                            size="small"
                            type="danger"
                          >
                            必需
                          </el-tag>
                        </div>
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>
              </el-col>

              <el-col :xs="24" :lg="14">
                <div class="preview-section">
                  <h3 class="section-title">数据预览（前50行）</h3>
                  <div v-if="previewData.length > 0" class="preview-table">
                    <el-table
                      :data="previewData"
                      style="width: 100%"
                      border
                      size="small"
                      max-height="400"
                    >
                      <el-table-column
                        v-for="column in previewColumns"
                        :key="column"
                        :prop="column"
                        :label="column"
                      />
                    </el-table>
                  </div>
                  <div v-else class="empty-preview">
                    <el-empty description="暂无预览数据">
                      <el-button @click="generatePreviewData">生成示例数据</el-button>
                    </el-empty>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据质量" name="quality">
          <div class="quality-container">
            <el-empty description="数据质量检查功能开发中">
              <template #description>
                <p>该功能将提供：</p>
                <ul class="feature-list">
                  <li>数据完整性检查</li>
                  <li>异常值检测</li>
                  <li>数据分布可视化</li>
                  <li>自动修复建议</li>
                </ul>
              </template>
            </el-empty>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 上传数据对话框 -->
    <el-dialog
      v-model="uploadDialog.visible"
      title="上传数据集"
      width="500px"
    >
      <div class="upload-dialog-content">
        <el-form label-position="top">
          <el-form-item label="数据集名称" required>
            <el-input v-model="uploadDialog.name" placeholder="请输入数据集名称" />
          </el-form-item>

          <el-form-item label="选择文件" required>
            <el-upload
              class="dataset-upload"
              drag
              action="#"
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :file-list="uploadDialog.fileList"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 .csv、.xlsx、.json 格式文件，最大 50MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>

        <div v-if="uploadDialog.progress > 0" class="upload-progress">
          <el-progress :percentage="uploadDialog.progress" :format="percentageFormat" />
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialog.visible = false">取消</el-button>
          <el-button
            type="primary"
            @click="uploadDataset"
            :loading="uploadDialog.uploading"
            :disabled="!uploadDialog.file || !uploadDialog.name"
          >
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 数据集预览对话框 -->
    <el-dialog
      v-model="previewDialog.visible"
      :title="`数据集预览: ${previewDialog.dataset?.name || ''}`"
      width="80%"
    >
      <div class="preview-dialog-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="数据集名称">{{ previewDialog.dataset?.name }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ previewDialog.dataset?.source }}</el-descriptions-item>
          <el-descriptions-item label="样本量">{{ formatNumber(previewDialog.dataset?.size) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ previewDialog.dataset?.updatedAt }}</el-descriptions-item>
        </el-descriptions>

        <div class="preview-table-container">
          <h4 class="preview-title">数据内容预览（前50行）</h4>
          <el-table
            :data="previewDialog.data"
            style="width: 100%"
            border
            max-height="400"
          >
            <el-table-column
              v-for="column in previewDialog.columns"
              :key="column"
              :prop="column"
              :label="column"
            />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Check,
  CircleCheck,
  ArrowRight,
  Delete
} from '@element-plus/icons-vue'

const route = useRoute()
const activeTab = ref('datasets')
const error = ref('')
const validating = ref(false)

// 数据集列表
const datasets = ref([
  { id: 'ds_1', name: '样例数据集 #1', source: '上传', size: 12345, updatedAt: '2025-01-02' },
  { id: 'ds_2', name: '样例数据集 #2', source: '链接', size: 54321, updatedAt: '2025-01-01' },
  { id: 'ds_3', name: '社交媒体对话数据集', source: '上传', size: 32567, updatedAt: '2025-01-03' },
  { id: 'ds_4', name: '舆情分析数据集', source: '链接', size: 87654, updatedAt: '2024-12-28' },
])
const selectedDatasetId = ref('ds_1')

// 字段映射
const schema = ref([
  { field: 'text', type: 'string', required: true },
  { field: 'label', type: 'string', required: true },
  { field: 'timestamp', type: 'datetime', required: false },
  { field: 'user_id', type: 'string', required: false },
  { field: 'category', type: 'string', required: false },
])
const mapping = reactive({
  '用户输入': 'text',
  '真实标签': 'label',
  '时间戳': 'timestamp',
  '用户ID': 'user_id',
})

// 预览数据
const previewData = ref([])
const previewColumns = computed(() => {
  return previewData.value.length > 0 ? Object.keys(previewData.value[0]) : []
})

// 上传对话框
const uploadDialog = reactive({
  visible: false,
  name: '',
  file: null,
  fileList: [],
  progress: 0,
  uploading: false
})

// 预览对话框
const previewDialog = reactive({
  visible: false,
  dataset: null,
  data: [],
  columns: []
})

// 获取字段是否必需
const getFieldRequirement = (sourceField) => {
  const targetField = mapping[sourceField]
  if (!targetField) return false

  const fieldSchema = schema.value.find(f => f.field === targetField)
  return fieldSchema?.required || false
}

// 格式化数字
const formatNumber = (num) => {
  if (!num && num !== 0) return '-'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// 格式化百分比
const percentageFormat = (percentage) => {
  return percentage === 100 ? '完成' : `${percentage}%`
}

// 处理数据集选择
const handleDatasetSelect = (row) => {
  selectedDatasetId.value = row.id
}

// 显示上传对话框
const showUploadDialog = () => {
  uploadDialog.visible = true
  uploadDialog.name = ''
  uploadDialog.file = null
  uploadDialog.fileList = []
  uploadDialog.progress = 0
}

// 处理文件变更
const handleFileChange = (file) => {
  uploadDialog.file = file.raw
}

// 处理文件移除
const handleFileRemove = () => {
  uploadDialog.file = null
}

// 上传数据集
const uploadDataset = async () => {
  if (!uploadDialog.file || !uploadDialog.name) {
    ElMessage.warning('请选择文件并输入数据集名称')
    return
  }

  uploadDialog.uploading = true
  uploadDialog.progress = 0

  try {
    // 模拟上传进度
    for (let i = 0; i <= 100; i += 10) {
      uploadDialog.progress = i
      await new Promise(resolve => setTimeout(resolve, 120))
    }

    // 模拟上传成功
    const newDataset = {
      id: `ds_${Date.now()}`,
      name: uploadDialog.name,
      source: '上传',
      size: Math.floor(Math.random() * 50000) + 10000,
      updatedAt: new Date().toISOString().split('T')[0]
    }

    datasets.value.unshift(newDataset)
    selectedDatasetId.value = newDataset.id

    ElMessage.success('数据集上传成功')
    uploadDialog.visible = false

    // 切换到字段映射标签页
    activeTab.value = 'mapping'
  } catch (e) {
    console.error('上传失败:', e)
    ElMessage.error('上传失败，请重试')
  } finally {
    uploadDialog.uploading = false
  }
}

// 确认删除数据集
const confirmDeleteDataset = (dataset) => {
  ElMessageBox.confirm(
    `确定要删除数据集"${dataset.name}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 模拟删除操作
      datasets.value = datasets.value.filter(d => d.id !== dataset.id)

      // 如果删除的是当前选中的数据集，则重置选择
      if (selectedDatasetId.value === dataset.id) {
        selectedDatasetId.value = datasets.value.length > 0 ? datasets.value[0].id : ''
      }

      ElMessage.success('数据集删除成功')
    })
    .catch(() => {
      // 取消删除
    })
}

// 预览数据集
const previewDataset = (dataset) => {
  previewDialog.dataset = dataset

  // 模拟生成预览数据
  const columns = ['id', 'text', 'label', 'timestamp', 'user_id', 'category']
  const data = []

  for (let i = 0; i < 50; i++) {
    const row = {
      id: `row_${i + 1}`,
      text: `这是一条示例文本内容 #${i + 1}`,
      label: Math.random() > 0.5 ? '正面' : '负面',
      timestamp: `2025-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      user_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
      category: ['政治', '经济', '社会', '文化', '科技'][Math.floor(Math.random() * 5)]
    }
    data.push(row)
  }

  previewDialog.data = data
  previewDialog.columns = columns
  previewDialog.visible = true
}

// 生成预览数据
const generatePreviewData = () => {
  // 模拟生成预览数据
  const data = []

  for (let i = 0; i < 50; i++) {
    const row = {
      id: `row_${i + 1}`,
      用户输入: `这是一条示例文本内容 #${i + 1}`,
      真实标签: Math.random() > 0.5 ? '正面' : '负面',
      时间戳: `2025-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      用户ID: `user_${Math.floor(Math.random() * 1000) + 1}`,
      分类: ['政治', '经济', '社会', '文化', '科技'][Math.floor(Math.random() * 5)]
    }
    data.push(row)
  }

  previewData.value = data
}

// 校验字段映射
const validateMapping = async () => {
  error.value = ''
  validating.value = true

  try {
    // 模拟校验延迟
    await new Promise(resolve => setTimeout(resolve, 600))

    // 检查必需字段是否已映射
    const requiredFields = schema.value.filter(f => f.required).map(f => f.field)
    const mappedFields = Object.values(mapping)

    const missingFields = requiredFields.filter(field => !mappedFields.includes(field))

    if (missingFields.length > 0) {
      error.value = `E401: 字段缺失 - 必需字段 "${missingFields.join(', ')}" 未映射`
      ElMessage.error(error.value)
      return false
    }

    ElMessage.success('字段映射校验通过')
    return true
  } catch (e) {
    console.error('校验失败:', e)
    error.value = e.message || '校验失败'
    ElMessage.error(error.value)
    return false
  } finally {
    validating.value = false
  }
}

// 保存数据集映射
const saveDatasetMapping = async () => {
  // 先校验映射
  const valid = await validateMapping()
  if (!valid) return

  try {
    // 模拟保存操作
    await new Promise(resolve => setTimeout(resolve, 500))

    ElMessage.success('数据集映射保存成功')

    // 可以在这里添加跳转逻辑，例如返回实验概览页面
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error(e.message || '保存失败')
  }
}
</script>

<style lang="scss" scoped>
.experiment-dataset-container {
  padding: 20px;

  .header-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
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
  }

  .dataset-tabs {
    .datasets-list {
      margin-bottom: 20px;
    }

    .mapping-container {
      .section-title {
        font-size: 16px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 15px;
      }

      .mapping-section {
        .mapping-fields {
          margin-bottom: 20px;

          .mapping-field {
            display: flex;
            align-items: center;
            margin-bottom: 10px;

            .field-source {
              min-width: 100px;
              font-weight: 500;
            }

            .mapping-arrow {
              margin: 0 10px;
              color: #909399;
            }

            .el-tag {
              margin-left: 10px;
            }
          }
        }

        .schema-info {
          margin-top: 30px;

          .info-title {
            font-size: 14px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 10px;
          }

          .field-info {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .field-type {
              color: #606266;
            }
          }
        }
      }

      .preview-section {
        .empty-preview {
          padding: 30px;
          background-color: #f5f7fa;
          border-radius: 4px;
          text-align: center;
        }
      }
    }

    .quality-container {
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;

      .feature-list {
        text-align: left;
        margin-top: 10px;
        padding-left: 20px;

        li {
          margin-bottom: 5px;
        }
      }
    }
  }
}

.upload-dialog-content {
  .dataset-upload {
    width: 100%;
  }

  .upload-progress {
    margin-top: 20px;
  }
}

.preview-dialog-content {
  .preview-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    margin: 20px 0 15px;
  }
}

@media (max-width: 992px) {
  .experiment-dataset-container {
    .header-card {
      .card-header {
        flex-direction: column;
        align-items: flex-start;

        .header-actions {
          margin-top: 15px;
          align-self: flex-end;
        }
      }
    }
  }
}
</style>
