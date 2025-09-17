import request from "@/utils/request";

export function getTasks(params) {
  return request({ url: "/api/tasks", method: "get", params });
}

export function getTaskDetail(id) {
  return request({ url: `/api/tasks/${id}`, method: "get" });
}

export function createTaskFromPlan(data) {
  return request({ url: "/api/tasks", method: "post", data });
}

export function startTask(id) {
  return request({ url: `/api/tasks/${id}/start`, method: "post" });
}

export function stopTask(id) {
  return request({ url: `/api/tasks/${id}/stop`, method: "post" });
}


