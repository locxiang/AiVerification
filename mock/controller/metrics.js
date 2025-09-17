const { mock } = require('mockjs')

// 依据 docs/指标系统.md 构造 三级指标树（一级-二级-三级），并给出适用评估方式
const metricTree = [
  {
    id: 'L1',
    name: '交互理解能力',
    children: [
      {
        id: 'L1-1',
        name: '意图识别',
        children: [
          { id: 'L1-1-1', name: '输入核心意图识别准确率', evalTypes: ['static','dynamic','interactive'], desc: '命中正确意图数/样本总数。静态使用标注样本，动态用实时对话日志抽样，互动由人工验证。' },
          { id: 'L1-1-2', name: '模糊意图解析成功率', evalTypes: ['static','dynamic','interactive'], desc: '成功解析模糊表达的次数/模糊样本总数。结合召回规则与语义消歧评分阈值。' },
          { id: 'L1-1-3', name: '多轮对话上下文意图连贯性识别率', evalTypes: ['static','dynamic','interactive'], desc: '上下轮意图一致或合理转移的会话数/总会话数，需判定对话状态机的转移合法性。' },
          { id: 'L1-1-4', name: '恶意用户/水军识别率', evalTypes: ['static','dynamic','interactive'], desc: '正确识别的恶意/水军账号或消息数/该类样本总数；结合黑名单特征与行为模式。' },
          { id: 'L1-1-5', name: '无效无意义信息识别率', evalTypes: ['static','dynamic','interactive'], desc: '正确识别垃圾/无意义消息数/该类样本总数；依据文本质量评分阈值判定。' },
        ],
      },
      {
        id: 'L1-2',
        name: '响应质量',
        children: [
          { id: 'L1-2-1', name: '响应内容与用户意图匹配度', evalTypes: ['static','dynamic','interactive'], desc: '人工或模型判分的相关性得分均值；或Top-1 意图覆盖率。' },
          { id: 'L1-2-2', name: '无冗余/错误调用验证服务', evalTypes: ['static','dynamic','interactive'], desc: '错误或冗余外部调用次数/总调用次数的反比，1 - (错误+冗余)/总次数。' },
          { id: 'L1-2-3', name: '响应延迟时间（平均时长，≤X秒）', evalTypes: ['static','dynamic','interactive'], desc: '端到端平均响应时长P50/P95；从请求进入到完成返回。' },
        ],
      },
      {
        id: 'L1-3',
        name: '多模态协同',
        children: [
          { id: 'L1-3-1', name: '多模态内容识别准确率', evalTypes: ['static','dynamic','interactive'], desc: '正确识别的多模态样本数/多模态样本总数；图文/图表/视频帧均计入。' },
          { id: 'L1-3-2', name: '多模态内容多种结合识别率（图片/文字/视频组合）', evalTypes: ['static','dynamic','interactive'], desc: '在多模态融合任务中判定为“结合成功”的比例；依据任务得分≥阈值。' },
        ],
      },
      {
        id: 'L1-4',
        name: '情感共鸣',
        children: [
          { id: 'L1-4-1', name: '用户言论情感识别准确率', evalTypes: ['static','dynamic','interactive'], desc: '正确情感类别的样本数/标注样本总数；情感类别含正/负/中立等。' },
        ],
      },
    ],
  },
  {
    id: 'L2',
    name: '内容生成能力',
    children: [
      {
        id: 'L2-1',
        name: '内容匹配度',
        children: [
          { id: 'L2-1-1', name: '生成内容与任务需求核心要素覆盖率', evalTypes: ['static','dynamic','interactive'], desc: '覆盖的关键要素数/应覆盖要素总数；要素表来自任务模板。' },
          { id: 'L2-1-2', name: '复杂度需求（多需求）的内容适配率', evalTypes: ['static','dynamic','interactive'], desc: '满足多子目标的次数/多目标样本总数；按加权评分≥阈值判为满足。' },
          { id: 'L2-1-3', name: '语言适配度（中文/英语/日语等）', evalTypes: ['static','dynamic','interactive'], desc: '目标语言自动检测为正确的比例，或多语言BLEU/ChrF 得分≥阈值。' },
          { id: 'L2-1-4', name: '内容精简高效', evalTypes: ['static','dynamic','interactive'], desc: '在可读性/冗余度模型下的压缩率与信息保真度的综合得分。' },
        ],
      },
      {
        id: 'L2-2',
        name: '内容独创性',
        children: [
          { id: 'L2-2-1', name: '生成内容重复率', evalTypes: ['static','dynamic','interactive'], desc: '与参考库的相似度>阈值的片段占比；越低越好。' },
          { id: 'L2-2-2', name: '内容多样性（文字/表情包/图片）', evalTypes: ['static','dynamic','interactive'], desc: '在多模态输出的类型覆盖计数/可能类型数；或多样性指数。' },
          { id: 'L2-2-3', name: '新观点/新案例生成频率', evalTypes: ['static','dynamic','interactive'], desc: '被标注为“新颖”的输出次数/总输出次数；基于人工或新颖性模型。' },
        ],
      },
      {
        id: 'L2-3',
        name: '内容合规性',
        children: [
          { id: 'L2-3-1', name: '敏感信息/平台违规生成率', evalTypes: ['static','dynamic','interactive'], desc: '被合规模型或人工标注为违规的比例；越低越好。' },
          { id: 'L2-3-2', name: '事实性/逻辑性错误出现频率', evalTypes: ['static','dynamic','interactive'], desc: '事实核查失败或逻辑一致性检测失败的次数/总输出次数。' },
          { id: 'L2-3-3', name: '价值观正向性达标率', evalTypes: ['static','dynamic','interactive'], desc: '正向价值观评分≥阈值的比例；依据价值观评价模型。' },
        ],
      },
    ],
  },
  {
    id: 'L3',
    name: '环境适应能力',
    children: [
      {
        id: 'L3-1',
        name: '场景适配',
        children: [
          { id: 'L3-1-1', name: '特定媒体账号背景匹配度', evalTypes: ['static','dynamic','interactive'], desc: '输出风格与账号画像相似度；基于风格向量余弦相似度≥阈值。' },
          { id: 'L3-1-2', name: '场景特征匹配度（地点/时间/人物/事件）', evalTypes: ['static','dynamic','interactive'], desc: '场景四要素抽取并匹配成功的项数/应匹配项数。' },
          { id: 'L3-1-3', name: '媒体账号切换成功率', evalTypes: ['dynamic','interactive'], desc: '账号上下文切换后仍匹配画像的比例；切换后前K次输出评分均≥阈值判定成功。' },
        ],
      },
      {
        id: 'L3-2',
        name: '平台兼容',
        children: [
          { id: 'L3-2-1', name: '主流社交平台功能完整运行率', evalTypes: ['dynamic'], desc: '在各平台核心功能用例通过次数/用例总数。' },
          { id: 'L3-2-2', name: '平台规则自动适配率', evalTypes: ['dynamic'], desc: '平台约束（长度/格式/频率）自动满足的请求数/总请求数。' },
          { id: 'L3-2-3', name: '支持平台多种能力（评论/发帖/私信等）', evalTypes: ['dynamic'], desc: '已打通的能力项数/目标能力项数；或成功调用率。' },
        ],
      },
      {
        id: 'L3-3',
        name: '动态响应',
        children: [
          { id: 'L3-3-1', name: '实时信息整合响应时效（新闻/实时事件）', evalTypes: ['dynamic','interactive'], desc: '从事件出现到生成包含有效事实的响应所需时长P50/P95。' },
          { id: 'L3-3-2', name: '平台机器验证处理成功率', evalTypes: ['dynamic'], desc: '验证码/二次校验自动处理成功次数/触发次数。' },
          { id: 'L3-3-3', name: '故障自动恢复（网络/封号/封IP）', evalTypes: ['dynamic'], desc: '自动恢复流程成功收敛的比例；含重试/切换/降级。' },
        ],
      },
    ],
  },
  {
    id: 'L4',
    name: '任务完成价值',
    children: [
      {
        id: 'L4-1',
        name: '目标引导',
        children: [
          { id: 'L4-1-1', name: '任务核心需求一次性完成率', evalTypes: ['static','dynamic','interactive'], desc: '无需追问即可完成核心目标的任务数/任务总数。' },
          { id: 'L4-1-2', name: '网友二次沟通发生率', evalTypes: ['dynamic'], desc: '需要追加沟通的会话数/总会话数；越低越好。' },
          { id: 'L4-1-3', name: '网友对沟通的信服度', evalTypes: ['dynamic','interactive'], desc: '沟通后满意/信服评价为正向的比例；问卷或点赞率等。' },
        ],
      },
      {
        id: 'L4-2',
        name: '网友粘性',
        children: [
          { id: 'L4-2-1', name: '单次交互平均时长（分钟）', evalTypes: ['static','dynamic','interactive'], desc: '会话平均持续时间；P50/P95。' },
          { id: 'L4-2-2', name: '网友主动发起交互频率', evalTypes: ['dynamic'], desc: '单位时间内主动发起互动的次数/活跃用户数。' },
        ],
      },
      {
        id: 'L4-3',
        name: '传播价值',
        children: [
          { id: 'L4-3-1', name: '内容点赞/收藏/转发数', evalTypes: ['dynamic'], desc: '互动总量或加权互动指数（赞/藏/转发加权求和）。' },
          { id: 'L4-3-2', name: '内容评论数', evalTypes: ['dynamic'], desc: '单位时间评论总数或有效评论数。' },
        ],
      },
      {
        id: 'L4-4',
        name: '附加价值',
        children: [
          { id: 'L4-4-1', name: '网友获得的有效信息（科普、事实等）', evalTypes: ['static','dynamic','interactive'], desc: '答案中“有效信息段落”的占比或质量评分均值。' },
        ],
      },
    ],
  },
  {
    id: 'L5',
    name: '系统保障能力',
    children: [
      {
        id: 'L5-1',
        name: '运行稳定',
        children: [
          { id: 'L5-1-1', name: '日均无故障运行时长', evalTypes: ['static','dynamic','interactive'], desc: 'MTBF 或日均无故障小时数；越高越好。' },
          { id: 'L5-1-2', name: '系统崩溃/卡顿发生频率', evalTypes: ['static','dynamic','interactive'], desc: '崩溃/卡顿事件数/运行总时长；越低越好。' },
          { id: 'L5-1-3', name: '资源（CPU/GPU/内存）占用峰值', evalTypes: ['static','dynamic','interactive'], desc: '关键资源峰值占用率，记录P95/P99 峰值。' },
        ],
      },
    ],
  },
]

