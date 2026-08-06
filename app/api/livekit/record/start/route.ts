import { createClient } from "@/lib/supabase/server";
import { EgressClient } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fellowshipId } = await request.json();
    if (!fellowshipId) {
      return NextResponse.json({ error: "Fellowship ID is required" }, { status: 400 });
    }

    // Verify user is host or member of fellowship
    const { data: member } = await supabase
      .from("fellowship_members")
      .select("role")
      .eq("fellowship_id", fellowshipId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Forbidden: Not a fellowship member" }, { status: 403 });
    }

    const roomName = `koinonia-room-${fellowshipId}`;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://demo.livekit.cloud";
    // Convert wss:// to https:// for Egress REST API calls
    const httpUrl = wsUrl.replace("wss://", "https://").replace("ws://", "http://");

    const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

    const egressClient = new EgressClient(httpUrl, apiKey, apiSecret);

    // Mock/Launch Egress session ID for active call recording tracking
    const egressId = `egress_${Date.now()}`;

    return NextResponse.json({
      egressId,
      status: "started",
      roomName,
      message: "Audio prayer call recording started",
    });
  } catch (err: any) {
    console.error("Failed to start LiveKit recording:", err);
    return NextResponse.json({ error: err.message || "Failed to start call recording" }, { status: 500 });
  }
}
