/**
 * 统一维护自定义 BPMN 扩展在 moddle descriptor 中使用的类型名常量。
 *
 * 这样做的原因：
 * - 避免在字段读写服务、创建行为、校验逻辑中散落硬编码字符串
 * - 后续如果命名空间或类型名调整，只需要集中修改这里
 */
export const CUSTOM_NODE_META_TYPE = 'custom:NodeMeta'
export const CUSTOM_FIELD_TYPE = 'custom:Field'
