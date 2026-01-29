import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { checkSiteHealth } from "@/lib/server/site-health";

export const dynamic = "force-dynamic";

type SiteRow = {
  id: string;
  api_base_url: string;
};

type LatestRow = {
  site_id: string;
  checked_at: string | null;
};

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export async function GET(request: NextRequest) {
  const secret = process.env.HEALTH_CRON_SECRET || "";
  if (!secret) {
    return NextResponse.json(
      { error: "HEALTH_CRON_SECRET is not configured" },
      { status: 500 }
    );
  }
  const provided = request.headers.get("x-cron-secret") || "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const intervalMinutes = getNumberEnv("HEALTH_CHECK_INTERVAL_MINUTES", 60);
  const timeoutMs = getNumberEnv("HEALTH_CHECK_TIMEOUT_MS", 10000);
  const slowThresholdMs = getNumberEnv("HEALTH_CHECK_SLOW_MS", 3000);
  const concurrency = getNumberEnv("HEALTH_CHECK_CONCURRENCY", 10);
  const intervalMs = intervalMinutes * 60 * 1000;

  const siteResponse = await supabaseAdmin
    .from("site")
    .select("id,api_base_url")
    .eq("is_active", true);
  if (siteResponse.error) {
    return NextResponse.json(
      { error: siteResponse.error.message },
      { status: 500 }
    );
  }

  const sites = (siteResponse.data ?? []) as SiteRow[];
  if (sites.length === 0) {
    return NextResponse.json({ checked: 0, skipped: 0, inserted: 0 });
  }

  const siteIds = sites.map((site) => site.id);
  const latestResponse = await supabaseAdmin
    .from("site_health_status")
    .select("site_id,checked_at")
    .in("site_id", siteIds);
  if (latestResponse.error) {
    return NextResponse.json(
      { error: latestResponse.error.message },
      { status: 500 }
    );
  }

  const latestMap = new Map<string, string | null>();
  for (const row of (latestResponse.data ?? []) as LatestRow[]) {
    latestMap.set(row.site_id, row.checked_at);
  }

  const now = Date.now();
  const dueSites = sites.filter((site) => {
    const checkedAt = latestMap.get(site.id);
    if (!checkedAt) return true;
    const lastTime = Date.parse(checkedAt);
    if (!Number.isFinite(lastTime)) return true;
    return now - lastTime >= intervalMs;
  });

  if (dueSites.length === 0) {
    return NextResponse.json({
      checked: 0,
      skipped: sites.length,
      inserted: 0,
    });
  }

  const startAt = Date.now();
  let currentIndex = 0;
  const rows: Array<Record<string, unknown>> = [];
  const counts = { up: 0, slow: 0, down: 0 };

  async function worker() {
    while (currentIndex < dueSites.length) {
      const index = currentIndex;
      currentIndex += 1;
      const site = dueSites[index];
      const result = await checkSiteHealth(site.api_base_url, {
        timeoutMs,
        slowThresholdMs,
        maxRedirects: 1,
      });
      const checkedAt = new Date().toISOString();
      rows.push({
        site_id: site.id,
        status: result.status,
        http_status: result.httpStatus,
        latency_ms: result.latencyMs,
        checked_at: checkedAt,
        error: result.error,
        response_url: result.responseUrl,
      });
      counts[result.status] += 1;
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, dueSites.length) },
    () => worker()
  );
  await Promise.all(workers);

  const insertResponse =
    rows.length > 0
      ? await supabaseAdmin
          .from("site_health_status")
          .upsert(rows, { onConflict: "site_id" })
      : { error: null };
  if (insertResponse.error) {
    return NextResponse.json(
      { error: insertResponse.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    checked: dueSites.length,
    skipped: sites.length - dueSites.length,
    inserted: rows.length,
    durationMs: Date.now() - startAt,
    counts,
  });
}
