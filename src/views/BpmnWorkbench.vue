<script setup lang="ts">
import { Download, Operation, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { nextTick, onMounted, ref } from 'vue'
import BpmnEditor from '../components/bpmn/BpmnEditor.vue'
import defaultXml from '../assets/default.bpmn?raw'
import { defaultBpmnLayoutRegistry } from '../features/bpmn-layout/presets/default-strategies'
import type { BpmnLayoutContext, BpmnLayoutStrategy } from '../features/bpmn-layout/core/types'
import { defaultBpmnValidationRules } from '../features/bpmn-validation/default-rules'
import { validateBpmnBeforeSave } from '../features/bpmn-validation/validator'
import type { BpmnValidationContext } from '../features/bpmn-validation/types'

type BpmnEditorExposed = {
  getLayoutContext: () => Promise<BpmnLayoutContext>
  getValidationContext: () => Promise<BpmnValidationContext>
  applyLayoutStrategy: (strategy: BpmnLayoutStrategy) => Promise<void>
  importXml: (xml: string) => Promise<void>
  saveXml: () => Promise<string>
  saveSvg: () => Promise<string>
  reset: () => Promise<void>
}

const editorRef = ref<BpmnEditorExposed | null>(null)
const lastOutput = ref('等待操作')
const layoutStrategies = defaultBpmnLayoutRegistry.list()

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

const handleApplyLayout = async (strategyKey: string) => {
  try {
    const editor = await waitForEditor()
    const strategy = defaultBpmnLayoutRegistry.get(strategyKey)

    if (!strategy) {
      throw new Error(`未找到布局策略: ${strategyKey}`)
    }

    await editor.applyLayoutStrategy(strategy)
    ElMessage.success(`已执行布局策略：${strategy.label}`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '布局格式化失败')
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

onMounted(() => {
  void loadDefaultDiagram()
})
</script>

<template>
  <el-container class="workbench">
    <el-header class="workbench__header">
      <div class="workbench__title">
        <h1>BPMN Designer</h1>
        <p>Vue 3 + TypeScript + Element Plus + bpmn-js</p>
      </div>
      <div class="workbench__actions">
        <el-dropdown @command="(command:string) => handleApplyLayout(command)">
          <el-button :icon="Operation">
            格式化布局
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="strategy in layoutStrategies"
                :key="strategy.key"
                :command="strategy.key"
              >
                {{ strategy.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" :icon="Download" @click="handleExportXml">导出 BPMN</el-button>
        <el-button :icon="Download" @click="handleExportSvg">导出 SVG</el-button>
        <el-button :icon="RefreshRight" @click="handleReset">重置画布</el-button>
      </div>
    </el-header>
    <el-container class="workbench__body">
      <el-main class="workbench__main">
        <BpmnEditor ref="editorRef" />
      </el-main>
      <el-aside width="360px" class="workbench__aside">
        <el-card shadow="never" class="workbench__panel workbench__panel--business">
          <template #header>预留区域</template>
          <el-empty description="bpmn-nodes 正在重构中，业务节点扩展界面暂时移除" />
        </el-card>
        <el-card shadow="never" class="workbench__panel workbench__panel--output">
          <template #header>输出结果</template>
          <pre class="workbench__output">{{ lastOutput }}</pre>
        </el-card>
      </el-aside>
    </el-container>
  </el-container>
</template>
