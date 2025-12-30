<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent, NTree, NEmpty, NButton, NSpace, useMessage, NModal, NInput } from 'naive-ui'
import { ApiService } from '../services/api'
import { TreeNode, Template } from '../types/domain'
import RequestEditor from '../components/RequestEditor.vue'

const message = useMessage()
const treeData = ref<TreeNode[] | undefined>(undefined)
const selectedKeys = ref<string[]>([])
const currentTemplate = ref<Template | null>(null)
const currentPath = ref<string>('')

// Modal states
const showCreateModal = ref(false)
const newName = ref('')
const isFolder = ref(false)

const loadTree = async () => {
  try {
    const root = await ApiService.getTemplates()
    treeData.value = root.children ? root.children : []
  } catch (e) {
    console.error(e)
    message.error('Failed to load templates')
  }
}

onMounted(loadTree)

const handleUpdateValue = async (keys: string[], option: any[]) => {
  selectedKeys.value = keys
  if (option.length > 0 && !option[0].is_folder) {
    const path = option[0].path
    currentPath.value = path
    try {
      currentTemplate.value = await ApiService.getTemplate(path)
    } catch (e) {
      message.error('Failed to load template')
    }
  } else {
    currentTemplate.value = null
    currentPath.value = ''
  }
}

const handleCreate = async () => {
  if (!newName.value) return
  
  // Determine parent path based on selection (if folder) or root
  // For simplicity, just creating at root or we need a way to select parent.
  // Let's assume root for now or implement context menu later.
  const path = newName.value // Relative to root
  
  try {
    if (isFolder.value) {
      // Folder creation API not fully exposed in ApiService yet, need to add it
      // Assuming ApiService.createFolder exists or we use createTemplate for files
      // Let's stick to files for now
    } else {
      const tmpl: Template = { mode: 'request', subject: '', payload: '' }
      await ApiService.saveTemplate(path, tmpl)
      message.success('Created ' + path)
      await loadTree()
      showCreateModal.value = false
      newName.value = ''
    }
  } catch (e: any) {
    message.error('Failed to create: ' + e.message)
  }
}

const openCreateModal = () => {
  showCreateModal.value = true
}
</script>

<template>
  <n-layout has-sider style="height: 100%">
    <n-layout-sider
      bordered
      width="300"
      content-style="padding: 10px; display: flex; flex-direction: column;"
    >
      <div class="mb-2 flex justify-between items-center">
        <span class="font-bold">Templates</span>
        <n-button size="tiny" @click="openCreateModal">New</n-button>
      </div>
      <n-tree
        block-line
        :data="treeData"
        key-field="path"
        label-field="name"
        children-field="children"
        :selected-keys="selectedKeys"
        @update:selected-keys="handleUpdateValue"
        selectable
        expand-on-click
        class="flex-1"
      />
    </n-layout-sider>
    <n-layout-content content-style="padding: 20px; height: 100%;">
      <RequestEditor 
        v-if="currentTemplate" 
        :path="currentPath" 
        :initial-template="currentTemplate"
        @saved="loadTree"
      />
      <div v-else class="flex h-full items-center justify-center">
        <n-empty description="Select a template to start" />
      </div>
    </n-layout-content>
  </n-layout>

  <n-modal v-model:show="showCreateModal" preset="dialog" title="Create New Template">
    <n-space vertical>
      <n-input v-model:value="newName" placeholder="Template Name (e.g. my_request)" />
      <div class="flex justify-end">
        <n-button type="primary" @click="handleCreate">Create</n-button>
      </div>
    </n-space>
  </n-modal>
</template>
