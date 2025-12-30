<script setup lang="ts">
import { ref, watch, h } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NButton, NSpace, NCard, NTabs, NTabPane, NDataTable, NTag, useMessage } from 'naive-ui'
import { Template, RequestPayload, SendReqResult, Variable } from '../types/domain'
import { ApiService } from '../services/api'

const props = defineProps<{
  path: string
  initialTemplate: Template | null
}>()

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const message = useMessage()
const loading = ref(false)
const result = ref<SendReqResult | null>(null)

// Form Data
const formData = ref<Template>({
  mode: 'request',
  subject: '',
  payload: ''
})

// Local Variables
const variables = ref<{ key: string; value: string; type: string }[]>([])

// Initialize form when template changes
watch(() => props.initialTemplate, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal }
    result.value = null
    // TODO: Load variables if stored in template
  } else {
    // Reset or New
    formData.value = { mode: 'request', subject: '', payload: '' }
    result.value = null
  }
}, { immediate: true })

const modeOptions = [
  { label: 'Request/Reply', value: 'request' },
  { label: 'Publish/Subscribe', value: 'pubsub' }
]

const handleSend = async () => {
  loading.value = true
  try {
    // Convert variables array to map
    const varsMap: Record<string, Variable> = {}
    variables.value.forEach(v => {
      if (v.key) varsMap[v.key] = { type: v.type, value: v.value }
    })

    const payload: RequestPayload = {
      mode: formData.value.mode,
      subject: formData.value.subject,
      body: formData.value.payload,
      variables: varsMap,
      config: { url: '', creds_path: '' } // Let backend use default
    }

    result.value = await ApiService.sendRequest(payload)
    message.success('Request sent successfully')
  } catch (e: any) {
    message.error('Failed to send request: ' + e.message)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    await ApiService.saveTemplate(props.path, formData.value)
    message.success('Template saved')
    emit('saved')
  } catch (e: any) {
    message.error('Failed to save: ' + e.message)
  }
}

// Variable Table Config
const varColumns = [
  { title: 'Key', key: 'key', render: (row: any, index: number) => {
      return h(NInput, { 
        value: row.key, 
        onUpdateValue: (v) => variables.value[index].key = v,
        placeholder: 'Variable Name'
      })
    } 
  },
  { title: 'Value', key: 'value', render: (row: any, index: number) => {
      return h(NInput, { 
        value: row.value, 
        onUpdateValue: (v) => variables.value[index].value = v,
        placeholder: 'Value'
      })
    }
  },
  { title: 'Action', key: 'action', render: (_row: any, index: number) => {
      return h(NButton, { 
        size: 'small', 
        type: 'error', 
        onClick: () => variables.value.splice(index, 1) 
      }, { default: () => 'Remove' })
    }
  }
]

const addVariable = () => {
  variables.value.push({ key: '', value: '', type: 'static' })
}

</script>

<template>
  <div class="h-full flex flex-col">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold truncate">{{ path }}</h2>
      <n-space>
        <n-button @click="handleSave">Save</n-button>
        <n-button type="primary" :loading="loading" @click="handleSend">
          Send
        </n-button>
      </n-space>
    </div>

    <n-tabs type="line" animated>
      <n-tab-pane name="request" tab="Request">
        <n-form label-placement="left" label-width="80">
          <n-form-item label="Mode">
            <n-select v-model:value="formData.mode" :options="modeOptions" />
          </n-form-item>
          <n-form-item label="Subject">
            <n-input v-model:value="formData.subject" placeholder="nats.subject.>" />
          </n-form-item>
          <n-form-item label="Payload">
            <n-input
              v-model:value="formData.payload"
              type="textarea"
              placeholder="JSON or Text Payload"
              :autosize="{ minRows: 5, maxRows: 15 }"
              class="font-mono"
            />
          </n-form-item>
        </n-form>
      </n-tab-pane>
      
      <n-tab-pane name="variables" tab="Variables">
        <div class="mb-2">
          <n-button size="small" @click="addVariable">Add Variable</n-button>
        </div>
        <n-data-table :columns="varColumns" :data="variables" size="small" />
      </n-tab-pane>
    </n-tabs>

    <n-card v-if="result" title="Response" class="mt-4 flex-1 overflow-hidden flex flex-col" content-style="overflow: auto; height: 100%;">
      <template #header-extra>
        <n-space>
          <n-tag :type="result.status === 'OK' ? 'success' : 'error'">{{ result.status }}</n-tag>
          <n-tag>{{ result.elapsed }}</n-tag>
        </n-space>
      </template>
      <pre class="whitespace-pre-wrap font-mono text-sm">{{ result.reply }}</pre>
    </n-card>
  </div>
</template>
