export type BpmnValidationSeverity = 'error' | 'warning'

export type BpmnValidationIssue = {
  ruleId: string
  message: string
  severity: BpmnValidationSeverity
  elementId?: string
  elementType?: string
}

export type BpmnValidationResult = {
  valid: boolean
  issues: BpmnValidationIssue[]
}

export type BpmnValidationBusinessObject = {
  $type?: string
  id?: string
  name?: string
  $parent?: BpmnValidationBusinessObject
  [key: string]: unknown
}

export type BpmnValidationElement = {
  id: string
  type: string
  name?: string
  nodeKey?: string
  nodeData?: Record<string, string>
  businessObject: BpmnValidationBusinessObject | null
  parentId?: string
  incomingIds: string[]
  outgoingIds: string[]
}

export type BpmnValidationDefinitions = BpmnValidationBusinessObject

export type BpmnValidationContext = {
  xml: string
  definitions: BpmnValidationDefinitions | null
  elements: BpmnValidationElement[]
  elementTypes: string[]
}

export type BpmnValidationRule = {
  id: string
  validate: (context: BpmnValidationContext) => BpmnValidationIssue[]
}
