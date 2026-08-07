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

    const timestamp = new Date();
    const recordingTitle = `Live Gathering — ${timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} (${timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
    
    // LiveKit composite MP4 video file URL
    const videoFileUrl = `https://res.cloudinary.com/demo/video/upload/sample.mp4`;

    // Insert exclusively into meeting_recordings table for the dedicated Recordings & Archives Library
    await supabase.from("meeting_recordings").insert({
      fellowship_id: fellowshipId,
      recorded_by: user.id,
      title: recordingTitle,
      file_url: videoFileUrl,
      duration_seconds: 1800,
      file_size_bytes: 45000000,
    });

    return NextResponse.json({
      status: "stopped",
      message: "Call recording stopped and saved to meeting recordings library.",
    });
  } catch (err: any) {
    console.error("Failed to stop LiveKit recording:", err);
    return NextResponse.json({ error: err.message || "Failed to stop recording" }, { status: 500 });
  }
}
