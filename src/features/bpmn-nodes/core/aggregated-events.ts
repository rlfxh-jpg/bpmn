import type {
  BpmnNodePlugin,
  NodeEventHandlers,
  NodeEventPayload,
  RuntimeDiagramElement
} from './types'

type EventType = keyof NodeEventHandlers

type EventBusLike = {
  on: (eventName: string, handler: (event: { element?: RuntimeDiagramElement }) => void) => void
}

type ModdleLike = {
  create: (type: string, attrs?: Record<string, unknown>) => Record<string, unknown>
}

class AggregatedEvents {
  static $inject = ['eventBus', 'moddle']

  constructor(
    private plugins: BpmnNodePlugin[],
    private eventBus: EventBusLike,
    private moddle: ModdleLike
  ) {
    this.eventBus.on('element.click', (event) => this.dispatch('click', event))
    this.eventBus.on('shape.added', (event) => this.dispatch('created', event))
    this.eventBus.on('element.changed', (event) => this.dispatch('changed', event))
  }

  private dispatch(type: EventType, event: { element?: RuntimeDiagramElement }) {
    const element = event.element
    if (!element) {
      return
    }

    this.plugins.forEach((plugin) => {
      const handler = plugin.events?.[type]
      const matches =
        type === 'created'
          ? element.businessObject &&
            typeof element.businessObject === 'object' &&
            element.businessObject.$type === plugin.baseType
          : plugin.is(element)

      if (!handler || !matches) {
        return
      }

      const payload: NodeEventPayload = {
        event,
        element,
        moddle: this.moddle
      }

      handler(payload)
    })
  }
}

export const createAggregatedEventsModule = (plugins: BpmnNodePlugin[]) => ({
  __init__: ['aggregatedEvents'],
  aggregatedEvents: [
    'type',
    class extends AggregatedEvents {
      constructor(eventBus: EventBusLike, moddle: ModdleLike) {
        super(plugins, eventBus, moddle)
      }
    }
  ]
})
