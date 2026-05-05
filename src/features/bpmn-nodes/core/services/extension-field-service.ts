import { CUSTOM_FIELD_TYPE, CUSTOM_NODE_META_TYPE } from '../shared/business-object'

/**
 * 该文件负责统一读写“节点扩展字段”。
 *
 * 设计原则：
 * 1. 页面层、节点 feature、校验规则都不直接手写 extensionElements 结构
 * 2. 所有扩展字段都通过统一服务访问，避免 XML 结构散落在各处
 * 3. 扩展字段最终落到 BPMN 标准的 extensionElements 中，保证导出 XML 可持久化
 */

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

/**
 * 用于在访问未知 moddle 数据时做最小的运行时安全收敛。
 *
 * BPMN moddle 返回的数据结构比较动态，因此这里先把“是不是对象”统一判断出来，
 * 再在后续读取逻辑中按字段约定逐步收窄类型。
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * 读取 businessObject 上的 extensionElements.values。
 *
 * 如果没有扩展数据，统一返回空数组，避免上层充斥空值判断。
 */
const getExtensionValues = (businessObject: RawBusinessObject | null | undefined) => {
  if (!businessObject?.extensionElements || !Array.isArray(businessObject.extensionElements.values)) {
    return []
  }

  return businessObject.extensionElements.values.filter(isRecord) as RawModdleElement[]
}

/**
 * 在 extensionElements.values 中找到当前节点对应的 custom:NodeMeta。
 *
 * 约定上，一个节点只维护一个 NodeMeta，用它承载 nodeKey 和业务字段列表。
 */
const getNodeMeta = (businessObject: RawBusinessObject | null | undefined) => {
  return getExtensionValues(businessObject).find((value) => value.$type === CUSTOM_NODE_META_TYPE)
}

/**
 * 确保 businessObject 上存在 bpmn:ExtensionElements。
 *
 * 这里不把创建逻辑交给页面或节点 feature，是为了统一扩展数据入口，
 * 让所有业务节点都复用同一套结构约定。
 */
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

/**
 * 确保当前节点存在 custom:NodeMeta。
 *
 * 如果已经存在，则直接复用；
 * 如果不存在，则在 extensionElements 下补建一个新的 NodeMeta。
 *
 * 这样节点扩展身份和业务字段都可以稳定地挂在同一个容器下。
 */
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

/**
 * 读取节点扩展身份标识。
 *
 * nodeKey 是整个可插拔节点系统识别“这是什么业务节点”的关键字段，
 * 例如 approval-task / system-task。
 */
export const getNodeKey = (businessObject: RawBusinessObject | null | undefined) => {
  const nodeMeta = getNodeMeta(businessObject)
  return typeof nodeMeta?.nodeKey === 'string' ? nodeMeta.nodeKey : ''
}

/**
 * 写入节点扩展身份标识。
 *
 * 注意这里不直接给 businessObject 挂普通字段，而是写入自定义 moddle 扩展，
 * 这样导出 BPMN XML 时该字段会被序列化并在导入后恢复。
 */
export const setNodeKey = (
  moddle: ModdleService,
  businessObject: RawBusinessObject,
  nodeKey: string
) => {
  const nodeMeta = ensureNodeMeta(moddle, businessObject)
  nodeMeta.nodeKey = nodeKey
}

/**
 * 读取业务字段键值对。
 *
 * 存储层是 `custom:Field[]`，对外暴露则收敛成简单对象，
 * 这样页面、校验、策略都能用熟悉的 key/value 形式消费。
 */
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

/**
 * 批量写入业务字段。
 *
 * 当前策略是“读出旧值 -> 合并 patch -> 重建 custom:Field 列表”。
 *
 * 这么做的原因：
 * - 字段结构本身很轻，重建成本低
 * - 可以避免在原地修改数组时处理复杂的增删改边界
 * - 保持写入逻辑稳定且容易推导
 */
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
