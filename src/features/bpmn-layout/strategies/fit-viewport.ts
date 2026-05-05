import type { BpmnLayoutStrategy } from '../core/types'

export const fitViewportStrategy: BpmnLayoutStrategy = {
  key: 'fit-viewport',
  label: '适配画布',
  execute() {
    return {
      updates: []
    }
  }
}
