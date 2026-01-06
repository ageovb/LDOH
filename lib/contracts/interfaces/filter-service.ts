/**
 * Filter Service Interface - 筛选服务接口
 *
 * 基于 PRD 第 3.1 节：筛选和搜索功能
 */

import { SiteWithStatus } from '../types/site';
import { FilterOptions, SortOrder } from '../types/filter';

/**
 * 筛选服务接口
 */
export interface IFilterService {
  /**
   * 根据筛选条件过滤站点列表
   * @param sites - 站点列表（带状态）
   * @param filters - 筛选条件
   * @param userPreferences - 用户偏好（用于判断收藏/隐藏）
   * @returns 过滤后的站点列表
   */
  filterSites(
    sites: SiteWithStatus[],
    filters: FilterOptions,
    userPreferences: {
      favoriteSites: string[];
      hiddenSites: string[];
    }
  ): SiteWithStatus[];

  /**
   * 对站点列表进行排序
   * @param sites - 站点列表
   * @param order - 排序规则
   * @param favoriteSites - 收藏的站点 ID 列表（智能排序用）
   * @returns 排序后的站点列表
   */
  sortSites(
    sites: SiteWithStatus[],
    order: SortOrder,
    favoriteSites: string[]
  ): SiteWithStatus[];
}
