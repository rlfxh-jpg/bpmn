import type { BpmnValidationRule } from './types'
import { requireEndEventRule } from './rules/require-end-event'
import { requireProcessContentRule } from './rules/require-process-content'
import { requireSequenceFlowRule } from './rules/require-sequence-flow'
import { requireStartEventRule } from './rules/require-start-event'
import { requireTaskNameRule } from './rules/require-task-name'

export const defaultBpmnValidationRules: BpmnValidationRule[] = [
  requireProcessContentRule,
  requireStartEventRule,
  requireEndEventRule,
  requireSequenceFlowRule,
  requireTaskNameRule
]
