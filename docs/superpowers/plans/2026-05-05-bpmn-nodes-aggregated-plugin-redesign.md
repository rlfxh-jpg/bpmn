# BPMN Nodes Aggregated Plugin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 `src/features/bpmn-nodes/` 重构为“节点独立开发 + 核心统一聚合 + 事件统一分发”的插件式扩展体系，同时保持业务节点仍然基于标准 BPMN 元素扩展，并通过 `extensionElements` 识别节点类型。

**Architecture:** 采用 `core + nodes + presets + index` 的聚合式插件结构。每个节点目录输出纯配置/纯函数风格的插件描述，`core` 统一聚合 palette、renderer、events、moddle，并由装配层将 `customNodeModule` 与 `customModdle` 注入编辑器。

**Tech Stack:** `Vue 3`, `TypeScript`, `bpmn-js`, `Element Plus`, `Vite`

---

## File Structure

本次实现预计创建或修改以下文件：

- Create: `src/features/bpmn-nodes/index.ts`
- Create: `src/features/bpmn-nodes/core/types.ts`
- Create: `src/features/bpmn-nodes/core/registry.ts`
- Create: `src/features/bpmn-nodes/core/merge-moddle.ts`
- Create: `src/features/bpmn-nodes/core/aggregated-palette.ts`
- Create: `src/features/bpmn-nodes/core/aggregated-events.ts`
- Create: `src/features/bpmn-nodes/core/aggregated-renderer.ts`
- Create: `src/features/bpmn-nodes/core/runtime-services.ts`
- Modify: `src/features/bpmn-nodes/core/services/extension-field-service.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/approval-task/index.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/approval-task/moddle.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/approval-task/palette.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/approval-task/renderer.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/approval-task/events.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/system-task/index.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/system-task/moddle.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/system-task/palette.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/system-task/renderer.ts`
- Move/Create: `src/features/bpmn-nodes/nodes/system-task/events.ts`
- Modify: `src/features/bpmn-nodes/presets/default-nodes.ts`
- Modify: `src/components/bpmn/BpmnEditor.vue`
- Modify: `src/views/BpmnWorkbench.vue`

### Task 1: Build the New Plugin Contracts and Registry

**Files:**
- Create: `src/features/bpmn-nodes/core/types.ts`
- Create: `src/features/bpmn-nodes/core/registry.ts`

- [ ] **Step 1: Define node plugin contracts**

```ts
export type NodePaletteConfig = {
  group: string
  className: string
  title: string
}

export type NodeRendererConfig = {
  fill: string
  stroke: string
  label?: string
  badgeText?: string
}

export type NodeEventHandlers = {
  click?: (payload: NodeEventPayload) => void
  created?: (payload: NodeEventPayload) => void
  changed?: (payload: NodeEventPayload) => void
}

export type BpmnNodePlugin = {
  type: string
  baseType: 'bpmn:UserTask' | 'bpmn:ServiceTask'
  moddle?: {
    types: unknown[]
  }
  palette?: NodePaletteConfig
  renderer?: NodeRendererConfig
  events?: NodeEventHandlers
  is: (element: RuntimeDiagramElement) => boolean
}
```

- [ ] **Step 2: Create plugin registry**

```ts
import type { BpmnNodePlugin } from './types'

export const createBpmnNodePluginRegistry = (plugins: BpmnNodePlugin[]) => {
  const byType = new Map(plugins.map((plugin) => [plugin.type, plugin]))

  return {
    list: () => plugins,
    getByType: (type: string) => byType.get(type)
  }
}
```

- [ ] **Step 3: Run type check for plugin contract layer**

Run: `pnpm exec vue-tsc --noEmit`
Expected: PASS with no type errors from the new core contracts

### Task 2: Add Moddle Merge and Runtime Services

**Files:**
- Create: `src/features/bpmn-nodes/core/merge-moddle.ts`
- Create: `src/features/bpmn-nodes/core/runtime-services.ts`
- Modify: `src/features/bpmn-nodes/core/services/extension-field-service.ts`

- [ ] **Step 1: Create moddle merge utility**

```ts
import type { BpmnNodePlugin } from './types'

export const mergeModdle = (plugins: BpmnNodePlugin[]) => ({
  name: 'Custom',
  uri: 'http://example.com/schema/bpmn/custom',
  prefix: 'custom',
  xml: {
    tagAlias: 'lowerCase'
  },
  types: plugins.flatMap((plugin) => plugin.moddle?.types ?? [])
})
```

- [ ] **Step 2: Define runtime services injected into node events**

```ts
export type NodeRuntimeServices = {
  getNodeKey: typeof getNodeKey
  getNodeData: typeof getNodeData
  setNodeKey: typeof setNodeKey
  setNodeData: typeof setNodeData
}
```

- [ ] **Step 3: Keep extension field service as the single write path**

```ts
export const createNodeRuntimeServices = () => ({
  getNodeKey,
  getNodeData,
  setNodeKey,
  setNodeData
})
```

