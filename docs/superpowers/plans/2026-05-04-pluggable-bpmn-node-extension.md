# Pluggable BPMN Node Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有 BPMN 编辑器增加可插拔的节点扩展框架，支持自定义左侧工具栏、自定义节点外观、自定义右侧业务属性面板、扩展字段和自定义创建行为。

**Architecture:** 基于 `src/features/bpmn-nodes/` 构建节点注册中心，每个节点 feature 独立目录并按 `palette / renderer / properties / behavior / fields` 拆分。编辑器仅接入统一 registry 和通用模块，不直接依赖具体节点，实现高内聚低耦合与后续后端下发配置兼容。

**Tech Stack:** `Vue 3`, `TypeScript`, `bpmn-js`, `bpmn-js-properties-panel`, `Element Plus`, `Vite`

---

## File Structure

本次实现预计创建或修改以下文件：

- Create: `src/features/bpmn-nodes/core/types.ts`
- Create: `src/features/bpmn-nodes/core/registry.ts`
- Create: `src/features/bpmn-nodes/core/modules/palette-provider.ts`
- Create: `src/features/bpmn-nodes/core/modules/renderer.ts`
- Create: `src/features/bpmn-nodes/core/modules/properties-panel.ts`
- Create: `src/features/bpmn-nodes/core/modules/create-behavior.ts`
- Create: `src/features/bpmn-nodes/core/services/extension-field-service.ts`
- Create: `src/features/bpmn-nodes/core/services/node-registry-service.ts`
- Create: `src/features/bpmn-nodes/core/shared/business-object.ts`
- Create: `src/features/bpmn-nodes/core/shared/icons.ts`
- Create: `src/features/bpmn-nodes/approval-task/definition.ts`
- Create: `src/features/bpmn-nodes/approval-task/palette.ts`
- Create: `src/features/bpmn-nodes/approval-task/renderer.ts`
- Create: `src/features/bpmn-nodes/approval-task/properties.ts`
- Create: `src/features/bpmn-nodes/approval-task/behavior.ts`
- Create: `src/features/bpmn-nodes/approval-task/fields.ts`
- Create: `src/features/bpmn-nodes/system-task/definition.ts`
- Create: `src/features/bpmn-nodes/system-task/palette.ts`
- Create: `src/features/bpmn-nodes/system-task/renderer.ts`
- Create: `src/features/bpmn-nodes/system-task/properties.ts`
- Create: `src/features/bpmn-nodes/system-task/behavior.ts`
- Create: `src/features/bpmn-nodes/system-task/fields.ts`
- Create: `src/features/bpmn-nodes/presets/default-nodes.ts`
- Modify: `src/components/bpmn/BpmnEditor.vue`
- Modify: `src/views/BpmnWorkbench.vue`
- Modify: `src/styles/index.css`
- Modify: `src/features/bpmn-validation/types.ts`
- Modify: `src/features/bpmn-validation/default-rules.ts`

### Task 1: Build Core Node Extension Types and Registry

**Files:**
- Create: `src/features/bpmn-nodes/core/types.ts`
- Create: `src/features/bpmn-nodes/core/registry.ts`
- Create: `src/features/bpmn-nodes/core/services/node-registry-service.ts`
- Create: `src/features/bpmn-nodes/presets/default-nodes.ts`

- [ ] **Step 1: Define core extension types**

```ts
export type BpmnNodeFieldDefinition = {
  key: string
  label: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
}

export type BpmnNodePaletteEntry = {
  group: string
  className: string
  title: string
}

export type BpmnNodeStyleDefinition = {
  fill: string
  stroke: string
  label?: string
  badgeText?: string
}

export type BpmnNodeDefinition = {
  key: string
  baseType: 'bpmn:UserTask' | 'bpmn:ServiceTask'
  displayName: string
  palette: BpmnNodePaletteEntry
  style: BpmnNodeStyleDefinition
  fields: BpmnNodeFieldDefinition[]
  initBusinessFields: () => Record<string, string>
}
```

- [ ] **Step 2: Create registry builder**

```ts
import type { BpmnNodeDefinition } from './types'

export const createBpmnNodeRegistry = (definitions: BpmnNodeDefinition[]) => {
  const byKey = new Map(definitions.map((definition) => [definition.key, definition]))

  return {
    list: () => definitions,
    getByKey: (key: string) => byKey.get(key),
    matchByElementType: (type: string) =>
      definitions.filter((definition) => definition.baseType === type)
  }
}
```

