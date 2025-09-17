import request from '@/utils/request'

// 后端 node 依赖：通过 axios 封装的 request（已有）
// 前端 vue 依赖：本模块仅导出 API 函数供组件调用

export function fetchMetricTree() {
  return request({
    url: '/metrics/tree',
    method: 'get',
  })
}

export function fetchMetricList(params) {
  return request({
    url: '/metrics/list',
    method: 'get',
    params,
  })
}


