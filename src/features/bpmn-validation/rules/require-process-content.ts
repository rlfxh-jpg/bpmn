import type { BpmnValidationRule } from '../types'

const ignoredElementTypes = new Set([
  'bpmn:Process',
  'bpmndi:BPMNDiagram',
  'bpmndi:BPMNPlane',
  'bpmndi:BPMNShape',
  'bpmndi:BPMNEdge',
  'label'
])

export const requireProcessContentRule: BpmnValidationRule = {
  id: 'require-process-content',
  validate(context) {
    const semanticElements = context.elements.filter((element) => !ignoredElementTypes.has(element.type))

    if (semanticElements.length > 0) {
      return []
    }

    return [
      {
        ruleId: 'require-process-content',
        message: '流程内容不能为空',
        severity: 'error'
      }
    ]
  }
}
