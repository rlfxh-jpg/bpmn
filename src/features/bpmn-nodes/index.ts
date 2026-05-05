import { createAggregatedEventsModule } from './core/aggregated-events'
import { createAggregatedPaletteModule } from './core/aggregated-palette'
import { createAggregatedRendererModule } from './core/aggregated-renderer'
import { mergeModdle } from './core/merge-moddle'
import { defaultEnabledNodePlugins } from './presets/default-nodes'

const plugins = defaultEnabledNodePlugins

export const customModdle = mergeModdle(plugins)

export const customNodeModule = {
  __depends__: [
    createAggregatedPaletteModule(plugins),
    createAggregatedEventsModule(plugins),
    createAggregatedRendererModule(plugins)
  ]
}
