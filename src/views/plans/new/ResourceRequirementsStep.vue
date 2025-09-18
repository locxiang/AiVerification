<template>
  <div class="resource-requirements-step">
    <h3 class="step-title">资源需求</h3>

    <div class="resource-requirements-info">
      <el-alert
        title="配置试验所需的人员、设备和基础数据集资源"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <div class="resource-section">
          <h4 class="section-title">
            <el-icon><User /></el-icon>
            人员需求
          </h4>

          <el-card shadow="hover" class="resource-card">
            <div class="personnel-list">
              <div
                v-for="(item, index) in localResourceRequirements.personnel"
                :key="`personnel_${index}`"
                class="personnel-item"
              >
                <div class="item-content item-content--personnel">
                  <el-row :gutter="10">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24">
                      <el-form-item label="角色">
                        <el-input v-model="item.role" placeholder="角色名称" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="10" class="item-actions-row">
                    <el-col :xs="12" :sm="12" :md="12" :lg="12">
                      <el-form-item label="数量">
                        <el-input-number class="count-number" v-model="item.count" :min="1" :max="10" size="small" />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="12" :sm="12" :md="12" :lg="12" class="delete-col">
                      <el-button
                        type="danger"
                        circle
                        plain
                        size="small"
                        @click="removePersonnel(index)"
                        aria-label="删除人员需求"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </div>

            <div class="add-resource">
              <el-button type="primary" plain @click="addPersonnel">
                <el-icon><Plus /></el-icon>
                添加人员需求
              </el-button>
            </div>
          </el-card>
        </div>
      </el-col>

      <el-col :xs="24" :lg="8">
        <div class="resource-section">
          <h4 class="section-title">
            <el-icon><Monitor /></el-icon>
            设备需求
          </h4>

          <el-card shadow="hover" class="resource-card">
            <div class="equipment-list">
              <div
                v-for="(item, index) in localResourceRequirements.equipment"
                :key="`equipment_${index}`"
                class="equipment-item"
              >
                <div class="item-content item-content--equipment">
                  <el-row :gutter="10">
                    <el-col :xs="24" :sm="12" :md="12" :lg="12">
                      <el-form-item label="类型">
                        <el-select v-model="item.type" placeholder="设备类型" style="width: 100%">
                          <el-option label="服务器" value="server" />
                          <el-option label="仿真终端" value="simulation_terminal" />
                          <el-option label="监控设备" value="monitor" />
                          <el-option label="存储设备" value="storage" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12">
                      <el-form-item label="规格">
                        <el-input v-model="item.spec" placeholder="规格" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="10" class="item-actions-row">
                    <el-col :xs="12" :sm="12" :md="12" :lg="12">
                      <el-form-item label="数量">
                        <el-input-number class="count-number" v-model="item.count" :min="1" :max="10" size="small" />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="12" :sm="12" :md="12" :lg="12" class="delete-col">
                      <el-button
                        type="danger"
                        circle
                        plain
                        size="small"
                        @click="removeEquipment(index)"
                        aria-label="删除设备需求"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </div>

            <div class="add-resource">
              <el-button type="primary" plain @click="addEquipment">
                <el-icon><Plus /></el-icon>
                添加设备需求
              </el-button>
            </div>
          </el-card>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="resource-section">
          <h4 class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            关联社交机器人
          </h4>

          <el-card shadow="hover" class="resource-card resource-card--auto">
            <div class="bots-selection">
              <el-checkbox-group v-model="localResourceRequirements.socialBots">
                <div
                  v-for="bot in availableSocialBots"
                  :key="bot.id"
                  class="bot-option"
                >
                  <el-checkbox :label="bot.id">
                    <span class="bot-name">{{ bot.name }}</span>
                  </el-checkbox>
                  <div class="bot-tags">
                    <el-tag
                      v-for="tag in bot.tags"
                      :key="tag"
                      size="small"
                      class="summary-tag"
                      type="warning"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </el-checkbox-group>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <div class="resource-summary">
      <h4 class="section-title">资源需求摘要</h4>

      <el-card shadow="hover" class="summary-card">
        <el-descriptions :column="summaryColumn" border>
          <el-descriptions-item label="总人员数">
            {{ totalPersonnel }}
          </el-descriptions-item>
          <el-descriptions-item label="总设备数">
            {{ totalEquipment }}
          </el-descriptions-item>
          <el-descriptions-item label="基础数据集数">
            {{ localResourceRequirements.baseDatasets.length }}
          </el-descriptions-item>

          <el-descriptions-item label="人员角色" :span="3">
            <el-tag
              v-for="role in uniquePersonnelRoles"
              :key="role"
              class="summary-tag"
            >
              {{ role }}
            </el-tag>
            <span v-if="uniquePersonnelRoles.length === 0" class="empty-text">无</span>
          </el-descriptions-item>

          <el-descriptions-item label="设备类型" :span="3">
            <el-tag
              v-for="type in uniqueEquipmentTypes"
              :key="type"
              class="summary-tag"
              type="success"
            >
              {{ getEquipmentTypeName(type) }}
            </el-tag>
            <span v-if="uniqueEquipmentTypes.length === 0" class="empty-text">无</span>
          </el-descriptions-item>

          <el-descriptions-item label="基础数据集" :span="3">
            <el-tag
              v-for="datasetId in localResourceRequirements.baseDatasets"
              :key="datasetId"
              class="summary-tag"
              type="info"
            >
              {{ getDatasetName(datasetId) }}
            </el-tag>
            <span v-if="localResourceRequirements.baseDatasets.length === 0" class="empty-text">无</span>
          </el-descriptions-item>

          <el-descriptions-item label="关联社交机器人数量">
            {{ localResourceRequirements.socialBots.length }}
          </el-descriptions-item>

          <el-descriptions-item label="社交机器人" :span="3">
            <template v-if="localResourceRequirements.socialBots.length">
              <span
                v-for="botId in localResourceRequirements.socialBots"
                :key="botId"
                class="bot-summary"
              >
                <el-tag class="summary-tag" type="danger">{{ getBotName(botId) }}</el-tag>
                <el-tag
                  v-for="tag in getBotTags(botId)"
                  :key="`${botId}_${tag}`"
                  class="summary-tag"
                  size="small"
                  type="success"
                >
                  {{ tag }}
                </el-tag>
              </span>
            </template>
            <span v-else class="empty-text">无</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { User, Monitor, DataLine, Delete, Plus, InfoFilled, ChatDotRound } from '@element-plus/icons-vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:resource-requirements'])

