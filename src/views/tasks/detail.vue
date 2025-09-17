<template>
  <div class="task-detail">
    <vab-page-header :title="`任务详情 #${taskId}`" />
    <el-card>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务ID">{{ task.id }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ task.name }}</el-descriptions-item>
        <el-descriptions-item label="来源方案">{{ task.planName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(task.status)">{{ task.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ task.createdAt }}</el-descriptions-item>
      </el-descriptions>
      <div class="ops">
        <el-button type="primary" @click="start">开始</el-button>
        <el-button @click="stop">停止</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import VabPageHeader from "@/components/VabPageHeader/index.vue";
import { ElMessage } from "element-plus";
import { getTaskDetail, startTask, stopTask } from "@/api/tasks";

export default {
  name: "TaskDetail",
  components: { VabPageHeader },
  data() {
    return {
      taskId: this.$route.params.id,
      task: {},
    };
  },
  created() {
    this.fetch();
  },
  methods: {
    async fetch() {
      const { data } = await getTaskDetail(this.taskId);
      this.task = data || {};
    },
    async start() {
      await startTask(this.taskId);
      ElMessage.success("已开始");
      this.fetch();
    },
    async stop() {
      await stopTask(this.taskId);
      ElMessage.success("已停止");
      this.fetch();
    },
    statusType(status) {
      switch (status) {
        case "running":
          return "success";
        case "pending":
          return "warning";
        case "failed":
          return "danger";
        default:
          return "info";
      }
    },
  },
};
</script>

<style scoped>
.ops { margin-top: 12px; }
</style>


