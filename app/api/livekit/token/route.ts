import { createClient } from "@/lib/supabase/server";
import { AccessToken } from "livekit-server-sdk";
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

    // Verify user is a member or creator of the fellowship
    const { data: member } = await supabase
      .from("fellowship_members")
      .select("role")
      .eq("fellowship_id", fellowshipId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this fellowship" }, { status: 403 });
    }

    const { data: fellowship } = await supabase
      .from("fellowships")
      .select("created_by")
      .eq("id", fellowshipId)
      .single();

    const isHost = member.role === "host" || fellowship?.created_by === user.id;

    // Fetch user profile for room display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const identity = user.id;
    const name = profile?.full_name || user.email?.split("@")[0] || "Believer";
    const roomName = `koinonia-room-${fellowshipId}`;

    const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: "4h",
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
      roomCreate: isHost,
    });

    const token = await at.toJwt();
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://demo.livekit.cloud";

    return NextResponse.json({ token, wsUrl, roomName, isHost });
  } catch (err: any) {
    console.error("Error issuing LiveKit token:", err);
    return NextResponse.json({ error: err.message || "Server error generating room token" }, { status: 500 });
  }
}