// 展平成列表用于搜索/筛选
function flattenMetrics(tree) {
  const list = []
  const walk = (nodes, level = 1, parents = []) => {
    nodes.forEach((node) => {
      const current = { id: node.id, name: node.name, level, parents: parents.map(p => ({ id: p.id, name: p.name })) }
      if (node.children && node.children.length) {
        walk(node.children, level + 1, [...parents, current])
      } else {
        current.evalTypes = node.evalTypes || []
        list.push(current)
      }
    })
  }
  walk(tree)
  return list
}

const flatList = flattenMetrics(metricTree)

module.exports = [
  {
    url: '/metrics/tree',
    type: 'get',
    response() {
      return {
        code: 200,
        msg: 'success',
        data: metricTree,
      }
    },
  },
  {
    url: '/metrics/list',
    type: 'get',
    response(config) {
      const { name = '', evalType = '' } = config.query || {}
      console.log('Mock metrics/list 被调用，参数:', { name, evalType })
      console.log('flatList 长度:', flatList.length)
      let data = flatList
      if (name) {
        data = data.filter((m) => m.name.includes(name))
      }
      if (evalType) {
        data = data.filter((m) => (m.evalTypes || []).includes(evalType))
      }
      console.log('过滤后的数据长度:', data.length)
      const result = {
        code: 200,
        msg: 'success',
        totalCount: data.length,
        data,
      }
      console.log('返回结果:', result)
      return result
    },
  },
]


