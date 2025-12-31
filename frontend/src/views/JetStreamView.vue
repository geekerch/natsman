<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent, NDataTable, NButton, NPageHeader, NSpace, NDescriptions, NDescriptionsItem, NTabs, NTabPane, NTag, NModal, NForm, NFormItem, NInput, NDynamicTags, NInputNumber, NSelect, NPopconfirm, NIcon, useMessage } from 'naive-ui'
import { AddOutline, TrashOutline } from '@vicons/ionicons5'
import { ApiService } from '../services/api'
import { StreamInfo } from '../types/domain'

const message = useMessage()
const streams = ref<{ name: string }[]>([])
const selectedStream = ref<string | null>(null)
const streamInfo = ref<StreamInfo | null>(null)
const messages = ref<any[]>([])
const loadingMessages = ref(false)

// Create Stream Modal
const showCreateModal = ref(false)
const createForm = ref({
  name: '',
  subjects: [] as string[],
  storage: 'file',
  replicas: 1
})

const storageOptions = [
  { label: 'File', value: 'file' },
  { label: 'Memory', value: 'memory' }
]

const columns = [
  { title: 'Stream Name', key: 'name' },
  {
    title: 'Actions',
    key: 'actions',
    width: 100,
    render: (row: any) => {
      return h(NSpace, null, {
        default: () => [
          h(NPopconfirm, {
            onPositiveClick: () => deleteStream(row.name)
          }, {
            default: () => 'Are you sure to delete this stream?',
            trigger: () => h(NButton, {
              size: 'small',
              type: 'error',
              quaternary: true,
              onClick: (e: Event) => e.stopPropagation()
            }, {
              icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
            })
          })
        ]
      })
    }
  }
]

const loadStreams = async () => {
  try {
    const list = await ApiService.listStreams()
    streams.value = list.map(s => ({ name: s }))
  } catch (e: any) {
    message.error('Failed to list streams: ' + e.message)
  }
}

onMounted(loadStreams)

const selectStream = async (row: any) => {
  selectedStream.value = row.name
  try {
    streamInfo.value = await ApiService.getStreamInfo(row.name)
    messages.value = []
  } catch (e: any) {
    message.error('Failed to get stream info: ' + e.message)
  }
}

const loadMessages = async () => {
  if (!selectedStream.value) return
  loadingMessages.value = true
  try {
    const res = await ApiService.getStreamMessages(selectedStream.value, true)
    messages.value = res.messages || []
  } catch (e: any) {
    message.error('Failed to load messages: ' + e.message)
  } finally {
    loadingMessages.value = false
  }
}

const createStream = async () => {
  if (!createForm.value.name || createForm.value.subjects.length === 0) {
    message.warning('Please fill in stream name and subjects')
    return
  }
  
  try {
    await ApiService.createStream({
      name: createForm.value.name,
      subjects: createForm.value.subjects,
      storage: createForm.value.storage,
      replicas: createForm.value.replicas,
      config: { url: '', creds_path: '' }
    })
    message.success('Stream created')
    showCreateModal.value = false
    createForm.value = { name: '', subjects: [], storage: 'file', replicas: 1 }
    await loadStreams()
  } catch (e: any) {
    message.error('Failed to create stream: ' + e.message)
  }
}

const deleteStream = async (name: string) => {
  try {
    await ApiService.deleteStream(name)
    message.success('Stream deleted')
    if (selectedStream.value === name) {
      selectedStream.value = null
      streamInfo.value = null
    }
    await loadStreams()
  } catch (e: any) {
    message.error('Failed to delete stream: ' + e.message)
  }
}

const msgColumns = [
  { title: 'Seq', key: 'seq', width: 80 },
  { title: 'Subject', key: 'subject' },
  { title: 'Data', key: 'data', render: (row: any) => {
      return row.data
    } 
  },
  { title: 'Time', key: 'time' }
]

</script>

<template>
  <n-layout has-sider style="height: 100%">
    <n-layout-sider bordered width="300" content-style="padding: 10px;">
      <div class="mb-2 font-bold flex justify-between items-center">
        <span>Streams</span>
        <n-space size="small">
          <n-button size="tiny" @click="showCreateModal = true">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            New
          </n-button>
          <n-button size="tiny" @click="loadStreams">Refresh</n-button>
        </n-space>
      </div>
      <n-data-table
        :columns="columns"
        :data="streams"
        :row-props="(row) => ({
          style: 'cursor: pointer;',
          onClick: () => selectStream(row)
        })"
        size="small"
      />
    </n-layout-sider>
    <n-layout-content content-style="padding: 20px; height: 100%; overflow: auto;">
      <div v-if="selectedStream && streamInfo">
        <n-page-header :subtitle="streamInfo.config.subjects?.join(', ')">
          <template #title>{{ streamInfo.config.name }}</template>
          <template #extra>
            <n-space>
              <n-tag type="info">{{ streamInfo.state.messages }} msgs</n-tag>
              <n-tag type="warning">{{ streamInfo.state.bytes }} bytes</n-tag>
            </n-space>
          </template>
        </n-page-header>

        <n-tabs type="line" class="mt-4">
          <n-tab-pane name="info" tab="Info">
            <n-descriptions bordered>
              <n-descriptions-item label="Created">{{ streamInfo.created }}</n-descriptions-item>
              <n-descriptions-item label="Storage">{{ streamInfo.config.storage }}</n-descriptions-item>
              <n-descriptions-item label="Subjects">{{ streamInfo.config.subjects?.join(', ') }}</n-descriptions-item>
              <n-descriptions-item label="Replicas">{{ streamInfo.config.replicas }}</n-descriptions-item>
              <n-descriptions-item label="First Seq">{{ streamInfo.state.first_seq }}</n-descriptions-item>
              <n-descriptions-item label="Last Seq">{{ streamInfo.state.last_seq }}</n-descriptions-item>
              <n-descriptions-item label="Consumers">{{ streamInfo.state.consumer_count }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>
          <n-tab-pane name="messages" tab="Messages">
            <div class="mb-2">
              <n-button @click="loadMessages" :loading="loadingMessages">Load Last 20 Messages</n-button>
            </div>
            <n-data-table :columns="msgColumns" :data="messages" size="small" />
          </n-tab-pane>
        </n-tabs>
      </div>
      <div v-else class="flex h-full items-center justify-center">
        <n-empty description="Select a stream to view details" />
      </div>
    </n-layout-content>
  </n-layout>

  <!-- Create Stream Modal -->
  <n-modal v-model:show="showCreateModal" preset="dialog" title="Create JetStream">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="Name" required>
        <n-input v-model:value="createForm.name" placeholder="stream_name" />
      </n-form-item>
      <n-form-item label="Subjects" required>
        <n-dynamic-tags v-model:value="createForm.subjects" />
      </n-form-item>
      <n-form-item label="Storage">
        <n-select v-model:value="createForm.storage" :options="storageOptions" />
      </n-form-item>
      <n-form-item label="Replicas">
        <n-input-number v-model:value="createForm.replicas" :min="1" :max="5" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-space>
        <n-button @click="showCreateModal = false">Cancel</n-button>
        <n-button type="primary" @click="createStream">Create</n-button>
      </n-space>
    </template>
  </n-modal>
</template>
