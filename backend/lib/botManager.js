// lib/botManager.js
import tmi from "tmi.js";
import db from "../db.js";
import {
  enqueue,
  playNext,
  getState,
  resolveTrack,
  skip,
} from "../lib/player.js";
import { getBotAccessToken } from "./botTokens.js";

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

  const BOT_LOGIN = (process.env.LUBOT_BOT_NAME || "").toLowerCase();

  const token = await getBotAccessToken();

  // Which channel do we join? → the streamer’s login/slug
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
      username: BOT_LOGIN,                 // LuBot
      password: `oauth:${token}`,     // LuBot token
    },
    channels: [`#${channelLogin}`],       // Join streamer channel
  });

  client.on("message", async (channel, tags, message, self) => {
    if (self) return;

    const isMod =
      tags.mod ||
      tags["user-type"] === "mod" ||
      tags.badges?.broadcaster === "1";

    const [rawCmd, ...rest] = message.trim().split(/\s+/);
    const cmd = rawCmd.toLowerCase();

    if (cmd === "!sr" || cmd === "!songrequest") {
      const q = rest.join(" ").trim();
      if (!q)
        return client.say(
          channel,
          `@${tags.username}, дай посилання або запит.`
        );
      try {
        const track = await resolveTrack(q, tags.username);
        enqueue(track);
        if (!getState().nowPlaying) playNext();
        client.say(
          channel,
          `Додано: ${track.title} (заявка від @${tags.username})`
        );
      } catch (e) {
        const msg = e?.message || String(e);
        client.say(channel, `@${tags.username} відхилено: ${msg}`);
      }
    }

    if (cmd === "!skip" && isMod) {
      skip();
      client.say(channel, `⏭️ Пропущено. Наступний трек...`);
    }

    if (cmd === "!song") {
      const { nowPlaying } = getState();
      if (nowPlaying) {
        client.say(
          channel,
          `Зараз: ${nowPlaying.title} (від @${nowPlaying.requester})`
        );
      } else {
        client.say(channel, `Зараз тиша. Додай трек командою !sr`);
      }
    }

    if (cmd === "!queue") {
      const { QUEUE } = getState();
      if (QUEUE.length === 0) client.say(channel, `Черга порожня.`);
      else client.say(channel, `У черзі ${QUEUE.length} трек(ів).`);
    }
  });

  client.on("connected", () =>
    console.log(
      `✅ LuBot connected for tenant=${tenantId} in #${channelLogin}`
    )
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

export function botStatus(tenantId) {
  return conns.has(tenantId) ? "connected" : "disconnected";
}
