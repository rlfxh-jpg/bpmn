import { systemTaskEvents } from './events'
import { isSystemTask } from './helpers'
import { systemTaskModdle } from './moddle'
import { systemTaskPalette } from './palette'
import { systemTaskRenderer } from './renderer'
import type { BpmnNodePlugin } from '../../core/types'

const systemTaskNode: BpmnNodePlugin = {
  type: 'system-task',
  baseType: 'bpmn:ServiceTask',
  moddle: systemTaskModdle,
  palette: systemTaskPalette,
  renderer: systemTaskRenderer,
  events: systemTaskEvents,
  is(element) {
    return isSystemTask(element.businessObject)
  }
}

export default systemTaskNode
