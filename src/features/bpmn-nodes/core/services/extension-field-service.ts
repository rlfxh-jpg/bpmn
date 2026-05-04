import { CUSTOM_FIELD_TYPE, CUSTOM_NODE_META_TYPE } from '../shared/business-object'

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

type ModdleService = {
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

const getNodeMeta = (businessObject: RawBusinessObject | null | undefined) => {
  return getExtensionValues(businessObject).find((value) => value.$type === CUSTOM_NODE_META_TYPE)
}

const ensureExtensionElements = (
  moddle: ModdleService,
  businessObject: RawBusinessObject
) => {
  if (businessObject.extensionElements && Array.isArray(businessObject.extensionElements.values)) {
    return businessObject.extensionElements as RawModdleElement
  }

  const extensionElements = moddle.create('bpmn:ExtensionElements', {
    values: []
  })
  extensionElements.$parent = businessObject
  businessObject.extensionElements = extensionElements
  return extensionElements
}

const ensureNodeMeta = (moddle: ModdleService, businessObject: RawBusinessObject) => {
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

export const getNodeKey = (businessObject: RawBusinessObject | null | undefined) => {
  const nodeMeta = getNodeMeta(businessObject)
  return typeof nodeMeta?.nodeKey === 'string' ? nodeMeta.nodeKey : ''
}

export const setNodeKey = (
  moddle: ModdleService,
  businessObject: RawBusinessObject,
  nodeKey: string
) => {
  const nodeMeta = ensureNodeMeta(moddle, businessObject)
  nodeMeta.nodeKey = nodeKey
}

export const getNodeData = (businessObject: RawBusinessObject | null | undefined) => {
  const nodeMeta = getNodeMeta(businessObject)
  const fields = Array.isArray(nodeMeta?.fields) ? nodeMeta.fields : []

  return fields.reduce(
    (result, field) => {
      if (!isRecord(field)) {
        return result
      }

      const key = typeof field.key === 'string' ? field.key : ''
      const value = typeof field.value === 'string' ? field.value : ''
      if (key) {
        result[key] = value
      }

      return result
    },
    {} as Record<string, string>
  )
}

export const setNodeData = (
  moddle: ModdleService,
  businessObject: RawBusinessObject,
  patch: Record<string, string>
) => {
  const nodeMeta = ensureNodeMeta(moddle, businessObject)
  const currentData = getNodeData(businessObject)
  const merged = {
    ...currentData,
    ...patch
  }

  const fields = Object.entries(merged).map(([key, value]) => {
    const field = moddle.create(CUSTOM_FIELD_TYPE, { key, value })
    field.$parent = nodeMeta
    return field
  })

  nodeMeta.fields = fields
}
