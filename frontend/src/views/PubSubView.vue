<template>
  <div class="h-full flex flex-col">
    <div class="p-4 border-b flex justify-between items-center">
      <h2 class="text-xl font-bold">Pub/Sub</h2>
      <div class="flex gap-2">
        <n-input v-model:value="newSubject" placeholder="Subject (e.g. updates.>)" @keyup.enter="subscribe" />
        <n-button type="primary" @click="subscribe" :disabled="!newSubject">Subscribe</n-button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar: Active Subscriptions -->
      <div class="w-64 border-r bg-gray-50 flex flex-col">
        <div class="p-2 font-semibold text-gray-600 border-b">Active Subscriptions</div>
        <div class="flex-1 overflow-y-auto p-2">
          <div
            v-for="sub in subscriptions"
            :key="sub"
            class="p-2 rounded cursor-pointer hover:bg-gray-200 flex justify-between items-center group"
            :class="{ 'bg-blue-100': selectedSubject === sub }"
            @click="selectSubject(sub)"
          >
            <span class="truncate" :title="sub">{{ sub }}</span>
            <n-button size="tiny" type="error" ghost class="opacity-0 group-hover:opacity-100" @click.stop="unsubscribe(sub)">
              ✕
            </n-button>
          </div>
          <div v-if="subscriptions.length === 0" class="text-gray-400 text-center mt-4">
            No subscriptions
          </div>
        </div>
      </div>

      <!-- Main Content: Messages -->
      <div class="flex-1 flex flex-col bg-white">
        <div v-if="selectedSubject" class="h-full flex flex-col">
          <div class="p-2 border-b flex justify-between items-center bg-gray-50">
            <div class="font-mono font-bold">{{ selectedSubject }}</div>
            <div class="flex gap-2">
              <n-button size="small" @click="refreshMessages">Refresh</n-button>
              <n-button size="small" type="warning" @click="clearMessages">Clear</n-button>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <div v-for="(msg, idx) in messages" :key="idx" class="border rounded p-2 hover:shadow-sm">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span class="font-mono">{{ msg.subject }}</span>
                <span>{{ formatTime(msg.timestamp) }}</span>
              </div>
              <pre class="bg-gray-50 p-2 rounded text-sm overflow-x-auto">{{ msg.data }}</pre>
            </div>
            <div v-if="messages.length === 0" class="text-gray-400 text-center mt-10">
              No messages received yet.
            </div>
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-gray-400">
          Select a subscription to view messages
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useMessage } from 'naive-ui';
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
