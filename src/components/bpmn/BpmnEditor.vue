<script setup lang="ts">
import BpmnModeler from 'bpmn-js/lib/Modeler'
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule
} from 'bpmn-js-properties-panel'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type {
  BpmnValidationBusinessObject,
  BpmnValidationContext,
  BpmnValidationElement
} from '../../features/bpmn-validation/types'
import { executeBpmnLayoutStrategy } from '../../features/bpmn-layout/core/executor'
import type {
  BpmnLayoutElement,
  BpmnLayoutContext,
  BpmnLayoutStrategy
} from '../../features/bpmn-layout/core/types'
import { createCreateBehaviorModule } from '../../features/bpmn-nodes/core/modules/create-behavior'
import { createPaletteProviderModule } from '../../features/bpmn-nodes/core/modules/palette-provider'
import { createCustomRendererModule } from '../../features/bpmn-nodes/core/modules/renderer'
import {
  getNodeData,
  getNodeKey,
  setNodeData
} from '../../features/bpmn-nodes/core/services/extension-field-service'
import { createNodeRegistryService } from '../../features/bpmn-nodes/core/services/node-registry-service'
import type { BpmnNodeDefinition } from '../../features/bpmn-nodes/core/types'
import customModdleDescriptor from '../../features/bpmn-nodes/core/moddle/custom.json'
import { defaultEnabledNodeDefinitions } from '../../features/bpmn-nodes/presets/default-nodes'

type SelectedNodeSnapshot = {
  id: string
  type: string
  name: string
  nodeKey: string
  nodeData: Record<string, string>
}

const emit = defineEmits<{
  selectionChange: [snapshot: SelectedNodeSnapshot | null]
}>()

const canvasRef = ref<HTMLDivElement | null>(null)
const propertiesPanelRef = ref<HTMLDivElement | null>(null)
const isReady = ref(false)
const errorMessage = ref('')
const selectedElementId = ref('')

let modeler: BpmnModeler | null = null
const registryService = createNodeRegistryService(defaultEnabledNodeDefinitions)

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

type SelectionService = {
  get: () => DiagramElement[]
}

type EventBusService = {
  on: (
    eventName: string,
    priorityOrHandler: number | ((payload: { newSelection?: DiagramElement[] }) => void),
    maybeHandler?: (payload: { newSelection?: DiagramElement[] }) => void
  ) => void
}

type ModelingService = {
  updateProperties: (element: DiagramElement, properties: Record<string, unknown>) => void
  moveShape: (shape: DiagramElement, delta: { x: number; y: number }) => void
}

type ModdleService = {
  create: (type: string, attrs?: Record<string, unknown>) => Record<string, unknown>
}

type CanvasService = {
  addMarker: (elementId: string, marker: string) => void
  removeMarker: (elementId: string, marker: string) => void
  zoom: (level: string) => void
}

type OverlaysService = {
  add: (
    elementId: string,
    options: {
      position: { top?: number; left?: number; right?: number; bottom?: number }
      html: HTMLElement
    }
  ) => string | number
  remove: (overlayId: string | number) => void
}

const activeNodeMarkers = new Map<string, string>()
const activeNodeOverlays = new Map<string, string | number>()

const initModeler = async () => {
  if (!canvasRef.value || !propertiesPanelRef.value) {
    return
  }

  try {
    modeler = new BpmnModeler({
      container: canvasRef.value,
      moddleExtensions: {
        custom: customModdleDescriptor
      },
      propertiesPanel: {
        parent: propertiesPanelRef.value
      },
      additionalModules: [
        BpmnPropertiesPanelModule as any,
        BpmnPropertiesProviderModule as any,
        createPaletteProviderModule(registryService) as any,
        createCreateBehaviorModule(registryService) as any,
        createCustomRendererModule() as any
      ]
    })
    bindSelectionListener()
    isReady.value = true
    errorMessage.value = ''
  } catch (error) {
    isReady.value = false
    errorMessage.value = error instanceof Error ? error.message : 'BPMN 编辑器初始化失败'
  }
}

const bindSelectionListener = () => {
  if (!modeler) {
    return
  }

  const eventBus = modeler.get('eventBus') as EventBusService
  eventBus.on('selection.changed', ({ newSelection }) => {
    selectedElementId.value = newSelection?.[0]?.id ?? ''
    emitSelectionChange()
  })

  eventBus.on('commandStack.shape.create.postExecuted', () => {
    applyCustomNodeDecorations()
    emitSelectionChange()
  })

  eventBus.on('import.done', () => {
    applyCustomNodeDecorations()
    emitSelectionChange()
  })
}

