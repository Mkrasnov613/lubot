// services/botManager.js
//
// Connection lifecycle only: authorizes the shared bot account and joins/leaves
// a tenant's Twitch chat. All bot *behaviour* (moderation, nuke words, song
// commands) was removed and is pending a rebuild — do not add message handling
// back here without revisiting that design.
import tmi from "tmi.js";
import { db } from "../db/connection.js";
import { getBotAccessToken } from "../utils/tokens/bot.js";

const conns = new Map(); // tenantId -> tmi.Client

function getTenantLogin(tenantId) {
  return db
    .prepare(`SELECT slug FROM tenants WHERE twitch_user_id = ?`)
    .get(tenantId);
}

function getBroadcasterLoginFallback(tenantId) {
  return db
    .prepare(`SELECT login FROM users WHERE twitch_user_id = ?`)
    .get(tenantId);
}

export async function enableBot(tenantId) {
  if (conns.has(tenantId)) return;

  const botToken = await getBotAccessToken();

  const tenant = getTenantLogin(tenantId);
  const broadcaster = getBroadcasterLoginFallback(tenantId);

  const channelLogin = (
    tenant?.slug ||
    tenant?.login ||
    broadcaster?.login ||
    ""
  ).toLowerCase();

  if (!channelLogin) {
    throw new Error("Missing broadcaster login/slug for tenant " + tenantId);
  }

  const client = new tmi.Client({
    options: { skipUpdatingEmotesets: true },
    identity: {
      username: "lutikbot",
      password: `oauth:${botToken}`,
    },
    channels: [`#${channelLogin}`],
  });

  client.on("connected", () =>
    console.log(`✅ LuBot connected for tenant=${tenantId} in #${channelLogin}`)
  );
  client.on("disconnected", (reason) => {
    console.log(`❌ LuBot disconnected for ${tenantId}: ${reason}`);
    conns.delete(tenantId);
  });

  await client.connect();
  conns.set(tenantId, client);
}

export async function disableBot(tenantId) {
  const c = conns.get(tenantId);
  if (!c) return;
  try {
    await c.disconnect();
  } finally {
    conns.delete(tenantId);
  }
}
