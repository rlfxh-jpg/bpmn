import approvalTaskNode from '../nodes/approval-task'
import systemTaskNode from '../nodes/system-task'

/**
 * 当前默认启用的节点插件集合。
 *
 * 该文件只负责声明“启用哪些节点”，不负责节点实现本身。
 */
export const defaultEnabledNodePlugins = [approvalTaskNode, systemTaskNode]
