# Vue + bpmn-js Frontend Design

## Goal

在当前目录从零搭建一个独立前端工程，使用 `Vue 3 + TypeScript + Vite + Element Plus + bpmn-js`，并提供一个可直接运行的 BPMN 建模页面，满足后续流程设计器扩展的基础开发需求。

## Scope

本次工作仅覆盖前端开发环境与最小可用示例，不包含：

- 后端接口联调
- 权限系统
- 多页面业务路由体系
- 流程属性面板深度定制
- 流程定义持久化与版本管理

## Recommended Approach

采用 `Vite + Vue 3 + TypeScript` 官方模板作为脚手架基础，在最小依赖集上引入 `Element Plus` 与 `bpmn-js`，并封装一个基础 `BpmnEditor` 组件。

这样做的原因：

- `Vite` 启动与构建速度快，适合本地开发与后续扩展
- `Vue 3 + TypeScript` 是当前主流组合，工程可维护性更好
- `Element Plus` 与 Vue 3 生态一致，适合快速搭建后台式工具界面
- `bpmn-js` 可以直接集成到组件中，先满足建模主链路，再逐步补充属性面板等能力

## Alternatives Considered

### 方案 1：最小可用工程

`Vite + Vue 3 + TS + Element Plus + bpmn-js`

优点：

- 初始化快
- 依赖少
- 结构清晰
- 便于后续按需扩展

缺点：

- 路由、状态管理、接口层需要后续按需补充

### 方案 2：预置业务骨架

在方案 1 基础上同时加入路由、状态管理、API 目录、基础后台布局。

优点：

- 更适合快速进入业务开发

缺点：

- 当前阶段会引入不必要的样板代码
- 会增加初始化复杂度

### 方案 3：旧脚手架方案

例如 Vue CLI。

不推荐原因：

- 维护体验与构建性能落后于 Vite
- 与当前 Vue 3 主流实践不一致

## Architecture

工程以单页最小可用编辑器为起点，不预先铺设复杂业务结构。首屏提供流程建模主画布，并保留导入、导出、重置等基础操作入口。

组件职责划分如下：

- 页面组件：负责整体布局、工具栏按钮、编辑器事件编排
- `BpmnEditor` 组件：负责 `bpmn-js` 模型器实例创建、XML 导入导出、组件卸载销毁
- 样式层：负责全局高度布局、`Element Plus` 页面骨架样式、`bpmn-js` 所需样式引入

该结构可以保证后续接入 `properties panel`、流程保存接口、节点配置面板时，不需要重构编辑器核心逻辑。

## Proposed File Structure

```text
.
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ src
   ├─ main.ts
   ├─ App.vue
   ├─ views
   │  └─ BpmnWorkbench.vue
   ├─ components
   │  └─ bpmn
   │     └─ BpmnEditor.vue
   ├─ styles
   │  └─ index.css
   ├─ assets
   │  └─ default.bpmn
   └─ types
      └─ bpmn.d.ts
```

文件职责：

- `src/views/BpmnWorkbench.vue`：页面布局、工具栏按钮、结果展示
- `src/components/bpmn/BpmnEditor.vue`：封装建模器实例与公开操作
- `src/assets/default.bpmn`：默认载入的 BPMN XML
- `src/styles/index.css`：全局高度与 BPMN 容器样式
- `src/types/bpmn.d.ts`：必要时补充静态资源类型声明

## UI Design

首屏采用后台工具型布局：

- 顶部工具栏：放置导入 XML、导出 XML、导出 SVG、重置画布等操作按钮
- 主内容区：显示 `bpmn-js` 画布
- 辅助区：先展示提示信息或导出结果反馈，后续可替换为属性面板或节点配置区

UI 目标不是做复杂视觉设计，而是保证画布区域稳定可见、操作路径清晰、后续扩展方便。

## Error Handling

本次实现包含以下基础错误处理：

- `bpmn-js` 初始化失败时显示明确错误提示
- 导入默认 XML 失败时显示错误信息
- 用户导出失败时给出操作反馈
- 组件卸载时销毁模型器实例，避免热更新或后续页面切换导致资源泄漏

## Validation Criteria

环境搭建完成的验收标准如下：

- `pnpm install` 可成功安装依赖
- `pnpm dev` 可正常启动开发服务器
- 页面可渲染 `Element Plus` 布局
- 页面中能看到可交互的 `bpmn-js` 建模画布
- 默认 BPMN XML 可自动载入
- `pnpm build` 可成功通过

## Implementation Notes

实现阶段应优先保证最小可运行与最小可维护：

- 不提前引入 Pinia、Vue Router 等非当前必要依赖
- 不做复杂二次封装，只封装当前明确需要的编辑器能力
- 默认示例应可直接编辑，避免“依赖都装好了但页面没有实际价值”的空壳工程

## Out of Scope for This Iteration

以下能力明确留到后续迭代：

- `bpmn-js-properties-panel`
- 自定义节点面板
- 后端保存与加载
- 多路由页面拆分
- 权限与登录接入
