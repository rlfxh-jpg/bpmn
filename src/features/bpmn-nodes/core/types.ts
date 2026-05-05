import type { BpmnValidationBusinessObject } from '../../bpmn-validation/types'

/**
 * 运行时画布元素的本地收敛类型。
 *
 * 该类型不是完整的 bpmn-js 官方 element 类型，而是当前节点插件系统真正依赖的最小字段集合。
 */
export type RuntimeDiagramElement = {
  id?: string
  type?: string
  businessObject?: BpmnValidationBusinessObject
}

/**
 * 单个节点在左侧工具栏中的展示配置。
 */
export type NodePaletteConfig = {
  group: string
  className: string
  title: string
}

/**
 * 单个节点在画布上的外观配置。
 *
 * 第一版主要驱动 marker / overlay / CSS 呈现，而不是直接渲染底层 SVG。
 */
export type NodeRendererConfig = {
  fill: string
  stroke: string
  label?: string
  badgeText?: string
}

/**
 * 单个节点提供的 moddle descriptor 片段。
 */
export type NodeModdleFragment = {
  types: unknown[]
}

/**
 * 向节点事件处理函数注入的运行时服务集合。
 */
export type NodeRuntimeServices = {
  getNodeKey: typeof import('./services/extension-field-service').getNodeKey
  getNodeData: typeof import('./services/extension-field-service').getNodeData
  setNodeKey: typeof import('./services/extension-field-service').setNodeKey
  setNodeData: typeof import('./services/extension-field-service').setNodeData
}

/**
 * 节点事件处理函数收到的统一 payload。
 */
export type NodeEventPayload = {
  event: { element?: RuntimeDiagramElement }
  element: RuntimeDiagramElement
  services: NodeRuntimeServices
  moddle: {
    create: (type: string, attrs?: Record<string, unknown>) => Record<string, unknown>
  }
}

/**
 * 每个节点可选提供的一组事件处理逻辑。
 */
export type NodeEventHandlers = {
  click?: (payload: NodeEventPayload) => void
  created?: (payload: NodeEventPayload) => void
  changed?: (payload: NodeEventPayload) => void
}

/**
 * 单个业务节点插件的统一契约。
 *
 * 节点插件目录只需要输出这个结构，系统层就可以统一聚合其 palette / renderer / events / moddle。
 */
export type BpmnNodePlugin = {
  type: string
  baseType: 'bpmn:UserTask' | 'bpmn:ServiceTask'
  moddle?: NodeModdleFragment
  palette?: NodePaletteConfig
  renderer?: NodeRendererConfig
  events?: NodeEventHandlers
  is: (element: RuntimeDiagramElement) => boolean
}

/**
 * 插件注册中心的最小能力集。
 */
export type BpmnNodePluginRegistry = {
  list: () => BpmnNodePlugin[]
  getByType: (type: string) => BpmnNodePlugin | undefined
}
