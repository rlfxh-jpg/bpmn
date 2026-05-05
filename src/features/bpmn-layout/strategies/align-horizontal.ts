import type { BpmnLayoutStrategy } from '../core/types'

export const alignHorizontalStrategy: BpmnLayoutStrategy = {
  key: 'align-horizontal',
  label: '水平对齐',
  execute(context) {
    if (context.elements.length === 0) {
      return { updates: [] }
    }

    const sorted = [...context.elements].sort((a, b) => a.x - b.x)
    const referenceY = sorted[0].y

    return {
      updates: sorted.map((element) => ({
        elementId: element.id,
        x: element.x,
        y: referenceY
      }))
    }
  }
}