- [ ] **Step 3: Add node registry service facade**

```ts
import type { BpmnNodeDefinition } from '../types'
import { createBpmnNodeRegistry } from '../registry'

export const createNodeRegistryService = (definitions: BpmnNodeDefinition[]) => {
  const registry = createBpmnNodeRegistry(definitions)

  return {
    getDefinitions: registry.list,
    getDefinition: registry.getByKey
  }
}
```

- [ ] **Step 4: Create default enabled preset**

```ts
import { approvalTaskDefinition } from '../approval-task/definition'
import { systemTaskDefinition } from '../system-task/definition'

export const defaultEnabledNodeDefinitions = [
  approvalTaskDefinition,
  systemTaskDefinition
]
```

- [ ] **Step 5: Run type check for registry layer**

Run: `pnpm exec vue-tsc --noEmit`
Expected: passes with no type errors from new registry files

### Task 2: Add Shared Extension Field Read/Write Utilities

**Files:**
- Create: `src/features/bpmn-nodes/core/shared/business-object.ts`
- Create: `src/features/bpmn-nodes/core/services/extension-field-service.ts`

- [ ] **Step 1: Add business object helper constants**

```ts
export const NODE_KEY_FIELD = 'nodeKey'
export const NODE_DATA_FIELD = 'nodeData'
```

- [ ] **Step 2: Create extension field service**

```ts
import { NODE_DATA_FIELD, NODE_KEY_FIELD } from '../shared/business-object'

type RawBusinessObject = Record<string, unknown>

export const getNodeKey = (businessObject: RawBusinessObject | null | undefined) => {
  const value = businessObject?.[NODE_KEY_FIELD]
  return typeof value === 'string' ? value : ''
}

export const setNodeKey = (businessObject: RawBusinessObject, nodeKey: string) => {
  businessObject[NODE_KEY_FIELD] = nodeKey
}

export const getNodeData = (businessObject: RawBusinessObject | null | undefined) => {
  const value = businessObject?.[NODE_DATA_FIELD]
  return value && typeof value === 'object' ? (value as Record<string, string>) : {}
}

export const setNodeData = (
  businessObject: RawBusinessObject,
  patch: Record<string, string>
) => {
  businessObject[NODE_DATA_FIELD] = {
    ...getNodeData(businessObject),
    ...patch
  }
}
```

- [ ] **Step 3: Run type check for field service**

Run: `pnpm exec vue-tsc --noEmit`
Expected: passes with no type errors from extension field helpers

### Task 3: Implement Two Example Node Definitions

**Files:**
- Create: `src/features/bpmn-nodes/approval-task/definition.ts`
- Create: `src/features/bpmn-nodes/approval-task/fields.ts`
- Create: `src/features/bpmn-nodes/approval-task/palette.ts`
- Create: `src/features/bpmn-nodes/approval-task/renderer.ts`
- Create: `src/features/bpmn-nodes/approval-task/properties.ts`
- Create: `src/features/bpmn-nodes/approval-task/behavior.ts`
- Create: `src/features/bpmn-nodes/system-task/definition.ts`
- Create: `src/features/bpmn-nodes/system-task/fields.ts`
- Create: `src/features/bpmn-nodes/system-task/palette.ts`
- Create: `src/features/bpmn-nodes/system-task/renderer.ts`
- Create: `src/features/bpmn-nodes/system-task/properties.ts`
- Create: `src/features/bpmn-nodes/system-task/behavior.ts`

- [ ] **Step 1: Define approval task fields**

```ts
export const approvalTaskFields = [
  { key: 'assigneeRole', label: '审批角色', defaultValue: 'manager', required: true },
  { key: 'formKey', label: '表单标识', defaultValue: '' }
]
```

- [ ] **Step 2: Define system task fields**

```ts
export const systemTaskFields = [
  { key: 'serviceCode', label: '服务编码', defaultValue: '', required: true },
  { key: 'retryPolicy', label: '重试策略', defaultValue: 'none' }
]
```

- [ ] **Step 3: Define approval task extension**