const importXml = async (xml: string) => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  await modeler.importXML(xml)
  ;(modeler.get('canvas') as CanvasService).zoom('fit-viewport')
  applyCustomNodeDecorations()
  emitSelectionChange()
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

const getSelectedElement = (): DiagramElement | null => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const selection = modeler.get('selection') as SelectionService
  return selection.get()?.[0] ?? null
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
    .filter((element): element is DiagramElement & { id: string; type: string; x: number; y: number; width: number; height: number } => {
      return Boolean(
        element.id &&
          element.type &&
          typeof element.x === 'number' &&
          typeof element.y === 'number' &&
          typeof element.width === 'number' &&
          typeof element.height === 'number'
      )
    })
    .filter((element) => element.type !== 'label')
    .map((element) => ({
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    }))
}

const getSelectedNodeSnapshot = () => {
  const selectedElement = getSelectedElement()
  if (!selectedElement?.id || !selectedElement.type) {
    return null
  }

  return {
    id: selectedElement.id,
    type: selectedElement.type,
    name:
      typeof selectedElement.businessObject?.name === 'string'
        ? selectedElement.businessObject.name
        : '',
    nodeKey: getNodeKey(selectedElement.businessObject),
    nodeData: getNodeData(selectedElement.businessObject)
  }
}

const emitSelectionChange = () => {
  emit('selectionChange', getSelectedNodeSnapshot() as any)
}

const clearCustomNodeDecorations = () => {
  if (!modeler) {
    return
  }

  const canvas = modeler.get('canvas') as CanvasService
  const overlays = modeler.get('overlays') as OverlaysService

  activeNodeMarkers.forEach((marker, elementId) => {
    canvas.removeMarker(elementId, marker)
  })
  activeNodeMarkers.clear()

  activeNodeOverlays.forEach((overlayId) => {
    overlays.remove(overlayId)
  })
  activeNodeOverlays.clear()
}

const applyCustomNodeDecorations = () => {
  if (!modeler) {
    return
  }

  clearCustomNodeDecorations()

  const elementRegistry = modeler.get('elementRegistry') as {
    getAll: () => DiagramElement[]
  }
  const canvas = modeler.get('canvas') as CanvasService
  const overlays = modeler.get('overlays') as OverlaysService

  elementRegistry.getAll().forEach((element) => {
    if (!element.id || !element.businessObject) {
      return
    }

    const nodeKey = getNodeKey(element.businessObject)
    const definition = registryService.getDefinition(nodeKey)
    if (!definition) {
      return
    }

    const marker = `custom-node--${definition.key}`
    canvas.addMarker(element.id, marker)
    activeNodeMarkers.set(element.id, marker)

    if (!definition.style.label) {
      return
    }

    const badge = document.createElement('div')
    badge.className = `bpmn-node-badge bpmn-node-badge--${definition.key}`
    badge.textContent = definition.style.label

    const overlayId = overlays.add(element.id, {
      position: {
        top: 6,
        left: 6
      },
      html: badge
    })

    activeNodeOverlays.set(element.id, overlayId)
    })
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

const updateSelectedNodeField = (fieldKey: string, value: string) => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const selectedElement = getSelectedElement()
  if (!selectedElement?.businessObject) {
    throw new Error('当前没有选中可编辑的节点')
  }

  const moddle = modeler.get('moddle') as ModdleService
  setNodeData(moddle, selectedElement.businessObject, {
    [fieldKey]: value
  })

  const modeling = modeler.get('modeling') as ModelingService
  modeling.updateProperties(selectedElement, {})
  emitSelectionChange()
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

  applyCustomNodeDecorations()
  emitSelectionChange()
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
      nodeKey: getNodeKey(element.businessObject),
      nodeData: getNodeData(element.businessObject),
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

const getNodeDefinitions = () => registryService.getDefinitions()
const getNodeDefinition = (nodeKey: string): BpmnNodeDefinition | undefined =>
  registryService.getDefinition(nodeKey)

defineExpose({
  getValidationContext,
  getNodeDefinition,
  getNodeDefinitions,
  getSelectedNodeSnapshot,
  getLayoutContext,
  importXml,
  applyLayoutStrategy,
  saveXml,
  saveSvg,
  updateSelectedNodeField,
  reset
})

onMounted(() => {
  void initModeler()
})

onBeforeUnmount(() => {
  clearCustomNodeDecorations()
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
    <div v-show="isReady" class="bpmn-editor__layout">
      <div ref="canvasRef" class="bpmn-editor__canvas"></div>
      <div ref="propertiesPanelRef" class="bpmn-editor__properties"></div>
    </div>
  </div>
</template>
