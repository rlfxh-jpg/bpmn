/**
 * 审批任务的业务字段定义。
 *
 * 设计思路：
 * - 这里仅描述“审批任务需要哪些业务字段”
 * - 不承担字段写入 BPMN XML 的职责
 * - 不承担右侧表单渲染逻辑
 *
 * 这样字段定义可以被：
 * - 节点 definition 复用
 * - 业务属性面板复用
 * - 后续校验规则复用
 */
export const approvalTaskFields = [
  { key: 'assigneeRole', label: '审批角色', defaultValue: 'manager', required: true },
  { key: 'formKey', label: '表单标识', defaultValue: '' }
]