```ts
import { approvalTaskFields } from './fields'

export const approvalTaskDefinition = {
  key: 'approval-task',
  baseType: 'bpmn:UserTask',
  displayName: '审批任务',
  palette: {
    group: 'custom-business',
    className: 'bpmn-icon-user-task',
    title: '创建审批任务'
  },
  style: {
    fill: '#fff3d6',
    stroke: '#c27c00',
    label: '审批'
  },
  fields: approvalTaskFields,
  initBusinessFields: () => ({
    assigneeRole: 'manager',
    formKey: ''
  })
}
```

- [ ] **Step 4: Define system task extension**

```ts
import { systemTaskFields } from './fields'

export const systemTaskDefinition = {
  key: 'system-task',
  baseType: 'bpmn:ServiceTask',
  displayName: '系统处理',
  palette: {
    group: 'custom-business',
    className: 'bpmn-icon-service-task',
    title: '创建系统处理'
  },
  style: {
    fill: '#dff4ff',
    stroke: '#1668dc',
    label: '系统'
  },
  fields: systemTaskFields,
  initBusinessFields: () => ({
    serviceCode: '',
    retryPolicy: 'none'
  })
}
```

- [ ] **Step 5: Run type check for node definition layer**

Run: `pnpm exec vue-tsc --noEmit`
Expected: passes with no type errors from example node definitions

### Task 4: Integrate Palette, Renderer, Properties, and Create Behavior

**Files:**
- Create: `src/features/bpmn-nodes/core/modules/palette-provider.ts`
- Create: `src/features/bpmn-nodes/core/modules/renderer.ts`
- Create: `src/features/bpmn-nodes/core/modules/properties-panel.ts`
- Create: `src/features/bpmn-nodes/core/modules/create-behavior.ts`
- Modify: `src/components/bpmn/BpmnEditor.vue`

- [ ] **Step 1: Create palette provider module**

```ts
export const createPaletteProviderModule = (registry: {
  getDefinitions: () => Array<{
    key: string
    baseType: string
    displayName: string
    palette: { group: string; className: string; title: string }
  }>
}) => ({
  __init__: ['customPaletteProvider'],
  customPaletteProvider: [
    'type',
    class {
      constructor(private palette: any, private create: any, private elementFactory: any) {
        palette.registerProvider(this)
      }

      getPaletteEntries() {
        return registry.getDefinitions().reduce((entries, definition) => {
          entries[`create.${definition.key}`] = {
            group: definition.palette.group,
            className: definition.palette.className,
            title: definition.palette.title,
            action: {
              click: (event: MouseEvent) => {
                const shape = this.elementFactory.createShape({ type: definition.baseType })
                this.create.start(event, shape, { customNodeKey: definition.key })
              },
              dragstart: (event: DragEvent) => {
                const shape = this.elementFactory.createShape({ type: definition.baseType })
                this.create.start(event, shape, { customNodeKey: definition.key })
              }
            }
          }

          return entries
        }, {} as Record<string, unknown>)
      }
    }
  ]
})
```

- [ ] **Step 2: Create create behavior module**

```ts
import { setNodeData, setNodeKey } from '../services/extension-field-service'

export const createCreateBehaviorModule = (registry: {
  getDefinition: (key: string) => {
    displayName: string
    initBusinessFields: () => Record<string, string>
  } | undefined
}) => ({
  __init__: ['customCreateBehavior'],
  customCreateBehavior: [
    'type',
    class {
      constructor(private eventBus: any, private modeling: any) {
        eventBus.on('commandStack.shape.create.postExecuted', ({ context }: any) => {
          const nodeKey = context.hints?.customNodeKey
          if (!nodeKey) return

          const definition = registry.getDefinition(nodeKey)
          if (!definition) return

          const businessObject = context.shape.businessObject
          setNodeKey(businessObject, nodeKey)
          setNodeData(businessObject, definition.initBusinessFields())

          if (!businessObject.name) {
            modeling.updateLabel(context.shape, definition.displayName)
          }
        })
      }
    }
  ]
})
```

- [ ] **Step 3: Create renderer module**

```ts
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer'
import { getNodeKey } from '../services/extension-field-service'

export const createCustomRendererModule = (registry: {
  getDefinition: (key: string) => {
    style: { fill: string; stroke: string; label?: string }
  } | undefined
}) => ({
  __init__: ['customRenderer'],
  customRenderer: [
    'type',
    class extends BaseRenderer {
      constructor(private eventBus: any, private bpmnRenderer: any) {
        super(eventBus, 2000)
      }

      canRender(element: any) {
        return Boolean(element?.businessObject)
      }

      drawShape(parentNode: SVGElement, element: any) {
        const shape = this.bpmnRenderer.drawShape(parentNode, element)
        const nodeKey = getNodeKey(element.businessObject)
        const definition = registry.getDefinition(nodeKey)
        if (!definition) return shape

        ;(shape as SVGElement).style.fill = definition.style.fill
        ;(shape as SVGElement).style.stroke = definition.style.stroke
        return shape
      }
    }
  ]
})
```

