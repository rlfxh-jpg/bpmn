import { getNodeKey } from '../../core/services/extension-field-service'
import { approvalTaskEvents } from './events'
import { approvalTaskModdle } from './moddle'
import { approvalTaskPalette } from './palette'
import { approvalTaskRenderer } from './renderer'
import type { BpmnNodePlugin } from '../../core/types'

/**
 * 审批任务节点插件。
 *
 * 这里以纯配置对象方式描述节点，不直接暴露任何 bpmn-js provider class。
 */
const approvalTaskNode: BpmnNodePlugin = {
  type: 'approval-task',
  baseType: 'bpmn:UserTask',
  moddle: approvalTaskModdle,
  palette: approvalTaskPalette,
  renderer: approvalTaskRenderer,
  events: approvalTaskEvents,
  is(element) {
    return getNodeKey(element.businessObject) === 'approval-task'
  }
}

export default approvalTaskNode
