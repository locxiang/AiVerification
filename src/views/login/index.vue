<template>
  <div class="login-container">
    <video class="bg-video" autoplay muted loop playsinline src="@/assets/bg5.mp4"></video>
    <div class="bg-mask"></div>
    <div class="login-box">
      <div class="login-form-container">
        <div class="logo-container">
          <div class="system-title">{{ title }}</div>
        </div>

        <el-form
          ref="loginForm"
          :model="form"
          :rules="rules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              tabindex="1"
              type="text"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              :key="passwordType"
              ref="password"
              v-model="form.password"
              :type="passwordType"
              tabindex="2"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
            <span class="show-pwd" @click="showPwd">
              <el-icon v-if="passwordType === 'password'">
                <Hide />
              </el-icon>
              <el-icon v-else>
                <View />
              </el-icon>
            </span>
          </el-form-item>

          <div class="form-actions">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          </div>

          <el-button
            :loading="loading"
            type="primary"
            class="login-button"
            @click.prevent="handleLogin"
          >
            登录
          </el-button>

          <div class="register-link">
            <span class="create-account">请联系管理员处理账号问题</span>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, toRefs, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { title } from "@/config";
import { isPassword } from "@/utils/validate";
import { ElMessage } from "element-plus";
import { Hide, View, User, Lock } from "@element-plus/icons-vue";

// 创建路由实例
const router = useRouter();
const store = useStore();

// 响应式状态
const state = reactive({
  form: {
    username: "admin",
    password: "123456",
  },
  rules: {
    username: [{ required: true, trigger: "blur", message: "请输入用户名" }],
    password: [
      { required: true, trigger: "blur", message: "请输入密码" },
      {
        validator: (rule, value, callback) => {
          if (!isPassword(value)) {
            callback(new Error("密码长度必须大于等于6位"));
          } else {
            callback();
          }
        },
        trigger: "blur",
      },
    ],
  },
  loading: false,
  passwordType: "password",
  redirect: undefined,
});

// 使用refs获取表单DOM引用
const loginForm = ref(null);
const password = ref(null);
const rememberMe = ref(false);

// 计算属性
const otherQuery = computed(() => {
  return Object.keys(router.currentRoute.value.query).reduce((acc, cur) => {
    if (cur !== "redirect") {
      acc[cur] = router.currentRoute.value.query[cur];
    }
    return acc;
  }, {});
});

// 显示/隐藏密码
const showPwd = () => {
  state.passwordType = state.passwordType === "password" ? "" : "password";
  // 等待DOM更新后聚焦
  nextTick(() => {
    password.value?.focus();
  });
};

// 处理登录
const handleLogin = () => {
  loginForm.value?.validate(async (valid) => {
    if (valid) {
      if (!isPassword(state.form.password)) {
        ElMessage.error("密码长度必须大于等于6位");
        return;
      }

      state.loading = true;
      try {
        // 使用命名空间调用login action
        await store.dispatch("user/login", state.form);

        // 登录成功后，让导航守卫处理路由跳转
        // 不需要手动获取用户信息和添加路由，导航守卫会处理
        const { query } = router.currentRoute.value;
        const targetPath = query.redirect || "/";

        // 跳转到目标页面
        router.replace({
          path: targetPath,
          query: otherQuery.value,
        });

        // 不再手动处理后续逻辑，让导航守卫处理
      } catch (error) {
        console.error("登录失败:", error);
        ElMessage.error(error.message || "登录失败，请检查用户名和密码");
        state.loading = false;
      }
    }
  });
};

// 生命周期钩子
onMounted(() => {
  if (router.currentRoute.value.query.redirect) {
    state.redirect = router.currentRoute.value.query.redirect;
  }
});

// 已移除演示登录功能

// 暴露给模板的变量
const { form, rules, loading, passwordType, redirect } = toRefs(state);
</script>

<style lang="scss" scoped>
$accent: #3cc7ff; // 青蓝主色，贴近视频高光
$accent-2: #6f97ff; // 渐变次色，偏蓝
$text-strong: #eaf1ff;
$text-muted: #b9c9e6;
$panel-bg: rgba(12, 18, 28, 0.58); // 更冷色调的半透明底
$panel-border: rgba(82, 170, 255, 0.18);
$input-bg: rgba(16, 24, 36, 0.38);
$input-bg-focus: rgba(16, 28, 44, 0.52);

.login-container {
  height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  overflow: hidden;
  background: #000;
}

.bg-video {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: 0;
  filter: contrast(1.0) saturate(1.12) brightness(1.12);
}

