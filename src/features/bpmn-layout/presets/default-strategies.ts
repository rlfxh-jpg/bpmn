import { createBpmnLayoutRegistry } from '../core/registry'
import { alignHorizontalStrategy } from '../strategies/align-horizontal'
import { distributeHorizontalStrategy } from '../strategies/distribute-horizontal'
import { fitViewportStrategy } from '../strategies/fit-viewport'

export const defaultBpmnLayoutRegistry = createBpmnLayoutRegistry([
  fitViewportStrategy,
  alignHorizontalStrategy,
  distributeHorizontalStrategy
])
