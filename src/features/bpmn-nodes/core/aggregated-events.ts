import type {
  BpmnNodePlugin,
  NodeEventHandlers,
  NodeEventPayload,
  NodeRuntimeServices,
  RuntimeDiagramElement
} from './types'

/**
 * 聚合事件模块统一监听 bpmn-js 事件，再按节点插件规则分发。
 *
 * 设计目标：
 * - 所有节点共享一个事件监听入口，避免重复绑定 eventBus
 * - 每个节点只关心自己的事件处理函数，不关心事件注册方式
 * - 统一向节点事件处理函数注入 runtime services 和 moddle 能力
 */
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
    private services: NodeRuntimeServices,
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
      if (!handler || !plugin.is(element)) {
        return
      }

      const payload: NodeEventPayload = {
        event,
        element,
        services: this.services,
        moddle: this.moddle
      }

      handler(payload)
    })
  }
}

export const createAggregatedEventsModule = (
  plugins: BpmnNodePlugin[],
  services: NodeRuntimeServices
) => ({
  __init__: ['aggregatedEvents'],
  aggregatedEvents: [
    'type',
    class extends AggregatedEvents {
      constructor(eventBus: EventBusLike, moddle: ModdleLike) {
        super(plugins, services, eventBus, moddle)
      }
    }
  ]
})
