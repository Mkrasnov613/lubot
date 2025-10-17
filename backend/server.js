import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import http from "http";
import { Server } from "socket.io";
import tmi from "tmi.js";
import cors from "cors";

import router from "./routes/api.js";
import { initPlayer, resolveTrack, enqueue, playNext, getState, skip } from "./lib/player.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// init player with socket.io
initPlayer(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("backend"));
app.use("/api", router);

function must(name, pred = (v) => !!v) {
  const v = process.env[name];
  if (!pred(v)) {
    console.error(`[ENV] ${name} missing/invalid. Current value:`, v);
    process.exit(1);
  }
  return v;
}
const BOT = must("TWITCH_BOT_NAME");
const PASS = must("TWITCH_OAUTH_TOKEN", (v) => v && v.startsWith("oauth:"));
const CHAN = must("TWITCH_CHANNEL");

console.log("[AUTH] user:", BOT, "tokenLen:", PASS.length, "startsWithOauth:", PASS.startsWith("oauth:"));

io.on("connection", (socket) => {
  const { QUEUE, nowPlaying } = getState();
  socket.emit("queue:update", { queue: QUEUE, nowPlaying });
});

const tmiClient = new tmi.Client({
  connection: { reconnect: true, secure: true },
  identity: { username: BOT, password: PASS },
  channels: [CHAN],
});
tmiClient.connect();

tmiClient.on("message", async (channel, tags, message, self) => {
  if (self) return;
  const isMod = tags.mod || tags["user-type"] === "mod" || tags.badges?.broadcaster === "1";
  const [cmd, ...rest] = message.trim().split(" ");

  if (cmd === "!sr" || cmd === "!songrequest") {
    const q = rest.join(" ").trim();
    if (!q) return tmiClient.say(channel, `@${tags.username}, дай посилання або запит.`);

    try {
      const track = await resolveTrack(q, tags.username);
      enqueue(track);
      if (!getState().nowPlaying) playNext();
      tmiClient.say(channel, `Додано: ${track.title} (заявка від @${tags.username})`);
    } catch (e) {
      tmiClient.say(channel, `@${tags.username} відхилено: ${e.message}`);
    }
  }

  if (cmd === "!skip" && isMod) {
    skip();
    tmiClient.say(channel, `⏭️ Пропущено. Наступний трек...`);
  }

  if (cmd === "!song") {
    const { nowPlaying } = getState();
    if (nowPlaying) {
      tmiClient.say(channel, `Зараз: ${nowPlaying.title} (від @${nowPlaying.requester})`);
    } else tmiClient.say(channel, `Зараз тиша. Додай трек командою !sr`);
  }

  if (cmd === "!queue") {
    const { QUEUE } = getState();
    if (QUEUE.length === 0) tmiClient.say(channel, `Черга порожня.`);
    else tmiClient.say(channel, `У черзі ${QUEUE.length} трек(ів).`);
  }
});

// Twitch OAuth login: correct param and redirect
app.get("/auth/twitch/login", (req, res) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = "http://localhost:3000/auth/twitch/callback";
  const scope = "user:read:email";
  const state = Math.random().toString(36).slice(2);

  const twitchAuthUrl =
    `https://id.twitch.tv/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  res.redirect(twitchAuthUrl);
});

const PORT = 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
