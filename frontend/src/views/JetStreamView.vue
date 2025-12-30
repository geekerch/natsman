<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent, NDataTable, NButton, NPageHeader, NSpace, NDescriptions, NDescriptionsItem, NTabs, NTabPane, NTag, useMessage } from 'naive-ui'
import { ApiService } from '../services/api'
import { StreamInfo } from '../types/domain'

const message = useMessage()
const streams = ref<{ name: string }[]>([])
const selectedStream = ref<string | null>(null)
const streamInfo = ref<StreamInfo | null>(null)
const messages = ref<any[]>([])
const loadingMessages = ref(false)

const columns = [
  { title: 'Stream Name', key: 'name' }
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
    messages.value = [] // Clear messages on switch
  } catch (e: any) {
    message.error('Failed to get stream info: ' + e.message)
  }
}

const loadMessages = async () => {
  if (!selectedStream.value) return
  loadingMessages.value = true
  try {
    const res = await ApiService.getStreamMessages(selectedStream.value, 20)
    messages.value = res.messages || []
  } catch (e: any) {
    message.error('Failed to load messages: ' + e.message)
  } finally {
    loadingMessages.value = false
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
        <n-button size="tiny" @click="loadStreams">Refresh</n-button>
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
        <div class="text-gray-400">Select a stream to view details</div>
      </div>
    </n-layout-content>
  </n-layout>
</template>
