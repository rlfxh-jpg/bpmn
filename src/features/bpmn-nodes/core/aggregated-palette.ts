import type { BpmnNodePlugin } from './types'

/**
 * 聚合 palette 模块统一读取所有节点的 palette 配置，并注册到 bpmn-js。
 *
 * 节点本身只需要声明 palette 如何展示，真正的 provider 生命周期管理留在聚合层。
 */
type PaletteLike = {
  registerProvider: (provider: unknown) => void
}

type CreateLike = {
  start: (event: Event, shape: unknown, hints?: Record<string, unknown>) => void
}

type ElementFactoryLike = {
  createShape: (attrs: Record<string, unknown>) => unknown
}

class AggregatedPalette {
  constructor(
    private palette: PaletteLike,
    private create: CreateLike,
    private elementFactory: ElementFactoryLike,
    private plugins: BpmnNodePlugin[]
  ) {
    this.palette.registerProvider(this)
  }

  getPaletteEntries() {
    return this.plugins.reduce(
      (entries, plugin) => {
        if (!plugin.palette) {
          return entries
        }

        entries[`create.${plugin.type}`] = {
          group: plugin.palette.group,
          className: plugin.palette.className,
          title: plugin.palette.title,
          action: {
            click: (event: Event) => this.startCreate(event, plugin),
            dragstart: (event: Event) => this.startCreate(event, plugin)
          }
        }

        return entries
      },
      {} as Record<string, unknown>
    )
  }

  private startCreate(event: Event, plugin: BpmnNodePlugin) {
    const shape = this.elementFactory.createShape({
      type: plugin.baseType
    })

    this.create.start(event, shape, {
      customNodeType: plugin.type
    })
  }
}

export const createAggregatedPaletteModule = (plugins: BpmnNodePlugin[]) => ({
  __init__: ['aggregatedPalette'],
  aggregatedPalette: [
    'type',
    class {
      static $inject = ['palette', 'create', 'elementFactory']

      constructor(palette: PaletteLike, create: CreateLike, elementFactory: ElementFactoryLike) {
        return new AggregatedPalette(palette, create, elementFactory, plugins)
      }
    }
  ]
})
