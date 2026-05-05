import { createBpmnNodeRegistry } from '../registry'
import type { BpmnNodeDefinition } from '../types'

/**
 * registry service 是对底层 registry 的轻量封装。
 *
 * 当前它主要起两个作用：
 * 1. 对编辑器层暴露更语义化的方法名，例如 getDefinitions / getDefinition
 * 2. 给后续演进预留空间，例如未来接后端下发配置、动态启停节点时，
 *    可以优先在 service 层扩展，而不影响所有调用方。
 */
export const createNodeRegistryService = (definitions: BpmnNodeDefinition[]) => {
  const registry = createBpmnNodeRegistry(definitions)

  return {
    getDefinitions: registry.list,
    getDefinition: registry.getByKey
  }
}
