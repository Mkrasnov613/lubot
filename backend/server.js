import dotenv from "dotenv";
dotenv.config();

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
import { startTokenScheduler } from "./utils/tokenScheduler.js";
import { initDB } from "./utils/initDB.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


initDB()
initPlayer(io);

app.use(cors({
  origin: "http://localhost:3001",
  credentials: true,
}));
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

const stopScheduler = startTokenScheduler()
process.on("SIGINT", () => {stopScheduler(); process.exit(0)})

const PORT = 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
