import { NextRequest, NextResponse } from "next/server";
import {
  getOAuthConfig,
  getOAuthStateFromCookies,
  getSessionSecret,
  getSessionCookieMaxAge,
  getSessionCookieName,
  getStateCookieMaxAge,
  getStateCookieName,
  normalizeReturnTo,
} from "@/lib/auth/ld-oauth";
import { createSession } from "@/lib/auth/session-store";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export async function GET(request: NextRequest) {
  const { clientId, clientSecret, redirectUri, tokenEndpoint } = getOAuthConfig();
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "LD OAuth is not configured" },
      { status: 500 }
    );
  }

  const code = request.nextUrl.searchParams.get("code") || "";
  const state = request.nextUrl.searchParams.get("state") || "";
  const secret = getSessionSecret();
  const statePayload = getOAuthStateFromCookies(request.cookies, secret);

  if (!code || !state || !statePayload || statePayload.state !== state) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 401 });
  }
  const stateAge = Date.now() - statePayload.createdAt;
  if (stateAge > getStateCookieMaxAge() * 1000) {
    return NextResponse.json({ error: "OAuth state expired" }, { status: 401 });
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenBody.toString(),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return NextResponse.json(
      { error: "Token exchange failed", detail: errorText },
      { status: 502 }
    );
  }

  const tokenData = (await tokenResponse.json()) as TokenResponse;
  if (!tokenData.access_token) {
    return NextResponse.json(
      { error: "Token exchange returned no access token" },
      { status: 502 }
    );
  }

  if (!tokenData.refresh_token) {
    return NextResponse.json(
      { error: "Token exchange returned no refresh token" },
      { status: 502 }
    );
  }

  const expiresIn = tokenData.expires_in ?? 3600;
  const accessExpiresAt = new Date(Date.now() + expiresIn * 1000);
  const sessionExpiresAt = new Date(
    Date.now() + getSessionCookieMaxAge() * 1000
  );
  const session = await createSession({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenType: tokenData.token_type || "bearer",
    accessExpiresAt,
    sessionExpiresAt,
  });
  const response = NextResponse.redirect(
    new URL(normalizeReturnTo(statePayload.returnTo), request.url)
  );

  response.cookies.set({
    name: getSessionCookieName(),
    value: session.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionCookieMaxAge(),
  });

  response.cookies.set({
    name: getStateCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: "ld_oauth_token",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
