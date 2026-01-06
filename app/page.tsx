import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHubPage } from "@/features/sites/components/SiteHubPage";
import { Site, SiteWithStatus } from "@/lib/contracts/types/site";
import { Tag } from "@/lib/contracts/types/tag";
import {
  getOAuthTokenFromCookies,
  getSessionSecret,
  isAuthRequired,
  shouldRefreshToken,
} from "@/lib/auth/ld-oauth";

export const dynamic = "force-dynamic";

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  if (!host) {
    return "";
  }
  const protocol = headerList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export default async function HomePage() {
  if (isAuthRequired()) {
    const secret = getSessionSecret();
    const cookieStore = await cookies();
    const token = getOAuthTokenFromCookies(cookieStore, secret);
    if (!token) {
      redirect("/auth/login?returnTo=/");
    }
    if (shouldRefreshToken(token)) {
      redirect("/api/oauth/refresh?redirect=/");
    }
  }

  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/sites`, {
    cache: "no-store",
  });
  const payload = response.ok ? await response.json() : null;
  const sitesResult = (payload?.sites ?? []) as Site[];
  const tagsResult = (payload?.tags ?? []) as Tag[];

  const sites: SiteWithStatus[] =
    sitesResult.map((site) => ({
      ...site,
      status: "available" as const,
    })) ?? [];

  const dataWarning = response.ok
    ? undefined
    : payload?.error || "数据加载失败";

  return (
    <SiteHubPage
      initialSites={sites}
      tags={tagsResult}
      dataWarning={dataWarning}
    />
  );
}
