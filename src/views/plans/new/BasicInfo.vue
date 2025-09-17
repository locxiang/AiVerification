<template>
  <div class="basic-info-step">
    <h3 class="step-title">基本信息</h3>

    <el-form label-position="top" :model="localFormData" label-width="100px">
      <el-form-item label="实验方案名称" required>
        <el-input
          v-model="localFormData.name"
          placeholder="请输入实验方案名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="实验描述">
        <el-input
          v-model="localFormData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入实验描述"
        />
      </el-form-item>

      <el-form-item label="实验类型" required>
        <el-select
          v-model="localFormData.type"
          placeholder="请选择实验类型"
          style="width: 100%"
        >
          <el-option
            v-for="type in experimentTypes"
            :key="type.id"
            :label="type.name"
            :value="type.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="选择模板（可选）">
        <el-select
          v-model="localFormData.templateId"
          placeholder="请选择模板"
          style="width: 100%"
          @change="handleTemplateChange"
        >
          <el-option label="不使用模板" value="" />
          <el-option
            v-for="template in templates"
            :key="template.id"
            :label="template.name"
            :value="template.id"
          />
        </el-select>
        <div class="template-tip">
          选择模板将自动填充后续步骤内容，您可以根据需要进行修改
        </div>
      </el-form-item>

      <el-form-item label="负责人">
        <el-input
          v-model="localFormData.responsiblePerson"
          placeholder="请输入负责人"
          disabled
        >
          <template #append>
            <el-tooltip content="演示环境中固定为当前用户" placement="top">
              <el-icon><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="可见范围">
        <el-select
          v-model="localFormData.visibility"
          placeholder="请选择可见范围"
          multiple
          disabled
          style="width: 100%"
        >
          <el-option label="默认组" value="group_1" />
        </el-select>
        <div class="template-tip">
          演示环境中固定为默认组
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  experimentTypes: {
    type: Array,
    required: true
  },
  templates: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:form-data', 'load-template'])

const localFormData = reactive({
  name: props.formData.name,
  description: props.formData.description,
  type: props.formData.type,
  templateId: props.formData.templateId,
  responsiblePerson: props.formData.responsiblePerson,
  visibility: props.formData.visibility
})

watch(localFormData, (newValue) => {
  emit('update:form-data', {
    name: newValue.name,
    description: newValue.description,
    type: newValue.type,
    templateId: newValue.templateId,
    responsiblePerson: newValue.responsiblePerson,
    visibility: newValue.visibility
  })
}, { deep: true })

watch(() => props.formData, (newValue) => {
  localFormData.name = newValue.name
  localFormData.description = newValue.description
  localFormData.type = newValue.type
  localFormData.templateId = newValue.templateId
  localFormData.responsiblePerson = newValue.responsiblePerson
  localFormData.visibility = newValue.visibility
}, { deep: true })

const handleTemplateChange = (value) => {
  if (value) {
    emit('load-template', value)
  }
}
</script>

<style lang="scss" scoped>
.basic-info-step {
  .step-title {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 20px;
  }

  .template-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>

