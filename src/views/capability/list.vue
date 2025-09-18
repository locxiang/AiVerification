<template>
  <div class="capability-systems-list">
    <vab-page-header title="能力评估体系管理" />
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索试验目的/任务/目标/场景" clearable class="w-320" />
        <el-button type="primary" @click="fetchList">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="体系ID" width="120" />
        <el-table-column prop="name" label="体系名称" min-width="220" />
        <el-table-column prop="purpose" label="试验目的" min-width="220" show-overflow-tooltip />
        <el-table-column prop="scenarioType" label="试验场景类型" width="160">
          <template #default="{ row }">
            <el-tag
              :type="getScenarioTypeTagType(row.scenarioType)"
              effect="light"
              size="small"
            >
              {{ row.scenarioType || '—' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="140" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.id)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :current-page="page"
          :total="total"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import VabPageHeader from "@/components/VabPageHeader/index.vue";
import { getCapabilitySystems } from "@/api/capability";

export default {
  name: "CapabilitySystemsList",
  components: { VabPageHeader },
  data() {
    return {
      keyword: "",
      list: [],
      page: 1,
      pageSize: 10,
      total: 0,
    };
  },
  created() {
    this.fetchList();
  },
  methods: {
    async fetchList() {
      try {
        const { data } = await getCapabilitySystems({ q: this.keyword, page: this.page, pageSize: this.pageSize });
        const payload = data || { list: [], total: 0 };
        this.list = payload.list || [];
        this.total = payload.total || 0;
      } catch (e) {
        // 本地回退假数据，确保页面可见
        const fallback = {
          total: 3,
          list: [
            { id: "SYS-1001", name: "通用能力评估体系A", purpose: "验证系统在多场景下的稳定性与鲁棒性", scenarioType: "政策宣示场景", owner: "张三", updatedAt: "2025-09-10 12:00:00" },
            { id: "SYS-1002", name: "专项能力评估体系B", purpose: "评估算法在复杂任务上的指标达标情况", scenarioType: "舆论斗争场景", owner: "李四", updatedAt: "2025-09-12 09:30:00" },
            { id: "SYS-1003", name: "认知防御评估体系C", purpose: "评估系统对恶意信息的识别与防御能力", scenarioType: "认知防御与干预场景", owner: "王五", updatedAt: "2025-09-15 14:20:00" },
          ],
        };
        this.list = fallback.list;
        this.total = fallback.total;
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
    reset() {
      this.keyword = "";
      this.page = 1;
      this.fetchList();
    },
    onSizeChange(size) {
      this.pageSize = size;
      this.page = 1;
      this.fetchList();
    },
    onPageChange(p) {
      this.page = p;
      this.fetchList();
    },
    goDetail(id) {
      this.$router.push({ name: "CapabilitySystemDetail", params: { id } });
    },
  },
};
</script>

<style scoped>
.capability-systems-list .toolbar { display: flex; gap: 12px; margin-bottom: 12px; }
.capability-systems-list .pager { display: flex; justify-content: flex-end; margin-top: 12px; }
.w-320 { width: 320px; }
</style>


