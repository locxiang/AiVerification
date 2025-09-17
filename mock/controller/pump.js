const { Random } = require("mockjs")

// Pump“内存状态”
const PUMP_STATE = {
  connections: 5,
  backlog: 12,
  heartbeat: new Date().toISOString(),
  errorsLastHour: Array.from({ length: 12 }).map(() => Math.floor(Math.random() * 5)),
  // 最近若干条日志（环形缓冲）
  logs: [],
}

module.exports = [
  {
    url: "/api/pump/status",
    type: "get",
    response: () => {
      // 轻微更新心跳/误差，模拟时序流动
      PUMP_STATE.heartbeat = new Date().toISOString()
      PUMP_STATE.errorsLastHour.shift()
      PUMP_STATE.errorsLastHour.push(Math.floor(Math.random() * 5))
      // 动态生成进行中的任务
      const runningCount = Random.integer(1, 3)
      const runningTasks = Array.from({ length: runningCount }).map(() => {
        const id = Random.integer(100, 999)
        const planId = Random.integer(1, 20)
        return {
          id,
          name: `任务-${id}`,
          planId,
          planName: `方案-${planId}`,
          progress: Number((Math.random()).toFixed(2)),
          status: "running",
        }
      })

      // 动态生成对接数据集
      const datasetCount = Random.integer(2, 4)
      const datasetSources = ["crawler", "social-bot", "api", "stream"]
      const datasets = Array.from({ length: datasetCount }).map((_, i) => {
        const id = `ds_${Random.word(4, 8)}`
        return {
          id,
          name: `${Random.cword(2, 4)}数据集${i + 1}`,
          source: datasetSources[Random.integer(0, datasetSources.length - 1)],
          docs: Random.integer(1_000, 200_000),
        }
      })

      // 日志滚动，混入 info/warn 级别
      const logSamples = [
        "心跳正常",
        `拉取 ${Random.integer(50, 300)} 条`,
        "重试成功，恢复正常",
        `解析 ${Random.integer(10, 60)} 篇文档`,
        "队列空闲，等待新任务",
      ]
      const newLog = {
        ts: new Date().toISOString(),
        level: Math.random() < 0.12 ? "warn" : "info",
        msg: logSamples[Random.integer(0, logSamples.length - 1)],
      }
      PUMP_STATE.logs.push(newLog)
      if (PUMP_STATE.logs.length > 30) PUMP_STATE.logs.shift()
      return {
        code: 200,
        data: {
          ...PUMP_STATE,
          runningTasks,
          datasets,
        },
        message: "ok",
      }
    },
  },
]

