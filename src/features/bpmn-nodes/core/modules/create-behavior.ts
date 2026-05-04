import { setNodeData, setNodeKey } from '../services/extension-field-service'
import type { BpmnNodeDefinition } from '../types'

type RegistryLike = {
  getDefinition: (key: string) => BpmnNodeDefinition | undefined
}

type CreateBehaviorContext = {
  hints?: {
    customNodeKey?: string
  }
  shape?: {
    businessObject?: Record<string, unknown>
  }
}

class CustomCreateBehavior {
  static $inject = ['eventBus', 'modeling', 'moddle']

  constructor(
    private registry: RegistryLike,
    private eventBus: {
      on: (eventName: string, handler: (payload: { context: CreateBehaviorContext }) => void) => void
    },
    private modeling: {
      updateLabel: (shape: unknown, label: string) => void
    },
    private moddle: {
      create: (type: string, attrs?: Record<string, unknown>) => Record<string, unknown>
    }
  ) {
    this.eventBus.on('commandStack.shape.create.postExecuted', ({ context }) => {
      const nodeKey = context.hints?.customNodeKey
      if (!nodeKey || !context.shape?.businessObject) {
        return
      }

      const definition = this.registry.getDefinition(nodeKey)
      if (!definition) {
        return
      }

          const businessObject = context.shape.businessObject
          setNodeKey(this.moddle, businessObject, nodeKey)
          setNodeData(this.moddle, businessObject, definition.initBusinessFields())

      if (!businessObject.name || typeof businessObject.name !== 'string') {
        this.modeling.updateLabel(context.shape, definition.displayName)
      }
    })
  }
}

export const createCreateBehaviorModule = (registry: RegistryLike) => ({
  __init__: ['customCreateBehavior'],
  customCreateBehavior: [
    'type',
    class extends CustomCreateBehavior {
      constructor(
        eventBus: {
          on: (eventName: string, handler: (payload: { context: CreateBehaviorContext }) => void) => void
        },
        modeling: { updateLabel: (shape: unknown, label: string) => void },
        moddle: { create: (type: string, attrs?: Record<string, unknown>) => Record<string, unknown> }
      ) {
        super(registry, eventBus, modeling, moddle)
      }
    }
  ]
})
