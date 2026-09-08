import "./env.js";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

import { APIRouter } from "./routes/api/player.js";
import { dataTenantRouter } from "./routes/api/data-tenant.js";
import { initPlayer, getState, roomName } from "./services/player.js";

import { startTokenScheduler } from "./utils/tokenScheduler.js";
import { initDB } from "./db/initDB.js";
import { TwitchRouter } from "./routes/api/twitch.js";
import { TwitchBotAuthRouter } from "./routes/auth/bot.js";
import { TwitchAuthRouter } from "./routes/auth/broadcaster.js";
import { BotRouter } from "./routes/api/bot.js";
import { NukeRouter } from "./routes/api/nuke-word.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const RateLimit = require("express-rate-limit");

const defaultLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

const app = express();
const server = http.createServer(app);

export const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_BASE_URL,
].filter(Boolean);

const corsOptions = {
  credentials: true,
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

initDB();

app.use(cors(corsOptions));
export const io = new Server(server, {
  cors: {
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  },
});

initPlayer(io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(defaultLimiter);
app.use("/api/twitch", TwitchRouter);
app.use("/api/bot", BotRouter);
app.use("/api/nuke-words", NukeRouter);
app.use("/api/player", APIRouter);
app.use("/api/data", dataTenantRouter);
app.use("/auth/twitch", TwitchAuthRouter);
app.use("/auth/twitch-bot", TwitchBotAuthRouter);

app.get("/version", (_req, res) => {
  res.json({ version: pkg.version, commit: process.env.GIT_SHA || "dev" });
});

io.on("connection", (socket) => {
  const tenantId =
    socket.handshake.auth?.tenantId || socket.handshake.query?.tenantId;

  if (!tenantId) {
    console.warn("Socket without tenantId, disconnecting", socket.id);
    socket.disconnect();
    return;
  }

  const room = roomName(tenantId);
  socket.join(room);

  console.log("Socket connected", socket.id, "tenant=", tenantId);

  const { QUEUE, nowPlaying } = getState(tenantId);
  socket.emit("queue:update", { queue: QUEUE, nowPlaying });
});

io.of("/eventsub").on("connection", (socket) => {
  console.log("EventSub UI client connected", socket.id);
});

const stopScheduler = startTokenScheduler();
process.on("SIGINT", () => {
  stopScheduler();
  process.exit(0);
});

const PORT = 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
