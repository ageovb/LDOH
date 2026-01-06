import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

export type AuthSession = {
  id: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: string;
  sessionExpiresAt: string;
};

type SessionRow = {
  id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_expires_at: string;
  session_expires_at: string;
};

function toSession(row: SessionRow): AuthSession {
  return {
    id: row.id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenType: row.token_type,
    accessExpiresAt: row.access_expires_at,
    sessionExpiresAt: row.session_expires_at,
  };
}

export async function createSession(params: {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: Date;
  sessionExpiresAt: Date;
}): Promise<AuthSession> {
  const response = await supabaseAdmin
    .from("auth_sessions")
    .insert({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      token_type: params.tokenType,
      access_expires_at: params.accessExpiresAt.toISOString(),
      session_expires_at: params.sessionExpiresAt.toISOString(),
    })
    .select("id,access_token,refresh_token,token_type,access_expires_at,session_expires_at")
    .single();

  if (response.error || !response.data) {
    throw new Error(
      response.error?.message || "Failed to create auth session"
    );
  }

  return toSession(response.data as SessionRow);
}

export async function getSession(sessionId: string): Promise<AuthSession | null> {
  const response = await supabaseAdmin
    .from("auth_sessions")
    .select("id,access_token,refresh_token,token_type,access_expires_at,session_expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (response.error) {
    throw new Error(`Failed to load auth session: ${response.error.message}`);
  }

  if (!response.data) {
    return null;
  }

  return toSession(response.data as SessionRow);
}

export async function updateSessionTokens(params: {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: Date;
  sessionExpiresAt: Date;
}): Promise<AuthSession> {
  const response = await supabaseAdmin
    .from("auth_sessions")
    .update({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      token_type: params.tokenType,
      access_expires_at: params.accessExpiresAt.toISOString(),
      session_expires_at: params.sessionExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.sessionId)
    .select("id,access_token,refresh_token,token_type,access_expires_at,session_expires_at")
    .single();

  if (response.error || !response.data) {
    throw new Error(
      response.error?.message || "Failed to update auth session"
    );
  }

  return toSession(response.data as SessionRow);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await supabaseAdmin
    .from("auth_sessions")
    .delete()
    .eq("id", sessionId);

  if (response.error) {
    throw new Error(`Failed to delete auth session: ${response.error.message}`);
  }
}
