import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  createSignedCookieValue,
  getOAuthConfig,
  getSessionSecret,
  getStateCookieMaxAge,
  getStateCookieName,
  normalizeReturnTo,
} from "@/lib/auth/ld-oauth";

export async function GET(request: NextRequest) {
  const { clientId, redirectUri, authorizationEndpoint } = getOAuthConfig();
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "LD OAuth is not configured" },
      { status: 500 }
    );
  }

  const returnTo = normalizeReturnTo(
    request.nextUrl.searchParams.get("returnTo")
  );
  const state = crypto.randomBytes(16).toString("hex");
  const statePayload = {
    state,
    createdAt: Date.now(),
    returnTo,
  };

  const secret = getSessionSecret();
  const stateCookieValue = createSignedCookieValue(statePayload, secret);
  const authorizeUrl = buildAuthorizeUrl({
    authorizationEndpoint,
    clientId,
    redirectUri,
    state,
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set({
    name: getStateCookieName(),
    value: stateCookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getStateCookieMaxAge(),
  });

  return response;
}
