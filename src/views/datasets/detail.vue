<template>
  <div class="dataset-detail-container">
    <el-page-header @back="$router.back()" content="数据集详情" />

    <!-- 详情信息 -->
    <el-card class="mt-3" shadow="never">
      <template #header>
        <span>{{ dataset.name || '数据集' }}</span>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="数据集ID">{{ id }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ dataset.source }}</el-descriptions-item>
        <el-descriptions-item label="样本量">{{ dataset.size }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ dataset.updatedAt }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ dataset.description || '—' }}</el-descriptions-item>
      </el-descriptions>

      <div class="mt-3 actions-row">
        <el-space>
          <el-button type="primary" @click="associateToExperiment">关联到试验</el-button>
          <el-button @click="fillWithExample">填充示例数据</el-button>
          <el-button @click="clearAll">清空输入</el-button>
        </el-space>
      </div>
    </el-card>

    <!-- 手动输入 & 预览合一 -->
    <el-card class="mt-3" shadow="never">
      <template #header>
        <span>数据输入与预览</span>
      </template>

      <el-form label-width="88px" class="mb-2">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12">
            <el-form-item label="数据格式">
              <el-radio-group v-model="inputFormat">
                <el-radio label="json">JSON/JSON Lines</el-radio>
                <el-radio label="csv">CSV</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="分隔符" v-if="inputFormat === 'csv'">
              <el-select v-model="csvDelimiter" style="width: 160px">
                <el-option label="," value="," />
                <el-option label=";" value=";" />
                <el-option label="\t(制表)" value="\t" />
                <el-option label="|" value="|" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="数据内容">
          <el-input
            v-model="rawInput"
            type="textarea"
            :autosize="{ minRows: 8, maxRows: 20 }"
            :placeholder="inputPlaceholder"
          />
        </el-form-item>
        <el-form-item label="操作">
          <el-space>
            <el-button type="primary" @click="previewData">预览</el-button>
            <el-button type="success" :disabled="previewRows.length === 0" @click="saveData">保存</el-button>
            <el-button @click="clearAll">清空</el-button>
          </el-space>
        </el-form-item>
      </el-form>

      <el-alert v-if="parseError" :title="parseError" type="error" show-icon class="mb-2" />

      <div v-if="previewRows.length > 0">
        <div class="table-toolbar mb-2">
          <span>预览行数：{{ previewRows.length }}</span>
        </div>
        <el-table :data="previewRows" border style="width: 100%">
          <el-table-column v-for="col in previewColumns" :key="col" :prop="col" :label="col" :min-width="120" />
        </el-table>
      </div>
      <el-empty v-else description="暂无预览数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const id = route.params.id

// 详情信息（可替换为接口返回）
const dataset = ref({
  name: '示例数据集',
  source: '手动/上传',
  size: 0,
  updatedAt: '2025-01-02',
  description: '这里展示数据集的基础信息与说明。'
})

// 输入与预览状态
const inputFormat = ref('json')
const csvDelimiter = ref(',')
const rawInput = ref('')
const parseError = ref('')
const previewRows = ref([])
const previewColumns = ref([])
const inputPlaceholder = ref(
  '粘贴或输入数据。支持:\n- JSON 数组，如 [{"a":1},{"a":2}]\n- JSON Lines，每行一个 JSON 对象\n- CSV，首行表头'
)

const associateToExperiment = () => {
  router.back()
}

const clearAll = () => {
  rawInput.value = ''
  parseError.value = ''
  previewRows.value = []
  previewColumns.value = []
}

const fillWithExample = () => {
  if (inputFormat.value === 'json') {
    rawInput.value = `[{"id":1,"name":"Alice","score":91},{"id":2,"name":"Bob","score":87}]`
  } else {
    rawInput.value = `id,name,score\n1,Alice,91\n2,Bob,87`
  }
  parseError.value = ''
}

const previewData = () => {
  parseError.value = ''
  try {
    const rows = inputFormat.value === 'json' ? parseJson(rawInput.value) : parseCsv(rawInput.value, csvDelimiter.value)
    const columns = inferColumns(rows)
    previewRows.value = rows
    previewColumns.value = columns
    dataset.value.size = rows.length
  } catch (err) {
    previewRows.value = []
    previewColumns.value = []
    parseError.value = err instanceof Error ? err.message : String(err)
  }
}

const saveData = () => {
  // TODO: 对接后端保存接口。此处仅演示更新本地元信息
  dataset.value.updatedAt = new Date().toISOString().slice(0, 10)
}

function parseJson(text) {
  const trimmed = (text || '').trim()
  if (!trimmed) return []
  // 兼容 JSON 数组与 JSON Lines
  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed)
    if (!Array.isArray(arr)) throw new Error('JSON 顶层必须是数组或逐行对象')
    return normalizeRows(arr)
  }
  const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0)
  const objs = lines.map((line, idx) => {
    try {
      return JSON.parse(line)
    } catch (e) {
      throw new Error(`第 ${idx + 1} 行不是合法 JSON：${e?.message || e}`)
    }
  })
  return normalizeRows(objs)
}

function parseCsv(text, delimiter) {
  const trimmed = (text || '').trim()
  if (!trimmed) return []
  const lines = trimmed.split(/\r?\n/)
  if (lines.length === 0) return []
  const header = splitCsvLine(lines[0], delimiter)
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter)
    const row = {}
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = cols[j] ?? ''
    }
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line, delimiter) {
  // 简易 CSV 拆分，支持双引号包裹与转义双引号
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function inferColumns(rows) {
  const set = new Set()
  rows.forEach(r => Object.keys(r || {}).forEach(k => set.add(k)))
  return Array.from(set)
}

function normalizeRows(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(item => {
    if (item && typeof item === 'object') return item
    return { value: item }
  })
}
</script>

<style scoped>
.dataset-detail-container { padding: 20px; }
.mt-3 { margin-top: 12px; }
.mb-2 { margin-bottom: 8px; }
.actions-row { display: flex; justify-content: space-between; align-items: center; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; }
</style>


