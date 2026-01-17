import { NextRequest, NextResponse } from "next/server";
import { checkApiBaseUrlExists, UrlValidationError } from "@/lib/utils/url";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") || "";
  const excludeId = request.nextUrl.searchParams.get("excludeId") || undefined;

  if (!url.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid URL parameter" },
      { status: 400 }
    );
  }

  try {
    const result = await checkApiBaseUrlExists(url, excludeId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UrlValidationError) {
      return NextResponse.json(
        { error: "Missing or invalid URL parameter" },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to check URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

