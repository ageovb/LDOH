-- Migration: Add site health status (no history)

CREATE TABLE IF NOT EXISTS public.site_health_status (
  site_id uuid PRIMARY KEY REFERENCES public.site(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('up', 'slow', 'down')),
  http_status integer,
  latency_ms integer,
  checked_at timestamptz NOT NULL DEFAULT now(),
  error text,
  response_url text
);
