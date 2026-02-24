-- Migration: add site runaway/fake-charity flags, set report types, and drop obsolete deleted columns (idempotent)

ALTER TABLE public.site
  ADD COLUMN IF NOT EXISTS is_runaway boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_fake_charity boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.site.is_runaway IS '是否跑路（关站）';
COMMENT ON COLUMN public.site.is_fake_charity IS '是否伪公益站点';

ALTER TABLE public.site_reports
  ADD COLUMN IF NOT EXISTS report_type text;

UPDATE public.site_reports
SET report_type = 'fake_charity';

UPDATE public.site_reports
SET report_type = 'runaway'
WHERE id IN (
  '8f796490-7771-41f4-8118-c376e639b17d'::uuid,
  'cf83c16f-8577-43d0-ae52-8d5fadeab0d7'::uuid,
  'a6ebd08f-0bdd-47e4-81f2-321b8f2ac498'::uuid
);

ALTER TABLE public.site_reports
  ALTER COLUMN report_type SET DEFAULT 'fake_charity',
  ALTER COLUMN report_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_reports_report_type_check'
      AND conrelid = 'public.site_reports'::regclass
  ) THEN
    ALTER TABLE public.site_reports
      ADD CONSTRAINT site_reports_report_type_check
      CHECK (report_type IN ('runaway', 'fake_charity'));
  END IF;
END;
$$;

DROP INDEX IF EXISTS public.idx_site_reports_unique_pending;

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_reports_unique_pending
  ON public.site_reports(site_id, reporter_id, report_type)
  WHERE status = 'pending';

COMMENT ON COLUMN public.site_reports.report_type IS '报告类型（runaway/fake_charity）';

ALTER TABLE public.site
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS deleted_by;

DROP INDEX IF EXISTS public.idx_site_deleted_at;
DROP INDEX IF EXISTS idx_site_deleted_at;
