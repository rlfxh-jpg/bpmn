import type { BpmnNodeDefinition } from '../types'

type RegistryLike = {
  getDefinitions: () => BpmnNodeDefinition[]
}

type PaletteProviderDeps = {
  palette: { registerProvider: (provider: unknown) => void }
  create: { start: (event: Event, shape: unknown, hints?: Record<string, unknown>) => void }
  elementFactory: { createShape: (attrs: Record<string, unknown>) => unknown }
}

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

  private startCreate(event: Event, definition: BpmnNodeDefinition) {
    const shape = this.elementFactory.createShape({ type: definition.baseType })
    this.create.start(event, shape, { customNodeKey: definition.key })
  }
}

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
