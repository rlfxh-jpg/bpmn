# Pluggable BPMN Node Extension Design

## Goal

在现有 `Vue 3 + bpmn-js` 编辑器基础上，构建一套可插拔的 BPMN 节点扩展架构，支持以下能力：

- 自定义左侧工具栏入口
- 自定义节点外观，包括颜色、图标、标签展示
- 自定义右侧属性面板
- 为标准 BPMN 节点写入和读取自定义扩展字段
- 自定义节点拖拽和创建初始化行为

该架构要求高内聚、低耦合，并且节点扩展代码统一放在 `src/features/` 目录下的子目录中。

## Scope

本次设计覆盖：

- 节点扩展注册机制
- 左侧工具栏扩展机制
- 节点外观扩展机制
- 右侧业务属性面板扩展机制
- BPMN 扩展字段读写机制
- 创建行为扩展机制
- 首版前端集中配置注册，后续兼容后端下发启用清单
- 2 个示例节点扩展

本次设计不包含：

- 自定义脱离 BPMN 标准的新 XML 元素类型
- 自定义 `moddle` 命名空间首版落地
- 后端接口联动
- 权限与租户隔离

## BPMN Standard Boundary

首版不发明新的 BPMN 元素类型。所有扩展节点都基于 BPMN 标准元素进行增强，例如：

- 审批任务：基于 `bpmn:UserTask`
- 系统处理：基于 `bpmn:ServiceTask`

自定义能力通过两层实现：

1. 视觉层扩展
包括 palette、renderer、节点标签、样式

2. 数据层扩展
通过标准节点上的扩展字段承载业务属性，优先采用 `extensionElements` 方式存储，同时保留通过标准字段补充默认值的能力

这样可以保证导出的 BPMN 文档仍然保持标准语义兼容性，同时支持业务扩展。

## Recommended Approach

采用“节点级 feature + 内部按能力拆分”的混合模式。

每个扩展节点作为一个独立 feature 目录存在，内部再按 `palette / renderer / properties / behavior / fields` 等能力拆分。页面和编辑器不直接依赖具体节点细节，只依赖统一的注册中心。

推荐原因：

- 符合“节点级可插拔”的目标
- 单个节点相关逻辑天然聚合，内聚高
- 不同能力边界清晰，便于维护
- 后续可按场景启用或禁用节点
- 可在不改页面核心逻辑的前提下新增节点

## Alternatives Considered

### 方案 1：按能力集中拆分

将所有 palette、renderer、properties、behavior 文件分别放在各自目录下，再通过配置拼装。

优点：

- 同类能力集中

缺点：

- 单个节点逻辑分散
- 新增节点时横跨多个目录，维护成本高

### 方案 2：每个节点一个单文件或单目录但不分层

优点：

- 上手快

缺点：

- 节点能力增长后会迅速膨胀
- 无法保持清晰边界

### 方案 3：节点级 feature + 内部按能力拆分

优点：

- 节点内聚
- 内部结构清晰
- 适合可插拔注册

缺点：

- 初始抽象略多，但长期收益明显

结论：采用方案 3。

## Proposed Directory Structure

```text
src/
├─ features/
│  └─ bpmn-nodes/
│     ├─ core/
│     │  ├─ registry.ts
│     │  ├─ types.ts
│     │  ├─ modules/
│     │  │  ├─ palette-provider.ts
│     │  │  ├─ renderer.ts
│     │  │  ├─ properties-panel.ts
│     │  │  └─ create-behavior.ts
│     │  ├─ services/
│     │  │  ├─ extension-field-service.ts
│     │  │  ├─ node-style-service.ts
│     │  │  └─ node-registry-service.ts
│     │  └─ shared/
│     │     ├─ icons.ts
│     │     ├─ business-object.ts
│     │     └─ element-matcher.ts
│     ├─ approval-task/
│     │  ├─ definition.ts
│     │  ├─ palette.ts
│     │  ├─ renderer.ts
│     │  ├─ properties.ts
│     │  ├─ behavior.ts
│     │  └─ fields.ts
│     ├─ system-task/
│     │  ├─ definition.ts
│     │  ├─ palette.ts
│     │  ├─ renderer.ts
│     │  ├─ properties.ts
│     │  ├─ behavior.ts
│     │  └─ fields.ts
│     └─ presets/
│        └─ default-nodes.ts
```

## Registration Model

每个扩展节点都导出统一定义对象，例如：

- 节点唯一标识
- 绑定的 BPMN 标准元素类型
- palette 配置
- 渲染配置
- 属性面板配置
- 创建行为配置
- 字段定义配置

注册中心只处理统一接口，不关心节点内部实现。

建议定义如下职责边界：

- `definition.ts`
描述该节点的完整扩展定义，是节点对外的唯一装配入口

- `palette.ts`
定义左侧工具栏中的分组、标题、图标、点击创建和拖拽创建能力

