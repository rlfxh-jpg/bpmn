<script setup lang="ts">
import { Download, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, ref } from 'vue'
import BpmnEditor from '../components/bpmn/BpmnEditor.vue'
import defaultXml from '../assets/default.bpmn?raw'
import { defaultBpmnValidationRules } from '../features/bpmn-validation/default-rules'
import { validateBpmnBeforeSave } from '../features/bpmn-validation/validator'
import type { BpmnValidationContext } from '../features/bpmn-validation/types'
import type { BpmnNodeDefinition } from '../features/bpmn-nodes/core/types'

type SelectedNodeSnapshot = {
  id: string
  type: string
  name: string
  nodeKey: string
  nodeData: Record<string, string>
}

type BpmnEditorExposed = {
  getValidationContext: () => Promise<BpmnValidationContext>
  getNodeDefinition: (nodeKey: string) => BpmnNodeDefinition | undefined
  getNodeDefinitions: () => BpmnNodeDefinition[]
  getSelectedNodeSnapshot: () => SelectedNodeSnapshot | null
  importXml: (xml: string) => Promise<void>
  saveXml: () => Promise<string>
  saveSvg: () => Promise<string>
  reset: () => Promise<void>
  updateSelectedNodeField: (fieldKey: string, value: string) => void
}

const editorRef = ref<BpmnEditorExposed | null>(null)
const lastOutput = ref('等待操作')
const selectedNodeKey = ref('')
const selectedNodeName = ref('')
const selectedNodeFields = ref<Record<string, string>>({})

const buildBpmnFileName = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  const hours = `${now.getHours()}`.padStart(2, '0')
  const minutes = `${now.getMinutes()}`.padStart(2, '0')
  const seconds = `${now.getSeconds()}`.padStart(2, '0')

  return `process-${year}${month}${day}${hours}${minutes}${seconds}.bpmn`
}

const downloadTextFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(downloadUrl)
}

const waitForEditor = async () => {
  await nextTick()
  if (!editorRef.value) {
    throw new Error('BPMN 编辑器尚未挂载')
  }

  return editorRef.value
}

const enabledNodeDefinitions = computed(() => editorRef.value?.getNodeDefinitions() ?? [])

const selectedNodeDefinition = computed(() =>
  enabledNodeDefinitions.value.find((definition) => definition.key === selectedNodeKey.value)
)

const loadDefaultDiagram = async () => {
  try {
    const editor = await waitForEditor()
    await editor.importXml(defaultXml)
    lastOutput.value = '默认 BPMN 图已加载'
  } catch (error) {
    const message = error instanceof Error ? error.message : '默认 BPMN 导入失败'
    lastOutput.value = message
    ElMessage.error(message)
  }
}

const refreshSelectedNodeState = async () => {
  try {
    const editor = await waitForEditor()
    const selectedElement = editor.getSelectedNodeSnapshot()

    if (!selectedElement) {
      selectedNodeKey.value = ''
      selectedNodeName.value = ''
      selectedNodeFields.value = {}
      return
    }

    selectedNodeKey.value = selectedElement.nodeKey ?? ''
    selectedNodeName.value = selectedElement.name ?? ''
    selectedNodeFields.value = selectedElement.nodeData ?? {}
  } catch {
    selectedNodeKey.value = ''
    selectedNodeName.value = ''
    selectedNodeFields.value = {}
  }
}

const updateBusinessField = async (fieldKey: string, value: string) => {
  try {
    const editor = await waitForEditor()
    editor.updateSelectedNodeField(fieldKey, value)
    selectedNodeFields.value = {
      ...selectedNodeFields.value,
      [fieldKey]: value
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '业务字段更新失败')
  }
}

const handleExportXml = async () => {
  try {
    const editor = await waitForEditor()
    const validationContext = await editor.getValidationContext()
    const validationResult = validateBpmnBeforeSave(
      validationContext,
      defaultBpmnValidationRules
    )

    if (!validationResult.valid) {
      const validationMessage = validationResult.issues
        .map((issue, index) => `${index + 1}. ${issue.message}`)
        .join('\n')

      lastOutput.value = validationMessage
      ElMessage.error('BPMN 校验未通过，已阻止导出')
      return
    }

    const xml = validationContext.xml

    lastOutput.value = xml
    downloadTextFile(xml, buildBpmnFileName(), 'application/xml;charset=utf-8')
    ElMessage.success('BPMN 文件导出成功')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'BPMN 文件导出失败')
  }
}

const handleExportSvg = async () => {
  try {
    const editor = await waitForEditor()
    lastOutput.value = await editor.saveSvg()
    ElMessage.success('SVG 导出成功')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'SVG 导出失败')
  }
}

const handleReset = async () => {
  try {
    const editor = await waitForEditor()
    await editor.reset()
    ElMessage.success('画布已重置')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '画布重置失败')
  }
}

const handleSelectionMock = async () => {
  await refreshSelectedNodeState()
}

onMounted(() => {
  void loadDefaultDiagram()
  void handleSelectionMock()
})

const handleSelectionChange = (snapshot: SelectedNodeSnapshot | null) => {
  if (!snapshot) {
    selectedNodeKey.value = ''
    selectedNodeName.value = ''
    selectedNodeFields.value = {}
    return
  }

  selectedNodeKey.value = snapshot.nodeKey
  selectedNodeName.value = snapshot.name
  selectedNodeFields.value = snapshot.nodeData
}
</script>

<template>
  <el-container class="workbench">
    <el-header class="workbench__header">
      <div class="workbench__title">
        <h1>BPMN Designer</h1>
        <p>Vue 3 + TypeScript + Element Plus + bpmn-js</p>
      </div>
      <div class="workbench__actions">
        <el-button type="primary" :icon="Download" @click="handleExportXml">导出 BPMN</el-button>
        <el-button :icon="Download" @click="handleExportSvg">导出 SVG</el-button>
        <el-button :icon="RefreshRight" @click="handleReset">重置画布</el-button>
      </div>
    </el-header>
    <el-container class="workbench__body">
      <el-main class="workbench__main">
        <BpmnEditor ref="editorRef" @selection-change="handleSelectionChange" />
      </el-main>
      <el-aside width="360px" class="workbench__aside">
        <el-card shadow="never" class="workbench__panel workbench__panel--business">
          <template #header>业务属性</template>
          <template v-if="selectedNodeDefinition">
            <div class="workbench__business-header">
              <strong>{{ selectedNodeDefinition.displayName }}</strong>
              <span>{{ selectedNodeName || '未命名节点' }}</span>
            </div>
            <el-form label-position="top">
              <el-form-item
                v-for="field in selectedNodeDefinition.fields"
                :key="field.key"
                :label="field.label"
              >
                <el-input
                  :model-value="selectedNodeFields[field.key] ?? ''"
                  :placeholder="field.placeholder ?? ''"
                  @update:model-value="(value:any) => updateBusinessField(field.key, value)"
                />
              </el-form-item>
            </el-form>
          </template>
          <el-empty v-else description="请选择扩展节点查看业务属性" />
        </el-card>
        <el-card shadow="never" class="workbench__panel workbench__panel--output">
          <template #header>输出结果</template>
          <pre class="workbench__output">{{ lastOutput }}</pre>
        </el-card>
      </el-aside>
    </el-container>
  </el-container>
</template>
