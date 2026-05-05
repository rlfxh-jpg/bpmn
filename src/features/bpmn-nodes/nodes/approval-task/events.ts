import type { NodeEventHandlers } from '../../core/types'
import { writeApprovalTaskDefaults } from './helpers'

export const approvalTaskEvents: NodeEventHandlers = {
  created({ element, moddle }) {
    const businessObject = element.businessObject
    if (!businessObject) {
      return
    }

    writeApprovalTaskDefaults(moddle, businessObject)
  },
  click() {},
  changed() {}
}
