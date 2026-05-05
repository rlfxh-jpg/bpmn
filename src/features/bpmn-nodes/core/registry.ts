import type { BpmnNodePlugin, BpmnNodePluginRegistry } from './types'

/**
 * 构建节点插件注册中心。
 *
 * 与旧版 definition registry 类似，但现在注册单元升级为节点插件对象。
 */
export const createBpmnNodePluginRegistry = (
  plugins: BpmnNodePlugin[]
): BpmnNodePluginRegistry => {
  const byType = new Map(plugins.map((plugin) => [plugin.type, plugin]))

  return {
    list: () => plugins,
    getByType: (type: string) => byType.get(type)
  }
}
