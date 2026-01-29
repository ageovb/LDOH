import { NextRequest, NextResponse } from "next/server";
import { getLdUserWithCache } from "@/lib/auth/ld-user";
import { getSessionIdFromCookies } from "@/lib/auth/ld-oauth";
import { getDevUserConfig } from "@/lib/auth/dev-user";

export async function GET(request: NextRequest) {
  try {
    if (process.env.ENV === "dev") {
      const devUser = getDevUserConfig();
      return NextResponse.json({
        id: devUser.id,
        username: devUser.username,
        trust_level: devUser.trustLevel,
      });
    }

    const sessionId = getSessionIdFromCookies(request.cookies);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getLdUserWithCache({
      sessionId,
      options: { requireId: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
