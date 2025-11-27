import WebSocket from "ws";
import { refreshTokenRow } from "./twitchTokens.js";

async function createSub({ token, sessionId, type, version, condition }) {
  const res = await fetch(
    `https://api.twitch.tv/helix/eventsub/subscriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        version,
        condition,
        transport: { method: "websocket", session_id: sessionId },
      }),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create sub failed: ${res.status} ${txt}`);
  }
}

export async function startEventSub(io, broadcasterId) {
  const nsp = io.of("/eventsub"); // client connects to ws://host/socket.io?ns=/eventsub
  const ws = new WebSocket("wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=60");

  const token = await refreshTokenRow(
    broadcasterId
  );

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (e) {
      console.error("[EventSub] Bad JSON:", raw.toString());
      return;
    }
    const type = msg?.metadata?.message_type;

    switch (type) {
      case "session_welcome":
        const sessionId = msg.payload.session.id;
        try {
          await createSub({
            token,
            sessionId,
            type: "stream.online",
            version: "1",
            condition: { broadcaster_user_id: String(broadcasterId) },
          });
          console.log("[EventSub] Subscribed to stream.online ✅");

          await createSub({
            token,
            sessionId,
            type: "channel.follow",
            version: "2",
            condition: {
              broadcaster_user_id: String(broadcasterId),
              moderator_user_id: String(broadcasterId),
            },
          });
          console.log("[EventSub] Subscribed to channel.follow v2 ✅");
        } catch (e) {
          console.error("[EventSub] createSub failed:", e);
        }
        break;

      case "notification":
        const { subscription, event } = msg.payload;
        console.log("[EventSub] notification:", subscription?.type, event);
        nsp.emit("twitch:event", {
          type: subscription.type, // e.g. "stream.online"
          event,
        });
        break;

      case "session_keepalive":
        console.log("[EventSub] keepalive");
        break;

      case "session_reconnect":
        console.warn("[EventSub] session_reconnect");
        ws.close();
        startEventSub(io, broadcasterId);
        break;
      default:
        console.log("[EventSub] unknown message:", msg);
    }
  });
  ws.on("error", (e) => console.error("EventSub WS error:", e));
  ws.on("close", () => {
    // naive backoff
    setTimeout(() => startEventSub(io, broadcasterId), 2000);
  });

  return ws;
}