// 本地资源需求对象
const localResourceRequirements = reactive({
  personnel: [],
  equipment: [],
  baseDatasets: [],
  socialBots: []
})

// 初始化本地数据
const initLocalData = () => {
  if (props.formData.resourceRequirements) {
    localResourceRequirements.personnel = props.formData.resourceRequirements.personnel.map(p => ({...p}))
    localResourceRequirements.equipment = props.formData.resourceRequirements.equipment.map(e => ({...e}))
    localResourceRequirements.baseDatasets = [...props.formData.resourceRequirements.baseDatasets]
    localResourceRequirements.socialBots = [...(props.formData.resourceRequirements.socialBots || [])]
  }
}

// 用于避免 props 与本地双向 watch 造成的递归更新
const isSyncingFromParent = ref(false)

// 监听props中formData的变化
watch(() => props.formData.resourceRequirements, (newValue) => {
  if (newValue) {
    isSyncingFromParent.value = true
    localResourceRequirements.personnel = newValue.personnel.map(p => ({...p}))
    localResourceRequirements.equipment = newValue.equipment.map(e => ({...e}))
    localResourceRequirements.baseDatasets = [...newValue.baseDatasets]
    localResourceRequirements.socialBots = [...(newValue.socialBots || [])]
    nextTick(() => {
      isSyncingFromParent.value = false
    })
  }
}, { deep: true })

// 监听本地数据的变化，并向父组件发送更新事件
watch(localResourceRequirements, (newValue) => {
  if (isSyncingFromParent.value) return
  emit('update:resource-requirements', {
    personnel: newValue.personnel.map(p => ({...p})),
    equipment: newValue.equipment.map(e => ({...e})),
    baseDatasets: [...newValue.baseDatasets],
    socialBots: [...newValue.socialBots]
  })
}, { deep: true })

// 模拟数据 - 可用基础数据集
const availableBaseDatasets = [
  { id: 'user_profile_dataset', name: '用户画像数据集', description: '包含用户基本信息、兴趣偏好等画像数据' },
  { id: 'social_text_dataset', name: '社交文本数据集', description: '社交媒体文本数据，包含各类话题和情感' },
  { id: 'news_dataset', name: '新闻数据集', description: '各类新闻报道文本数据' },
  { id: 'qa_dataset', name: '问答数据集', description: '常见问题及标准答案数据集' },
  { id: 'sentiment_dataset', name: '情感分析数据集', description: '带情感标注的文本数据集' }
]

// 模拟数据 - 可用社交机器人
const availableSocialBots = [
  { id: 'bot_weibo_sentiment', name: 'A 型号社交机器人', tags: ['微博', '情感分析', '中文'] },
  { id: 'bot_wechat_qa', name: 'B 型号社交机器人', tags: ['企微', '知识问答', 'FAQ'] },
  { id: 'bot_twitter_monitor', name: '舆情监测机器人', tags: ['Twitter', '监测', '多语言'] },
  { id: 'bot_bilibili_helper', name: 'C 型号社交机器人', tags: ['B站', '互动', '弹幕处理'] }
]

