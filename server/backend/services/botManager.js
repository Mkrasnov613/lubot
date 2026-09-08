// services/botManager.js
import tmi from "tmi.js";
import { db } from "../db/connection.js";
import axios from "axios";
import {
  enqueue,
  playNext,
  getState,
  resolveTrack,
  skip,
} from "./player.js";
import { getBotAccessToken } from "../utils/tokens/bot.js";
import { refreshTokenRow } from "../utils/tokens/broadcaster.js";

const conns = new Map(); // tenantId -> tmi.Client
const nukeWordsCache = new Map(); // broadcasterId -> [word, ...]

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

function loadNukeWords(broadcasterId) {
  if (nukeWordsCache.has(broadcasterId)) {
    return nukeWordsCache.get(broadcasterId);
  }

  const rows = db
    .prepare("SELECT word FROM nuke_words WHERE broadcaster_id = ?")
    .all(broadcasterId);

  const words = rows.map((r) => r.word.toLowerCase());
  nukeWordsCache.set(broadcasterId, words);
  return words;
}

// Call this from API after POST/DELETE to update cache immediately:
export function invalidateNukeCache(broadcasterId) {
  nukeWordsCache.delete(broadcasterId);
}

export async function enableBot(tenantId) {
  if (conns.has(tenantId)) return;

  const botToken = await getBotAccessToken();
  const twitchToken = await refreshTokenRow(tenantId);

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

  client.on("message", async (channel, tags, message, self) => {
    if (self) return;

    console.log("[LuBot message]", {
      channel,
      user: tags.username,
      message,
    });

    const broadcasterId = tags["room-id"];
    const username = tags["username"];
    const isMod =
      tags.mod ||
      tags["user-type"] === "mod" ||
      tags.badges?.broadcaster === "1";

    if (!broadcasterId || !username) {
      return;
    }

    const msg = message.toLowerCase();

    try {
      const words = loadNukeWords(broadcasterId);

      let hitWord = null;
      for (const w of words) {
        if (!w) continue;
        if (msg.includes(w)) {
          hitWord = w;
          break;
        }
      }

      if (hitWord) {
        try {
          const msgId = tags.id;
          console.log("Try delete", { channel, username, msgId, hitWord });
          if (msgId) {
            await axios.delete("https://api.twitch.tv/helix/moderation/chat", {
              params: {
                broadcaster_id: broadcasterId,
                moderator_id: broadcasterId,
                message_id: msgId,
              },
              headers: {
                Authorization: `Bearer ${twitchToken}`,
                "Client-Id": process.env.TWITCH_CLIENT_ID,
              },
            });
            console.log(
              `💣 Deleted message from ${username} containing "${hitWord}"`
            );
          }
        } catch (e) {
          console.error("Error nuking user:", e);
        }
      }
    } catch (e) {
      console.error("Error loading nuke words:", e);
    }

    const [rawCmd, ...rest] = message.trim().split(/\s+/);
    const cmd = rawCmd.toLowerCase();

    if (cmd === "!sr" || cmd === "!songrequest") {
      const q = rest.join(" ").trim();
      if (!q) {
        return client.say(channel, `@${username}, дай посилання або запит.`);
      }
      try {
        const track = await resolveTrack(q, username);
        enqueue(tenantId, track);
        const { nowPlaying } = getState(tenantId);
        if (!nowPlaying) playNext(tenantId);
        client.say(channel, `Додано: ${track.title} (заявка від @${username})`);
      } catch (e) {
        const msg = e?.message || String(e);
        client.say(channel, `@${username} відхилено: ${msg}`);
      }
    }

    if (cmd === "!skip" && isMod) {
      skip(tenantId);
      client.say(channel, `⏭️ Пропущено. Наступний трек...`);
    }

    if (cmd === "!song") {
      const { nowPlaying } = getState(tenantId);
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
      const { QUEUE } = getState(tenantId);
      if (QUEUE.length === 0) client.say(channel, `Черга порожня.`);
      else client.say(channel, `У черзі ${QUEUE.length} трек(ів).`);
    }
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

export function botStatus(tenantId) {
  return conns.has(tenantId) ? "connected" : "disconnected";
}
