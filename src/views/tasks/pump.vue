<template>
  <div class="pump">
    <vab-page-header title="数据泵状态" />
    <el-card>
      <div class="actions">
        <el-button size="small" type="warning" @click="resetPumpState">重置本地状态</el-button>
      </div>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="连接数">{{ status.connections }}</el-descriptions-item>
        <el-descriptions-item label="队列积压">{{ status.backlog }}</el-descriptions-item>
        <el-descriptions-item label="最后心跳">{{ status.heartbeat }}</el-descriptions-item>
      </el-descriptions>
      <div class="chart" ref="chartEl" />
    </el-card>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card header="进行中的任务">
          <el-table :data="status.runningTasks || []" size="small" height="280">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="任务名" min-width="120" />
            <el-table-column prop="planName" label="所属方案" min-width="120" />
            <el-table-column label="进度" min-width="160">
              <template #default="{ row }">
                <el-progress :text-inside="true" :stroke-width="18" :percentage="Math.round((row.progress||0)*100)" />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="对接的数据集">
          <el-table :data="status.datasets || []" size="small" height="280">
            <el-table-column prop="id" label="ID" width="120" />
            <el-table-column prop="name" label="名称" min-width="140" />
            <el-table-column prop="source" label="来源" width="140" />
            <el-table-column prop="docs" label="文档数" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 12px" header="最近日志">
      <div class="logs">
        <div v-for="(l, idx) in (status.logs || [])" :key="idx" class="log-line" :class="l.level">
          <span class="ts">{{ l.ts }}</span>
          <span class="level">[{{ l.level }}]</span>
          <span class="msg">{{ l.msg }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import VabPageHeader from "@/components/VabPageHeader/index.vue";
import { idbGet, idbSet, idbDel, makeIncrementalState } from "@/utils/indexedDb";
import * as echarts from "echarts";

export default {
  name: "DataPump",
  components: { VabPageHeader },
  data() {
    return { timer: null, chart: null, status: { connections: 0, backlog: 0, heartbeat: "-", errorsLastHour: [], runningTasks: [], datasets: [], logs: [] } };
  },
  async created() {
    await this.fetch();
    this.$nextTick(this.renderChart);
    this.startPolling();
  },
  beforeUnmount() {
    this.stopPolling();
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    async fetch() {
      const prev = (await idbGet("pump_state")) || this.status;
      const next = makeIncrementalState(prev);
      this.status = next;
      await idbSet("pump_state", next);
      if (this.chart) this.updateChart();
    },
    async resetPumpState() {
      await idbDel("pump_state");
      this.status = { connections: 5, backlog: 12, heartbeat: new Date().toISOString(), errorsLastHour: Array.from({ length: 12 }).map(() => 0), runningTasks: [], datasets: [], logs: [] };
      if (this.chart) this.updateChart();
      this.$message && this.$message.success && this.$message.success("已重置本地状态");
    },
    renderChart() {
      this.chart = echarts.init(this.$refs.chartEl);
      this.chart.setOption({
        xAxis: { type: "category", data: Array.from({ length: this.status.errorsLastHour?.length || 0 }).map((_, i) => `${i}m`) },
        yAxis: { type: "value" },
        series: [{ type: "line", data: this.status.errorsLastHour || [] }],
        tooltip: { trigger: "axis" },
      });
    },
    updateChart() {
      this.chart.setOption({
        xAxis: { data: Array.from({ length: this.status.errorsLastHour?.length || 0 }).map((_, i) => `${i}m`) },
        series: [{ data: this.status.errorsLastHour || [] }],
      });
    },
    startPolling() {
      this.stopPolling();
      this.timer = setInterval(this.fetch, 3000);
    },
    stopPolling() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
  },
};
</script>

<style scoped>
.chart { height: 260px; margin-top: 12px; }
.logs { max-height: 260px; overflow: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
.log-line { padding: 4px 6px; border-bottom: 1px solid #f0f0f0; }
.log-line .ts { color: #999; margin-right: 8px; }
.log-line .level { color: #666; margin-right: 8px; }
.log-line.info { background: #fafafa; }
.log-line.warn { background: #fff7e6; }
</style>


