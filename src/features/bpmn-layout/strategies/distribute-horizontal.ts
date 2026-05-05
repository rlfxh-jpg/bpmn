import type { BpmnLayoutStrategy } from '../core/types'

const DEFAULT_GAP = 80

export const distributeHorizontalStrategy: BpmnLayoutStrategy = {
  key: 'distribute-horizontal',
  label: '水平分布',
  execute(context) {
    if (context.elements.length <= 1) {
      return { updates: [] }
    }

    const sorted = [...context.elements].sort((a, b) => a.x - b.x)
    let currentX = sorted[0].x

    return {
      updates: sorted.map((element, index) => {
        const nextX = index === 0 ? element.x : currentX
        currentX = nextX + element.width + DEFAULT_GAP

        return {
          elementId: element.id,
          x: nextX,
          y: element.y
        }
      })
    }
  }
}
