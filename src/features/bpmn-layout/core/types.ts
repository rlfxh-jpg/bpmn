import type {
  BpmnValidationBusinessObject,
  BpmnValidationDefinitions
} from '../../bpmn-validation/types'

export type BpmnLayoutElement = {
  id: string
  type: string
  name?: string
  nodeKey?: string
  nodeData?: Record<string, string>
  businessObject: BpmnValidationBusinessObject | null
  parentId?: string
  incomingIds: string[]
  outgoingIds: string[]
  x: number
  y: number
  width: number
  height: number
}

export type BpmnLayoutContext = {
  xml: string
  definitions: BpmnValidationDefinitions | null
  elements: BpmnLayoutElement[]
  elementTypes: string[]
}

export type BpmnLayoutUpdate = {
  elementId: string
  x: number
  y: number
}

export type BpmnLayoutStrategyResult = {
  updates: BpmnLayoutUpdate[]
}

export type BpmnLayoutStrategy = {
  key: string
  label: string
  execute: (context: BpmnLayoutContext) => BpmnLayoutStrategyResult
}
