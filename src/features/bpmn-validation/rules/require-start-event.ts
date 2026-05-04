import type { BpmnValidationRule } from '../types'

export const requireStartEventRule: BpmnValidationRule = {
  id: 'require-start-event',
  validate(context) {
    if (context.elements.some((element) => element.type === 'bpmn:StartEvent')) {
      return []
    }

    return [
      {
        ruleId: 'require-start-event',
        message: '流程至少需要一个开始事件',
        severity: 'error',
        elementType: 'bpmn:StartEvent'
      }
    ]
  }
}
