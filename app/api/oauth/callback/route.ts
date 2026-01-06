import { NextRequest, NextResponse } from "next/server";
import {
  createSignedCookieValue,
  getOAuthConfig,
  getOAuthStateFromCookies,
  getSessionSecret,
  getStateCookieMaxAge,
  getStateCookieName,
  getTokenCookieMaxAge,
  getTokenCookieName,
  normalizeReturnTo,
} from "@/lib/auth/ld-oauth";

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

  const expiresIn = tokenData.expires_in ?? 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const tokenPayload = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
    tokenType: tokenData.token_type || "bearer",
  };

  const tokenCookieValue = createSignedCookieValue(tokenPayload, secret);
  const response = NextResponse.redirect(
    new URL(normalizeReturnTo(statePayload.returnTo), request.url)
  );

  response.cookies.set({
    name: getTokenCookieName(),
    value: tokenCookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getTokenCookieMaxAge(),
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

  return response;
}
