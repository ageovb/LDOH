import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await supabaseAdmin
    .from("system_notifications")
    .select("id, title, content, valid_from, valid_until")
    .eq("is_active", true)
    .lte("valid_from", new Date().toISOString())
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
    .order("valid_from", { ascending: false });

  if (response.error) {
    console.error("Failed to fetch notifications:", response.error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({ notifications: response.data || [] });
}