import { approvalTaskFields } from './fields'
import type { BpmnNodeDefinition } from '../core/types'

export const approvalTaskDefinition: BpmnNodeDefinition = {
  key: 'approval-task',
  baseType: 'bpmn:UserTask',
  displayName: '审批任务',
  palette: {
    group: 'custom-business',
    className: 'bpmn-icon-user-task',
    title: '创建审批任务'
  },
  style: {
    fill: '#fff3d6',
    stroke: '#c27c00',
    label: '审批'
  },
  fields: approvalTaskFields,
  initBusinessFields: () => ({
    assigneeRole: 'manager',
    formKey: ''
  })
}