- `renderer.ts`
定义节点的颜色、图标、标签补充和可选徽标

- `properties.ts`
定义该节点在右侧业务属性面板中显示哪些字段、以什么控件展示、如何读写

- `behavior.ts`
定义节点创建后的默认值写入逻辑、扩展字段初始化逻辑、必要的创建约束

- `fields.ts`
定义扩展字段元数据，例如字段名、标签、默认值、是否必填、读写路径

## UI Architecture

### Left Palette

左侧工具栏分为两部分：

- BPMN 默认能力区
- 业务节点扩展区

业务节点扩展区由注册中心动态生成。每个节点定义可以声明：

- 分组
- 名称
- 图标
- 基础 BPMN 类型
- 创建时默认写入的数据

### Node Appearance

节点外观不通过新增 BPMN 元素类型实现，而是基于现有元素进行渲染增强：

- 外框颜色
- 填充色
- 自定义图标
- 附加标签
- 状态角标预留

外观逻辑统一由扩展 renderer 接入，renderer 根据当前节点是否命中某个扩展定义决定如何绘制。

### Right Properties Panel

右侧面板分为两层：

1. 标准 BPMN 属性面板
2. 业务扩展属性面板

业务扩展属性面板按当前选中元素动态切换：

- 若元素命中某个扩展节点定义，则渲染该节点专属业务表单
- 若未命中扩展定义，则不显示业务扩展区

页面只关心面板容器，不关心具体节点有哪些字段。

## Data Model

扩展字段首版采用“标准 BPMN 元素 + 扩展字段”模式。

数据模型设计要求：

- 节点必须保留标准 BPMN 类型
- 节点扩展身份通过扩展字段标记，例如 `nodeKey`
- 业务字段统一走扩展字段读写服务

推荐结构：

- 节点身份标识字段
- 节点业务字段集合
- 字段默认值规则
- 字段序列化和反序列化规则

首版不强行绑定某个后端引擎规范，但字段读写服务应预留 namespace / moddle descriptor 接入点，方便下一阶段升级为自定义 moddle 扩展。

## Behavior Model

自定义拖拽和创建行为不绕开 `bpmn-js` 的标准建模流程，而是在标准创建流程后追加扩展行为。

创建行为包括：

- 创建元素时选择基础 BPMN 类型
- 自动写入扩展节点标识
- 自动写入默认业务字段
- 自动写入默认名称
- 可选应用默认样式标记

这样可以避免把业务规则耦合到通用建模器核心中。

## Preset and Enablement

首版采用前端集中配置注册：

- `presets/default-nodes.ts` 负责声明启用哪些节点
- 编辑器初始化时加载该 preset

后续如果改为后端下发启用清单，只需要把后端响应转换成启用列表，再映射到 registry，不需要修改节点内部实现。

## Example Nodes

首版内置两个示例节点，用于验证整套扩展架构。

### Approval Task

- 基础 BPMN 类型：`bpmn:UserTask`
- 业务身份：审批任务
- 自定义能力：
  - palette 新入口
  - 默认名称“审批任务”
  - 自定义颜色和图标
  - 业务字段如 `assigneeRole`、`formKey`
  - 右侧业务属性面板

### System Task

- 基础 BPMN 类型：`bpmn:ServiceTask`
- 业务身份：系统处理
- 自定义能力：
  - palette 新入口
  - 默认名称“系统处理”
  - 自定义颜色和图标
  - 业务字段如 `serviceCode`、`retryPolicy`
  - 创建时自动初始化默认扩展字段

## Coupling Strategy

为保证高内聚、低耦合，采用以下约束：

- 页面层不直接依赖任何具体节点 feature
- 编辑器层不写死某个节点的 palette、renderer、properties 或 behavior
- 节点 feature 只通过统一接口暴露能力
- 通用字段读写逻辑放在 `core/services`
- 启用策略与节点定义分离

## Validation and Future Extension

该架构要兼容现有保存前校验体系。规则上下文后续可以通过扩展节点定义解析出：

- 节点所属扩展类型
- 节点业务字段
- 节点原始 businessObject

后续扩展方向：

- 引入 moddle descriptor 与自定义 namespace
- 支持后端下发节点启用清单
- 支持节点分组权限控制
- 支持不同业务场景装配不同节点 preset
- 支持节点级校验规则绑定

## Validation Criteria

架构落地后的验收标准：

- 左侧工具栏能显示扩展节点入口
- 点击或拖拽可以创建扩展节点
- 创建出的元素仍是标准 BPMN 类型
- 节点能显示自定义颜色、图标或标签效果
- 右侧能显示对应业务属性面板
- 业务字段能写入并从 BPMN 数据中读出
- 不同节点可按 preset 独立启用或停用
- 新增节点时不需要修改页面主逻辑
