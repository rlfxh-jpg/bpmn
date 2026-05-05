# BPMN Nodes Aggregated Plugin Redesign

## Goal

重构当前项目中的 `src/features/bpmn-nodes/`，将其升级为“节点独立开发 + 核心统一聚合 + 事件统一分发”的插件式扩展体系。

本次重构重点解决两个问题：

- 前端事件如何统一监听、统一分发，而不是由各节点各自绑定
- 每个节点如何独立开发，但仍然通过统一注册和统一调度接入系统

## Scope

本次设计覆盖：

- `bpmn-nodes` 的目录重组
- 节点插件描述协议
- 聚合 palette / renderer / events / moddle 的核心机制
- 节点事件分发方式
- 与当前 `BpmnEditor` 的接入边界
- 节点仍然基于标准 BPMN 元素扩展，只通过 `extensionElements` 标识业务节点类型

本次设计不包含：

- 标准属性面板恢复
- 复杂 commandStack 事件体系接入
- 新的业务属性面板 UI 方案落地
- 新增脱离 BPMN 标准的新元素类型

## Core Principles

### 节点基于标准 BPMN 元素扩展

业务节点不发明新的基础 BPMN 元素类型。

例如：

- 审批任务基于 `bpmn:UserTask`
- 系统处理基于 `bpmn:ServiceTask`

业务节点身份通过 `businessObject.extensionElements` 中的扩展结构识别，而不是通过新元素类型识别。

### 节点独立，系统聚合

每个节点目录只负责自己的：

- 节点元信息
- 左侧工具栏展示配置
- 外观配置
- 事件处理逻辑
- moddle 扩展片段

系统层只负责：

- 收集所有节点
- 聚合为统一模块
- 向 `bpmn-js` 注册
- 统一监听并分发事件

### 节点实现使用纯配置 / 纯函数风格

节点目录内部优先导出纯对象、纯函数，不直接暴露 `bpmn-js` provider class。

所有和 `bpmn-js` 深耦合的类式接入细节留在 `core/` 聚合层处理。

## Recommended Directory Structure

按当前项目结构映射后，建议重构为：

```text
src/
└─ features/
   └─ bpmn-nodes/
      ├─ core/
      │  ├─ types.ts
      │  ├─ registry.ts
      │  ├─ merge-moddle.ts
      │  ├─ aggregated-palette.ts
      │  ├─ aggregated-events.ts
      │  ├─ aggregated-renderer.ts
      │  ├─ runtime-services.ts
      │  └─ services/
      │     └─ extension-field-service.ts
      ├─ nodes/
      │  ├─ approval-task/
      │  │  ├─ index.ts
      │  │  ├─ moddle.ts
      │  │  ├─ palette.ts
      │  │  ├─ renderer.ts
      │  │  └─ events.ts
      │  └─ system-task/
      │     ├─ index.ts
      │     ├─ moddle.ts
      │     ├─ palette.ts
      │     ├─ renderer.ts
      │     └─ events.ts
      ├─ presets/
      │  └─ default-nodes.ts
      └─ index.ts
```

## Why Restructure From Current Layout

当前结构虽然已经有 `core/` 和节点目录，但仍然存在两个主要问题：

1. `BpmnEditor` 曾经知道过多节点系统细节，节点系统和编辑器内核边界不够清楚
2. 节点能力虽然已经被拆分，但缺少“统一聚合入口”，尤其是事件与渲染的统一调度仍然不够标准化

这次重构的目标，是让 `bpmn-nodes` 成为真正的“插件系统”，而不是一组松散的扩展文件。

## Node Plugin Contract

每个节点通过一个统一定义对象接入系统，推荐结构如下：

```ts
export type BpmnNodePlugin = {
  type: string
  baseType: string
  moddle?: ModdleDescriptorFragment
  palette?: NodePaletteConfig
  renderer?: NodeRendererConfig
  events?: NodeEventHandlers
  is: (element: DiagramElement) => boolean
}
```

说明：

- `type`
业务节点唯一标识，例如 `approval-task`

- `baseType`
绑定的标准 BPMN 元素类型，例如 `bpmn:UserTask`

- `moddle`
该节点需要的扩展字段描述片段

- `palette`
左侧工具栏入口配置

- `renderer`
节点外观配置，不直接写底层 renderer class

- `events`
该节点自己的事件处理函数集合

- `is(element)`
用于判断某个 BPMN 元素是否属于当前节点插件

## Event Handling Design

第一版统一监听以下事件：

- `element.click`
- `shape.added`
- `element.changed`

统一由 `AggregatedEvents` 监听，再分发给节点插件。

