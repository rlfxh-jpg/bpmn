import type { BpmnNodePlugin, RuntimeDiagramElement } from './types'

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

    const plugin = this.plugins.find((item) => item.renderer && item.is(element))
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
