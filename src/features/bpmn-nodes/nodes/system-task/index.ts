import { getNodeKey } from '../../core/services/extension-field-service'
import { systemTaskEvents } from './events'
import { systemTaskModdle } from './moddle'
import { systemTaskPalette } from './palette'
import { systemTaskRenderer } from './renderer'
import type { BpmnNodePlugin } from '../../core/types'

/**
 * 系统处理节点插件。
 */
const systemTaskNode: BpmnNodePlugin = {
  type: 'system-task',
  baseType: 'bpmn:ServiceTask',
  moddle: systemTaskModdle,
  palette: systemTaskPalette,
  renderer: systemTaskRenderer,
  events: systemTaskEvents,
  is(element) {
    return getNodeKey(element.businessObject) === 'system-task'
  }
}

export default systemTaskNode
