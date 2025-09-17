const tasks = [
  { id: 'tg_1', name: 'XX国关于婚姻法造谣反驳', summary: '针对XX国婚姻法相关谣言进行识别与权威反驳' },
  { id: 'tg_2', name: 'XX国经济数据误读澄清', summary: '识别并澄清关于XX国经济数据的误读和虚假信息' },
  { id: 'tg_3', name: 'XX国科技政策正面引导', summary: '在科技政策舆论中进行正向价值观引导' },
  { id: 'tg_4', name: '多平台一致性信息宣传政策正向解读', summary: '确保在各大平台发布的信息内容一致且符合政策要求' },
]

const targetToSubtasks = {
  tg_1: [
    { id: 'st_1_1', name: '议题分析', summary: '识别核心议题与潜在冲突点' },
    { id: 'st_1_2', name: '引导话术生成', summary: '生成正向价值观引导话术' },
    { id: 'st_1_3', name: '对话跟进', summary: '多轮对话中持续保持引导方向' },
  ],
  tg_2: [
    { id: 'st_2_1', name: '虚假信息识别', summary: '检测并标记不实内容' },
    { id: 'st_2_2', name: '证据检索', summary: '检索可靠来源作为支撑' },
    { id: 'st_2_3', name: '反驳生成', summary: '结构化、礼貌且有说服力的反驳' },
  ],
  tg_3: [
    { id: 'st_3_1', name: '情感识别', summary: '识别用户情绪与态度' },
    { id: 'st_3_2', name: '风格适配', summary: '根据用户画像调整回答风格' },
    { id: 'st_3_3', name: '体验评价收集', summary: '收集并量化用户反馈' },
  ],
  tg_4: [
    { id: 'st_4_1', name: '账号画像匹配', summary: '确保输出风格与账号画像一致' },
    { id: 'st_4_2', name: '多平台格式适配', summary: '自动满足各平台长度/格式/频率要求' },
    { id: 'st_4_3', name: '发布监控', summary: '监控发布成功率与互动数据' },
  ],
}

function likeIncludes(text = '', kw = '') {
  return String(text).toLowerCase().includes(String(kw || '').toLowerCase())
}

module.exports = [
  // 任务目标列表（评估对象关联）
  {
    url: '/requirements/tasks',
    type: 'get',
    response(config) {
      const { keyword = '', page = 1, pageSize = 20 } = config.query || {}
      const filtered = tasks.filter(
        (t) => likeIncludes(t.name, keyword) || likeIncludes(t.summary, keyword)
      )
      const p = Number(page) || 1
      const ps = Number(pageSize) || 20
      const start = (p - 1) * ps
      const end = start + ps
      const list = filtered.slice(start, end)
      return {
        code: 200,
        msg: 'success',
        data: { list, total: filtered.length },
      }
    },
  },

  // 子任务列表（按目标过滤）
  {
    url: '/requirements/subtasks',
    type: 'get',
    response(config) {
      const { keyword = '', targetId = '', page = 1, pageSize = 20 } = config.query || {}
      const all = targetToSubtasks[targetId] || []
      const filtered = all.filter(
        (t) => likeIncludes(t.name, keyword) || likeIncludes(t.summary, keyword)
      )
      const p = Number(page) || 1
      const ps = Number(pageSize) || 20
      const start = (p - 1) * ps
      const end = start + ps
      const list = filtered.slice(start, end)
      return {
        code: 200,
        msg: 'success',
        data: { list, total: filtered.length },
      }
    },
  },
]


