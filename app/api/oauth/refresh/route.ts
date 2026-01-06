import { NextRequest, NextResponse } from "next/server";
import {
  getOAuthConfig,
  getSessionCookieMaxAge,
  getSessionCookieName,
  getSessionIdFromCookies,
  getStateCookieName,
  normalizeReturnTo,
} from "@/lib/auth/ld-oauth";
import {
  deleteSession,
  getSession,
  updateSessionTokens,
} from "@/lib/auth/session-store";

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

  const sessionId = getSessionIdFromCookies(request.cookies);
  if (!sessionId) {
    const response = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
    response.cookies.set({
      name: getSessionCookieName(),
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const session = await getSession(sessionId);
  if (!session) {
    const response = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
    response.cookies.set({
      name: getSessionCookieName(),
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
    refresh_token: session.refreshToken,
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
    await deleteSession(sessionId);
    const response = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
    response.cookies.set({
      name: getSessionCookieName(),
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
  const accessExpiresAt = new Date(Date.now() + expiresIn * 1000);
  const sessionExpiresAt = new Date(
    Date.now() + getSessionCookieMaxAge() * 1000
  );
  const updatedSession = await updateSessionTokens({
    sessionId,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || session.refreshToken,
    tokenType: tokenData.token_type || session.tokenType || "bearer",
    accessExpiresAt,
    sessionExpiresAt,
  });

  const redirectTarget = normalizeReturnTo(
    request.nextUrl.searchParams.get("redirect")
  );
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));
  response.cookies.set({
    name: getSessionCookieName(),
    value: updatedSession.id,
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

  return response;
}
