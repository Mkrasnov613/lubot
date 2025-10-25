import { getValidToken } from "./lib/twitch-auth.js";
import tmi from "tmi.js";
import db from "../db.js";

export async function initBot(tenantId) {
  try {
    const token = await getValidToken(tenantId);

    const channel = db
      .prepare(`SELECT slug FROM tenants WHERE tenant_id = ?`)
      .run(tenantId);

    const tmiClient = new tmi.Client({
      connection: { reconnect: true, secure: true },
      identity: {
        username: process.env.TWITCH_BOT_NAME,
        password: `oauth:${token}`,
      },
      channels: [channel],
    });

    await tmiClient.connect();
    console.log("✅ Bot connected with a valid token");
    return tmiClient;
  } catch (err) {
    console.error("Bot init failed:", err.message);
  }
}
