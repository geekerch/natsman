<template>
  <div class="h-full flex flex-col">
    <div class="p-4 border-b flex justify-between items-center">
      <h2 class="text-xl font-bold">KV Store</h2>
      <n-button type="primary" @click="showCreateBucket = true">Create Bucket</n-button>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar: Buckets -->
      <div class="w-64 border-r bg-gray-50 flex flex-col">
        <div class="p-2 font-semibold text-gray-600 border-b">Buckets</div>
        <div class="flex-1 overflow-y-auto p-2">
          <div
            v-for="bucket in buckets"
            :key="bucket"
            class="p-2 rounded cursor-pointer hover:bg-gray-200 flex justify-between items-center"
            :class="{ 'bg-blue-100': selectedBucket === bucket }"
            @click="selectBucket(bucket)"
          >
            <span class="truncate" :title="bucket">{{ bucket }}</span>
          </div>
          <div v-if="buckets.length === 0" class="text-gray-400 text-center mt-4">
            No buckets
          </div>
        </div>
      </div>

      <!-- Main Content: Keys -->
      <div class="flex-1 flex flex-col bg-white">
        <div v-if="selectedBucket" class="h-full flex flex-col">
          <div class="p-2 border-b flex justify-between items-center bg-gray-50">
            <div class="font-mono font-bold">{{ selectedBucket }}</div>
            <div class="flex gap-2">
              <n-button size="small" type="primary" @click="showPutKey = true">Put Key</n-button>
              <n-popconfirm @positive-click="deleteBucket">
                <template #trigger>
                  <n-button size="small" type="error">Delete Bucket</n-button>
                </template>
                Are you sure you want to delete this bucket?
              </n-popconfirm>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4">
            <n-data-table
              :columns="keyColumns"
              :data="keysData"
              :loading="loadingKeys"
              :row-props="rowProps"
            />
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-gray-400">
          Select a bucket to view keys
        </div>
      </div>
    </div>

    <!-- Create Bucket Modal -->
    <n-modal v-model:show="showCreateBucket" preset="dialog" title="Create KV Bucket">
      <div class="space-y-4 mt-4">
        <n-input v-model:value="newBucketName" placeholder="Bucket Name" />
        <n-input-number v-model:value="newBucketHistory" placeholder="Max History (default 1)" :min="1" />
      </div>
      <template #action>
        <n-button @click="showCreateBucket = false">Cancel</n-button>
        <n-button type="primary" @click="createBucket" :disabled="!newBucketName">Create</n-button>
      </template>
    </n-modal>

    <!-- Put Key Modal -->
    <n-modal v-model:show="showPutKey" preset="dialog" title="Put Key">
      <div class="space-y-4 mt-4">
        <n-input v-model:value="putKeyName" placeholder="Key" />
        <n-input type="textarea" v-model:value="putKeyValue" placeholder="Value" :rows="5" />
      </div>
      <template #action>
        <n-button @click="showPutKey = false">Cancel</n-button>
        <n-button type="primary" @click="putKey" :disabled="!putKeyName">Put</n-button>
      </template>
    </n-modal>

    <!-- Key Details Drawer -->
    <n-drawer v-model:show="showKeyDetails" width="500">
      <n-drawer-content :title="selectedKey">
        <div v-if="keyEntry" class="space-y-4">
          <div>
            <div class="text-xs text-gray-500">Revision</div>
            <div>{{ keyEntry.revision }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Created</div>
            <div>{{ formatTime(keyEntry.created) }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Operation</div>
            <n-tag :type="keyEntry.operation === 'DEL' ? 'error' : 'success'">{{ keyEntry.operation }}</n-tag>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">Value</div>
            <pre class="bg-gray-50 p-2 rounded text-sm overflow-x-auto border">{{ keyEntry.value }}</pre>
          </div>
          
          <div class="pt-4 border-t flex justify-end">
             <n-popconfirm @positive-click="deleteKey">
                <template #trigger>
                  <n-button type="error">Delete Key</n-button>
                </template>
                Are you sure you want to delete this key?
              </n-popconfirm>
          </div>
        </div>
        <div v-else class="text-center py-10">
          <n-spin />
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue';
import { NButton, NModal, NInput, NInputNumber, NPopconfirm, NDataTable, NDrawer, NDrawerContent, NTag, NSpin, useMessage } from 'naive-ui';
import { ApiService } from '../services/api';
import { KVEntry } from '../types/domain';

const message = useMessage();

// State
const buckets = ref<string[]>([]);
const selectedBucket = ref<string | null>(null);
const keys = ref<string[]>([]);
const loadingKeys = ref(false);

// Create Bucket
const showCreateBucket = ref(false);
const newBucketName = ref('');
const newBucketHistory = ref(1);

// Put Key
const showPutKey = ref(false);
const putKeyName = ref('');
const putKeyValue = ref('');

// Key Details
const showKeyDetails = ref(false);
const selectedKey = ref('');
const keyEntry = ref<KVEntry | null>(null);

const keyColumns = [
  { title: 'Key', key: 'key' },
  { 
    title: 'Action', 
    key: 'actions',
    render(row: any) {
      return h(NButton, {
        size: 'small',
        onClick: (e) => {
          e.stopPropagation();
          openKeyDetails(row.key);
        }
      }, { default: () => 'View' });
    }
  }
];

const keysData = computed(() => keys.value.map(k => ({ key: k })));

const loadBuckets = async () => {
  try {
    buckets.value = await ApiService.listKVBuckets();
  } catch (err) {
    console.error(err);
  }
};

const createBucket = async () => {
  try {
    await ApiService.createKVBucket(newBucketName.value, newBucketHistory.value);
    message.success('Bucket created');
    showCreateBucket.value = false;
    newBucketName.value = '';
    await loadBuckets();
  } catch (err: any) {
    message.error(err.message || 'Failed to create bucket');
  }
};

const selectBucket = async (bucket: string) => {
  selectedBucket.value = bucket;
  await loadKeys();
};

const loadKeys = async () => {
  if (!selectedBucket.value) return;
  loadingKeys.value = true;
  try {
    keys.value = await ApiService.getKVKeys(selectedBucket.value);
  } catch (err) {
    console.error(err);
  } finally {
    loadingKeys.value = false;
  }
};

const deleteBucket = async () => {
  if (!selectedBucket.value) return;
  try {
    await ApiService.deleteKVBucket(selectedBucket.value);
    message.success('Bucket deleted');
    selectedBucket.value = null;
    await loadBuckets();
  } catch (err: any) {
    message.error(err.message || 'Failed to delete bucket');
  }
};

const putKey = async () => {
  if (!selectedBucket.value) return;
  try {
    await ApiService.putKVValue(selectedBucket.value, putKeyName.value, putKeyValue.value);
    message.success('Key saved');
    showPutKey.value = false;
    putKeyName.value = '';
    putKeyValue.value = '';
    await loadKeys();
  } catch (err: any) {
    message.error(err.message || 'Failed to put key');
  }
};

const openKeyDetails = async (key: string) => {
  selectedKey.value = key;
  showKeyDetails.value = true;
  keyEntry.value = null;
  if (!selectedBucket.value) return;
  
  try {
    keyEntry.value = await ApiService.getKVValue(selectedBucket.value, key);
  } catch (err: any) {
    message.error(err.message || 'Failed to load key details');
  }
};

const deleteKey = async () => {
  if (!selectedBucket.value || !selectedKey.value) return;
  try {
    await ApiService.deleteKVValue(selectedBucket.value, selectedKey.value);
    message.success('Key deleted');
    showKeyDetails.value = false;
    await loadKeys();
  } catch (err: any) {
    message.error(err.message || 'Failed to delete key');
  }
};

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => openKeyDetails(row.key)
  };
};

const formatTime = (ts: string) => {
  return new Date(ts).toLocaleString();
};

onMounted(() => {
  loadBuckets();
});
</script>

<style scoped>
.selected-bucket {
  border-color: var(--n-color-target);
  background-color: var(--n-color-target);
  opacity: 0.9;
}
</style>