// 计算属性 - 总人员数
const totalPersonnel = computed(() => {
  return localResourceRequirements.personnel.reduce((sum, item) => sum + item.count, 0)
})

// 计算属性 - 总设备数
const totalEquipment = computed(() => {
  return localResourceRequirements.equipment.reduce((sum, item) => sum + item.count, 0)
})

// 计算属性 - 唯一人员角色
const uniquePersonnelRoles = computed(() => {
  return [...new Set(localResourceRequirements.personnel.map(item => item.role))].filter(Boolean)
})

// 计算属性 - 唯一设备类型
const uniqueEquipmentTypes = computed(() => {
  return [...new Set(localResourceRequirements.equipment.map(item => item.type))].filter(Boolean)
})

// 添加人员需求
const addPersonnel = () => {
  localResourceRequirements.personnel.push({
    role: '',
    count: 1
  })
}

// 移除人员需求
const removePersonnel = (index) => {
  localResourceRequirements.personnel.splice(index, 1)
}

// 添加设备需求
const addEquipment = () => {
  localResourceRequirements.equipment.push({
    type: 'server',
    spec: '',
    count: 1
  })
}

// 移除设备需求
const removeEquipment = (index) => {
  localResourceRequirements.equipment.splice(index, 1)
}

// 获取设备类型名称
const getEquipmentTypeName = (type) => {
  const typeMap = {
    'server': '服务器',
    'simulation_terminal': '仿真终端',
    'monitor': '监控设备',
    'storage': '存储设备'
  }
  return typeMap[type] || type
}

// 获取数据集名称
const getDatasetName = (datasetId) => {
  const dataset = availableBaseDatasets.find(d => d.id === datasetId)
  return dataset ? dataset.name : datasetId
}

// 获取机器人名称
const getBotName = (botId) => {
  const bot = availableSocialBots.find(b => b.id === botId)
  return bot ? bot.name : botId
}

// 获取机器人标签
const getBotTags = (botId) => {
  const bot = availableSocialBots.find(b => b.id === botId)
  return bot ? bot.tags : []
}

// 初始化
initLocalData()

// 响应式：根据屏幕宽度动态设置摘要列数
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

const summaryColumn = computed(() => {
  const width = windowWidth.value
  if (width < 768) return 1
  if (width < 1200) return 2
  return 3
})
</script>

<style lang="scss" scoped>
.resource-requirements-step {
  .step-title {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 20px;
  }

  .resource-requirements-info {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 15px;
    margin-top: 0;
    display: flex;
    align-items: center;

    .el-icon {
      margin-right: 8px;
      color: #409EFF;
    }
  }

  .resource-section {
    margin-bottom: 20px;
  }

  .resource-card {
    height: 350px;
    overflow-y: auto;

    .personnel-list,
    .equipment-list {
      margin-bottom: 15px;

      .personnel-item,
      .equipment-item {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px dashed #EBEEF5;

        &:last-child {
          border-bottom: none;
        }

        .item-content {
          .el-form-item {
            margin-bottom: 10px;
          }

          .delete-col {
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            height: 100%;
          }
        }
      }
    }

    // 表单项在卡片内的标签占用更少空间，避免横向挤压
    .el-form-item__label {
      width: auto;
      padding-right: 8px;
    }

    // 第二行动作区（数量 + 删除）整体对齐与间距
    .item-actions-row {
      align-items: end;
      margin-top: 2px;
    }

    // 统一的数量输入宽度，避免显示被挤压
    .count-number {
      width: 100%;
      min-width: 180px;
      max-width: 420px;
    }

    .datasets-selection {
      .dataset-option {
        display: flex;
        align-items: center;
        margin-bottom: 15px;

        .info-icon {
          margin-left: 8px;
          color: #909399;
          cursor: pointer;
        }
      }
    }

    .add-resource {
      text-align: center;
      margin-top: 15px;
    }
  }

  .resource-summary {
    margin-top: 30px;

    .summary-card {
      .summary-tag {
        margin-right: 8px;
        margin-bottom: 8px;
      }

      .empty-text {
        color: #909399;
        font-style: italic;
      }
    }
  }
}

@media (max-width: 992px) {
  .resource-requirements-step {
    .resource-card {
      height: auto;
      max-height: 350px;
      margin-bottom: 20px;
    }

    // 小屏时数量输入占满可用宽度
    .count-number {
      width: 100%;
    }
  }
}
</style>
