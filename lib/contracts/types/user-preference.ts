/**
 * User Preference Types - 用户偏好类型定义
 *
 * 基于 PRD 第 4 节：数据模型（概念层）
 * 存储位置：浏览器 localStorage
 */

/**
 * 用户偏好设置
 */
export interface UserPreference {
  /** 已隐藏的站点 ID 列表 */
  hiddenSites: string[];
  /** 已收藏的站点 ID 列表 */
  favoriteSites: string[];
}

/**
 * localStorage 键名常量
 */
export const STORAGE_KEYS = {
  USER_PREFERENCE: 'ldoh_user_preference',
} as const;
