const { mock } = require('mockjs')
const { handleRandomImage } = require('../utils')

// 表格“内存数据库”
const TABLE_DB = {
  items: [],
  total: 999,
}

// 初始化一次，后续仅在编辑/删除时改动
if (TABLE_DB.items.length === 0) {
  for (let i = 0; i < TABLE_DB.total; i++) {
    TABLE_DB.items.push(
      mock({
        uuid: '@uuid',
        id: '@id',
        title: '@csentence(1, 2)',
        'status|1': ['published', 'draft', 'deleted'],
        author: '@cname',
        datetime: '@datetime',
        pageViews: '@integer(300, 5000)',
        img: handleRandomImage(200, 200),
        smallImg: handleRandomImage(40, 40),
        switch: '@boolean',
        percent: '@integer(80,99)',
      })
    )
  }
}

module.exports = [
  {
    url: '/table/getList',
    type: 'post',
    response(config) {
      const { title = '', pageNo = 1, pageSize = 20 } = config.body || {}
      let filtered = TABLE_DB.items
      if (title) {
        filtered = filtered.filter((item) => String(item.title).includes(title))
      }
      const start = (pageNo - 1) * pageSize
      const end = start + pageSize
      const pageList = filtered.slice(start, end)
      return {
        code: 200,
        msg: 'success',
        totalCount: filtered.length,
        data: pageList,
      }
    },
  },
  {
    url: '/table/doEdit',
    type: 'post',
    response(config) {
      const body = config.body || {}
      // 简单根据 id 找记录并更新标题/状态等
      if (body && body.id) {
        const idx = TABLE_DB.items.findIndex((it) => it.id === body.id)
        if (idx !== -1) {
          TABLE_DB.items[idx] = Object.assign({}, TABLE_DB.items[idx], body)
        }
      }
      return {
        code: 200,
        msg: '模拟保存成功',
      }
    },
  },
  {
    url: '/table/doDelete',
    type: 'post',
    response(config) {
      const { id } = config.body || {}
      if (id) {
        const idx = TABLE_DB.items.findIndex((it) => it.id === id)
        if (idx !== -1) TABLE_DB.items.splice(idx, 1)
      }
      return {
        code: 200,
        msg: '模拟删除成功',
      }
    },
  },
]