.bg-mask {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: radial-gradient(1200px 600px at 65% 45%, rgba(0, 180, 255, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.15));
}

.login-box {
  width: 420px;
  max-width: 90vw;
  border-radius: 16px;
  position: absolute;
  z-index: 2;
  background: $panel-bg;
  backdrop-filter: blur(14px) saturate(1.2);
  border: 1px solid $panel-border;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 40px rgba(60, 199, 255, 0.08);
  top: 12vh;
  right: 6vw;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    pointer-events: none;
    background: linear-gradient(140deg, rgba(60, 199, 255, 0.18), rgba(111, 151, 255, 0.16) 35%, transparent 60%);
    mix-blend-mode: screen;
  }
}

.login-form-container {
  width: 100%;
  padding: 28px 26px 22px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
}

.logo-container {
  margin-bottom: 40px;
  text-align: center;



  .system-title {
    font-size: 18px;
    color: $text-muted;
    font-weight: 400;
  }
}

.login-form {
  flex: 1;

  .el-form-item {
    margin-bottom: 18px;
  }

  .el-input {
    height: 46px;

    :deep(.el-input__wrapper) {
      padding-left: 12px;
      background-color: $input-bg;
      box-shadow: 0 0 0 1px rgba(120, 180, 255, 0.16) inset;
      transition: box-shadow 0.2s ease, background-color 0.2s ease, transform 0.12s ease;
    }

    :deep(.el-input__prefix) {
      color: lighten($accent, 12%);
      font-size: 18px;
    }

    :deep(.is-focus .el-input__wrapper),
    :deep(.el-input__wrapper.is-focus),
    :deep(.el-input__wrapper:hover) {
      background-color: $input-bg-focus;
      box-shadow: 0 0 0 1px rgba(150, 210, 255, 0.28) inset, 0 0 0 2px rgba(60, 199, 255, 0.32), 0 8px 24px rgba(0, 0, 0, 0.25);
    }
  }

  .show-pwd {
    position: absolute;
    right: 15px;
    top: 14px;
    font-size: 16px;
    color: rgba(234, 241, 255, 0.65);
    cursor: pointer;
    user-select: none;
    transition: color 0.2s ease;

    &:hover {
      color: rgba(234, 241, 255, 0.9);
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;

  .forgot-password {
    display: none;
  }

  :deep(.el-checkbox__label) {
    color: $text-muted;
  }
}

.login-button {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2px;
  background: linear-gradient(135deg, $accent 0%, $accent-2 100%);
  border: none;
  color: #fff;
  margin-top: 10px;
  box-shadow: 0 10px 24px rgba(60, 199, 255, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.06) inset;
  transition: transform 0.08s ease, box-shadow 0.2s ease, filter 0.2s ease;

  &:hover {
    filter: brightness(1.05);
    box-shadow: 0 14px 30px rgba(60, 199, 255, 0.36), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  }

  &:active {
    transform: translateY(1px);
  }
}

.demo-login {
  margin-top: 15px;
  text-align: center;

  .demo-button {
    width: 100%;
    height: 40px;
    border-radius: 12px;
    font-size: 14px;
    background: rgba(122, 169, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #d9e6ff;
  }
}

.register-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: $text-muted;

  .create-account {
    color: lighten($accent, 10%);
    text-decoration: none;
    margin-left: 5px;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* 移除右侧图片列，视频已作为全局背景 */

// 响应式设计
@media screen and (max-width: 992px) {
  .login-box {
    width: 92vw;
    max-width: 520px;
  }
}

@media screen and (max-width: 576px) {
  .login-container {
    padding: 0;
    height: 100%;
    background: transparent;
  }

  .login-box {
    width: 94vw;
    max-width: 460px;
    border-radius: 14px;
  }

  .login-form-container {
    padding: 20px 16px 16px;
  }

  .logo-container {
    margin-bottom: 20px;

    .welcome-text {
      font-size: 24px;
    }

    .system-title {
      font-size: 16px;
    }
  }

  .login-form {
    .el-form-item {
      margin-bottom: 15px;
      width: 100%;
    }

    :deep(.el-input) {
      width: 100%;

      .el-input__wrapper {
        width: 100%;
        box-sizing: border-box;
      }
    }
  }

  .login-button {
    height: 44px;
    font-size: 15px;
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;

    .forgot-password {
      margin-top: 8px;
    }
  }
}

// 额外小屏幕适配
@media screen and (max-width: 375px) {
  .login-form-container {
    padding: 16px 12px;
  }
}
</style>
