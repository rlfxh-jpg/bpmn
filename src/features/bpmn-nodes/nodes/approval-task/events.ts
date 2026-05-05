import type { NodeEventHandlers } from '../../core/types'

/**
 * 审批任务的专属事件逻辑。
 *
 * 第一版只在 created 阶段写入默认业务身份和字段，
 * click / changed 先保留占位，方便后续接业务交互。
 */
export const approvalTaskEvents: NodeEventHandlers = {
  created({ element, services, moddle }) {
    const businessObject = element.businessObject
    if (!businessObject) {
      return
    }

    services.setNodeKey(moddle, businessObject, 'approval-task')
    services.setNodeData(moddle, businessObject, {
      assigneeRole: 'manager',
      formKey: ''
    })
  },
  click() {},
  changed() {}
}
