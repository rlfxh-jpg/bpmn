import type { BpmnValidationContext, BpmnValidationResult, BpmnValidationRule } from './types'

export const validateBpmnBeforeSave = (
  context: BpmnValidationContext,
  rules: BpmnValidationRule[]
): BpmnValidationResult => {
  const issues = rules.flatMap((rule) => rule.validate(context))

  return {
    valid: issues.every((issue) => issue.severity !== 'error'),
    issues
  }
}
