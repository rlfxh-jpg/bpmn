import {
  getNodeData,
  getNodeKey,
  setNodeData,
  setNodeKey
} from './services/extension-field-service'

/**
 * 统一向节点插件事件处理逻辑暴露 runtime services。
 *
 * 节点目录因此不需要直接 import editor 内部实现，
 * 只消费一组稳定的读写服务。
 */
export const createNodeRuntimeServices = () => ({
  getNodeKey,
  getNodeData,
  setNodeKey,
  setNodeData
})
