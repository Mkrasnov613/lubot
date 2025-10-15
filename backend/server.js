import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import http from "http";
import { Server } from "socket.io";
import ytSearch from "yt-search";
import tmi from "tmi.js";
import cors from "cors";
import yts from "yt-search";
import { error } from "console";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("backend/public"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

console.log(
  "[AUTH] user:",
  BOT,
  "tokenLen:",
  PASS.length,
  "startsWithOauth:",
  PASS.startsWith("oauth:")
);

const QUEUE = [];
let nowPlaying = null;

const PLAYER_SECRET = process.env.PLAYER_SECRET;

const RU_LETTERS = /[ёыэъ]/i;
const RU_DOMAINS = /(vk\.com|yandex|rutube|ok\.ru)/i;

function isRussianLike(text = "") {
  const lower = text.toLowerCase();
  return RU_LETTERS.test(lower);
}
function isDisallowedUrl(url = "") {
  return RU_DOMAINS.test(url.toLowerCase());
}
function validateTrackCandidate({ title = "", url = "" }) {
  if (isDisallowedUrl(url)) return { ok: false, reason: "Заборонене джерело" };
  if (isRussianLike(title))
    return { ok: false, reason: "Заборонений виконавець/назва" };
  return { ok: true };
}

function assertPlayer(req, res, next) {
  const hdr = req.headers["x-player-secret"] || req.query.key;
  if (hdr && hdr === PLAYER_SECRET) return next();
  return res.status(401).json({ error: "unauthorized player" });
}

async function resolveTrack(query, requester) {
  const res = await ytSearch(query);
  const v = res?.videos?.find(
    (x) => x.videoId && x.seconds > 0 && !x.live && !x.isLive && !x.isShorts
  );

  const cand = { title: v?.title, url: v?.url };
  const chk = validateTrackCandidate(cand);
  if (!chk.ok) throw new Error(chk.reason);

  return {
    id: v.videoId,
    videoId: v.videoId,
    title: v?.title,
    url: cand.url,
    author: v.author,
    thumb: v.thumbnail,
    requester,
    durationSec: v.seconds || 0,
  };
}

function enqueue(track) {
  QUEUE.push(track);
  io.emit("queue:update", { queue: QUEUE, nowPlaying });
}
function playNext() {
  nowPlaying = QUEUE.shift() || null;
  io.emit("player:play", { track: nowPlaying });
  io.emit("queue:update", { queue: QUEUE, nowPlaying });
}
function skip() {
  playNext();
}

io.on("connection", (socket) => {
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
  const isMod =
    tags.mod || tags["user-type"] === "mod" || tags.badges?.broadcaster === "1";
  const [cmd, ...rest] = message.trim().split(" ");

  if (cmd === "!sr" || cmd === "!songrequest") {
    const q = rest.join(" ").trim();
    if (!q)
      return tmiClient.say(
        channel,
        `@${tags.username}, дай посилання або запит.`
      );
    try {
      const track = await resolveTrack(q, tags.username);
      enqueue(track);
      if (!nowPlaying) playNext();
      tmiClient.say(
        channel,
        `Додано: ${track.title} (заявка від @${tags.username})`
      );
    } catch (e) {
      tmiClient.say(channel, `@${tags.username} відхилено: ${e.message}`);
    }
  }

  if (cmd === "!skip" && isMod) {
    skip();
    tmiClient.say(channel, `⏭️ Пропущено. Наступний трек...`);
  }

  if (cmd === "!song") {
    if (nowPlaying) {
      tmiClient.say(
        channel,
        `Зараз: ${nowPlaying.title} (від @${nowPlaying.requester})`
      );
    } else tmiClient.say(channel, `Зараз тиша. Додай трек командою !sr`);
  }

  if (cmd === "!queue") {
    if (QUEUE.length === 0) tmiClient.say(channel, `Черга порожня.`);
    else tmiClient.say(channel, `У черзі ${QUEUE.length} трек(ів).`);
  }
});

app.post("/api/enqueue", async (req, res) => {
  try {
    const { videoId, requester } = req.body || {};
    const who = requester || "web";

    const query = `https://www.youtube.com/watch?v=${videoId}`;
    const track = await resolveTrack(query, who);
    enqueue(track);
    if (!nowPlaying) playNext();
    return res.json({ track, requester });
  } catch (error) {
    return res.status(400).json({ error });
  }
});

// API for a player to play next track
app.post("/api/next", assertPlayer, (_req, res) => {
  playNext();
  res.json({ ok: true });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
