import { NextRequest, NextResponse } from "next/server";
import {
  createSignedCookieValue,
  getOAuthConfig,
  getOAuthTokenFromCookies,
  getSessionSecret,
  getTokenCookieMaxAge,
  getTokenCookieName,
  normalizeReturnTo,
} from "@/lib/auth/ld-oauth";

type RefreshResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export async function GET(request: NextRequest) {
  const { clientId, clientSecret, tokenEndpoint } = getOAuthConfig();
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "LD OAuth is not configured" },
      { status: 500 }
    );
  }

  const secret = getSessionSecret();
  const tokenPayload = getOAuthTokenFromCookies(request.cookies, secret);
  if (!tokenPayload?.refreshToken) {
    const response = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
    response.cookies.set({
      name: getTokenCookieName(),
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const tokenBody = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokenPayload.refreshToken,
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
    const response = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
    response.cookies.set({
      name: getTokenCookieName(),
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const tokenData = (await tokenResponse.json()) as RefreshResponse;
  if (!tokenData.access_token) {
    return NextResponse.json(
      { error: "Refresh token response missing access token" },
      { status: 502 }
    );
  }

  const expiresIn = tokenData.expires_in ?? 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const tokenCookieValue = createSignedCookieValue(
    {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || tokenPayload.refreshToken,
      expiresAt,
      tokenType: tokenData.token_type || tokenPayload.tokenType || "bearer",
    },
    secret
  );

  const redirectTarget = normalizeReturnTo(
    request.nextUrl.searchParams.get("redirect")
  );
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));
  response.cookies.set({
    name: getTokenCookieName(),
    value: tokenCookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getTokenCookieMaxAge(),
  });

  return response;
}
