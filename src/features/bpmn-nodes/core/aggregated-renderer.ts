import { getNodeKey } from './services/extension-field-service'
import type { BpmnNodePlugin, RuntimeDiagramElement } from './types'

/**
 * 聚合渲染模块第一版不直接实现深度 SVG renderer，
 * 而是统一根据节点 renderer 配置添加 marker。
 *
 * 这样可以保持节点独立声明外观意图，同时避免 renderer 深层依赖带来的打包风险。
 */
type EventBusLike = {
  on: (eventName: string, handler: (event: { element?: RuntimeDiagramElement }) => void) => void
}

type CanvasLike = {
  addMarker: (elementId: string, marker: string) => void
  removeMarker: (elementId: string, marker: string) => void
}

class AggregatedRenderer {
  static $inject = ['eventBus', 'canvas']

  private activeMarkers = new Map<string, string>()

  constructor(
    private plugins: BpmnNodePlugin[],
    private eventBus: EventBusLike,
    private canvas: CanvasLike
  ) {
    this.eventBus.on('shape.added', (event) => this.decorate(event.element))
    this.eventBus.on('element.changed', (event) => this.decorate(event.element))
  }

  private decorate(element?: RuntimeDiagramElement) {
    if (!element?.id || !element.businessObject) {
      return
    }

    const existingMarker = this.activeMarkers.get(element.id)
    if (existingMarker) {
      this.canvas.removeMarker(element.id, existingMarker)
      this.activeMarkers.delete(element.id)
    }

    const nodeKey = getNodeKey(element.businessObject)
    if (!nodeKey) {
      return
    }

    const plugin = this.plugins.find((item) => item.type === nodeKey && item.renderer)
    if (!plugin?.renderer) {
      return
    }

    const marker = `custom-node--${plugin.type}`
    this.canvas.addMarker(element.id, marker)
    this.activeMarkers.set(element.id, marker)
  }
}

export const createAggregatedRendererModule = (plugins: BpmnNodePlugin[]) => ({
  __init__: ['aggregatedRenderer'],
  aggregatedRenderer: [
    'type',
    class extends AggregatedRenderer {
      constructor(eventBus: EventBusLike, canvas: CanvasLike) {
        super(plugins, eventBus, canvas)
      }
    }
  ]
})
