<template>
  <div class="login-container">
    <video class="bg-video" autoplay muted loop playsinline src="@/assets/bg.mp4"></video>
    <div class="bg-mask"></div>
    <div class="login-box">
      <div class="login-form-container">
        <div class="logo-container">
          <h2 class="welcome-text">欢迎回来</h2>
          <h3 class="system-title">{{ title }}</h3>
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
.login-container {
  height: 100vh;
  width: 100vw;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
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
  filter: saturate(1.15) contrast(1.08) brightness(1.1);
}

.bg-mask {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: radial-gradient(80% 100% at 50% 0%, rgba(8, 20, 16, 0.58) 0%, rgba(8, 20, 16, 0.38) 60%, rgba(8, 17, 14, 0.42) 100%);
}

.login-box {
  width: 420px;
  max-width: 90vw;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 255, 170, 0.12), inset 0 0 30px rgba(0, 255, 170, 0.05);
  background: rgba(8, 20, 16, 0.72);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 255, 170, 0.18);
  position: relative;
  z-index: 2;
}

.login-form-container {
  width: 100%;
  padding: 40px 36px 30px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
}

.logo-container {
  margin-bottom: 40px;
  text-align: center;

  .welcome-text {
    font-size: 28px;
    color: #b3ffea;
    margin-bottom: 10px;
    font-weight: 600;
  }

  .system-title {
    font-size: 18px;
    color: #7adec8;
    font-weight: 400;
  }
}

.login-form {
  flex: 1;

  .el-form-item {
    margin-bottom: 24px;
  }

  .el-input {
    height: 50px;

    :deep(.el-input__wrapper) {
      padding-left: 15px;
      box-shadow: 0 0 0 1px rgba(0, 255, 170, 0.15) inset, 0 0 0 rgba(0, 0, 0, 0);
      background-color: rgba(10, 25, 20, 0.5);
      transition: box-shadow 0.2s ease, background-color 0.2s ease;
    }

    :deep(.el-input__prefix) {
      color: #57e6c0;
      font-size: 18px;
    }

    :deep(.is-focus .el-input__wrapper),
    :deep(.el-input__wrapper.is-focus),
    :deep(.el-input__wrapper:hover) {
      box-shadow: 0 0 0 1px rgba(0, 255, 170, 0.35) inset, 0 0 12px rgba(0, 255, 170, 0.25);
      background-color: rgba(10, 25, 20, 0.65);
    }
  }

  .show-pwd {
    position: absolute;
    right: 15px;
    top: 14px;
    font-size: 16px;
    color: #84f0d3;
    cursor: pointer;
    user-select: none;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;

  .forgot-password { display: none; }
}

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #00d1a0 0%, #00ffcc 100%);
  border: none;
  margin-top: 10px;

  &:hover {
    background: linear-gradient(90deg, #00ffcc 0%, #00d1a0 100%);
    box-shadow: 0 0 18px rgba(0, 255, 204, 0.35);
  }
}

.demo-login {
  margin-top: 15px;
  text-align: center;

  .demo-button {
    width: 100%;
    height: 40px;
    border-radius: 25px;
    font-size: 14px;
    background: rgba(0, 255, 170, 0.08);
    border: 1px solid rgba(0, 255, 170, 0.25);
    color: #9cf7e4;
  }
}

.register-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #9bdacb;

  .create-account {
    color: #49f2c6;
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
  }

  .login-form-container {
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
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
    height: 45px;
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

// 添加额外的小屏幕适配
@media screen and (max-width: 375px) {
  .login-form-container {
    padding: 15px 10px;
  }

}
</style>
