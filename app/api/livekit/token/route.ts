import { createClient } from "@/lib/supabase/server";
import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { fellowshipId, cellId, guestName } = await request.json();
    const targetCellId = cellId || fellowshipId;

    if (!targetCellId) {
      return NextResponse.json({ error: "Cell ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let identity: string;
    let name: string;
    let isHost = false;

    if (user) {
      // Authenticated Believer
      const { data: member } = await supabase
        .from("fellowship_members")
        .select("role")
        .eq("fellowship_id", targetCellId)
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: cell } = await supabase
        .from("fellowships")
        .select("created_by")
        .eq("id", targetCellId)
        .single();

      isHost = member?.role === "host" || cell?.created_by === user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      identity = user.id;
      name = profile?.full_name || user.email?.split("@")[0] || "Believer";
    } else if (guestName) {
      // Unauthenticated Guest joining live call via meeting link
      const cleanGuestName = guestName.trim() || "Guest Believer";
      identity = `guest-${crypto.randomBytes(6).toString("hex")}`;
      name = cleanGuestName.endsWith("(Guest)") ? cleanGuestName : `${cleanGuestName} (Guest)`;
      isHost = false;
    } else {
      return NextResponse.json({ error: "Unauthorized: Sign in or provide guest name" }, { status: 401 });
    }

    const roomName = `koinonia-room-${targetCellId}`;
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

    return NextResponse.json({ token, wsUrl, roomName, isHost, participantName: name });
  } catch (err: any) {
    console.error("Error issuing LiveKit token:", err);
    return NextResponse.json({ error: err.message || "Server error generating room token" }, { status: 500 });
  }
}
