export type BpmnNodeFieldDefinition = {
  key: string
  label: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
}

export type BpmnNodePaletteEntry = {
  group: string
  className: string
  title: string
}

export type BpmnNodeStyleDefinition = {
  fill: string
  stroke: string
  label?: string
  badgeText?: string
}

export type BpmnNodeDefinition = {
  key: string
  baseType: 'bpmn:UserTask' | 'bpmn:ServiceTask'
  displayName: string
  palette: BpmnNodePaletteEntry
  style: BpmnNodeStyleDefinition
  fields: BpmnNodeFieldDefinition[]
  initBusinessFields: () => Record<string, string>
  matches?: (businessObject: Record<string, unknown> | null | undefined) => boolean
}

export type BpmnNodeRegistry = {
  list: () => BpmnNodeDefinition[]
  getByKey: (key: string) => BpmnNodeDefinition | undefined
}
