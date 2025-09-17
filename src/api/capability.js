import request from "@/utils/request";

// 能力评估体系：只读接口
export function getCapabilitySystems(params) {
  return request({ url: "/api/capabilities/systems", method: "get", params });
}

export function getCapabilitySystemDetail(id) {
  return request({ url: `/api/capabilities/systems/${id}`, method: "get" });
}


