const CUSTOM_NODE_META_TYPE = 'custom:NodeMeta'
const CUSTOM_FIELD_TYPE = 'custom:Field'

type RawBusinessObject = Record<string, unknown> & {
  extensionElements?: {
    values?: unknown[]
  }
}

type RawModdleElement = Record<string, unknown> & {
  $type?: string
  $parent?: unknown
  values?: unknown[]
  fields?: unknown[]
  nodeKey?: string
  key?: string
  value?: string
}

type ModdleLike = {
  create: (type: string, attrs?: Record<string, unknown>) => RawModdleElement
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getExtensionValues = (businessObject: RawBusinessObject | null | undefined) => {
  if (!businessObject?.extensionElements || !Array.isArray(businessObject.extensionElements.values)) {
    return []
  }

  return businessObject.extensionElements.values.filter(isRecord) as RawModdleElement[]
}

const getNodeMeta = (businessObject: RawBusinessObject | null | undefined) =>
  getExtensionValues(businessObject).find((value) => value.$type === CUSTOM_NODE_META_TYPE)

const ensureExtensionElements = (moddle: ModdleLike, businessObject: RawBusinessObject) => {
  if (businessObject.extensionElements && Array.isArray(businessObject.extensionElements.values)) {
    return businessObject.extensionElements as RawModdleElement
  }

  const extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
  extensionElements.$parent = businessObject
  businessObject.extensionElements = extensionElements
  return extensionElements
}

const ensureNodeMeta = (moddle: ModdleLike, businessObject: RawBusinessObject) => {
  const existing = getNodeMeta(businessObject)
  if (existing) {
    if (!Array.isArray(existing.fields)) {
      existing.fields = []
    }
    return existing
  }

  const extensionElements = ensureExtensionElements(moddle, businessObject)
  const values = Array.isArray(extensionElements.values) ? extensionElements.values : []
  const nodeMeta = moddle.create(CUSTOM_NODE_META_TYPE, {
    nodeKey: '',
    fields: []
  })

  nodeMeta.$parent = extensionElements
  values.push(nodeMeta)
  extensionElements.values = values
  return nodeMeta
}

export const isApprovalTask = (businessObject: Record<string, unknown> | null | undefined) => {
  const nodeMeta = getNodeMeta(businessObject as RawBusinessObject | undefined)
  return nodeMeta?.nodeKey === 'approval-task'
}

export const writeApprovalTaskDefaults = (
  moddle: ModdleLike,
  businessObject: Record<string, unknown>
) => {
  const nodeMeta = ensureNodeMeta(moddle, businessObject as RawBusinessObject)
  nodeMeta.nodeKey = 'approval-task'

  const fields = [
    moddle.create(CUSTOM_FIELD_TYPE, { key: 'assigneeRole', value: 'manager' }),
    moddle.create(CUSTOM_FIELD_TYPE, { key: 'formKey', value: '' })
  ]
  fields.forEach((field) => {
    field.$parent = nodeMeta
  })
  nodeMeta.fields = fields
}
