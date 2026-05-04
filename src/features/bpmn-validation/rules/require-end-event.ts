import type { BpmnValidationRule } from '../types'

export const requireEndEventRule: BpmnValidationRule = {
  id: 'require-end-event',
  validate(context) {
    console.log('流程包含结束事件，验证通过', context)
    if (context.elements.some((element) => element.type === 'bpmn:EndEvent')) { 
      return []
    }

    return [
      {
        ruleId: 'require-end-event',
        message: '流程至少需要一个结束事件',
        severity: 'error',
        elementType: 'bpmn:EndEvent'
      }
    ]
  }
}