### Dispatch Flow

```text
eventBus.on(...)
  -> AggregatedEvents
  -> 遍历已注册节点
  -> node.is(element)
  -> 命中后执行 node.events[type]
```

### Why This Is Preferred

不让每个节点自己绑定 `eventBus` 的原因：

- 事件源会重复注册
- 生命周期更难控制
- 节点数量增长后，排查谁响应了事件会变复杂
- 编辑器销毁时，清理边界也会变差

统一监听再分发，能保证系统行为清晰、可控、可扩展。

## Palette Aggregation

`AggregatedPalette` 负责读取所有节点的 `palette` 配置，并统一注册给 `bpmn-js`。

节点目录本身只需要声明：

- group
- className
- title
- 创建时使用的标准 BPMN 基础类型

真正的 `palette.registerProvider(...)` 行为只发生在 core 聚合层。

## Renderer Aggregation

首版不直接回到复杂的 SVG renderer 深度接入，而采用“节点声明渲染配置，聚合层统一处理”的方向。

也就是说，节点只描述：

- fill
- stroke
- label
- badge

聚合层负责把这些配置转换成统一的画布表现方式。

在当前项目阶段，优先可继续沿用：

- marker
- overlay
- CSS class

这种更稳定的方案，而不是让每个节点直接实现深度 renderer class。

## Moddle Aggregation

每个节点可以提供自己的 moddle 片段，但最终只允许系统输出一个统一的 `custom` moddle descriptor。

因此需要一个 `merge-moddle.ts`：

- 收集所有节点的 moddle 类型定义
- 合并成一个统一 `custom` descriptor
- 挂到 `moddleExtensions.custom`

这样可以避免：

- namespace 重复定义
- 不同节点自己维护不一致的 descriptor
- editor 初始化时传多个分散 moddle 对象

## Runtime Services

为了让节点事件逻辑保持纯函数风格，但仍能访问运行时能力，建议由 `core/runtime-services.ts` 统一向节点事件注入服务能力。

例如：

- `getNodeKey`
- `getNodeData`
- `setNodeData`
- `updateLabel`
- `readBusinessObject`

这样节点的 `events.ts` 不需要直接依赖 `modeler.get(...)` 这类底层调用。

## Integration Boundary With BpmnEditor

重构后的 `BpmnEditor` 应继续保持“通用建模器内核”角色，不直接硬编码节点系统细节。

推荐边界如下：

- `BpmnEditor`
  - 初始化 `bpmn-js`
  - 导入导出 XML / SVG
  - 画布缩放、布局、通用校验上下文
  - 接受外部传入的 `additionalModules` 和 `moddleExtensions`

- `bpmn-nodes/index.ts`
  - 导出聚合后的 `customNodeModule`
  - 导出聚合后的 `customModdle`

- 页面或装配层
  - 负责把 `customNodeModule` 和 `customModdle` 注入到 `BpmnEditor`

这样编辑器和节点扩展系统是“装配关系”，不是“源码内嵌关系”。

## Example Node Responsibilities

### approval-task

- baseType: `bpmn:UserTask`
- 识别方式：从 `extensionElements` 中识别 `nodeKey = approval-task`
- 颜色 / badge：审批主题
- 事件：
  - click: 可以打开审批业务上下文
  - created: 写入默认审批字段
  - changed: 响应节点业务变化

### system-task

- baseType: `bpmn:ServiceTask`
- 识别方式：从 `extensionElements` 中识别 `nodeKey = system-task`
- 颜色 / badge：系统主题
- 事件：
  - click: 进入系统配置上下文
  - created: 写入默认系统字段
  - changed: 响应服务配置变化

## Why Pure Config / Function Style

本次明确选择“节点内部纯配置 / 纯函数风格”，原因是：

- 节点代码更轻，开发门槛更低
- 不把 `bpmn-js` 复杂类式接入语义散落到每个节点目录
- 聚合层可以统一管理 provider、renderer、eventBus 生命周期
- 更容易做统一测试和统一调试

如果将来某个节点确实需要复杂实现，也可以在纯配置基础上局部升级，但不改变整体架构。

## Validation Criteria

重构完成后应满足：

- 每个节点可独立开发，不直接操作 `eventBus` 注册
- 所有节点通过统一 `index.ts` 聚合注册
- `moddleExtensions` 最终只对外暴露一个统一 `custom` descriptor
- `element.click` / `shape.added` / `element.changed` 都通过统一事件聚合层分发
- `BpmnEditor` 不再内嵌节点系统实现细节
- 新增节点时，主要只需新增节点目录并加入 preset
