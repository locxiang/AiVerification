module.exports = [

];

const templates = [
  {
    id: "tpl_1",
    name: "静态评估模板",
    type: "static_evaluation",
    description: "常用静态评估配置",
    createdAt: Date.now() - 86400000,
    content: {
      keyFactors: {
        targetId: "target_1",
        purpose: "评估社交机器人识别和反驳虚假信息的能力",
        tasks: ["task_1", "task_2"],
        scenario: "scenario_2",
        personnel: ["评估员A", "技术支持B"],
      },
      indicators: {
        indicatorIds: ["ind_1", "ind_2", "ind_5"],
        weights: { ind_1: 0.4, ind_2: 0.4, ind_5: 0.2 },
      },
      experimentFlow: {
        nodes: [
          { id: "n1", type: "start", label: "开始" },
          { id: "n2", type: "data_collection", label: "采集数据" },
          { id: "n3", type: "evaluate", label: "计算指标" },
          { id: "n4", type: "end", label: "结束" },
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2" },
          { id: "e2", source: "n2", target: "n3" },
          { id: "e3", source: "n3", target: "n4" },
        ],
      },
      dataRequirements: {
        datasetId: "ds_1",
        requiredFields: ["user_input", "expected_output", "timestamp"],
        dataCollectionPoints: ["n2"],
      },
      resourceRequirements: {
        personnel: [
          { role: "评估员", count: 1 },
          { role: "技术支持", count: 1 },
        ],
        equipment: [
          { type: "server", spec: "8核16G", count: 1 },
          { type: "simulation_terminal", spec: "", count: 2 },
        ],
        baseDatasets: ["user_profile_dataset"],
      },
    },
  },
  {
    id: "tpl_2",
    name: "动态效能评估模板",
    type: "dynamic_evaluation",
    description: "包含流程与资源配置",
    createdAt: Date.now() - 43200000,
    content: {
      keyFactors: {
        targetId: "target_2",
        purpose: "评估社交机器人在复杂舆论环境中的引导能力",
        tasks: ["task_2", "task_3"],
        scenario: "scenario_1",
        personnel: ["评估员B", "技术支持A", "数据分析师C"],
      },
      indicators: {
        indicatorIds: ["ind_2", "ind_3", "ind_4"],
        weights: { ind_2: 0.3, ind_3: 0.4, ind_4: 0.3 },
      },
      experimentFlow: {
        nodes: [
          { id: "m1", type: "start", label: "开始" },
          { id: "m2", type: "data_collection", label: "实时采集" },
          { id: "m3", type: "evaluate", label: "动态评估" },
          { id: "m4", type: "end", label: "结束" },
        ],
        edges: [
          { id: "me1", source: "m1", target: "m2" },
          { id: "me2", source: "m2", target: "m3" },
          { id: "me3", source: "m3", target: "m4" },
        ],
      },
      dataRequirements: {
        datasetId: "ds_2",
        requiredFields: ["user_input", "bot_response", "response_time"],
        dataCollectionPoints: ["m2"],
      },
      resourceRequirements: {
        personnel: [
          { role: "评估员", count: 2 },
          { role: "技术支持", count: 1 },
        ],
        equipment: [
          { type: "server", spec: "16核32G", count: 1 },
          { type: "simulation_terminal", spec: "", count: 3 },
        ],
        baseDatasets: ["user_profile_dataset"],
      },
    },
  },
];

module.exports = [
  {
    url: "/api/templates",
    type: "get",
    response: () => {
      return {
        code: 200,
        msg: "success",
        data: templates,
      };
    },
  },
  {
    url: "/api/templates",
    type: "post",
    response: (req) => {
      const body = req.body || {};
      const id = body.id || `tpl_${Math.floor(Math.random() * 100000)}`;
      const item = {
        id,
        name: body.name || "未命名模板",
        type: body.type || "static_evaluation",
        description: body.description || "",
        createdAt: Date.now(),
        content: body.content || {},
      };
      templates.unshift(item);
      return { code: 200, msg: "created", data: item };
    },
  },
  {
    url: "/api/templates/\\w+",
    type: "delete",
    response: (req) => {
      const id = req.path.split("/").pop();
      const idx = templates.findIndex((t) => t.id === id);
      if (idx !== -1) templates.splice(idx, 1);
      return { code: 200, msg: "deleted" };
    },
  },
];


