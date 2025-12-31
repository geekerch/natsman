<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent, NTree, NEmpty, NButton, NSpace, useMessage, NModal, NInput, NIcon, NDropdown } from 'naive-ui'
import type { DropdownOption, TreeOption } from 'naive-ui'
import { FolderOutline, DocumentOutline, AddOutline, TrashOutline } from '@vicons/ionicons5'
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
const createType = ref<'file' | 'folder'>('file')
const parentPath = ref('')

// Context menu
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextNode = ref<TreeNode | null>(null)

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

const openCreateModal = (path: string = '', type: 'file' | 'folder' = 'file') => {
  parentPath.value = path
  createType.value = type
  newName.value = ''
  showCreateModal.value = true
}

const handleCreate = async () => {
  if (!newName.value) return
  
  const fullPath = parentPath.value ? `${parentPath.value}/${newName.value}` : newName.value
  
  try {
    const wails = (window as any).go?.main?.App
    if (wails) {
      if (createType.value === 'folder') {
        await wails.CreateFolder(fullPath)
        message.success('Folder created')
      } else {
        const tmpl: Template = { mode: 'request', subject: '', payload: '' }
        await wails.CreateTemplate(fullPath, tmpl)
        message.success('Template created')
      }
      await loadTree()
      showCreateModal.value = false
      newName.value = ''
    } else {
      // HTTP fallback
      if (createType.value === 'file') {
        const tmpl: Template = { mode: 'request', subject: '', payload: '' }
        await ApiService.saveTemplate(fullPath, tmpl)
        message.success('Created ' + fullPath)
        await loadTree()
        showCreateModal.value = false
        newName.value = ''
      }
    }
  } catch (e: any) {
    message.error('Failed to create: ' + e.message)
  }
}

const handleDelete = async (path: string) => {
  try {
    const wails = (window as any).go?.main?.App
    if (wails) {
      await wails.DeleteTemplate(path)
      message.success('Deleted')
      if (currentPath.value === path) {
        currentPath.value = ''
        currentTemplate.value = null
      }
      await loadTree()
    }
  } catch (e: any) {
    message.error('Failed to delete: ' + e.message)
  }
}

const handleNodeRightClick = ({ option, event }: { option: TreeNode, event: MouseEvent }) => {
  event.preventDefault()
  contextNode.value = option
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

const contextMenuOptions: DropdownOption[] = [
  {
    label: 'New File',
    key: 'newFile',
    icon: () => h(NIcon, null, { default: () => h(DocumentOutline) })
  },
  {
    label: 'New Folder',
    key: 'newFolder',
    icon: () => h(NIcon, null, { default: () => h(FolderOutline) })
  },
  {
    label: 'Delete',
    key: 'delete',
    icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
  }
]

const handleContextMenuSelect = (key: string) => {
  showContextMenu.value = false
  if (!contextNode.value) return
  
  const node = contextNode.value
  
  switch (key) {
    case 'newFile':
      openCreateModal(node.is_folder ? node.path : '', 'file')
      break
    case 'newFolder':
      openCreateModal(node.is_folder ? node.path : '', 'folder')
      break
    case 'delete':
      handleDelete(node.path)
      break
  }
}

const handleClickOutside = () => {
  showContextMenu.value = false
}

const renderPrefix = ({ option }: { option: TreeOption }) => {
  const treeNode = option as any
  return h(NIcon, null, {
    default: () => h(treeNode.is_folder ? FolderOutline : DocumentOutline)
  })
}
</script>

<template>
  <n-layout has-sider style="height: 100%" @click="handleClickOutside">
    <n-layout-sider
      bordered
      width="300"
      content-style="padding: 10px; display: flex; flex-direction: column;"
    >
      <div class="mb-2 flex justify-between items-center">
        <span class="font-bold">Templates</span>
        <n-space size="small">
          <n-button size="tiny" @click="openCreateModal('', 'file')">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            File
          </n-button>
          <n-button size="tiny" @click="openCreateModal('', 'folder')">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            Folder
          </n-button>
        </n-space>
      </div>
      <n-tree
        block-line
        :data="treeData"
        key-field="path"
        label-field="name"
        children-field="children"
        :selected-keys="selectedKeys"
        @update:selected-keys="handleUpdateValue"
        @node-props="(info) => ({
          onContextmenu: (e: MouseEvent) => handleNodeRightClick({ option: info.option as TreeNode, event: e })
        })"
        :render-prefix="renderPrefix"
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

  <!-- Create Modal -->
  <n-modal v-model:show="showCreateModal" preset="dialog" :title="`Create New ${createType === 'folder' ? 'Folder' : 'Template'}`">
    <n-space vertical>
      <n-input 
        v-model:value="newName" 
        :placeholder="`${createType === 'folder' ? 'Folder' : 'Template'} Name`" 
        @keyup.enter="handleCreate"
      />
      <div class="flex justify-end">
        <n-space>
          <n-button @click="showCreateModal = false">Cancel</n-button>
          <n-button type="primary" @click="handleCreate" :disabled="!newName">Create</n-button>
        </n-space>
      </div>
    </n-space>
  </n-modal>

  <!-- Context Menu -->
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    :x="contextMenuX"
    :y="contextMenuY"
    :options="contextMenuOptions"
    :show="showContextMenu"
    @select="handleContextMenuSelect"
    @clickoutside="showContextMenu = false"
  />
</template>
