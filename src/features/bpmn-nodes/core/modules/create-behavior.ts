import { setNodeData, setNodeKey } from '../services/extension-field-service'
import type { BpmnNodeDefinition } from '../types'

/**
 * 该模块负责“节点创建后的补充行为”。
 *
 * 注意它不负责创建图元本身，图元仍由 bpmn-js 的标准创建流程完成。
 * 它做的是在标准创建成功后，补写业务节点所需的扩展信息：
 * - nodeKey
 * - 默认业务字段
 * - 默认显示名称
 *
 * 这样既遵守 BPMN 标准建模流程，又能挂接业务扩展能力。
 */

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

/**
 * 监听 shape.create 的后置事件，给刚创建出的标准 BPMN 元素补齐业务扩展信息。
 */
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
      // 创建行为通过 hints.customNodeKey 判断这次创建是否来自业务扩展 palette。
      const nodeKey = context.hints?.customNodeKey
      if (!nodeKey || !context.shape?.businessObject) {
        return
      }

      // 只有在 registry 中找到了定义，才说明这是一个受支持的业务节点扩展。
      const definition = this.registry.getDefinition(nodeKey)
      if (!definition) {
        return
      }

      // 统一通过 extension field service 写入扩展身份和默认业务字段。
      const businessObject = context.shape.businessObject
      setNodeKey(this.moddle, businessObject, nodeKey)
      setNodeData(this.moddle, businessObject, definition.initBusinessFields())

      // 如果创建出来的元素还没有名称，就补上节点定义中的默认显示名称。
      if (!businessObject.name || typeof businessObject.name !== 'string') {
        this.modeling.updateLabel(context.shape, definition.displayName)
      }
    })
  }
}

/**
 * 按 bpmn-js additionalModules 约定包装成可注入模块。
 *
 * 这里通过闭包把 registry 注入进去，避免在 bpmn-js 的依赖注入容器里再维护一份 registry 状态。
 */
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
