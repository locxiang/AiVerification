<template>
  <div class="dataset-create-container">
    <el-steps :active="activeStep" finish-status="success" align-center>
      <el-step title="上传数据集" />
      <el-step title="字段映射" />
    </el-steps>

    <div v-show="activeStep === 0" class="step-body">
      <el-card shadow="never">
        <template #header>
          <span>上传数据集</span>
        </template>
        <el-form label-position="top">
          <el-form-item label="数据集名称" required>
            <el-input v-model="form.name" placeholder="请输入数据集名称" />
          </el-form-item>
          <el-form-item label="选择文件" required>
            <el-upload class="dataset-upload" drag action="#" :auto-upload="false" :limit="1" :on-change="onFileChange" :on-remove="onFileRemove" :file-list="form.fileList">
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">支持 .csv、.xlsx、.json 格式文件，最大 50MB</div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
        <div class="actions">
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" :loading="uploading" :disabled="!form.name || !form.file" @click="upload">上传并下一步</el-button>
        </div>
      </el-card>
    </div>

    <div v-show="activeStep === 1" class="step-body">
      <el-card shadow="never">
        <template #header>
          <span>字段映射</span>
        </template>
        <el-row :gutter="20">
          <el-col :xs="24" :lg="10">
            <h3 class="section-title">源字段 → 标准字段</h3>
            <div class="mapping-fields">
              <div v-for="(targetField, sourceField) in mapping" :key="sourceField" class="mapping-field">
                <div class="field-source">{{ sourceField }}</div>
                <el-icon class="mapping-arrow"><ArrowRight /></el-icon>
                <el-select v-model="mapping[sourceField]" placeholder="选择标准字段" size="default" style="width: 180px;">
                  <el-option v-for="field in schema" :key="field.field" :label="`${field.field} (${field.type})`" :value="field.field" />
                </el-select>
                <el-tag v-if="getFieldRequirement(sourceField)" size="small" type="danger">必需</el-tag>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :lg="14">
            <h3 class="section-title">预览（前50行）</h3>
            <el-table :data="previewData" style="width: 100%" border size="small" max-height="400">
              <el-table-column v-for="column in previewColumns" :key="column" :prop="column" :label="column" />
            </el-table>
          </el-col>
        </el-row>
        <div class="actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button :loading="validating" @click="validate">校验映射</el-button>
          <el-button type="success" :disabled="!canSave" @click="save">完成</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const activeStep = ref(0)
const uploading = ref(false)

const form = reactive({
  name: '',
  file: null,
  fileList: [],
})

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

const previewData = ref([])
const previewColumns = computed(() => (previewData.value[0] ? Object.keys(previewData.value[0]) : []))
const validating = ref(false)
const canSave = ref(false)

const onFileChange = (file) => {
  form.file = file.raw
}

const onFileRemove = () => {
  form.file = null
}

const upload = async () => {
  uploading.value = true
  try {
    await new Promise((r) => setTimeout(r, 800))
    // 生成预览数据
    const data = []
    for (let i = 0; i < 50; i++) {
      data.push({
        id: `row_${i + 1}`,
        用户输入: `这是一条示例文本内容 #${i + 1}`,
        真实标签: Math.random() > 0.5 ? '正面' : '负面',
        时间戳: `2025-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        用户ID: `user_${Math.floor(Math.random() * 1000) + 1}`,
        分类: ['政治', '经济', '社会', '文化', '科技'][Math.floor(Math.random() * 5)],
      })
    }
    previewData.value = data
    activeStep.value = 1
    ElMessage.success('上传成功，进入字段映射')
  } finally {
    uploading.value = false
  }
}

const getFieldRequirement = (sourceField) => {
  const targetField = mapping[sourceField]
  if (!targetField) return false
  const fieldSchema = schema.value.find((f) => f.field === targetField)
  return fieldSchema?.required || false
}

const validate = async () => {
  validating.value = true
  try {
    await new Promise((r) => setTimeout(r, 600))
    const requiredFields = schema.value.filter((f) => f.required).map((f) => f.field)
    const mappedFields = Object.values(mapping)
    const missing = requiredFields.filter((f) => !mappedFields.includes(f))
    if (missing.length) {
      ElMessage.error(`必需字段未映射：${missing.join(', ')}`)
      canSave.value = false
      return
    }
    ElMessage.success('映射校验通过')
    canSave.value = true
  } finally {
    validating.value = false
  }
}

const save = async () => {
  await new Promise((r) => setTimeout(r, 500))
  ElMessage.success('数据集创建完成')
  router.replace('/datasets/list')
}

const prevStep = () => {
  activeStep.value = 0
}

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.dataset-create-container {
  padding: 20px;
  .step-body { margin-top: 16px; }
  .actions { margin-top: 16px; text-align: right; }
  .section-title { font-size: 16px; font-weight: 500; color: #303133; margin: 10px 0 15px; }
  .mapping-fields { margin-bottom: 10px; }
  .mapping-field { display: flex; align-items: center; margin-bottom: 10px; }
  .field-source { min-width: 100px; font-weight: 500; }
  .mapping-arrow { margin: 0 10px; color: #909399; }
}
</style>
