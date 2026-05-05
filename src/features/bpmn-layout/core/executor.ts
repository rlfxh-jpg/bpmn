import type { BpmnLayoutContext, BpmnLayoutStrategy, BpmnLayoutStrategyResult } from './types'

export const executeBpmnLayoutStrategy = (
  strategy: BpmnLayoutStrategy,
  context: BpmnLayoutContext
): BpmnLayoutStrategyResult => {
  return strategy.execute(context)
}
