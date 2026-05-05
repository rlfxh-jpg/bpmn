import type { BpmnValidationBusinessObject } from '../../bpmn-validation/types'

export type RuntimeDiagramElement = {
  id?: string
  type?: string
  businessObject?: BpmnValidationBusinessObject
}

export type NodePaletteConfig = {
  group: string
  className: string
  title: string
}

export type NodeRendererConfig = {
  fill: string
  stroke: string
  label?: string
  badgeText?: string
}

export type NodeModdleFragment = {
  name: string
  uri: string
  prefix: string
  xml?: {
    tagAlias?: string
  }
  types: unknown[]
}

export type NodeEventPayload = {
  event: { element?: RuntimeDiagramElement }
  element: RuntimeDiagramElement
  moddle: {
    create: (type: string, attrs?: Record<string, unknown>) => Record<string, unknown>
  }
}

export type NodeEventHandlers = {
  click?: (payload: NodeEventPayload) => void
  created?: (payload: NodeEventPayload) => void
  changed?: (payload: NodeEventPayload) => void
}

export type BpmnNodePlugin = {
  type: string
  baseType: 'bpmn:UserTask' | 'bpmn:ServiceTask'
  moddle?: NodeModdleFragment
  palette?: NodePaletteConfig
  renderer?: NodeRendererConfig
  events?: NodeEventHandlers
  is: (element: RuntimeDiagramElement) => boolean
}

export type BpmnNodePluginRegistry = {
  list: () => BpmnNodePlugin[]
  getByType: (type: string) => BpmnNodePlugin | undefined
}
