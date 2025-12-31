<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NSpace, NButton, NSelect, NTag, useMessage } from 'naive-ui'
import { ApiService } from '../services/api'

const router = useRouter()
const message = useMessage()
const collapsed = ref(false)
const natsProfiles = ref<any[]>([])
const activeNatsProfile = ref('')
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')

const menuOptions = [
  { label: 'Requests', key: 'requests' },
  { label: 'Pub/Sub', key: 'pubsub' },
  { label: 'JetStream', key: 'jetstream' },
  { label: 'KV Store', key: 'kv' },
  { label: 'Settings', key: 'settings' }
]

const profileOptions = computed(() => 
  natsProfiles.value.map(p => ({ label: p.name, value: p.name }))
)

const handleMenuUpdate = (key: string) => {
  router.push(`/${key}`)
}

const loadProfiles = async () => {
  try {
    const wails = (window as any).go?.main?.App
    if (wails) {
      natsProfiles.value = await wails.GetNatsProfiles()
      activeNatsProfile.value = await wails.GetActiveNatsProfile()
    }
  } catch (err) {
    console.error('Failed to load profiles:', err)
  }
}

const handleProfileChange = async (value: string) => {
  try {
    const wails = (window as any).go?.main?.App
    if (wails) {
      await wails.ActivateNatsProfile(value)
      activeNatsProfile.value = value
      message.success(`Switched to profile: ${value}`)
      connectionStatus.value = 'disconnected'
    }
  } catch (err: any) {
    message.error(err.message || 'Failed to switch profile')
  }
}

const handleConnect = async () => {
  connectionStatus.value = 'connecting'
  try {
    // Test connection by listing streams
    await ApiService.listStreams()
    connectionStatus.value = 'connected'
    message.success('Connected to NATS')
  } catch (err: any) {
    connectionStatus.value = 'disconnected'
    message.error('Connection failed: ' + err.message)
  }
}

onMounted(() => {
  loadProfiles()
})
</script>

<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="logo">NATS Manager</div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuUpdate"
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered class="header">
        <n-space justify="space-between" align="center" style="height: 100%; padding: 0 20px;">
          <n-space align="center">
            <span>Profile:</span>
            <n-select
              v-model:value="activeNatsProfile"
              :options="profileOptions"
              @update:value="handleProfileChange"
              style="width: 200px;"
              size="small"
              :disabled="profileOptions.length === 0"
            />
            <n-tag v-if="connectionStatus === 'connected'" type="success" size="small">
              Connected
            </n-tag>
            <n-tag v-else-if="connectionStatus === 'connecting'" type="warning" size="small">
              Connecting...
            </n-tag>
            <n-tag v-else type="default" size="small">
              Disconnected
            </n-tag>
          </n-space>
          <n-button 
            type="primary" 
            size="small" 
            @click="handleConnect"
            :loading="connectionStatus === 'connecting'"
            :disabled="!activeNatsProfile"
          >
            {{ connectionStatus === 'connected' ? 'Reconnect' : 'Connect' }}
          </n-button>
        </n-space>
      </n-layout-header>
      <n-layout-content content-style="padding: 0;">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
}
.header {
  height: 64px;
}
</style>
