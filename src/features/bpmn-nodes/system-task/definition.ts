import { systemTaskFields } from './fields'
import type { BpmnNodeDefinition } from '../core/types'

/**
 * 系统处理节点定义。
 *
 * 该节点基于 `bpmn:ServiceTask` 扩展，表达“系统自动执行某项处理逻辑”的业务语义。
 * 与审批任务一样，这里集中声明 palette、外观、默认字段、默认名称等信息，
 * 让 core 层可以按统一协议接入该节点。
 */
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
  // 让系统处理节点在创建后立即具备最小可用的业务字段集合。
  initBusinessFields: () => ({
    serviceCode: '',
    retryPolicy: 'none'
  })
}
