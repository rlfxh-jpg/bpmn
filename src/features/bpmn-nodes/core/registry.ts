import type { BpmnNodeDefinition, BpmnNodeRegistry } from './types'

export const createBpmnNodeRegistry = (definitions: BpmnNodeDefinition[]): BpmnNodeRegistry => {
  const byKey = new Map(definitions.map((definition) => [definition.key, definition]))

  return {
    list: () => definitions,
    getByKey: (key: string) => byKey.get(key)
  }
}
