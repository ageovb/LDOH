-- ============================================
-- Migration: Add supports_nsfw field to site table
-- Date: 2026-01-17
-- Description: Add NSFW support indicator for sites
-- ============================================

-- 检查字段是否已存在（仅供参考，不会执行）
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'site'
--   AND column_name = 'supports_nsfw';

-- ============================================
-- Forward Migration (添加字段)
-- ============================================

-- 添加 supports_nsfw 字段
ALTER TABLE public.site
ADD COLUMN IF NOT EXISTS supports_nsfw boolean NOT NULL DEFAULT false;

-- 添加字段注释
COMMENT ON COLUMN public.site.supports_nsfw IS '是否支持 NSFW 内容（18+）';

-- 验证字段已添加
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'site'
  AND column_name = 'supports_nsfw';

-- ============================================
-- Rollback Migration (回滚脚本，如需要可执行)
-- ============================================

-- 如果需要回滚，取消下面的注释并执行
-- ALTER TABLE public.site DROP COLUMN IF EXISTS supports_nsfw;

-- ============================================
-- 数据验证（可选）
-- ============================================

-- 查看当前所有站点的 NSFW 状态
-- SELECT id, name, supports_nsfw
-- FROM public.site
-- ORDER BY created_at DESC;

-- 统计支持 NSFW 的站点数量
-- SELECT
--   supports_nsfw,
--   COUNT(*) as count
-- FROM public.site
-- GROUP BY supports_nsfw;
