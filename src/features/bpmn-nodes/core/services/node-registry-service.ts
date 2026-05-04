import { createBpmnNodeRegistry } from '../registry'
import type { BpmnNodeDefinition } from '../types'

export const createNodeRegistryService = (definitions: BpmnNodeDefinition[]) => {
  const registry = createBpmnNodeRegistry(definitions)

  return {
    getDefinitions: registry.list,
    getDefinition: registry.getByKey
  }
}
