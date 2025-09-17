const { Random } = require("mockjs");

const makeTask = (i) => ({
  id: i,
  name: `任务-${i}`,
  planId: Math.ceil(i / 2),
  planName: `方案-${Math.ceil(i / 2)}`,
  status: ["pending", "running", "failed"][i % 3],
  createdAt: Random.datetime(),
});

let tasks = Array.from({ length: 15 }).map((_, i) => makeTask(i + 1));

module.exports = [
  {
    url: "/api/tasks",
    type: "get",
    response: (req) => {
      const keyword = (req.query.keyword || "").toLowerCase();
      const data = tasks.filter(
        (t) => String(t.id).includes(keyword) || t.name.toLowerCase().includes(keyword)
      );
      return { code: 200, data, message: "ok" };
    },
  },
  {
    url: "/api/tasks",
    type: "post",
    response: (req) => {
      const id = tasks.length ? tasks[tasks.length - 1].id + 1 : 1;
      const { planId, concurrency } = req.body || {};
      const task = {
        id,
        name: `任务-${id}`,
        planId,
        planName: `方案-${planId}`,
        status: "pending",
        concurrency,
        createdAt: Random.datetime(),
      };
      tasks.push(task);
      return { code: 200, data: task, message: "created" };
    },
  },
  {
    url: "/api/tasks/:id",
    type: "get",
    response: (req) => {
      const id = Number((req.params && req.params.id) || (req.path.match(/\d+/) || [null])[0]);
      const task = tasks.find((t) => t.id === id) || null;
      return { code: 200, data: task, message: "ok" };
    },
  },
  {
    url: "/api/tasks/:id/start",
    type: "post",
    response: (req) => {
      const id = Number((req.params && req.params.id) || (req.path.match(/\d+/) || [null])[0]);
      const task = tasks.find((t) => t.id === id);
      if (task) task.status = "running";
      return { code: 200, data: task, message: "started" };
    },
  },
  {
    url: "/api/tasks/:id/stop",
    type: "post",
    response: (req) => {
      const id = Number((req.params && req.params.id) || (req.path.match(/\d+/) || [null])[0]);
      const task = tasks.find((t) => t.id === id);
      if (task) task.status = "pending";
      return { code: 200, data: task, message: "stopped" };
    },
  },
];


