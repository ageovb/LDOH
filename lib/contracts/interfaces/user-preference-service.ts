/**
 * User Preference Service Interface - 用户偏好服务接口
 *
 * 基于 PRD 第 4 节：Entity: UserPreference
 */

import { UserPreference } from '../types/user-preference';

/**
 * 用户偏好服务接口
 * 负责管理 localStorage 中的用户隐藏/收藏设置
 */
export interface IUserPreferenceService {
  /**
   * 获取用户偏好设置
   * @returns 用户偏好对象
   */
  getPreferences(): UserPreference;

  /**
   * 收藏站点
   * @param siteId - 站点 ID
   */
  favoriteSite(siteId: string): void;

  /**
   * 取消收藏站点
   * @param siteId - 站点 ID
   */
  unfavoriteSite(siteId: string): void;

  /**
   * 隐藏站点
   * @param siteId - 站点 ID
   */
  hideSite(siteId: string): void;

  /**
   * 取消隐藏站点
   * @param siteId - 站点 ID
   */
  unhideSite(siteId: string): void;

  /**
   * 检查站点是否被收藏
   * @param siteId - 站点 ID
   * @returns 是否被收藏
   */
  isFavorite(siteId: string): boolean;

  /**
   * 检查站点是否被隐藏
   * @param siteId - 站点 ID
   * @returns 是否被隐藏
   */
  isHidden(siteId: string): boolean;

  /**
   * 清空所有偏好设置
   */
  clearPreferences(): void;
}
