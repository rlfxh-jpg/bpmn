import { createAggregatedEventsModule } from './core/aggregated-events'
import { createAggregatedPaletteModule } from './core/aggregated-palette'
import { createAggregatedRendererModule } from './core/aggregated-renderer'
import { mergeModdle } from './core/merge-moddle'
import { createNodeRuntimeServices } from './core/runtime-services'
import { defaultEnabledNodePlugins } from './presets/default-nodes'

const plugins = defaultEnabledNodePlugins
const services = createNodeRuntimeServices()

/**
 * 聚合后的 custom moddle descriptor。
 */
export const customModdle = mergeModdle(plugins)

/**
 * 聚合后的节点扩展模块入口。
 *
 * 供页面或装配层注入 BpmnEditor，而不是让编辑器源码直接依赖 bpmn-nodes 内部实现。
 */
export const customNodeModule = {
  __depends__: [
    createAggregatedPaletteModule(plugins),
    createAggregatedEventsModule(plugins, services),
    createAggregatedRendererModule(plugins)
  ]
}
