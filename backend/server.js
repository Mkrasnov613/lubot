const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const ytSearch = require("yt-search");
const tmi = require("tmi.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const QUEUE = [];
const PLAYER_SECRET = process.env.PLAYER_SECRET;
let nowPlaying = null;

function assertPlayer(req, res, next) {
  const hdr = req.headers["x-player-secret"] || req.query.key;
  if (hdr && hdr === PLAYER_SECRET) return next();
  return res.status(401).json({ error: "unauthorized player" });
}

async function resolveTrack(query, requester) {
  const res = await ytSearch(query);
  const v = res && res.videos && res.videos[0];
  if (!v) return null;
  return {
    id: v.videoId,
    videoId: v.videoId,
    title: v.title,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
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
  options: { debug: false },
  connection: { reconnect: true, secure: true },
  identity: {
    username: process.env.TWITCH_BOT_NAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL],
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
    } else {
      tmiClient.say(channel, `Зараз тиша. Додай трек командою !sr`);
    }
  }
  if (cmd === "!queue") {
    if (QUEUE.length === 0) tmiClient.say(channel, `Черга порожня.`);
    else tmiClient.say(channel, `У черзі ${QUEUE.length} трек(ів).`);
  }
});

app.post("/api/next", assertPlayer, (_req, res) => {
  playNext();
  res.json({ ok: true });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
