/**
 * @author https://github.com/zxwk1998/vue-admin-better （不想保留author可删除）
 * @description router全局配置，如有必要可分文件抽离，其中asyncRoutes只有在intelligence模式下才会用到，vip文档中已提供路由的基础图标与小清新图标的配置方案，请仔细阅读
 */

import { createRouter, createWebHashHistory } from "vue-router";
import Layout from "@/layouts/index.vue";
import EmptyLayout from "@/layouts/EmptyLayout.vue";
import { publicPath } from "@/config";

export const constantRoutes = [
  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    hidden: true,
  },
  {
    path: "/register",
    component: () => import("@/views/register/index.vue"),
    hidden: true,
  },
  {
    path: "/401",
    name: "401",
    component: () => import("@/views/401.vue"),
    hidden: true,
  },
  {
    path: "/404",
    name: "404",
    component: () => import("@/views/404.vue"),
    hidden: true,
  },
];

export const asyncRoutes = [
  {
    path: "/",
    component: Layout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: {
          title: "仪表盘",
          icon: "chart-pie",
          affix: true,
        },
      },
    ],
  },
  {
    path: "/capability",
    component: Layout,
    redirect: "/capability/list",
    name: "Capability",
    alwaysShow: true,
    meta: { title: "能力评估体系管理", icon: "sitemap" },
    children: [
      {
        path: "list",
        name: "CapabilitySystemsList",
        component: () => import("@/views/capability/list.vue"),
        meta: { title: "体系列表" },
      },
      {
        path: ":id",
        name: "CapabilitySystemDetail",
        component: () => import("@/views/capability/detail.vue"),
        hidden: true,
        meta: { title: "体系详情", activeMenu: "/capability/list" },
      },
    ],
  },
  // 试验方案管理（沿用 experiments 下页面作为实现，后续可迁移文件路径）
  {
    path: "/plans",
    component: Layout,
    redirect: "/plans/list",
    name: "Plans",
    meta: {
      title: "试验方案管理",
      icon: "file-alt",
    },
    children: [
      {
        path: "list",
        name: "PlanList",
        component: () => import("@/views/plans/list.vue"),
        meta: {
          title: "方案列表",
        },
      },
      {
        path: "new",
        name: "PlanNew",
        component: () => import("@/views/plans/new/index.vue"),
        meta: {
          title: "新建方案",
        },
      },
      {
        path: "templates",
        name: "PlanTemplates",
        component: () => import("@/views/plans/templates.vue"),
        meta: {
          title: "模板管理",
        },
      },
      {
        path: ":id/overview",
        name: "PlanOverview",
        component: () => import("@/views/plans/overview.vue"),
        hidden: true,
        meta: {
          title: "方案概览",
          activeMenu: "/plans/list",
        },
      },
      {
        path: ":id/metrics",
        name: "PlanMetrics",
        component: () => import("@/views/plans/metrics.vue"),
        hidden: true,
        meta: {
          title: "方案指标",
          activeMenu: "/plans/list",
        },
      },
      {
        path: ":id/run",
        name: "PlanRun",
        component: () => import("@/views/plans/run.vue"),
        hidden: true,
        meta: {
          title: "方案运行",
          activeMenu: "/plans/list",
        },
      },
      {
        path: ":id/results",
        name: "PlanResults",
        component: () => import("@/views/plans/results.vue"),
        hidden: true,
        meta: {
          title: "方案结果",
          activeMenu: "/plans/list",
        },
      },
    ],
  },
  // 试验任务管理
  {
    path: "/tasks",
    component: Layout,
    redirect: "/tasks/list",
    name: "Tasks",
    meta: { title: "试验运行管理", icon: "list-ul" },
    children: [
      {
        path: ":id",
        name: "TaskDetail",
        component: () => import("@/views/tasks/detail.vue"),
        hidden: true,
        meta: { title: "任务详情", activeMenu: "/tasks/list" },
      },
      {
        path: "runs",
        name: "TaskRuns",
        component: () => import("@/views/runs/index.vue"),
        meta: { title: "运行记录" },
      },
      {
        path: "pump",
        name: "DataPump",
        component: () => import("@/views/tasks/pump.vue"),
        meta: { title: "数据泵状态" },
      },
    ],
  },
  // 数据集管理
  {
    path: "/datasets",
    component: Layout,
    redirect: "/datasets/list",
    meta: {
      title: "数据集管理",
      icon: "database",
    },
    children: [
      {
        path: "list",
        name: "DatasetsList",
        component: () => import("@/views/datasets/list.vue"),
        meta: { title: "数据集列表" },
      },
      {
        path: "create",
        name: "DatasetCreate",
        component: () => import("@/views/datasets/create.vue"),
        meta: { title: "新增数据集" },
      },
      {
        path: "changes",
        name: "DatasetChanges",
        component: () => import("@/views/datasets/changes.vue"),
        meta: { title: "变更记录" },
      },
      {
        path: ":id",
        name: "DatasetDetail",
        component: () => import("@/views/datasets/detail.vue"),
        hidden: true,
        meta: { title: "数据集详情", activeMenu: "/datasets/list" },
      },
    ],
  },
  {
    path: "/metrics",
    component: Layout,
    children: [
      {
        path: "",
        name: "MetricsLibrary",
        component: () => import("@/views/metrics/index.vue"),
        meta: {
          title: "指标查看",
          icon: "chart-line",
        },
      },
    ],
  },
  // 系统相关（系统设置、控制枢纽终端）
  {
    path: "/system",
    component: Layout,
    redirect: "/system/settings",
    meta: { title: "系统相关", icon: "cog" },
    children: [

      // 权限管理
      {
        path: "permissions",
        name: "Permissions",
        component: () => import("@/views/vab/permissions.vue"),
        meta: { title: "权限管理", icon: "shield" },
      },
      {
        path: "terminal",
        name: "Terminal",
        component: () => import("@/views/terminal/index.vue"),
        meta: { title: "控制枢纽终端", icon: "code" },
      },
    ],
  },

  /* {
    path: "/test",
    component: Layout,
    redirect: "noRedirect",
    children: [
      {
        path: "test",
        name: "Test",
        component: () => import("@/views/test/index"),
        meta: {
          title: "test",
          icon: "marker",
          permissions: ["admin"],
        },
      },
    ],
  }, */

  {
    path: "/vab",
    component: Layout,
    redirect: "noRedirect",
    name: "Vab",
    alwaysShow: true,
    hidden: true,
    meta: { title: "其他组件", icon: "box-open", defaultOpen: true },
    children: [
      {
        path: "vue3Demo",
        name: "Vue3Demo",
        component: () => import("@/views/vab/vue3Demo/index.vue"),
        meta: {
          title: "Vue 3 示例",
          permissions: ["admin"],
        },
      },
      {
        path: "table",
        name: "Table",
        component: () => import("@/views/vab/table.vue"),
        meta: {
          title: "表格",
          permissions: ["admin"],
        },
      },
      {
        path: "tree",
        name: "Tree",
        component: () => import("@/views/vab/tree.vue"),
        meta: {
          title: "树形控件",
          permissions: ["admin"],
        },
      },
      {
        path: "icon",
        name: "Icon",
        component: () => import("@/views/vab/icon.vue"),
        meta: {
          title: "图标",
          permissions: ["admin"],
        },
      },
      {
        path: "form",
        name: "Form",
        component: () => import("@/views/vab/form.vue"),
        meta: {
          title: "表单",
          permissions: ["admin"],
        },
      },
      {
        path: "chart",
        name: "Chart",
        component: () => import("@/views/vab/chart.vue"),
        meta: {
          title: "图表",
          permissions: ["admin"],
        },
      },

      {
        path: "nested",
        component: () => import("@/views/vab/nested.vue"),
        name: "Nested",
        redirect: "/vab/nested/menu1",
        meta: {
          title: "嵌套路由",
          permissions: ["admin"],
        },
        children: [
          {
            path: "menu1",
            component: () => import("@/views/vab/nested/menu1.vue"),
            name: "Menu1",
            redirect: "/vab/nested/menu1/menu2",
            meta: { title: "一级菜单" },
            children: [
              {
                path: "menu2",
                component: () => import("@/views/vab/nested/menu1/menu2.vue"),
                name: "Menu2",
                redirect: "/vab/nested/menu1/menu2/menu3",
                meta: { title: "二级菜单" },
                children: [
                  {
                    path: "menu3",
                    component: () => import("@/views/vab/nested/menu1/menu2/menu3.vue"),
                    name: "Menu3",
                    meta: { title: "三级菜单" },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "editor",
        name: "Editor",
        component: () => import("@/views/vab/editor.vue"),
        meta: {
          title: "富文本编辑器",
          permissions: ["admin"],
        },
      },
      {
        path: "upload",
        name: "Upload",
        component: () => import("@/views/vab/upload.vue"),
        meta: {
          title: "文件上传",
          permissions: ["admin"],
        },
      },
      {
        path: "settings",
        name: "Settings",
        component: () => import("@/views/vab/settings.vue"),
        meta: {
          title: "系统设置",
          permissions: ["admin"],
        },
      },
      {
        path: "notification",
        name: "Notification",
        component: () => import("@/views/vab/notification.vue"),
        meta: {
          title: "通知中心",
          permissions: ["admin"],
        },
      },
      {
        path: "calendar",
        name: "Calendar",
        component: () => import("@/views/vab/calendar.vue"),
        meta: {
          title: "日历",
          permissions: ["admin"],
        },
      },
      {
        path: "task",
        name: "Task",
        component: () => import("@/views/vab/task.vue"),
        meta: {
          title: "任务管理",
          permissions: ["admin"],
        },
      },
      {
        path: "statistics",
        name: "Statistics",
        component: () => import("@/views/vab/statistics.vue"),
        meta: {
          title: "数据统计",
          permissions: ["admin"],
        },
      },
      {
        path: "help",
        name: "Help",
        component: () => import("@/views/vab/help.vue"),
        meta: {
          title: "帮助中心",
          permissions: ["admin"],
        },
      },
      {
        path: "project",
        name: "Project",
        component: () => import("@/views/vab/project.vue"),
        meta: {
          title: "项目管理",
          permissions: ["admin"],
        },
      },
      {
        path: "team",
        name: "Team",
        component: () => import("@/views/vab/team.vue"),
        meta: {
          title: "团队管理",
          permissions: ["admin"],
        },
      },
      {
        path: "workflow",
        name: "Workflow",
        component: () => import("@/views/vab/workflow.vue"),
        meta: {
          title: "工作流",
          permissions: ["admin"],
        },
      },
      {
        path: "knowledge",
        name: "Knowledge",
        component: () => import("@/views/vab/knowledge.vue"),
        meta: {
          title: "知识库",
          permissions: ["admin"],
        },
      },
      {
        path: "customer",
        name: "Customer",
        component: () => import("@/views/vab/customer.vue"),
        meta: {
          title: "客户管理",
          permissions: ["admin"],
        },
      },
      {
        path: "product",
        name: "Product",
        component: () => import("@/views/vab/product.vue"),
        meta: {
          title: "产品管理",
          permissions: ["admin"],
        },
      },
      {
        path: "order",
        name: "Order",
        component: () => import("@/views/vab/order.vue"),
        meta: {
          title: "订单管理",
          permissions: ["admin"],
        },
      },
      // {
      //   path: "campaign",
      //   name: "Campaign",
      //   component: () => import("@/views/vab/campaign.vue"),
      //   meta: {
      //     title: "营销活动",
      //     permissions: ["admin"],
      //   },
      // },
    ],
  },
  {
    path: "/error",
    component: EmptyLayout,
    redirect: "noRedirect",
    name: "Error",
    hidden: true,
    meta: { title: "错误页", icon: "bug" },
    children: [
      {
        path: "401",
        name: "Error401",
        component: () => import("@/views/401"),
        meta: { title: "401" },
      },
      {
        path: "404",
        name: "Error404",
        component: () => import("@/views/404"),
        meta: { title: "404" },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/404",
    hidden: true,
  },
];

const router = createRouter({
  history: createWebHashHistory(publicPath),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

export function resetRouter() {
  // 注意：所有动态路由路由必须带有name属性，否则可能会不能完全重置干净
  try {
    router.getRoutes().forEach((route) => {
      const { name } = route;
      if (name && name !== "Login") {
        router.hasRoute(name) && router.removeRoute(name);
      }
    });
  } catch {
    // 强制刷新浏览器，不要用这种方式
    window.location.reload();
  }
}

export default router;
