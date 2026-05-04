# Vue + bpmn-js Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前目录搭建一个可运行的 `Vue 3 + TypeScript + Vite + Element Plus + bpmn-js` 前端工程，并提供默认可编辑的 BPMN 建模页面。

**Architecture:** 使用 `Vite` 官方 `Vue + TS` 模板作为基础，页面层负责工具栏与结果反馈，`BpmnEditor` 组件负责 `bpmn-js` 模型器生命周期与导入导出能力。全局样式统一处理页面高度和 BPMN 画布可见性，默认 BPMN XML 作为静态资源直接加载。

**Tech Stack:** `Vue 3`, `TypeScript`, `Vite`, `pnpm`, `Element Plus`, `bpmn-js`

---

## File Structure

本次实现会创建或修改以下文件：

- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/views/BpmnWorkbench.vue`
- Create: `src/components/bpmn/BpmnEditor.vue`
- Create: `src/assets/default.bpmn`
- Create: `src/styles/index.css`
- Create: `src/vite-env.d.ts`
- Create: `src/types/bpmn.d.ts`

### Task 1: Initialize Vite Vue TypeScript Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Create package manifest with required scripts and dependencies**

```json
{
  "name": "bpmn-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "bpmn-js": "^18.6.2",
    "element-plus": "^2.11.5",
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@vitejs/plugin-vue": "^6.0.1",
    "typescript": "^5.8.3",
    "vite": "^7.0.6",
    "vue-tsc": "^3.0.4"
  }
}
```

- [ ] **Step 2: Create Vite entry HTML**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BPMN Designer</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: Create TypeScript base config**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 4: Create app TypeScript config**

```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "types": ["vite/client"],
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

- [ ] **Step 5: Create node TypeScript config**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Create Vite config**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

- [ ] **Step 7: Create gitignore**

```gitignore
node_modules
dist
.DS_Store
*.local
```

- [ ] **Step 8: Create Vue app entry**

```ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import App from './App.vue'
import './styles/index.css'

createApp(App).use(ElementPlus).mount('#app')
```

- [ ] **Step 9: Create root app shell**

```vue
<script setup lang="ts">
import BpmnWorkbench from './views/BpmnWorkbench.vue'
</script>

<template>
  <BpmnWorkbench />
</template>
```

- [ ] **Step 10: Create Vite env declaration**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 11: Install scaffold dependencies**

Run: `pnpm install`
Expected: install completes successfully and generates `pnpm-lock.yaml`

- [ ] **Step 12: Commit scaffold**

```bash
git add package.json pnpm-lock.yaml index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts .gitignore src/main.ts src/App.vue src/vite-env.d.ts
git commit -m "feat: initialize vite vue typescript app"
```

### Task 2: Add BPMN Editor Component and Default XML

**Files:**
- Create: `src/components/bpmn/BpmnEditor.vue`
- Create: `src/assets/default.bpmn`
- Create: `src/types/bpmn.d.ts`
- Test: `pnpm build`

- [ ] **Step 1: Create default BPMN XML asset**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="开始" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
```

- [ ] **Step 2: Create BPMN resource type declaration**

```ts
declare module '*.bpmn?raw' {
  const content: string
  export default content
}
```

- [ ] **Step 3: Create BPMN editor component**

```vue
<script setup lang="ts">
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { ElMessage } from 'element-plus'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLDivElement | null>(null)
const isReady = ref(false)
const errorMessage = ref('')

let modeler: BpmnModeler | null = null

const initModeler = async () => {
  if (!canvasRef.value) {
    return
  }

  try {
    modeler = new BpmnModeler({
      container: canvasRef.value
    })
    isReady.value = true
    errorMessage.value = ''
  } catch (error) {
    isReady.value = false
    errorMessage.value = error instanceof Error ? error.message : 'BPMN 编辑器初始化失败'
  }
}

const importXml = async (xml: string) => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  await modeler.importXML(xml)
  const canvas = modeler.get('canvas')
  canvas.zoom('fit-viewport')
}

const saveXml = async () => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const result = await modeler.saveXML({ format: true })
  return result.xml ?? ''
}

const saveSvg = async () => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  const result = await modeler.saveSVG()
  return result.svg ?? ''
}

const reset = async () => {
  if (!modeler) {
    throw new Error('BPMN 编辑器尚未初始化')
  }

  await nextTick()
  const canvas = modeler.get('canvas')
  canvas.zoom('fit-viewport')
}

defineExpose({
  importXml,
  saveXml,
  saveSvg,
  reset
})

onMounted(() => {
  void initModeler()
})

onBeforeUnmount(() => {
  try {
    modeler?.destroy()
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : 'BPMN 编辑器释放失败')
  } finally {
    modeler = null
  }
})
</script>

<template>
  <div class="bpmn-editor">
    <el-alert
      v-if="errorMessage"
      type="error"
      :closable="false"
      show-icon
      :title="errorMessage"
    />
    <div v-show="isReady" ref="canvasRef" class="bpmn-editor__canvas"></div>
  </div>
