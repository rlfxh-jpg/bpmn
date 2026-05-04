import type { BpmnValidationRule } from '../types'

export const requireSequenceFlowRule: BpmnValidationRule = {
  id: 'require-sequence-flow',
  validate(context) {
    if (context.elements.some((element) => element.type === 'bpmn:SequenceFlow')) {
      return []
    }

    return [
      {
        ruleId: 'require-sequence-flow',
        message: '流程至少需要一条顺序连线',
        severity: 'error',
        elementType: 'bpmn:SequenceFlow'
      }
    ]
  }
}
