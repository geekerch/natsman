<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NDataTable, NButton, NPageHeader } from 'naive-ui'
import { ApiService } from '../services/api'

const streams = ref<{ name: string }[]>([])
const columns = [
  { title: 'Stream Name', key: 'name' },
  { title: 'Actions', key: 'actions' }
]

onMounted(async () => {
  try {
    const list = await ApiService.listStreams()
    streams.value = list.map(s => ({ name: s }))
  } catch (e) {
    console.error(e)
  }
})
</script>

<template>
  <div class="p-4">
    <n-page-header subtitle="Manage JetStream Streams">
      <template #title>JetStream</template>
      <template #extra>
        <n-button type="primary">Create Stream</n-button>
      </template>
    </n-page-header>
    
    <n-data-table
      class="mt-4"
      :columns="columns"
      :data="streams"
      :bordered="false"
    />
  </div>
</template>