</template>
```

- [ ] **Step 4: Run build to verify component types compile**

Run: `pnpm build`
Expected: build may still fail because page and styles are not wired yet, but the BPMN component should not introduce type errors that block compilation after integration

- [ ] **Step 5: Commit BPMN editor foundation**

```bash
git add src/components/bpmn/BpmnEditor.vue src/assets/default.bpmn src/types/bpmn.d.ts
git commit -m "feat: add bpmn editor component"
```

### Task 3: Build the Workbench Page and Global Styles

**Files:**
- Create: `src/views/BpmnWorkbench.vue`
- Create: `src/styles/index.css`
- Modify: `src/App.vue`
- Test: `pnpm dev`

- [ ] **Step 1: Create workbench page**

```vue
<script setup lang="ts">
import { Download, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import BpmnEditor from '../components/bpmn/BpmnEditor.vue'
import defaultXml from '../assets/default.bpmn?raw'

type BpmnEditorExposed = {
  importXml: (xml: string) => Promise<void>
  saveXml: () => Promise<string>
  saveSvg: () => Promise<string>
  reset: () => Promise<void>
}

const editorRef = ref<BpmnEditorExposed | null>(null)
const lastOutput = ref('等待操作')

const loadDefaultDiagram = async () => {
  if (!editorRef.value) {
    return
  }

  try {
    await editorRef.value.importXml(defaultXml)
    lastOutput.value = '默认 BPMN 图已加载'
  } catch (error) {
    const message = error instanceof Error ? error.message : '默认 BPMN 导入失败'
    lastOutput.value = message
    ElMessage.error(message)
  }
}

const handleExportXml = async () => {
  if (!editorRef.value) {
    return
  }

  try {
    lastOutput.value = await editorRef.value.saveXml()
    ElMessage.success('XML 导出成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'XML 导出失败'
    ElMessage.error(message)
  }
}

const handleExportSvg = async () => {
  if (!editorRef.value) {
    return
  }

  try {
    lastOutput.value = await editorRef.value.saveSvg()
    ElMessage.success('SVG 导出成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SVG 导出失败'
    ElMessage.error(message)
  }
}

const handleReset = async () => {
  if (!editorRef.value) {
    return
  }

  try {
    await editorRef.value.reset()
    ElMessage.success('画布已重置')
  } catch (error) {
    const message = error instanceof Error ? error.message : '画布重置失败'
    ElMessage.error(message)
  }
}

onMounted(() => {
  void loadDefaultDiagram()
})
</script>

<template>
  <el-container class="workbench">
    <el-header class="workbench__header">
      <div class="workbench__title">
        <h1>BPMN Designer</h1>
        <p>Vue 3 + TypeScript + Element Plus + bpmn-js</p>
      </div>
      <div class="workbench__actions">
        <el-button type="primary" :icon="Download" @click="handleExportXml">导出 XML</el-button>
        <el-button :icon="Download" @click="handleExportSvg">导出 SVG</el-button>
        <el-button :icon="RefreshRight" @click="handleReset">重置画布</el-button>
      </div>
    </el-header>
    <el-container class="workbench__body">
      <el-main class="workbench__main">
        <BpmnEditor ref="editorRef" />
      </el-main>
      <el-aside width="360px" class="workbench__aside">
        <el-card shadow="never" class="workbench__panel">
          <template #header>输出结果</template>
          <pre class="workbench__output">{{ lastOutput }}</pre>
        </el-card>
      </el-aside>
    </el-container>
  </el-container>
</template>
```

- [ ] **Step 2: Create global styles**

```css
:root {
  color: #18222c;
  background:
    radial-gradient(circle at top left, #d7ecff 0%, transparent 32%),
    linear-gradient(180deg, #f4f8fb 0%, #eef3f8 100%);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
}

body {
  min-width: 1200px;
}

.workbench {
  height: 100%;
  padding: 16px;
  gap: 16px;
}

.workbench__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88px;
  padding: 0 20px;
  border: 1px solid rgba(24, 34, 44, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
}

.workbench__title h1 {
  margin: 0;
  font-size: 28px;
}

.workbench__title p {
  margin: 4px 0 0;
  color: #52606d;
}

.workbench__actions {
  display: flex;
  gap: 12px;
}

.workbench__body {
  overflow: hidden;
  gap: 16px;
}

.workbench__main,
.workbench__aside {
  padding: 0;
}

.workbench__main {
  overflow: hidden;
}

.workbench__aside {
  display: flex;
}

.workbench__panel,
.bpmn-editor {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(24, 34, 44, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.el-card__body,
.workbench__panel .el-card__body {
  height: calc(100% - 57px);
}

.workbench__output {
  margin: 0;
  height: 100%;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.6;
}

.bpmn-editor {
  padding: 12px;
}

.bpmn-editor__canvas {
  width: 100%;
  height: 100%;
  min-height: 680px;
  border-radius: 12px;
  background: linear-gradient(180deg, #fcfdff 0%, #f1f5f9 100%);
}
```

- [ ] **Step 3: Run dev server to verify the page boots**

Run: `pnpm dev`
Expected: Vite starts on `http://localhost:5173` and the page shows a BPMN canvas with toolbar and output panel

- [ ] **Step 4: Commit workbench UI**

```bash
git add src/views/BpmnWorkbench.vue src/styles/index.css src/App.vue
git commit -m "feat: add bpmn workbench page"
```

### Task 4: Fix Build Issues and Final Verification

**Files:**
- Modify: files affected by build output
- Test: `pnpm build`

- [ ] **Step 1: Add any missing dependencies discovered during boot verification**

If build reports missing icon package, install:

```bash
pnpm add @element-plus/icons-vue
```

If TypeScript config reports missing Vue base config, install:

```bash
pnpm add -D @vue/tsconfig
```

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: `vue-tsc --noEmit && vite build` completes successfully and outputs `dist/`

- [ ] **Step 3: Inspect build artifacts**

Run: `Get-ChildItem -Recurse dist | Select-Object FullName,Length`
Expected: `dist/index.html` and generated JS/CSS assets exist

- [ ] **Step 4: Commit final working environment**

```bash
git add .
git commit -m "feat: scaffold vue bpmn frontend environment"
```
