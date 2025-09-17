<template>
  <div class="capability-system-detail">
    <vab-page-header :title="`能力评估体系详情 #${systemId}`" />
    <el-card>
      <div class="detail-header">
        <div class="title-area">
          <h2 class="system-title">{{ detail.name || '未命名能力评估体系' }}</h2>
          <div class="meta">
            <el-tag type="info" effect="plain" size="small" class="mr-6">ID：{{ detail.id }}</el-tag>
            <el-tag type="success" effect="plain" size="small" class="mr-6">负责人：{{ detail.owner || '—' }}</el-tag>
            <el-tag
              v-if="detail.scenarioType"
              :type="getScenarioTypeTagType(detail.scenarioType)"
              effect="light"
              size="small"
            >
              场景类型：{{ detail.scenarioType }}
            </el-tag>
          </div>
        </div>
        <div class="time-area">
          <span class="label">更新时间</span>
          <span class="time">{{ detail.updatedAt || '—' }}</span>
        </div>
      </div>

      <el-divider class="section-divider"/>

      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">体系ID</div>
          <div class="summary-value">{{ detail.id || '—' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">负责人</div>
          <div class="summary-value">{{ detail.owner || '—' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">更新时间</div>
          <div class="summary-value">{{ detail.updatedAt || '—' }}</div>
        </div>
      </div>

      <div class="rich-sections">
        <section v-if="detail.purpose" class="rich-block">
          <h3 class="rich-title">试验目的</h3>
          <div class="rich-content">{{ detail.purpose }}</div>
        </section>
        <section v-if="detail.task" class="rich-block">
          <h3 class="rich-title">试验任务</h3>
          <div class="rich-content">{{ detail.task }}</div>
        </section>
        <section v-if="detail.goal" class="rich-block">
          <h3 class="rich-title">试验目标</h3>
          <div class="rich-content">{{ detail.goal }}</div>
        </section>
        <section v-if="detail.scenarioType" class="rich-block">
          <h3 class="rich-title">实验场景类型</h3>
          <div class="rich-content">
            <el-tag
              :type="getScenarioTypeTagType(detail.scenarioType)"
              effect="light"
              size="default"
            >
              {{ detail.scenarioType }}
            </el-tag>
          </div>
        </section>
        <section v-if="detail.scenario" class="rich-block">
          <h3 class="rich-title">试验场景</h3>
          <div class="rich-content">{{ detail.scenario }}</div>
        </section>
        <section v-if="detail.staffing" class="rich-block">
          <h3 class="rich-title">人员安排</h3>
          <div class="rich-content">{{ detail.staffing }}</div>
        </section>
      </div>

      <h3 class="block-title">子任务列表</h3>
      <el-table :data="detail.subtasks || []" stripe>
        <el-table-column prop="id" label="子任务ID" width="120" />
        <el-table-column prop="name" label="子任务名称" min-width="220" />
        <el-table-column prop="description" label="描述" min-width="260" show-overflow-tooltip />
      </el-table>

      <h3 class="block-title">能力与指标</h3>
      <CapabilityTree :subtasks="detail.subtasks || []" :rootName="detail.name || '能力评估体系'" />
    </el-card>
  </div>

</template>

<script>
import VabPageHeader from "@/components/VabPageHeader/index.vue";
import { getCapabilitySystemDetail } from "@/api/capability";
import CapabilityTree from "./CapabilityTree.vue";

export default {
  name: "CapabilitySystemDetail",
  components: { VabPageHeader, CapabilityTree },
  data() {
    return {
      systemId: this.$route.params.id,
      detail: {},
    };
  },
  computed: {
    capabilityRows() {
      const rows = [];
      const subtasks = this.detail.subtasks || [];
      for (const st of subtasks) {
        const capabilities = st.capabilities || [];
        for (const cap of capabilities) {
          rows.push({
            subtaskName: st.name,
            capabilityName: cap.name,
            metrics: cap.metrics || [],
          });
        }
      }
      return rows;
    },
  },
  created() {
    this.fetch();
  },
  methods: {
    async fetch() {
      try {
        const { data } = await getCapabilitySystemDetail(this.systemId);
        this.detail = data || {};
      } catch (e) {
        this.detail = {};
      }
    },
    getScenarioTypeTagType(scenarioType) {
      const typeMap = {
        '政策宣示场景': 'success',
        '舆论斗争场景': 'warning',
        '认知防御与干预场景': 'danger'
      };
      return typeMap[scenarioType] || 'info';
    },
  },
};
</script>

<style scoped>
.block-title { margin: 16px 0 8px; font-weight: 600; }
.mr-6 { margin-right: 6px; }

.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.system-title { margin: 0; font-size: 18px; line-height: 26px; font-weight: 600; }
.meta { margin-top: 6px; display: flex; align-items: center; flex-wrap: wrap; }
.time-area { display: flex; align-items: baseline; gap: 8px; color: var(--el-text-color-secondary); }
.time-area .label { font-size: 12px; }
.time-area .time { font-size: 13px; }

.section-divider { margin: 14px 0; }

.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 768px) { .summary-grid { grid-template-columns: 1fr; } }
.summary-item { background: var(--el-fill-color-light); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 10px 12px; min-height: 56px; display: flex; flex-direction: column; justify-content: center; }
.summary-label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 2px; }
.summary-value { font-size: 14px; color: var(--el-text-color-primary); font-weight: 500; }

.rich-sections { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 10px; }
.rich-block { padding: 12px 14px; background: var(--el-color-white); border: 1px solid var(--el-border-color-lighter); border-radius: 10px; }
.rich-title { margin: 0 0 6px; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.rich-content { white-space: pre-wrap; word-break: break-word; line-height: 1.75; color: var(--el-text-color-regular); font-size: 13px; }
</style>


