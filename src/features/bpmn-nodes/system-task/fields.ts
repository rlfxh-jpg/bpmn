/**
 * 系统处理节点的业务字段定义。
 *
 * 与 approval-task 一样，这里只负责字段元数据，
 * 不负责底层扩展字段读写，也不直接依赖页面组件。
 */
export const systemTaskFields = [
  { key: 'serviceCode', label: '服务编码', defaultValue: '', required: true },
  { key: 'retryPolicy', label: '重试策略', defaultValue: 'none' }
]
