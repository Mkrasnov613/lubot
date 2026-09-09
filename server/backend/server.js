import "./env.js";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

import { dataTenantRouter } from "./routes/api/data-tenant.js";

import { startTokenScheduler } from "./utils/tokenScheduler.js";
import { initDB } from "./db/initDB.js";
import { TwitchRouter } from "./routes/api/twitch.js";
import { TwitchBotAuthRouter } from "./routes/auth/bot.js";
import { TwitchAuthRouter } from "./routes/auth/broadcaster.js";

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

await initDB();

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(defaultLimiter);
app.use("/api/twitch", TwitchRouter);
app.use("/api/data", dataTenantRouter);
app.use("/auth/twitch", TwitchAuthRouter);
app.use("/auth/twitch-bot", TwitchBotAuthRouter);

app.get("/version", (_req, res) => {
  res.json({ version: pkg.version, commit: process.env.GIT_SHA || "dev" });
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
