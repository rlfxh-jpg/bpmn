import type { BpmnNodeDefinition } from '../types'

/**
 * 该模块负责把“节点定义”转换成左侧工具栏入口。
 *
 * 设计重点：
 * - 页面层不直接拼 palette 项
 * - 每个节点 feature 不直接依赖 bpmn-js palette API
 * - 由 core 统一把 registry 中的节点定义转成 bpmn-js 可识别的 palette entries
 */

type RegistryLike = {
  getDefinitions: () => BpmnNodeDefinition[]
}

type PaletteProviderDeps = {
  palette: { registerProvider: (provider: unknown) => void }
  create: { start: (event: Event, shape: unknown, hints?: Record<string, unknown>) => void }
  elementFactory: { createShape: (attrs: Record<string, unknown>) => unknown }
}

/**
 * 自定义 palette provider。
 *
 * 它不关心“审批任务”和“系统处理”这些业务细节，
 * 只负责遍历 registry，并把每个节点定义映射成工具栏中的一个入口。
 */
class CustomPaletteProvider {
  static $inject = ['palette', 'create', 'elementFactory']

  constructor(
    private registry: RegistryLike,
    private palette: PaletteProviderDeps['palette'],
    private create: PaletteProviderDeps['create'],
    private elementFactory: PaletteProviderDeps['elementFactory']
  ) {
    this.palette.registerProvider(this)
  }

  /**
   * 生成 bpmn-js 所需的 palette entries。
   *
   * 这里使用 reduce 是为了让每个节点定义都独立产出一个 entry，
   * 最终收敛成 palette 需要的键值对象。
   */
  getPaletteEntries() {
    return this.registry.getDefinitions().reduce(
      (entries, definition) => {
        entries[`create.${definition.key}`] = {
          group: definition.palette.group,
          className: definition.palette.className,
          title: definition.palette.title,
          action: {
            click: (event: MouseEvent) => this.startCreate(event, definition),
            dragstart: (event: DragEvent) => this.startCreate(event, definition)
          }
        }

        return entries
      },
      {} as Record<string, unknown>
    )
  }

  /**
   * 点击或拖拽 palette 入口时，仍然创建标准 BPMN 类型的 shape，
   * 只是通过 hints.customNodeKey 把“业务节点身份”带入后续创建行为模块。
   */
  private startCreate(event: Event, definition: BpmnNodeDefinition) {
    const shape = this.elementFactory.createShape({ type: definition.baseType })
    this.create.start(event, shape, { customNodeKey: definition.key })
  }
}

/**
 * 包装成 bpmn-js additionalModules 可消费的模块定义。
 */
export const createPaletteProviderModule = (registry: RegistryLike) => ({
  __init__: ['customPaletteProvider'],
  customPaletteProvider: [
    'type',
    class extends CustomPaletteProvider {
      constructor(palette: PaletteProviderDeps['palette'], create: PaletteProviderDeps['create'], elementFactory: PaletteProviderDeps['elementFactory']) {
        super(registry, palette, create, elementFactory)
      }
    }
  ]
})
