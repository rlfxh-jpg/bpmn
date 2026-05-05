/**
 * approval-task 当前不额外引入新的 moddle 类型定义。
 *
 * 业务节点身份和字段仍复用统一的 custom:NodeMeta / custom:Field 结构，
 * 因此这里先返回空片段，保留后续单节点扩展 descriptor 的入口。
 */
export const approvalTaskModdle = {
  types: []
}
