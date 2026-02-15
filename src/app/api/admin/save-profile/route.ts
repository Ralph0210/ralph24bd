import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_GUEST_ID } from "@/lib/guest-id";
import { getChineseZodiac } from "@/lib/chinese-zodiac";

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase Dashboard → Settings → API → service_role)" },
        { status: 500 }
      );
    }
    const { name, avatar_url, birth_year } = (await request.json()) as {
      name?: string;
      avatar_url?: string | null;
      birth_year?: number | null;
    };
    const trimmedName = typeof name === "string" ? name.trim() || "Host" : "Host";
    const year = typeof birth_year === "number" ? birth_year : null;
    const zodiac_sign = year && year >= 1900 && year <= 2100 ? getChineseZodiac(year) : null;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("guests")
      .upsert(
        {
          guest_id: ADMIN_GUEST_ID,
          name: trimmedName,
          avatar_url: avatar_url ?? null,
          birth_year: year,
          zodiac_sign: zodiac_sign ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "guest_id" }
      )
      .select("name, avatar_url, birth_year, zodiac_sign")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save profile" },
      { status: 500 }
    );
  }
}
