import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY",
        },
        { status: 503 }
      );
    }

    const { from, subject, body, messageId } = await req.json();

    if (!from || !subject || !body || !messageId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase.from("email_replies").insert([
      {
        from,
        subject,
        body,
        message_id: messageId,
        received_at: new Date(),
      },
    ]);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Error saving reply to Supabase" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Reply saved successfully" }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
