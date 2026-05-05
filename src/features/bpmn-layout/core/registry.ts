import type { BpmnLayoutStrategy } from './types'

export const createBpmnLayoutRegistry = (strategies: BpmnLayoutStrategy[]) => {
  const byKey = new Map(strategies.map((strategy) => [strategy.key, strategy]))

  return {
    list: () => strategies,
    get: (key: string) => byKey.get(key)
  }
}
