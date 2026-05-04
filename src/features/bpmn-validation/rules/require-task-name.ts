import type { BpmnValidationIssue, BpmnValidationRule } from '../types'

const taskTypesRequiringName = new Set([
  'bpmn:UserTask',
  'bpmn:ServiceTask',
  'bpmn:ManualTask',
  'bpmn:ScriptTask',
  'bpmn:BusinessRuleTask',
  'bpmn:SendTask',
  'bpmn:ReceiveTask'
])

export const requireTaskNameRule: BpmnValidationRule = {
  id: 'require-task-name',
  validate(context) {
    const issues: BpmnValidationIssue[] = []

    context.elements.forEach((element) => {
      if (!taskTypesRequiringName.has(element.type)) {
        return
      }

      const name = element.name?.trim()
      if (name) {
        return
      }

      issues.push({
        ruleId: 'require-task-name',
        message: `任务节点 ${element.id} 的名称不能为空`,
        severity: 'error',
        elementId: element.id,
        elementType: element.type
      })
    })

    return issues
  }
}
