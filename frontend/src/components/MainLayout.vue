<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NSpace, NButton } from 'naive-ui'

const router = useRouter()
const collapsed = ref(false)

const menuOptions = [
  { label: 'Requests', key: 'requests' },
  { label: 'Pub/Sub', key: 'pubsub' },
  { label: 'JetStream', key: 'jetstream' },
  { label: 'KV Store', key: 'kv' },
  { label: 'Settings', key: 'settings' }
]

const handleMenuUpdate = (key: string) => {
  router.push(`/${key}`)
}
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
          <div>Active Profile: Default</div>
          <n-button type="primary" size="small">Connect</n-button>
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
