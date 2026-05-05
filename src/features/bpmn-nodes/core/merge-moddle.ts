import type { BpmnNodePlugin } from './types'

/**
 * 合并所有节点提供的 moddle 片段，最终输出单个 custom descriptor。
 *
 * 这样 editor 初始化时只需要挂一个 `moddleExtensions.custom`，
 * 避免不同节点各自维护分散的 descriptor 入口。
 */
export const mergeModdle = (plugins: BpmnNodePlugin[]) => ({
  name: 'Custom',
  uri: 'http://example.com/schema/bpmn/custom',
  prefix: 'custom',
  xml: {
    tagAlias: 'lowerCase'
  },
  types: plugins.flatMap((plugin) => plugin.moddle?.types ?? [])
})
