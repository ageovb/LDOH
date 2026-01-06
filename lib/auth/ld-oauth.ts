import crypto from "crypto";

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
};

export type OAuthStatePayload = {
  state: string;
  createdAt: number;
  returnTo: string;
};

const DEFAULT_AUTH_ENDPOINT = "https://connect.linux.do/oauth2/authorize";
const DEFAULT_TOKEN_ENDPOINT = "https://connect.linux.do/oauth2/token";

const STATE_COOKIE_NAME = "ld_oauth_state";
const SESSION_COOKIE_NAME = "ld_auth_session";

const DEFAULT_STATE_TTL_SECONDS = 60 * 10;
const DEFAULT_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_REFRESH_BUFFER_SECONDS = 120;

export function getOAuthConfig() {
  return {
    clientId: process.env.LD_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.LD_OAUTH_CLIENT_SECRET || "",
    redirectUri: process.env.LD_OAUTH_REDIRECT_URI || "",
    authorizationEndpoint:
      process.env.LD_OAUTH_AUTHORIZATION_ENDPOINT || DEFAULT_AUTH_ENDPOINT,
    tokenEndpoint: process.env.LD_OAUTH_TOKEN_ENDPOINT || DEFAULT_TOKEN_ENDPOINT,
  };
}

export function isAuthRequired() {
  return process.env.ENV !== "dev";
}

export function getStateCookieName() {
  return STATE_COOKIE_NAME;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function normalizeReturnTo(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export function getSignedCookieValue<T>(value: string, secret: string): T | null {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload, secret);
  if (!timingSafeEqual(expectedSignature, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as T;
    return payload;
  } catch {
    return null;
  }
}

export function createSignedCookieValue(payload: unknown, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function getOAuthStateFromCookies(cookies: CookieStore, secret: string) {
  const cookieValue = cookies.get(STATE_COOKIE_NAME)?.value;
  if (!cookieValue) {
    return null;
  }
  return getSignedCookieValue<OAuthStatePayload>(cookieValue, secret);
}

export function getSessionIdFromCookies(cookies: CookieStore) {
  return cookies.get(SESSION_COOKIE_NAME)?.value || "";
}

export function buildAuthorizeUrl(options: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL(options.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("state", options.state);
  return url.toString();
}

export function getStateCookieMaxAge() {
  return DEFAULT_STATE_TTL_SECONDS;
}

export function getTokenCookieMaxAge() {
  const configured = Number(process.env.LD_OAUTH_TOKEN_COOKIE_MAX_AGE);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }
  return DEFAULT_TOKEN_MAX_AGE_SECONDS;
}

export function getSessionCookieMaxAge() {
  return getTokenCookieMaxAge();
}

export function getRefreshBufferSeconds() {
  const configured = Number(process.env.LD_OAUTH_REFRESH_BUFFER_SECONDS);
  if (Number.isFinite(configured) && configured >= 0) {
    return configured;
  }
  return DEFAULT_REFRESH_BUFFER_SECONDS;
}

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return secret;
}

function signValue(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
