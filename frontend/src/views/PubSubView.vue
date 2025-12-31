<template>
  <n-layout style="height: 100%">
    <n-layout-header bordered style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; font-size: 20px; font-weight: bold;">Pub/Sub</h2>
      <n-space>
        <n-input 
          v-model:value="newSubject" 
          placeholder="Subject (e.g. updates.>)" 
          @keyup.enter="subscribe"
          style="width: 300px;"
        />
        <n-button type="primary" @click="subscribe" :disabled="!newSubject">Subscribe</n-button>
      </n-space>
    </n-layout-header>

    <n-layout has-sider style="flex: 1;">
      <!-- Sidebar: Active Subscriptions -->
      <n-layout-sider 
        bordered 
        width="260"
        content-style="display: flex; flex-direction: column;"
      >
        <div style="padding: 12px; font-weight: 600; border-bottom: 1px solid var(--n-border-color);">
          Active Subscriptions
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 8px;">
          <n-space vertical :size="4">
            <n-card
              v-for="sub in subscriptions"
              :key="sub"
              size="small"
              :bordered="selectedSubject === sub"
              hoverable
              @click="selectSubject(sub)"
              style="cursor: pointer;"
              :class="{ 'selected-subscription': selectedSubject === sub }"
            >
              <template #default>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-family: monospace; font-size: 13px;" :title="sub">
                    {{ sub.length > 25 ? sub.substring(0, 25) + '...' : sub }}
                  </span>
                  <n-button 
                    size="tiny" 
                    type="error" 
                    text
                    @click.stop="unsubscribe(sub)"
                  >
                    ✕
                  </n-button>
                </div>
              </template>
            </n-card>
          </n-space>
          <n-empty v-if="subscriptions.length === 0" description="No subscriptions" style="margin-top: 40px;" />
        </div>
      </n-layout-sider>

      <!-- Main Content: Messages -->
      <n-layout-content content-style="display: flex; flex-direction: column;">
        <div v-if="selectedSubject" style="display: flex; flex-direction: column; height: 100%;">
          <n-page-header style="padding: 12px; border-bottom: 1px solid var(--n-border-color);">
            <template #title>
              <span style="font-family: monospace;">{{ selectedSubject }}</span>
            </template>
            <template #extra>
              <n-space>
                <n-button size="small" @click="refreshMessages">Refresh</n-button>
                <n-button size="small" type="warning" @click="clearMessages">Clear</n-button>
              </n-space>
            </template>
          </n-page-header>
          
          <div style="flex: 1; overflow-y: auto; padding: 16px;">
            <n-space vertical :size="8">
              <n-card 
                v-for="(msg, idx) in messages" 
                :key="idx"
                size="small"
                hoverable
              >
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--n-text-color-3); margin-bottom: 8px;">
                  <span style="font-family: monospace;">{{ msg.subject }}</span>
                  <span>{{ formatTime(msg.timestamp) }}</span>
                </div>
                <n-code :code="msg.data" language="json" :word-wrap="true" />
              </n-card>
            </n-space>
            <n-empty v-if="messages.length === 0" description="No messages received yet." style="margin-top: 80px;" />
          </div>
        </div>
        <n-empty v-else description="Select a subscription to view messages" style="height: 100%; display: flex; align-items: center; justify-content: center;" />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { NLayout, NLayoutHeader, NLayoutSider, NLayoutContent, NSpace, NInput, NButton, NCard, NEmpty, NPageHeader, NCode, useMessage } from 'naive-ui';
import { ApiService } from '../services/api';
import { SubscriptionMessage } from '../types/domain';

const message = useMessage();
const newSubject = ref('');
const subscriptions = ref<string[]>([]);
const selectedSubject = ref<string | null>(null);
const messages = ref<SubscriptionMessage[]>([]);
let pollInterval: any = null;

const loadSubscriptions = async () => {
  try {
    subscriptions.value = await ApiService.getActiveSubscriptions();
  } catch (err) {
    console.error(err);
  }
};

const subscribe = async () => {
  if (!newSubject.value) return;
  try {
    await ApiService.subscribe(newSubject.value);
    message.success(`Subscribed to ${newSubject.value}`);
    newSubject.value = '';
    await loadSubscriptions();
  } catch (err: any) {
    message.error(err.message || 'Failed to subscribe');
  }
};

const unsubscribe = async (subject: string) => {
  try {
    await ApiService.unsubscribe(subject);
    message.success(`Unsubscribed from ${subject}`);
    if (selectedSubject.value === subject) {
      selectedSubject.value = null;
      messages.value = [];
    }
    await loadSubscriptions();
  } catch (err: any) {
    message.error(err.message || 'Failed to unsubscribe');
  }
};

const selectSubject = async (subject: string) => {
  selectedSubject.value = subject;
  await refreshMessages();
};

const refreshMessages = async () => {
  if (!selectedSubject.value) return;
  try {
    messages.value = await ApiService.getSubscriptionMessages(selectedSubject.value);
    // Sort by timestamp desc
    messages.value.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error(err);
  }
};

const clearMessages = async () => {
  if (!selectedSubject.value) return;
  try {
    await ApiService.clearSubscriptionMessages(selectedSubject.value);
    messages.value = [];
    message.success('Messages cleared');
  } catch (err: any) {
    message.error(err.message || 'Failed to clear messages');
  }
};

const formatTime = (ts: string) => {
  return new Date(ts).toLocaleString();
};

onMounted(() => {
  loadSubscriptions();
  // Poll for messages every second if a subject is selected
  pollInterval = setInterval(() => {
    if (selectedSubject.value) {
      refreshMessages();
    }
  }, 1000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.selected-subscription {
  border-color: var(--n-color-target);
  background-color: var(--n-color-target);
  opacity: 0.9;
}
</style>
