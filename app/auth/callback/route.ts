import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  // Optional: display name passed from magic-link invite flow
  const name = searchParams.get("name");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // If a display name was passed (from the quick-join magic link flow),
      // save/update it in the user's profile
      if (name) {
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: decodeURIComponent(name),
          }, { onConflict: "id" });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could%20not%20authenticate%20user`);
}
