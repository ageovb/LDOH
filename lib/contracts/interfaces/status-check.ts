/**
 * Status Check API Interface - 状态检测接口
 *
 * 基于 PRD 第 5 节：API 契约 - 接口 1: 状态检测
 */

import { SiteStatus } from '../types/site';

/**
 * 状态检测请求
 */
export interface StatusCheckRequest {
  /** 待检测的 URL 列表 */
  urls: string[];
}

/**
 * 单个 URL 的状态检测结果
 */
export interface URLStatusResult {
  /** URL 地址 */
  url: string;
  /** 状态：available | unavailable | unknown */
  status: SiteStatus;
}

/**
 * 状态检测响应
 */
export interface StatusCheckResponse {
  /** 请求是否成功 */
  success: boolean;
  /** 状态检测结果数组 */
  data: URLStatusResult[];
  /** 错误信息（可选） */
  error?: string;
}

/**
 * 状态检测服务接口
 */
export interface IStatusCheckService {
  /**
   * 批量检测站点 API Base URL 的 HTTP 可用性
   * @param urls - URL 列表
   * @returns 状态检测结果
   */
  checkStatus(urls: string[]): Promise<StatusCheckResponse>;
}
