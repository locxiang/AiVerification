import request from "@/utils/request";

export function getPumpStatus() {
  return request({ url: "/api/pump/status", method: "get" });
}


