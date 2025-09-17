<template>
  <div class="tasks-list">
    <vab-page-header title="任务列表" />
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索任务名称/ID" clearable class="w-260" />
        <el-button type="primary" @click="fetchTasks">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="success" @click="openCreateFromPlan">从方案创建任务</el-button>
      </div>
      <el-table :data="tasks" stripe>
        <el-table-column prop="id" label="任务ID" width="120" />
        <el-table-column prop="name" label="任务名称" min-width="180" />
        <el-table-column prop="planName" label="来源方案" min-width="180" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="createVisible" title="从方案创建任务" width="640px">
      <el-form :model="createForm">
        <el-form-item label="选择方案" label-width="90px">
          <el-select
            v-model="createForm.planId"
            filterable
            remote
            :remote-method="remoteSearchPlans"
            :loading="plansLoading"
            placeholder="搜索方案名称/ID"
            style="width: 100%"
          >
            <el-option
              v-for="plan in planOptions"
              :key="plan.id"
              :label="plan.name"
              :value="plan.id"
            >
              <div class="plan-option">
                <div class="left">
                  <div class="title">{{ plan.name }} <span class="id">#{{ plan.id }}</span></div>
                  <div class="meta">
                    <span>模板：{{ plan.template }}</span>
                    <span>负责人：{{ plan.owner }}</span>
                    <span>状态：{{ statusText(plan.status) }}</span>
                  </div>
                </div>
                <div class="right">
                  <div class="time">创建：{{ plan.createdAt }}</div>
                  <div class="time" v-if="plan.lastRunAt">最近运行：{{ plan.lastRunAt }}</div>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="并发数" label-width="90px">
          <el-input-number v-model="createForm.concurrency" :min="1" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="createTask">创建</el-button>
      </template>
    </el-dialog>
  </div>

</template>

<script>
import { ElMessage } from "element-plus";
import VabPageHeader from "@/components/VabPageHeader/index.vue";
import { getTasks, createTaskFromPlan } from "@/api/tasks";
import { getPlans } from "@/api/plans";

export default {
  name: "TaskList",
  components: { VabPageHeader },
  data() {
    return {
      keyword: "",
      tasks: [],
      createVisible: false,
      createForm: { planId: "", concurrency: 1 },
      planOptions: [],
      plansLoading: false,
    };
  },
  created() {
    this.fetchTasks();
  },
  methods: {
    async fetchTasks() {
      const { data } = await getTasks({ keyword: this.keyword });
      this.tasks = data || [];
    },
    reset() {
      this.keyword = "";
      this.fetchTasks();
    },
    openCreateFromPlan() {
      this.createVisible = true;
      this.remoteSearchPlans("");
    },
    async remoteSearchPlans(query) {
      this.plansLoading = true;
      try {
        const { data } = await getPlans({ q: query, page: 1, pageSize: 20 });
        this.planOptions = (data && data.list) || [];
      } finally {
        this.plansLoading = false;
      }
    },
    async createTask() {
      if (!this.createForm.planId) {
        ElMessage.warning("请选择方案");
        return;
      }
      await createTaskFromPlan(this.createForm);
      ElMessage.success("任务创建成功");
      this.createVisible = false;
      this.fetchTasks();
    },
    statusText(status) {
      const map = { draft: "草稿", running: "进行中", completed: "已完成", failed: "失败" };
      return map[status] || status;
    },
    goDetail(id) {
      this.$router.push({ name: "TaskDetail", params: { id } });
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
.tasks-list .toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.w-260 { width: 260px; }
.plan-option { display: flex; justify-content: space-between; align-items: flex-start; }
.plan-option .title { font-weight: 600; }
.plan-option .id { color: #909399; font-weight: 400; margin-left: 6px; }
.plan-option .meta { color: #909399; display: flex; gap: 12px; font-size: 12px; margin-top: 4px; }
.plan-option .right { text-align: right; color: #909399; font-size: 12px; }
</style>


