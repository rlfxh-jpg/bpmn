import { approvalTaskDefinition } from '../approval-task/definition'
import { systemTaskDefinition } from '../system-task/definition'

/**
 * 默认启用的节点集合。
 *
 * 这里把“有哪些节点可用”和“节点本身怎么实现”分离开来，
 * 是为了后续支持：
 * - 不同场景启用不同节点集
 * - 前端静态配置切换
 * - 后端下发启用清单
 */
export const defaultEnabledNodeDefinitions = [approvalTaskDefinition, systemTaskDefinition]
