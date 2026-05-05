import { approvalTaskFields } from './fields'
import type { BpmnNodeDefinition } from '../core/types'

/**
 * 审批任务节点定义。
 *
 * 这是 approval-task 对外暴露的唯一装配入口。
 * 注册中心、palette、创建行为、右侧业务属性面板都只依赖这个 definition，
 * 而不会直接去读取 approval-task 目录下的其他实现细节。
 *
 * 基于 `bpmn:UserTask` 扩展，而不是发明新的 BPMN 元素类型，
 * 这样可以保证导出的流程在标准语义上仍然兼容。
 */
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
  // 创建节点时自动写入默认业务字段，保证新节点一落图就有基础业务语义。
  initBusinessFields: () => ({
    assigneeRole: 'manager',
    formKey: ''
  })
}
