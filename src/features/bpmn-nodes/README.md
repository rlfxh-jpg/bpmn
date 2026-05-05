# bpmn-nodes 设计思路

## 目录目标

`src/features/bpmn-nodes/` 现在采用“节点独立开发 + 核心统一聚合 + 事件统一分发”的插件式结构。

这个目录的目标不是把业务节点逻辑塞进编辑器，而是提供一个独立的节点扩展系统，使业务节点能够：

- 基于标准 BPMN 元素扩展
- 通过 `extensionElements` 标识节点身份
- 独立声明 palette / renderer / events / moddle 片段
- 通过统一入口聚合后再注入编辑器

## 当前目录结构

```text
src/features/bpmn-nodes/
├─ core/
│  ├─ aggregated-events.ts
│  ├─ aggregated-palette.ts
│  ├─ aggregated-renderer.ts
│  ├─ merge-moddle.ts
│  ├─ registry.ts
│  ├─ runtime-services.ts
│  ├─ types.ts
│  ├─ moddle/
│  │  └─ custom.json
│  ├─ services/
│  │  └─ extension-field-service.ts
│  └─ shared/
│     └─ business-object.ts
├─ nodes/
│  ├─ approval-task/
│  │  ├─ events.ts
│  │  ├─ index.ts
│  │  ├─ moddle.ts
│  │  ├─ palette.ts
│  │  └─ renderer.ts
│  └─ system-task/
│     ├─ events.ts
│     ├─ index.ts
│     ├─ moddle.ts
│     ├─ palette.ts
│     └─ renderer.ts
├─ presets/
│  └─ default-nodes.ts
└─ index.ts
```

## 为什么是 `core + nodes + presets + index`

### `core/`

`core` 负责所有节点都共享的基础设施：

- 节点插件协议定义
- 插件注册和查询
- palette 聚合
- 事件统一监听与分发
- 外观聚合
- moddle 合并
- 扩展字段统一读写

这里的原则是：凡是“所有节点都要复用”的能力，都收敛到 `core`，避免每个节点重复实现底层逻辑。

### `nodes/`

`nodes/` 下面每个目录就是一个真正的业务节点插件。

每个节点目录只负责自己的：

- 业务节点类型标识
- 对应标准 BPMN 基础类型
- 左侧工具栏配置
- 外观配置
- 事件处理逻辑
- 需要的 moddle 片段

这样节点天然高内聚，新增节点时只需要围绕该目录工作。

### `presets/`

`presets/` 只负责声明“当前启用了哪些节点插件”。

这层单独存在的价值在于把：

- 节点实现
- 节点启用策略

彻底分开。后续如果切换场景、权限或后端下发启用清单，优先改 preset，而不是改节点源码。

### `index.ts`

根入口负责：

- 收集当前启用节点
- 生成统一 `customModdle`
- 生成统一 `customNodeModule`

编辑器或页面层只和这个入口交互，而不直接 import 各个节点目录。

## 为什么节点仍然基于标准 BPMN 元素

当前约束依然是：

- 不随意发明新的基础 BPMN 元素类型
- 节点身份只通过扩展数据表达

例如：

- 审批任务基于 `bpmn:UserTask`
- 系统处理基于 `bpmn:ServiceTask`

业务节点身份通过 `extensionElements` 中的 `custom:NodeMeta` 识别，而不是通过 `bpmn:ApprovalTask` 这种自造元素类型识别。

这样做的好处是：

- 流程语义仍然是标准 BPMN
- 导出的 XML 更容易与其他工具或后端兼容
- 节点扩展可以迭代，但 BPMN 基础语义不被破坏

## 为什么节点内部使用纯配置 / 纯函数风格

当前节点插件目录刻意不直接暴露 `bpmn-js` provider class。

原因是：

- 节点开发门槛更低
- 节点代码更容易测试
- `bpmn-js` 生命周期和依赖注入细节全部收敛在聚合层
- 不会把 `eventBus` / `palette` / `renderer` 这种底层接入语义散落到每个节点目录

节点只描述“我要什么能力”，聚合层负责“怎么接进 bpmn-js”。

## 事件为什么统一走聚合分发

当前第一版统一监听：

- `element.click`
- `shape.added`
- `element.changed`

统一由 `aggregated-events.ts` 监听，再按节点插件分发。

这么做的原因：

- 避免每个节点自己重复绑定 `eventBus`
- 避免生命周期和解绑边界混乱
- 让所有事件入口清晰可控

需要特别注意的一点是：

- `click / changed` 可以通过 `plugin.is(element)` 判断
- `created` 不能完全依赖 `plugin.is(element)`

因为节点刚创建出来时，还没有写入 `nodeKey`。所以系统通过 runtime services 中的“待创建节点类型”上下文，先完成首次识别，再把 `nodeKey / nodeData` 写入 `extensionElements`。

## 为什么扩展字段要统一走 `extension-field-service`

如果页面、节点事件、校验规则都各自手写 `extensionElements` 结构，会出现：

- XML 结构散落
- 写法不一致
- 难以维护
- 导入导出恢复不稳定

因此当前统一做法是：

- `core/moddle/custom.json` 定义 XML 扩展结构
- `core/services/extension-field-service.ts` 统一读写

这样所有节点都通过一套标准方式读写：

- `custom:NodeMeta`
- `custom:Field`

## 与 BpmnEditor 的关系

重构后的 `bpmn-nodes` 不再把实现细节塞进 `BpmnEditor`。

推荐边界是：

- `BpmnEditor`
  - 只负责通用建模器能力
  - 接受外部传入 `additionalModules` 和 `moddleExtensions`

- `bpmn-nodes/index.ts`
  - 对外导出 `customNodeModule`
  - 对外导出 `customModdle`

- 页面层
  - 把它们装配进 `BpmnEditor`

这使得 `BpmnEditor` 和节点系统是“装配关系”，不是“源码内嵌关系”。

## 当前节点插件的实际职责

### `nodes/approval-task/`

- 描述审批任务是什么
- 配置审批任务的左侧入口
- 配置审批任务外观
- 在 `created` 事件中写入默认审批字段

### `nodes/system-task/`

- 描述系统处理节点是什么
- 配置系统处理节点的左侧入口
- 配置系统处理节点外观
- 在 `created` 事件中写入默认系统字段

## 当前整体设计原则

### 高内聚

- 单个节点自己的逻辑集中在自己的目录
- 所有底层基础设施集中在 `core`

### 低耦合

- 页面层不硬编码节点细节
- 编辑器层不直接依赖节点实现
- 节点启用策略与节点源码分离

### 可拔插

- 新增节点主要是新增一个节点目录并加入 preset
- 下线节点主要是调整 preset
- palette / events / renderer / moddle 都统一走聚合入口

## 后续推荐演进方向

如果继续完善当前结构，推荐顺序是：

1. 恢复或重建业务属性面板，并与新插件体系对接
2. 让聚合渲染层支持更丰富的标签与角标表现
3. 让校验规则按节点插件挂接
4. 支持不同场景加载不同 preset
5. 最后再考虑更复杂的 commandStack 事件体系
