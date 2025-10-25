import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";

import { APIRouter } from "./routes/api.js";
import { TwitchRouter } from "./routes/auth-twitch.js";
import { DashboardRouter } from "./routes/dashboard.js";

import {
  initPlayer,
  resolveTrack,
  enqueue,
  playNext,
  getState,
  skip,
} from "./lib/player.js";

import { initBot } from "./utils/initBot.js";

import { initDB } from "./utils/initDB.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

initDB();
initPlayer(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("backend"));
app.use(cookieParser());
app.use("/api", APIRouter);
app.use("/auth/twitch", TwitchRouter);
app.use("/dashboard", DashboardRouter);

io.on("connection", (socket) => {
  const { QUEUE, nowPlaying } = getState();
  socket.emit("queue:update", { queue: QUEUE, nowPlaying });
});

const tmiClient = initBot()

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
      if (!getState().nowPlaying) playNext();
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
    const { nowPlaying } = getState();
    if (nowPlaying) {
      tmiClient.say(
        channel,
        `Зараз: ${nowPlaying.title} (від @${nowPlaying.requester})`
      );
    } else tmiClient.say(channel, `Зараз тиша. Додай трек командою !sr`);
  }

  if (cmd === "!queue") {
    const { QUEUE } = getState();
    if (QUEUE.length === 0) tmiClient.say(channel, `Черга порожня.`);
    else tmiClient.say(channel, `У черзі ${QUEUE.length} трек(ів).`);
  }
});

const PORT = 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
