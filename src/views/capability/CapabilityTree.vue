<template>
  <div ref="chartRef" class="cap-tree" />
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "CapabilityTree",
  props: {
    subtasks: {
      type: Array,
      default: () => [],
    },
    rootName: {
      type: String,
      default: "能力评估体系",
    },
  },
  data() {
    return {
      chart: null,
    };
  },
  mounted() {
    this.init();
    window.addEventListener("resize", this.resize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.resize);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  watch: {
    subtasks: {
      deep: true,
      handler() {
        this.render();
      },
    },
  },
  methods: {
    init() {
      this.chart = echarts.init(this.$refs.chartRef);
      this.render();
    },
    resize() {
      this.chart && this.chart.resize();
    },
    buildTreeData() {
      const root = { name: this.rootName, children: [], label: this.nodeLabelStyle('root') };
      for (const st of this.subtasks || []) {
        const stNode = { name: st.name || st.id, children: [], label: this.nodeLabelStyle('subtask') };
        for (const cap of st.capabilities || []) {
          const capNode = { name: cap.name || cap.id, children: [], label: this.nodeLabelStyle('capability') };
          for (const m of cap.metrics || []) {
            capNode.children.push({ name: m.name || m.code, label: this.nodeLabelStyle('metric') });
          }
          stNode.children.push(capNode);
        }
        root.children.push(stNode);
      }
      return root;
    },
    nodeLabelStyle(type) {
      // 不同层级的样式
      const base = {
        position: "top",
        verticalAlign: "middle",
        align: "center",
        borderWidth: 2,
        borderRadius: 8,
        padding: [6, 12],
        shadowColor: "rgba(0,0,0,0.06)",
        shadowBlur: 8,
      };
      switch (type) {
        case 'root':
          return {
            ...base,
            fontSize: 14,
            fontWeight: 900,
            color: '#1f2d3d',
            backgroundColor: '#e8f3ff',
            borderColor: '#409EFF',
          };
        case 'subtask':
          return {
            ...base,
            fontSize: 13,
            backgroundColor: '#f0f9eb',
            borderColor: '#67C23A',
            color: '#2c3e50',
          };
        case 'capability':
          return {
            ...base,
            fontSize: 12,
            backgroundColor: '#ecf5ff',
            borderColor: '#409EFF',
            color: '#2c3e50',
          };
        case 'metric':
        default:
          return {
            ...base,
            fontSize: 12,
            backgroundColor: '#f4f4f5',
            borderColor: '#d3d4d6',
            color: '#606266',
          };
      }
    },
    render() {
      if (!this.chart) return;
      const data = this.buildTreeData();
      const option = {
        tooltip: { trigger: "item", triggerOn: "mousemove" },
        series: [
          {
            type: "tree",
            data: [data],
            top: "5%",
            left: "6%",
            bottom: "5%",
            right: "6%",
            orient: "TB", // 从上到下
            layout: "orthogonal",
            symbol: "none", // 用标签作为节点样式
            edgeShape: "polyline",
            edgeForkPosition: "50%",
            lineStyle: { width: 1.2 },
            // 默认标签样式，具体节点已在构建时分别设置
            label: { show: true },
            leaves: { label: { show: true } },
            expandAndCollapse: true,
            initialTreeDepth: 3,
            animationDuration: 450,
            animationDurationUpdate: 300,
          },
        ],
      };
      this.chart.setOption(option);
    },
  },
};
</script>

<style scoped>
.cap-tree { width: 100%; height: 420px; }
</style>


