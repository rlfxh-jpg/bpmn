import { systemTaskFields } from './fields'
import type { BpmnNodeDefinition } from '../core/types'

export const systemTaskDefinition: BpmnNodeDefinition = {
  key: 'system-task',
  baseType: 'bpmn:ServiceTask',
  displayName: '系统处理',
  palette: {
    group: 'custom-business',
    className: 'bpmn-icon-service-task',
    title: '创建系统处理'
  },
  style: {
    fill: '#dff4ff',
    stroke: '#1668dc',
    label: '系统'
  },
  fields: systemTaskFields,
  initBusinessFields: () => ({
    serviceCode: '',
    retryPolicy: 'none'
  })
}