- [ ] **Step 4: Update editor initialization to load custom node modules**

```ts
const registryService = createNodeRegistryService(defaultEnabledNodeDefinitions)

modeler = new BpmnModeler({
  container: canvasRef.value,
  propertiesPanel: { parent: propertiesPanelRef.value },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    createPaletteProviderModule(registryService),
    createCreateBehaviorModule(registryService),
    createCustomRendererModule(registryService)
  ]
})
```

- [ ] **Step 5: Run build to verify BPMN editor integration**

Run: `pnpm build`
Expected: build passes and editor still initializes successfully

### Task 5: Add Custom Business Properties Panel UI

**Files:**
- Create: `src/features/bpmn-nodes/core/modules/properties-panel.ts`
- Modify: `src/views/BpmnWorkbench.vue`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Add selection state exposure from editor**

```ts
const getSelectionSnapshot = () => {
  const selection = modeler?.get('selection') as any
  const selected = selection?.get()?.[0]
  return selected
    ? {
        id: selected.id,
        type: selected.type,
        name: selected.businessObject?.name ?? ''
      }
    : null
}
```

- [ ] **Step 2: Render a custom business panel beside the standard panel**

```vue
<el-card shadow="never" class="workbench__panel workbench__panel--business">
  <template #header>业务属性</template>
  <div v-if="selectedNodeConfig">
    <el-form label-position="top">
      <el-form-item
        v-for="field in selectedNodeConfig.fields"
        :key="field.key"
        :label="field.label"
      >
        <el-input
          :model-value="fieldValues[field.key] ?? ''"
          :placeholder="field.placeholder ?? ''"
          @update:model-value="(value) => updateBusinessField(field.key, value)"
        />
      </el-form-item>
    </el-form>
  </div>
  <el-empty v-else description="当前节点没有业务扩展配置" />
</el-card>
```

- [ ] **Step 3: Style the right side dual-panel layout**

```css
.workbench__aside {
  display: grid;
  grid-template-rows: minmax(320px, 1fr) minmax(220px, 320px);
  gap: 12px;
}
```

- [ ] **Step 4: Run build to verify business panel UI**

Run: `pnpm build`
Expected: build passes and layout compiles cleanly

### Task 6: Extend Validation Context with Custom Node Metadata

**Files:**
- Modify: `src/features/bpmn-validation/types.ts`
- Modify: `src/components/bpmn/BpmnEditor.vue`
- Modify: `src/features/bpmn-validation/default-rules.ts`

- [ ] **Step 1: Add custom node metadata to validation context**

```ts
export type BpmnValidationElement = {
  id: string
  type: string
  name?: string
  nodeKey?: string
  nodeData?: Record<string, string>
  businessObject: BpmnValidationBusinessObject | null
  parentId?: string
  incomingIds: string[]
  outgoingIds: string[]
}
```

- [ ] **Step 2: Populate nodeKey and nodeData from extension field service**

```ts
const nodeKey = getNodeKey(element.businessObject)
const nodeData = getNodeData(element.businessObject)
```

- [ ] **Step 3: Keep validation rules independent of UI layer**

```ts
export const defaultBpmnValidationRules: BpmnValidationRule[] = [
  requireProcessContentRule,
  requireStartEventRule,
  requireEndEventRule,
  requireSequenceFlowRule,
  requireTaskNameRule
]
```

- [ ] **Step 4: Run type check for validation context changes**

Run: `pnpm exec vue-tsc --noEmit`
Expected: passes with no rule type regressions

### Task 7: Final Verification

**Files:**
- Test only

- [ ] **Step 1: Verify type checking**

Run: `pnpm exec vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Verify production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Manual behavior checklist**

Run: `pnpm dev --host 127.0.0.1`
Expected:
- 左侧能看到审批任务和系统处理入口
- 可点击或拖拽创建对应节点
- 节点显示自定义外观
- 右侧显示标准属性面板
- 选中扩展节点时可编辑业务字段
- 导出 BPMN 前仍会执行校验

