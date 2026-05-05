/**
 * 该文件定义 bpmn-nodes feature 的公共类型协议。
 *
 * 设计目标：
 * 1. 让每个节点 feature 都遵循统一结构，而不是各写各的配置格式。
 * 2. 让页面层、编辑器层、注册中心只依赖抽象协议，不依赖具体节点实现。
 * 3. 为后续新增 palette / renderer / properties / behavior 等能力预留稳定扩展面。
 */

/**
 * 单个业务字段的定义。
 *
 * 这些字段最终会显示在右侧业务属性面板中，并且通过统一字段服务写入 BPMN 扩展数据。
 */
export type BpmnNodeFieldDefinition = {
  key: string
  label: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
}

/**
 * 左侧 palette 中一个节点入口的展示配置。
 *
 * 这里仅描述“如何展示和归类”，真正的点击/拖拽创建逻辑由 core/modules/palette-provider.ts 负责。
 */
export type BpmnNodePaletteEntry = {
  group: string
  className: string
  title: string
}

/**
 * 节点视觉配置。
 *
 * 当前首版主要用于 marker + overlay 方案的颜色和角标文本，
 * 后续如果恢复更完整的 renderer，也继续复用这份配置。
 */
export type BpmnNodeStyleDefinition = {
  fill: string
  stroke: string
  label?: string
  badgeText?: string
}

/**
 * 单个可插拔节点的统一定义对象。
 *
 * 这是节点对外暴露的唯一“装配入口”：
 * - registry 只认这个对象
 * - palette 模块从这里取左侧入口信息
 * - create behavior 从这里取默认名称和初始化字段
 * - 业务属性面板从这里取字段定义
 *
 * 这样每个节点 feature 可以高内聚地描述自己，而核心层只需要理解这一个抽象。
 */
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

/**
 * 注册中心对外暴露的最小能力集合。
 *
 * 这里刻意保持简单：
 * - `list` 用于页面或模块枚举所有已启用节点
 * - `getByKey` 用于运行时按 nodeKey 精确查找节点定义
 *
 * 后续如果出现更复杂的筛选条件，可以扩展 registry 实现，
 * 但页面和编辑器层不需要感知底层索引结构。
 */
export type BpmnNodeRegistry = {
  list: () => BpmnNodeDefinition[]
  getByKey: (key: string) => BpmnNodeDefinition | undefined
}
