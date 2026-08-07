import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const cleanName = name?.trim() || "Guest Believer";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Method A: Admin creation with Service Role Key (if available in env)
    if (serviceRoleKey && serviceRoleKey !== "your-supabase-service-role-key") {
      const uniqueId = crypto.randomBytes(8).toString("hex");
      const guestEmail = `koinonia_guest_${uniqueId}@gmail.com`;
      const guestPassword = `Guest#${crypto.randomBytes(12).toString("hex")}`;

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

      if (!adminErr && adminUser?.user) {
        return NextResponse.json({
          email: guestEmail,
          password: guestPassword,
          userId: adminUser.user.id,
        });
      }
    }

    // Method B: Instant PostgreSQL RPC creation (100% zero-email, zero-rate-limit, valid @gmail.com domain)
    const supabase = await createServerClient();
    const { data: guestCreds, error: rpcErr } = await supabase.rpc("create_instant_guest", {
      p_display_name: cleanName,
    });

    if (rpcErr || !guestCreds) {
      console.error("RPC guest creation error:", rpcErr);
      throw new Error(rpcErr?.message || "Failed to generate instant guest access");
    }

    return NextResponse.json({
      email: guestCreds.email,
      password: guestCreds.password,
      userId: guestCreds.user_id,
    });
  } catch (err: any) {
    console.error("Guest creation API failure:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate guest access" },
      { status: 500 }
    );
  }
}
