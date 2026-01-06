/**
 * Filter Types - 筛选器类型定义
 *
 * 基于 PRD 第 3.1 节：必须功能
 */

/**
 * 筛选条件
 */
export interface FilterOptions {
  /** 按标签筛选 */
  tags?: string[];
  /** 按登记等级筛选 */
  registrationLimit?: number | 'all';
  /** 按特性筛选 */
  feature?: 'all' | 'ldc' | 'translation' | 'checkin';
  /** 关键词搜索（站点名称） */
  searchKeyword?: string;
  /** 仅显示收藏的站点 */
  showOnlyFavorites?: boolean;
  /** 显示已隐藏的站点 */
  showHidden?: boolean;
}

/**
 * 排序规则
 */
export type SortOrder = 'smart' | 'name-asc' | 'name-desc';
