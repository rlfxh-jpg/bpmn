import type { NodeEventHandlers } from '../../core/types'

/**
 * 系统处理节点的专属事件逻辑。
 */
export const systemTaskEvents: NodeEventHandlers = {
  created({ element, services, moddle }) {
    const businessObject = element.businessObject
    if (!businessObject) {
      return
    }

    services.setNodeKey(moddle, businessObject, 'system-task')
    services.setNodeData(moddle, businessObject, {
      serviceCode: '',
      retryPolicy: 'none'
    })
  },
  click() {},
  changed() {}
}
