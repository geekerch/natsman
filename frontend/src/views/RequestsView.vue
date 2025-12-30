<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent, NTree, NCard, NEmpty } from 'naive-ui'
import { ApiService } from '../services/api'
import { TreeNode } from '../types/domain'

const treeData = ref<TreeNode[] | undefined>(undefined)
const selectedKeys = ref<string[]>([])

onMounted(async () => {
  try {
    const root = await ApiService.getTemplates()
    // NTree expects an array of nodes. Our API returns a root node.
    // We might want to show the children of the root if the root is just a container.
    treeData.value = root.children ? root.children : [root]
  } catch (e) {
    console.error(e)
  }
})

const handleUpdateValue = (keys: string[], option: any[]) => {
  selectedKeys.value = keys
  if (option.length > 0 && !option[0].is_folder) {
    // Load template logic here
    console.log("Selected template:", option[0].path)
  }
}
</script>

<template>
  <n-layout has-sider style="height: 100%">
    <n-layout-sider
      bordered
      width="300"
      content-style="padding: 10px;"
    >
      <div class="mb-2 font-bold">Templates</div>
      <n-tree
        block-line
        :data="treeData"
        key-field="path"
        label-field="name"
        children-field="children"
        :selected-keys="selectedKeys"
        @update:selected-keys="handleUpdateValue"
        selectable
      />
    </n-layout-sider>
    <n-layout-content content-style="padding: 20px;">
      <n-card v-if="selectedKeys.length > 0" title="Request Editor">
        <!-- Editor will go here -->
        Selected: {{ selectedKeys[0] }}
      </n-card>
      <div v-else class="flex h-full items-center justify-center">
        <n-empty description="Select a template to start" />
      </div>
    </n-layout-content>
  </n-layout>
</template>
