import type { BpmnNodeDefinition, BpmnNodeRegistry } from './types'

/**
 * 构建节点注册中心。
 *
 * 设计思路：
 * - 使用 definitions 数组保留原始注册顺序，方便 palette 或配置面板按声明顺序展示
 * - 使用 Map 提供按 key 的快速查找，避免运行时反复线性遍历
 *
 * 这里不直接暴露 Map，是为了把数据结构细节封装在 core 内部，
 * 上层模块只通过稳定接口访问。
 */
export const createBpmnNodeRegistry = (definitions: BpmnNodeDefinition[]): BpmnNodeRegistry => {
  const byKey = new Map(definitions.map((definition) => [definition.key, definition]))

  return {
    list: () => definitions,
    getByKey: (key: string) => byKey.get(key)
  }
}