- [ ] **Step 4: Run type check for moddle and runtime services**

Run: `pnpm exec vue-tsc --noEmit`
Expected: PASS

### Task 3: Rewrite Example Nodes Into Plugin Style

**Files:**
- Create: `src/features/bpmn-nodes/nodes/approval-task/index.ts`
- Create: `src/features/bpmn-nodes/nodes/approval-task/moddle.ts`
- Create: `src/features/bpmn-nodes/nodes/approval-task/palette.ts`
- Create: `src/features/bpmn-nodes/nodes/approval-task/renderer.ts`
- Create: `src/features/bpmn-nodes/nodes/approval-task/events.ts`
- Create: `src/features/bpmn-nodes/nodes/system-task/index.ts`
- Create: `src/features/bpmn-nodes/nodes/system-task/moddle.ts`
- Create: `src/features/bpmn-nodes/nodes/system-task/palette.ts`
- Create: `src/features/bpmn-nodes/nodes/system-task/renderer.ts`
- Create: `src/features/bpmn-nodes/nodes/system-task/events.ts`
- Modify: `src/features/bpmn-nodes/presets/default-nodes.ts`

- [ ] **Step 1: Define approval task palette config**

```ts
export const approvalTaskPalette = {
  group: 'custom-business',
  className: 'bpmn-icon-user-task',
  title: '创建审批任务'
}
```

- [ ] **Step 2: Define approval task renderer config**

```ts
export const approvalTaskRenderer = {
  fill: '#fff3d6',
  stroke: '#c27c00',
  label: '审批'
}
```

- [ ] **Step 3: Define approval task events**

```ts
export const approvalTaskEvents = {
  click() {
    console.log('approval-task clicked')
  },
  created({ element, services, moddle }) {
    const businessObject = element.businessObject
    if (!businessObject) return

    services.setNodeKey(moddle, businessObject, 'approval-task')
    services.setNodeData(moddle, businessObject, {
      assigneeRole: 'manager',
      formKey: ''
    })
  }
}
```

- [ ] **Step 4: Define approval task plugin**

```ts
export default {
  type: 'approval-task',
  baseType: 'bpmn:UserTask',
  palette: approvalTaskPalette,
  renderer: approvalTaskRenderer,
  events: approvalTaskEvents,
  is(element) {
    return getNodeKey(element.businessObject) === 'approval-task'
  }
}
```

- [ ] **Step 5: Mirror the same structure for system task**

```ts
export default {
  type: 'system-task',
  baseType: 'bpmn:ServiceTask',
  palette: systemTaskPalette,
  renderer: systemTaskRenderer,
  events: systemTaskEvents,
  is(element) {
    return getNodeKey(element.businessObject) === 'system-task'
  }
}
```

- [ ] **Step 6: Update preset to point to new node plugins**

```ts
import approvalTaskNode from '../nodes/approval-task'
import systemTaskNode from '../nodes/system-task'

export const defaultEnabledNodePlugins = [approvalTaskNode, systemTaskNode]
```

- [ ] **Step 7: Run type check for node plugin layer**

Run: `pnpm exec vue-tsc --noEmit`
Expected: PASS

### Task 4: Implement Aggregated Palette, Events, and Renderer

**Files:**
- Create: `src/features/bpmn-nodes/core/aggregated-palette.ts`
- Create: `src/features/bpmn-nodes/core/aggregated-events.ts`
- Create: `src/features/bpmn-nodes/core/aggregated-renderer.ts`

- [ ] **Step 1: Implement aggregated palette**

```ts
export class AggregatedPalette {
  constructor(private palette: any, private create: any, private elementFactory: any, private plugins: BpmnNodePlugin[]) {
    palette.registerProvider(this)
  }

  getPaletteEntries() {
    return this.plugins.reduce((entries, plugin) => {
      if (!plugin.palette) return entries

      entries[`create.${plugin.type}`] = {
        group: plugin.palette.group,
        className: plugin.palette.className,
        title: plugin.palette.title,
        action: {
          click: (event: Event) => {
            const shape = this.elementFactory.createShape({ type: plugin.baseType })
            this.create.start(event, shape, { customNodeType: plugin.type })
          },
          dragstart: (event: Event) => {
            const shape = this.elementFactory.createShape({ type: plugin.baseType })
            this.create.start(event, shape, { customNodeType: plugin.type })
          }
        }
      }

      return entries
    }, {} as Record<string, unknown>)
  }
}
```

- [ ] **Step 2: Implement aggregated events**

```ts
export const createAggregatedEventsModule = (plugins: BpmnNodePlugin[], services: NodeRuntimeServices) => ({
  __init__: ['aggregatedEvents'],
  aggregatedEvents: [
    'type',
    class {
      static $inject = ['eventBus', 'moddle']

      constructor(private eventBus: any, private moddle: any) {
        eventBus.on('element.click', (event: any) => this.dispatch('click', event))
        eventBus.on('shape.added', (event: any) => this.dispatch('created', event))
        eventBus.on('element.changed', (event: any) => this.dispatch('changed', event))
      }

      dispatch(type: 'click' | 'created' | 'changed', event: any) {
        const element = event.element
        plugins.forEach((plugin) => {
          if (plugin.is(element) && plugin.events?.[type]) {
            plugin.events[type]?.({ event, element, services, moddle: this.moddle })
          }
        })
      }
    }
  ]
})
```

