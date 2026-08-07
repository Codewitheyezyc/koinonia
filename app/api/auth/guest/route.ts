import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { name, fellowshipId } = await request.json();

    const cleanName = name?.trim() || "Guest Believer";
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const guestEmail = `guest_${uniqueId}@koinonia-guest.com`;
    const guestPassword = `Guest#${crypto.randomBytes(12).toString("hex")}`;

    const supabase = await createClient();

    // 1. Create user via standard GoTrue auth signup (populates all required GoTrue fields)
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        data: {
          full_name: `${cleanName} (Guest)`,
          is_guest: true,
        },
      },
    });

    if (signUpErr) {
      console.error("Guest signUp error:", signUpErr);
      return NextResponse.json({ error: signUpErr.message }, { status: 400 });
    }

    // 2. Auto-confirm email in database using security definer RPC
    await supabase.rpc("confirm_guest_email", { p_email: guestEmail });

    // 3. Return credentials so client can sign in with password
    return NextResponse.json({
      email: guestEmail,
      password: guestPassword,
      userId: signUpData.user?.id,
    });
  } catch (err: any) {
    console.error("Guest creation API failure:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate guest access" },
      { status: 500 }
    );
  }
}
