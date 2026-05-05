import type { NodeEventHandlers } from '../../core/types'
import { writeSystemTaskDefaults } from './helpers'

export const systemTaskEvents: NodeEventHandlers = {
  created({ element, moddle }) {
    const businessObject = element.businessObject
    if (!businessObject) {
      return
    }

    writeSystemTaskDefaults(moddle, businessObject)
  },
  click() {},
  changed() {}
}