- [ ] **Step 3: Implement aggregated renderer using marker/overlay strategy**

```ts
export const createAggregatedRendererModule = (plugins: BpmnNodePlugin[], services: NodeRuntimeServices) => ({
  __init__: ['aggregatedRenderer'],
  aggregatedRenderer: [
    'type',
    class {
      static $inject = ['eventBus', 'canvas', 'overlays']

      constructor(private eventBus: any, private canvas: any, private overlays: any) {
        eventBus.on('shape.added', (event: any) => this.decorate(event.element))
        eventBus.on('element.changed', (event: any) => this.decorate(event.element))
      }

      decorate(element: any) {
        const plugin = plugins.find((item) => item.is(element) && item.renderer)
        if (!plugin?.renderer || !element?.id) return

        this.canvas.addMarker(element.id, `custom-node--${plugin.type}`)
      }
    }
  ]
})
```

- [ ] **Step 4: Run build for aggregated modules**

Run: `pnpm build`
Expected: PASS

### Task 5: Create the Aggregated Module Entry

**Files:**
- Create: `src/features/bpmn-nodes/index.ts`

- [ ] **Step 1: Build the top-level aggregated module**

```ts
import { createNodeRuntimeServices } from './core/runtime-services'
import { mergeModdle } from './core/merge-moddle'
import { createAggregatedEventsModule } from './core/aggregated-events'
import { createAggregatedRendererModule } from './core/aggregated-renderer'
import { defaultEnabledNodePlugins } from './presets/default-nodes'

const plugins = defaultEnabledNodePlugins
const services = createNodeRuntimeServices()

export const customModdle = mergeModdle(plugins)

export const customNodeModule = {
  __depends__: [
    createAggregatedEventsModule(plugins, services),
    createAggregatedRendererModule(plugins, services)
  ]
}
```

- [ ] **Step 2: Add aggregated palette module into the entry**

```ts
export const customNodeModule = {
  __init__: ['aggregatedPalette'],
  aggregatedPalette: [
    'type',
    class {
      static $inject = ['palette', 'create', 'elementFactory']

      constructor(palette: any, create: any, elementFactory: any) {
        return new AggregatedPalette(palette, create, elementFactory, plugins)
      }
    }
  ],
  __depends__: [
    createAggregatedEventsModule(plugins, services),
    createAggregatedRendererModule(plugins, services)
  ]
}
```

- [ ] **Step 3: Run type check for top-level module entry**

Run: `pnpm exec vue-tsc --noEmit`
Expected: PASS

### Task 6: Reconnect the Plugin System Through Editor Composition

**Files:**
- Modify: `src/components/bpmn/BpmnEditor.vue`
- Modify: `src/views/BpmnWorkbench.vue`

- [ ] **Step 1: Allow BpmnEditor to accept external additional modules and moddle extensions**

```ts
const props = withDefaults(
  defineProps<{
    additionalModules?: unknown[]
    moddleExtensions?: Record<string, unknown>
  }>(),
  {
    additionalModules: () => [],
    moddleExtensions: () => ({})
  }
)
```

- [ ] **Step 2: Merge injected modules into the modeler initialization**

```ts
modeler = new BpmnModeler({
  container: canvasRef.value,
  moddleExtensions: props.moddleExtensions,
  additionalModules: [...props.additionalModules]
})
```

- [ ] **Step 3: Inject the new custom node module from the page layer**

```ts
import { customModdle, customNodeModule } from '../features/bpmn-nodes'
```

```vue
<BpmnEditor
  ref="editorRef"
  :additional-modules="[customNodeModule]"
  :moddle-extensions="{ custom: customModdle }"
/>
```

- [ ] **Step 4: Keep editor internals free of bpmn-nodes implementation**

```ts
// BpmnEditor should not import any file from ../features/bpmn-nodes/*
```

- [ ] **Step 5: Run build to verify composition boundary**

Run: `pnpm build`
Expected: PASS

### Task 7: Final Verification

**Files:**
- Test only

- [ ] **Step 1: Verify type checking**

Run: `pnpm exec vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Verify production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Manual runtime checklist**

Run: `pnpm dev --host 127.0.0.1`
Expected:
- 左侧能显示聚合后的业务节点入口
- 点击或拖拽节点能创建标准 BPMN 元素
- `shape.added` 后业务节点身份能写入 `extensionElements`
- 点击节点时聚合事件分发能命中对应插件
- 变更节点后 `element.changed` 能触发对应插件逻辑
- `BpmnEditor` 本身不再直接依赖 `bpmn-nodes` 实现细节
