import request from "@/utils/request";

export function getTemplates(params) {
  return request({ url: "/api/templates", method: "get", params });
}

export function createTemplate(data) {
  return request({ url: "/api/templates", method: "post", data });
}

export function deleteTemplate(id) {
  return request({ url: `/api/templates/${id}`, method: "delete" });
}


