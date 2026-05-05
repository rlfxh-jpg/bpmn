import type { BpmnNodePlugin } from './types'

export const mergeModdle = (plugins: BpmnNodePlugin[]) => {
  const base = plugins.find((plugin) => plugin.moddle)?.moddle

  return {
    name: base?.name ?? 'Custom',
    uri: base?.uri ?? 'http://example.com/schema/bpmn/custom',
    prefix: base?.prefix ?? 'custom',
    xml: base?.xml ?? {
      tagAlias: 'lowerCase'
    },
    types: plugins.flatMap((plugin) => plugin.moddle?.types ?? [])
  }
}
