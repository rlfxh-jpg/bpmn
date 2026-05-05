<!-- BpmnEditor 只负责
初始化 bpmn-js
导入导出 XML/SVG
选中节点事件
位置/布局操作
获取当前元素快照
更新 BPMN 节点基础属性或扩展属性 -->
<script setup lang="ts">
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type {
  BpmnValidationBusinessObject,
  BpmnValidationContext,
  BpmnValidationElement
} from '../../features/bpmn-validation/types'
import { executeBpmnLayoutStrategy } from '../../features/bpmn-layout/core/executor'
import type {
  BpmnLayoutContext,
  BpmnLayoutElement,
  BpmnLayoutStrategy
} from '../../features/bpmn-layout/core/types'

const canvasRef = ref<HTMLDivElement | null>(null)
const isReady = ref(false)
const errorMessage = ref('')

let modeler: BpmnModeler | null = null

type DiagramElement = {
  id?: string
  type?: string
  x?: number
  y?: number
  width?: number
  height?: number
  businessObject?: BpmnValidationBusinessObject
  parent?: { id?: string }
  incoming?: Array<{ id?: string }>
  outgoing?: Array<{ id?: string }>
}

type ModelingService = {
  moveShape: (shape: DiagramElement, delta: { x: number; y: number }) => void
}

type CanvasService = {
  zoom: (level: string) => void
}

const initModeler = async () => {
  if (!canvasRef.value) {
    return
  }

  try {
    modeler = new BpmnModeler({
      container: canvasRef.value
    })
    isReady.value = true
    errorMessage.value = ''
  } catch (error) {
    isReady.value = false
    errorMessage.value = error instanceof Error ? error.message : 'BPMN 编辑器初始化失败'
  }
}

const importXml = async (xml: string) => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  await modeler.importXML(xml)
  ;(modeler.get('canvas') as CanvasService).zoom('fit-viewport')
}

const saveXml = async () => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const result = await modeler.saveXML({ format: true })
  return result.xml ?? ''
}

const saveSvg = async () => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const result = await modeler.saveSVG()
  return result.svg ?? ''
}

const getLayoutElements = (): BpmnLayoutElement[] => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const elementRegistry = modeler.get('elementRegistry') as {
    getAll: () => DiagramElement[]
  }

  return elementRegistry
    .getAll()
    .filter(
      (
        element
      ): element is DiagramElement & {
        id: string
        type: string
        x: number
        y: number
        width: number
        height: number
      } => {
        return Boolean(
          element.id &&
            element.type &&
            typeof element.x === 'number' &&
            typeof element.y === 'number' &&
            typeof element.width === 'number' &&
            typeof element.height === 'number'
        )
      }
    )
    .filter((element) => element.type !== 'label')
    .map((element) => ({
      id: element.id,
      type: element.type,
      name:
        typeof element.businessObject?.name === 'string' ? element.businessObject.name : undefined,
      businessObject: element.businessObject ?? null,
      parentId: element.parent?.id,
      incomingIds: (element.incoming ?? [])
        .map((incomingElement) => incomingElement.id)
        .filter((id): id is string => Boolean(id)),
      outgoingIds: (element.outgoing ?? [])
        .map((outgoingElement) => outgoingElement.id)
        .filter((id): id is string => Boolean(id)),
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    }))
}

const getLayoutContext = async (): Promise<BpmnLayoutContext> => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const xml = await saveXml()
  const elements = getLayoutElements()
  const elementTypes = elements.map((element) => element.type)
  const definitions = (modeler.getDefinitions?.() ?? null) as BpmnValidationBusinessObject | null

  return {
    xml,
    definitions,
    elements,
    elementTypes
  }
}

const applyLayoutStrategy = async (strategy: BpmnLayoutStrategy) => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  if (strategy.key === 'fit-viewport') {
    ;(modeler.get('canvas') as CanvasService).zoom('fit-viewport')
    return
  }

  const layoutContext = await getLayoutContext()
  const result = executeBpmnLayoutStrategy(strategy, layoutContext)
  const modeling = modeler.get('modeling') as ModelingService
  const elementRegistry = modeler.get('elementRegistry') as {
    get: (id: string) => DiagramElement | undefined
  }

  result.updates.forEach((update) => {
    const target = elementRegistry.get(update.elementId)
    if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') {
      return
    }

    modeling.moveShape(target, {
      x: update.x - target.x,
      y: update.y - target.y
    })
  })
}

const getValidationContext = async (): Promise<BpmnValidationContext> => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const xml = await saveXml()
  const elementRegistry = modeler.get('elementRegistry') as {
    getAll: () => DiagramElement[]
  }
  const elements: BpmnValidationElement[] = elementRegistry
    .getAll()
    .filter((element): element is DiagramElement & { id: string; type: string } => {
      return Boolean(element.id && element.type)
    })
    .map((element) => ({
      id: element.id,
      type: element.type,
      name:
        typeof element.businessObject?.name === 'string' ? element.businessObject.name : undefined,
      businessObject: element.businessObject ?? null,
      parentId: element.parent?.id,
      incomingIds: (element.incoming ?? [])
        .map((incomingElement) => incomingElement.id)
        .filter((id): id is string => Boolean(id)),
      outgoingIds: (element.outgoing ?? [])
        .map((outgoingElement) => outgoingElement.id)
        .filter((id): id is string => Boolean(id))
    }))
  const elementTypes = elements.map((element) => element.type)
  const definitions = (modeler.getDefinitions?.() ?? null) as BpmnValidationBusinessObject | null

  return {
    xml,
    definitions,
    elements,
    elementTypes
  }
}

const reset = async () => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  ;(modeler.get('canvas') as CanvasService).zoom('fit-viewport')
}

defineExpose({
  getValidationContext,
  getLayoutContext,
  importXml,
  applyLayoutStrategy,
  saveXml,
  saveSvg,
  reset
})

onMounted(() => {
  void initModeler()
})

onBeforeUnmount(() => {
  modeler?.destroy()
  modeler = null
})
</script>

<template>
  <div class="bpmn-editor">
    <el-alert
      v-if="errorMessage"
      type="error"
      :closable="false"
      show-icon
      :title="errorMessage"
    />
    <div v-show="isReady" ref="canvasRef" class="bpmn-editor__canvas"></div>
  </div>
</template>
