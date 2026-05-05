/**
 * 当前 renderer 模块为占位实现。
 *
 * 原因：
 * - 早期尝试直接接入 diagram-js 深层 renderer 依赖时，会引入打包解析问题
 * - 为了先保证“节点扩展主链路”稳定，首版使用 marker + overlay 方案完成外观差异化
 *
 * 保留该模块的意义在于：
 * - 目录职责完整，renderer 仍然是体系内明确的扩展点
 * - 后续如果要升级为更完整的 SVG 渲染策略，可以直接在这里恢复实现
 */
export const createCustomRendererModule = () => ({})
