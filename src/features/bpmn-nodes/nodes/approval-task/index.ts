import { approvalTaskEvents } from './events'
import { isApprovalTask } from './helpers'
import { approvalTaskModdle } from './moddle'
import { approvalTaskPalette } from './palette'
import { approvalTaskRenderer } from './renderer'
import type { BpmnNodePlugin } from '../../core/types'

const approvalTaskNode: BpmnNodePlugin = {
  type: 'approval-task',
  baseType: 'bpmn:UserTask',
  moddle: approvalTaskModdle,
  palette: approvalTaskPalette,
  renderer: approvalTaskRenderer,
  events: approvalTaskEvents,
  is(element) {
    return isApprovalTask(element.businessObject)
  }
}

export default approvalTaskNode
