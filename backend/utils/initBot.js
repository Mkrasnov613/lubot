// utils/initBot.js
import tmi from "tmi.js";
import db from "../db.js";
import { refreshTokenRow } from "../lib/twitch-tokens.js";
import { enqueue, playNext, getState, resolveTrack, skip } from "../lib/player.js";

export async function initBot(tenantId) {
  const botAccessToken = await refreshTokenRow(
    tenantId,
    "tenant_bot"
  );

  const botRow = db.prepare(`
    SELECT bot_login, bot_display_name FROM tenant_bot WHERE tenant_id = ?
  `).get(tenantId);
  if (!botRow) throw new Error("Bot not connected for this tenant");

  // get streamer’s channel (tenant slug)
  const tenant = db.prepare(`SELECT slug FROM tenants WHERE twitch_user_id = ?`).get(tenantId);
  if (!tenant?.slug) throw new Error("Tenant slug not found");

  const client = new tmi.Client({
    identity: { username: botRow.bot_login, password: `oauth:${botAccessToken}` },
    channels: [tenant.slug], // <-- join streamer’s channel
    connection: { reconnect: true, secure: true },
  });

  await client.connect();

  client.on("message", async (channel, tags, message, self) => {
    if (self) return;
    const isMod = tags.mod || tags["user-type"] === "mod" || tags.badges?.broadcaster === "1";
    const [cmd, ...rest] = message.trim().split(" ");

    if (cmd === "!sr" || cmd === "!songrequest") {
      const q = rest.join(" ").trim();
      if (!q) return client.say(channel, `@${tags.username}, дай посилання або запит.`);
      try {
        const track = await resolveTrack(q, tags.username);
        enqueue(track);
        if (!getState().nowPlaying) playNext();
        client.say(channel, `Додано: ${track.title} (заявка від @${tags.username})`);
      } catch (e) {
        client.say(channel, `@${tags.username} відхилено: ${e.message}`);
      }
    }

    if (cmd === "!skip" && isMod) {
      skip();
      client.say(channel, `⏭️ Пропущено. Наступний трек...`);
    }

    if (cmd === "!song") {
      const { nowPlaying } = getState();
      if (nowPlaying) client.say(channel, `Зараз: ${nowPlaying.title} (від @${nowPlaying.requester})`);
      else client.say(channel, `Зараз тиша. Додай трек командою !sr`);
    }

    if (cmd === "!queue") {
      const { QUEUE } = getState();
      if (QUEUE.length === 0) client.say(channel, `Черга порожня.`);
      else client.say(channel, `У черзі ${QUEUE.length} трек(ів).`);
    }
  });

  return client;
}
