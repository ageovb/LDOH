import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

/**
 * URL 标准化结果
 */
export interface NormalizedUrl {
  /** 标准化后的完整 URL */
  normalized: string;
  /** 协议+域名部分 (用于重复检查) */
  protocolAndDomain: string;
  /** 原始 URL */
  original: string;
}

/**
 * URL 冲突检查结果
 */
export interface UrlConflictResult {
  /** 是否存在冲突 */
  exists: boolean;
  /** 冲突的站点信息 */
  conflictingSite?: {
    id: string;
    name: string;
    apiBaseUrl: string;
  };
}

/**
 * URL 验证错误
 */
export class UrlValidationError extends Error {
  constructor(message: string, public readonly url: string) {
    super(message);
    this.name = "UrlValidationError";
  }
}

/**
 * API 错误响应类型
 */
export interface ApiErrorResponse {
  error: string;
}

/**
 * URL 冲突错误响应类型
 */
export interface UrlConflictErrorResponse extends ApiErrorResponse {
  error: "API Base URL 已存在";
  conflictingSite: {
    id: string;
    name: string;
    apiBaseUrl: string;
  };
}

/**
 * 标准化 API Base URL
 *
 * 规则:
 * 1. 统一协议为 https
 * 2. 域名转换为小写
 * 3. 移除尾部斜杠
 * 4. 保留路径部分
 *
 * @param url - 原始 URL
 * @returns 标准化结果
 * @throws UrlValidationError 如果 URL 格式无效
 *
 * @example
 * normalizeApiBaseUrl('http://API.Example.COM/v1/')
 * // => {
 * //   normalized: 'https://api.example.com/v1',
 * //   protocolAndDomain: 'https://api.example.com',
 * //   original: 'http://API.Example.COM/v1/'
 * // }
 */
export function normalizeApiBaseUrl(url: string): NormalizedUrl {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new UrlValidationError("URL cannot be empty", url);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch (error) {
    throw new UrlValidationError("Invalid URL format", url);
  }

  // 只允许 http 和 https 协议
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new UrlValidationError(
      `Unsupported protocol: ${parsedUrl.protocol}`,
      url
    );
  }

  // 统一协议为 https
  parsedUrl.protocol = "https:";

  // 域名转换为小写
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

  // 移除尾部斜杠
  let pathname = parsedUrl.pathname;
  if (pathname.endsWith("/") && pathname.length > 1) {
    pathname = pathname.slice(0, -1);
  }

  // 构建标准化后的 URL
  const normalized = `${parsedUrl.protocol}//${parsedUrl.host}${pathname}${parsedUrl.search}${parsedUrl.hash}`;

  // 提取协议+域名
  const protocolAndDomain = `${parsedUrl.protocol}//${parsedUrl.host}`;

  return {
    normalized,
    protocolAndDomain,
    original: url,
  };
}

/**
 * 提取 URL 的协议+域名部分
 * 用于重复检查
 *
 * @param url - 原始 URL
 * @returns 协议+域名 (例如: "https://api.example.com")
 * @throws UrlValidationError 如果 URL 格式无效
 *
 * @example
 * extractProtocolAndDomain('https://api.example.com/v1')
 * // => 'https://api.example.com'
 */
export function extractProtocolAndDomain(url: string): string {
  const normalized = normalizeApiBaseUrl(url);
  return normalized.protocolAndDomain;
}

/**
 * 检查 API Base URL 是否已存在
 * 基于协议+域名进行检查
 *
 * @param url - 要检查的 URL
 * @param excludeSiteId - 排除的站点 ID (用于更新场景)
 * @returns 冲突检查结果
 *
 * @example
 * await checkApiBaseUrlExists('https://api.example.com/v1')
 * // => { exists: true, conflictingSite: { id: '123', name: 'Example', apiBaseUrl: 'https://api.example.com' } }
 *
 * await checkApiBaseUrlExists('https://api.example.com/v2', '123')
 * // => { exists: false }
 */
export async function checkApiBaseUrlExists(
  url: string,
  excludeSiteId?: string
): Promise<UrlConflictResult> {
  // 标准化输入 URL
  const normalizedInput = normalizeApiBaseUrl(url);
  const inputProtocolAndDomain = normalizedInput.protocolAndDomain;

  // 查询所有站点的 api_base_url
  const { data: sites, error } = await supabaseAdmin
    .from("site")
    .select("id, name, api_base_url");

  if (error) {
    throw new Error(`Failed to query sites: ${error.message}`);
  }

  if (!sites || sites.length === 0) {
    return { exists: false };
  }

  // 检查是否存在冲突
  for (const site of sites) {
    // 排除指定的站点 ID
    if (excludeSiteId && site.id === excludeSiteId) {
      continue;
    }

    try {
      // 标准化数据库中的 URL
      const normalizedSite = normalizeApiBaseUrl(site.api_base_url);

      // 比较协议+域名
      if (normalizedSite.protocolAndDomain === inputProtocolAndDomain) {
        return {
          exists: true,
          conflictingSite: {
            id: site.id,
            name: site.name,
            apiBaseUrl: site.api_base_url,
          },
        };
      }
    } catch (error) {
      // 如果数据库中的 URL 格式无效,跳过
      console.warn(
        `Invalid URL in database for site ${site.id}: ${site.api_base_url}`
      );
      continue;
    }
  }

  return { exists: false };
}
