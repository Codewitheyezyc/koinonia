import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { name, fellowshipId } = await request.json();

    const cleanName = name?.trim() || "Guest Believer";
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const guestEmail = `guest_${uniqueId}@koinonia-guest.com`;
    const guestPassword = `Guest#${crypto.randomBytes(12).toString("hex")}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let userId: string | undefined;

    if (serviceRoleKey && serviceRoleKey !== "your-supabase-service-role-key") {
      // 1A. Admin creation using SUPABASE_SERVICE_ROLE_KEY — 100% bypasses email server & rate limits!
      const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey);
      const { data: adminUser, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
        email: guestEmail,
        password: guestPassword,
        email_confirm: true,
        user_metadata: {
          full_name: `${cleanName} (Guest)`,
          is_guest: true,
        },
      });

      if (adminErr) {
        console.error("Admin guest createUser error:", adminErr);
        return NextResponse.json({ error: adminErr.message }, { status: 400 });
      }

      userId = adminUser.user?.id;
    } else {
      // 1B. Fallback creation via standard GoTrue server client
      const supabase = await createServerClient();
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
        console.error("Guest signUp fallback error:", signUpErr);
        return NextResponse.json({ error: signUpErr.message }, { status: 400 });
      }

      userId = signUpData.user?.id;
      // Auto-confirm email in database using security definer RPC
      await supabase.rpc("confirm_guest_email", { p_email: guestEmail });
    }

    // Return credentials so client can sign in with password
    return NextResponse.json({
      email: guestEmail,
      password: guestPassword,
      userId,
    });
  } catch (err: any) {
    console.error("Guest creation API failure:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate guest access" },
      { status: 500 }
    );
  }
}
