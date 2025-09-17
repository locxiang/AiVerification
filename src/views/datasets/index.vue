<template>
  <div class="dataset-manager-redirect">
    <el-alert type="info" :closable="false" show-icon title="结构已调整：请使用左侧“数据集管理”下的二级菜单进行操作（列表/新增/变更记录）。此页面未来将移除。" style="margin-bottom: 12px;" />
    <el-button type="primary" @click="$router.replace('/datasets/list')">前往数据集列表</el-button>
  </div>
</template>

<script setup>
</script>

<style scoped>
.dataset-manager-redirect { padding: 20px; }
</style>
