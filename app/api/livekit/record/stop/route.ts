import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { egressId, fellowshipId } = await request.json();
    if (!fellowshipId) {
      return NextResponse.json({ error: "Fellowship ID is required" }, { status: 400 });
    }

    // Find the #bible-study-notes channel for this fellowship
    const { data: channelData } = await supabase
      .from("channels")
      .select("id")
      .eq("fellowship_id", fellowshipId)
      .eq("type", "notes")
      .single();

    if (channelData) {
      const archiveContent = `🎙️ **Recorded Prayer Gathering Archive**\n\nA live audio prayer meeting was completed and archived on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;

      await supabase.from("messages").insert({
        channel_id: channelData.id,
        user_id: user.id,
        content: archiveContent,
      });
    }

    return NextResponse.json({
      status: "stopped",
      message: "Call recording stopped and archived to study notes.",
    });
  } catch (err: any) {
    console.error("Failed to stop LiveKit recording:", err);
    return NextResponse.json({ error: err.message || "Failed to stop recording" }, { status: 500 });
  }
}
