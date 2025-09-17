<template>
  <div class="settings-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2 class="title">系统设置</h2>
            <p class="subtitle">通用、主题与账户设置（演示占位）</p>
          </div>
          <div class="header-actions">
            <el-button type="primary" :loading="saving" @click="save">保存设置</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="active">
        <el-tab-pane label="通用" name="general">
          <el-form label-position="top" :model="general">
            <el-form-item label="站点标题">
              <el-input v-model="general.title" placeholder="输入站点标题" />
            </el-form-item>
            <el-form-item label="语言">
              <el-select v-model="general.lang" style="width: 200px">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item label="登录策略（演示）">
              <el-switch v-model="general.allowGuest" inline-prompt active-text="允许演示登录" inactive-text="禁止" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="主题" name="theme">
          <el-form label-position="top" :model="theme">
            <el-form-item label="主题色">
              <el-color-picker v-model="theme.primary" />
            </el-form-item>
            <el-form-item label="暗色模式">
              <el-switch v-model="theme.dark" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="账户" name="account">
          <el-form label-position="top" :model="account">
            <el-form-item label="昵称">
              <el-input v-model="account.nickname" placeholder="输入昵称" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="account.email" placeholder="name@example.com" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="account.password" type="password" placeholder="******" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const active = ref('general')
const saving = ref(false)

const general = reactive({ title: 'AI 能力试验验证系统', lang: 'zh-CN', allowGuest: true })
const theme = reactive({ primary: '#409EFF', dark: false })
const account = reactive({ nickname: '管理员', email: 'admin@example.com', password: '' })

const save = async () => {
  saving.value = true
  try {
    await new Promise(r => setTimeout(r, 600))
    ElMessage.success('设置已保存（演示）')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.settings-container {
  padding: 20px;

  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
  .subtitle { font-size: 14px; color: #909399; margin: 5px 0 0; }
}
</style>
