import { NextRequest, NextResponse } from "next/server";
import { fetchLdUser } from "@/lib/auth/ld-user";
import { getOAuthTokenFromCookies, getSessionSecret } from "@/lib/auth/ld-oauth";

export async function GET(request: NextRequest) {
  try {
    if (process.env.ENV === "dev") {
      return NextResponse.json({
        id: 0,
        username: "dev",
        trust_level: 2,
      });
    }

    const token = getOAuthTokenFromCookies(request.cookies, getSessionSecret());
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await fetchLdUser(token.accessToken);
    return NextResponse.json({
      id: user.id,
      username: user.username,
      trust_level: user.trust_level,
      avatar_template: user.avatar_template,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load user";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
