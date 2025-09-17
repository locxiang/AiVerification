// 能力体系“内存数据库”
const capabilitySystems = [
  {
    id: 'SYS-20241001',
    name: '南海争端认知战能力体系',
    owner: '国家战略研究中心',
    updatedAt: '2024-10-01 08:00:00',
    purpose: '提升国庆期间对南海争端相关舆论的引导与认知防护能力',
    task: '围绕国庆节点，开展南海争端相关信息监测、溯源、引导与反制等多维度认知作战任务',
    goal: '实现对南海争端相关负面舆情的有效识别、快速响应与正面引导，确保国庆期间网络空间安全稳定',
    scenario: '国庆期间，针对南海争端热点事件，模拟多平台（微博、抖音、微信公众号等）舆情扩散与应对',
    scenarioType: '舆论斗争场景',
    staffing: '指挥组1名，分析师3名，技术支持2名，舆情引导专员2名',
    subtasks: [
      {
        id: 'ST-20241001-1',
        name: '子任务一：舆情监测与预警',
        description: '实时监测南海争端相关舆情动态，识别敏感信息并预警',
        capabilities: [
          {
            id: 'CAP-20241001-1',
            name: '敏感信息识别能力',
            metrics: [
              {
                code: 'M-RECALL',
                name: '敏感信息召回率',
                function: {
                  name: 'recall',
                  description: '召回率 = TP / (TP + FN)',
                  params: [
                    { name: 'tp', type: 'number', description: '真正例数' },
                    { name: 'fn', type: 'number', description: '漏检数' },
                  ],
                  returns: { type: 'number', description: '召回率，范围 0-1' },
                  body: '(tp, fn) => { const d = (Number(tp)||0) + (Number(fn)||0); return d ? (Number(tp)||0) / d : 0 }',
                },
              },
              {
                code: 'M-PRECISION',
                name: '误报率',
                function: {
                  name: 'falsePositiveRate',
                  description: '误报率 = FP / (FP + TN)',
                  params: [
                    { name: 'fp', type: 'number', description: '假正例数（误报数）' },
                    { name: 'tn', type: 'number', description: '真负例数' },
                  ],
                  returns: { type: 'number', description: '误报率，范围 0-1' },
                  body: '(fp, tn) => { const d = (Number(fp)||0) + (Number(tn)||0); return d ? (Number(fp)||0) / d : 0 }',
                },
              },
            ],
          },
          {
            id: 'CAP-20241001-2',
            name: '舆情热度分析能力',
            metrics: [
              {
                code: 'M-HOT',
                name: '热点事件响应时效',
                function: {
                  name: 'responseLatencySeconds',
                  description: '响应时效（秒）= respondedAt - eventDetectedAt',
                  params: [
                    { name: 'eventDetectedAt', type: 'string|number|Date', description: '事件检测时间' },
                    { name: 'respondedAt', type: 'string|number|Date', description: '响应发生时间' },
                  ],
                  returns: { type: 'number', description: '时间差（秒），小于 0 时按 0' },
                  body: '(eventDetectedAt, respondedAt) => { const a = +new Date(eventDetectedAt); const b = +new Date(respondedAt); if (!Number.isFinite(a) || !Number.isFinite(b)) return 0; const d = Math.max(0, b - a); return Math.round(d / 1000) }',
                },
              },
              {
                code: 'M-TREND',
                name: '舆情趋势准确率',
                function: {
                  name: 'trendAccuracy',
                  description: '趋势准确率 = 正确预测数 / 预测总数',
                  params: [
                    { name: 'correctPredictions', type: 'number', description: '正确预测数量' },
                    { name: 'totalPredictions', type: 'number', description: '预测总数量' },
                  ],
                  returns: { type: 'number', description: '准确率，范围 0-1' },
                  body: '(correctPredictions, totalPredictions) => { const d = Number(totalPredictions)||0; return d ? (Number(correctPredictions)||0) / d : 0 }',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'ST-20241001-2',
        name: '子任务二：认知引导与反制',
        description: '针对不实信息和负面舆论，制定并实施正面引导与反制策略',
        capabilities: [
          {
            id: 'CAP-20241001-3',
            name: '正面信息扩散能力',
            metrics: [
              {
                code: 'M-POS-COV',
                name: '正面信息覆盖率',
                function: {
                  name: 'positiveCoverage',
                  description: '覆盖率 = 覆盖用户数 / 目标用户数',
                  params: [
                    { name: 'coveredUsers', type: 'number', description: '被覆盖用户数' },
                    { name: 'targetUsers', type: 'number', description: '目标用户总数' },
                  ],
                  returns: { type: 'number', description: '覆盖率，范围 0-1' },
                  body: '(coveredUsers, targetUsers) => { const d = Number(targetUsers)||0; return d ? (Number(coveredUsers)||0) / d : 0 }',
                },
              },
              {
                code: 'M-ENGAGE',
                name: '用户互动率',
                function: {
                  name: 'engagementRate',
                  description: '互动率 = 互动次数 / 展示次数',
                  params: [
                    { name: 'engagements', type: 'number', description: '互动次数（点赞/转发/评论等）' },
                    { name: 'impressions', type: 'number', description: '展示次数' },
                  ],
                  returns: { type: 'number', description: '互动率，范围 0-1' },
                  body: '(engagements, impressions) => { const d = Number(impressions)||0; return d ? (Number(engagements)||0) / d : 0 }',
                },
              },
            ],
          },
          {
            id: 'CAP-20241001-4',
            name: '谣言反制能力',
            metrics: [
              {
                code: 'M-RUMOR-BREAK',
                name: '谣言遏制时效',
                function: {
                  name: 'containLatencySeconds',
                  description: '遏制时效（秒）= containedAt - detectedAt',
                  params: [
                    { name: 'detectedAt', type: 'string|number|Date', description: '谣言检测时间' },
                    { name: 'containedAt', type: 'string|number|Date', description: '遏制完成时间' },
                  ],
                  returns: { type: 'number', description: '时间差（秒），小于 0 时按 0' },
                  body: '(detectedAt, containedAt) => { const a = +new Date(detectedAt); const b = +new Date(containedAt); if (!Number.isFinite(a) || !Number.isFinite(b)) return 0; const d = Math.max(0, b - a); return Math.round(d / 1000) }',
                },
              },
              {
                code: 'M-CLARIFY',
                name: '权威澄清传播量',
                function: {
                  name: 'clarificationTotal',
                  description: '传播量 = 多渠道计数求和',
                  params: [
                    { name: 'counts', type: 'number[]', description: '各渠道计数数组' },
                  ],
                  returns: { type: 'number', description: '总传播量' },
                  body: '(counts = []) => counts.reduce((s, v) => s + (Number(v)||0), 0)',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'SYS-20241002',
    name: '国庆重大舆情应对专项体系',
    owner: '中央网信办',
    updatedAt: '2024-10-01 09:00:00',
    purpose: '保障国庆期间重大舆情事件的快速响应与正面引导',
    task: '建立国庆期间重大舆情事件的监测、研判、响应与引导全流程机制',
    goal: '确保国庆期间重大舆情事件得到及时、有效、正面处置',
    scenario: '国庆期间，模拟突发重大舆情事件（如涉国旗、国歌、爱国主义等），多部门协同应对',
    scenarioType: '认知防御与干预场景',
    staffing: '应急指挥1名，舆情分析2名，技术支持2名，宣传专员2名',
    subtasks: [
      {
        id: 'ST-20241002-1',
        name: '子任务一：重大舆情事件监测',
        description: '对国庆期间突发重大舆情进行实时监控与分级预警',
        capabilities: [
          {
            id: 'CAP-20241002-1',
            name: '事件识别能力',
            metrics: [
              {
                code: 'M-EVENT-RECALL',
                name: '事件识别召回率',
                function: {
                  name: 'eventRecall',
                  description: '召回率 = TP / (TP + FN)',
                  params: [
                    { name: 'tp', type: 'number', description: '真正例数' },
                    { name: 'fn', type: 'number', description: '漏检数' },
                  ],
                  returns: { type: 'number', description: '召回率，范围 0-1' },
                  body: '(tp, fn) => { const d = (Number(tp)||0) + (Number(fn)||0); return d ? (Number(tp)||0) / d : 0 }',
                },
              },
              {
                code: 'M-EVENT-TIME',
                name: '识别时效',
                function: {
                  name: 'recognitionLatencySeconds',
                  description: '识别时效（秒）= recognizedAt - occurredAt',
                  params: [
                    { name: 'occurredAt', type: 'string|number|Date', description: '事件发生时间' },
                    { name: 'recognizedAt', type: 'string|number|Date', description: '识别完成时间' },
                  ],
                  returns: { type: 'number', description: '时间差（秒），小于 0 时按 0' },
                  body: '(occurredAt, recognizedAt) => { const a = +new Date(occurredAt); const b = +new Date(recognizedAt); if (!Number.isFinite(a) || !Number.isFinite(b)) return 0; const d = Math.max(0, b - a); return Math.round(d / 1000) }',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'ST-20241002-2',
        name: '子任务二：正面引导与宣传',
        description: '针对重大舆情事件，制定正面宣传方案并组织实施',
        capabilities: [
          {
            id: 'CAP-20241002-2',
            name: '正面宣传覆盖能力',
            metrics: [
              {
                code: 'M-PROP-COV',
                name: '正面宣传覆盖率',
                function: {
                  name: 'propagandaCoverage',
                  description: '覆盖率 = 覆盖人群 / 总人群',
                  params: [
                    { name: 'covered', type: 'number', description: '被覆盖人群数量' },
                    { name: 'population', type: 'number', description: '目标人群总量' },
                  ],
                  returns: { type: 'number', description: '覆盖率，范围 0-1' },
                  body: '(covered, population) => { const d = Number(population)||0; return d ? (Number(covered)||0) / d : 0 }',
                },
              },
              {
                code: 'M-PROP-IMPACT',
                name: '正面影响力指数',
                function: {
                  name: 'impactIndex',
                  description: '简单加权：0.5×分享 + 0.3×点赞 + 0.2×评论',
                  params: [
                    { name: 'shares', type: 'number', description: '分享数' },
                    { name: 'likes', type: 'number', description: '点赞数' },
                    { name: 'comments', type: 'number', description: '评论数' },
                  ],
                  returns: { type: 'number', description: '影响力指数（无量纲）' },
                  body: '(shares = 0, likes = 0, comments = 0) => 0.5 * (Number(shares)||0) + 0.3 * (Number(likes)||0) + 0.2 * (Number(comments)||0)',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'SYS-20241003',
    name: '重大政策宣示效果评估体系',
    owner: '国务院新闻办公室',
    updatedAt: '2024-10-02 10:00:00',
    purpose: '评估重大政策宣示在不同渠道和平台上的传播效果与公众认知度',
    task: '建立政策宣示的多维度传播效果监测与评估机制',
    goal: '提升政策宣示的传播效果和公众理解度，确保政策意图准确传达',
    scenario: '模拟重大政策发布后，通过传统媒体、新媒体、政务平台等多渠道的传播效果评估',
    scenarioType: '政策宣示场景',
    staffing: '政策分析师2名，传播效果评估师2名，数据分析师1名，媒体联络员1名',
    subtasks: [
      {
        id: 'ST-20241003-1',
        name: '子任务一：政策传播监测',
        description: '监测政策在不同媒体平台的传播情况',
        capabilities: [
          {
            id: 'CAP-20241003-1',
            name: '传播覆盖分析能力',
            metrics: [
              {
                code: 'M-COVERAGE',
                name: '传播覆盖率',
                function: {
                  name: 'coverageRate',
                  description: '覆盖率 = 覆盖人数 / 受众总数',
                  params: [
                    { name: 'reach', type: 'number', description: '实际覆盖人数' },
                    { name: 'totalAudience', type: 'number', description: '受众总数' },
                  ],
                  returns: { type: 'number', description: '覆盖率，范围 0-1' },
                  body: '(reach, totalAudience) => { const d = Number(totalAudience)||0; return d ? (Number(reach)||0) / d : 0 }',
                },
              },
              {
                code: 'M-REACH',
                name: '目标受众到达率',
                function: {
                  name: 'reachRate',
                  description: '到达率 = 到达人数 / 受众总数',
                  params: [
                    { name: 'reachedUsers', type: 'number', description: '到达人数' },
                    { name: 'totalAudience', type: 'number', description: '受众总数' },
                  ],
                  returns: { type: 'number', description: '到达率，范围 0-1' },
                  body: '(reachedUsers, totalAudience) => { const d = Number(totalAudience)||0; return d ? (Number(reachedUsers)||0) / d : 0 }',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'ST-20241003-2',
        name: '子任务二：公众认知评估',
        description: '评估公众对政策内容的认知和理解程度',
        capabilities: [
          {
            id: 'CAP-20241003-2',
            name: '认知度评估能力',
            metrics: [
              {
                code: 'M-AWARENESS',
                name: '政策认知度',
                function: {
                  name: 'awarenessRate',
                  description: '认知度 = 认知人数 / 调研样本数',
                  params: [
                    { name: 'awareRespondents', type: 'number', description: '表示认知的受访者数' },
                    { name: 'totalRespondents', type: 'number', description: '受访者总数' },
                  ],
                  returns: { type: 'number', description: '比例，范围 0-1' },
                  body: '(awareRespondents, totalRespondents) => { const d = Number(totalRespondents)||0; return d ? (Number(awareRespondents)||0) / d : 0 }',
                },
              },
              {
                code: 'M-UNDERSTAND',
                name: '政策理解准确率',
                function: {
                  name: 'understandingAccuracy',
                  description: '理解准确率 = 正确理解人数 / 样本数',
                  params: [
                    { name: 'correct', type: 'number', description: '正确理解人数' },
                    { name: 'total', type: 'number', description: '样本总数' },
                  ],
                  returns: { type: 'number', description: '准确率，范围 0-1' },
                  body: '(correct, total) => { const d = Number(total)||0; return d ? (Number(correct)||0) / d : 0 }',
                },
              },
            ],
          },
        ],
      },
    ],
  },
]

function toListView(item) {
  return {
    id: item.id,
    name: item.name,
    purpose: item.purpose,
    owner: item.owner,
    updatedAt: item.updatedAt,
    scenarioType: item.scenarioType,
  }
}

module.exports = [
  {
    url: '/api/capabilities/systems/[^/]+$',
    type: 'get',
    response: (req) => {
      const id = req.path.split('/').pop()
      const found = capabilitySystems.find((s) => s.id === id)
      if (!found) {
        return { code: 404, msg: 'not found', data: null }
      }
      return { code: 200, msg: 'ok', data: JSON.parse(JSON.stringify(found)) }
    },
  },
  {
    url: '/api/capabilities/systems$',
    type: 'get',
    response: (req) => {
      const { keyword = '', owner, page = '1', pageSize = '10' } = req.query || {}
      const kw = String(keyword).trim().toLowerCase()
      let filtered = capabilitySystems.filter((s) => {
        const hitKw = kw
          ? (s.name && s.name.toLowerCase().includes(kw)) ||
            (s.purpose && s.purpose.toLowerCase().includes(kw))
          : true
        const hitOwner = owner ? s.owner === owner : true
        return hitKw && hitOwner
      })

      const total = filtered.length
      const pageNum = Math.max(parseInt(page, 10) || 1, 1)
      const pageSizeNum = Math.max(parseInt(pageSize, 10) || 10, 1)
      const start = (pageNum - 1) * pageSizeNum
      const end = start + pageSizeNum
      const pageList = filtered.slice(start, end).map(toListView)

      return {
        code: 200,
        msg: 'ok',
        data: {
          total,
          list: pageList,
        },
      }
    },
  },
]
