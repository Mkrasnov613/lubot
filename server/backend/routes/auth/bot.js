import { Router } from "express";
import axios from "axios";
import { saveBotRow } from "../../utils/tokens/bot.js";
import { oauthStateCookieOptions } from "../../utils/session.js";

export const TwitchBotAuthRouter = Router();

const TWITCH_CLIENT_ID = (process.env.TWITCH_CLIENT_ID || "").trim();
const TWITCH_CLIENT_SECRET = (process.env.TWITCH_CLIENT_SECRET || "").trim();
const TWITCH_BOT_REDIRECT_URI = (process.env.TWITCH_BOT_REDIRECT_URI || "").trim();
const LUBOT_BOT_NAME = (process.env.LUBOT_BOT_NAME || "").toLowerCase(); // e.g. "lutikbot"

TwitchBotAuthRouter.get("/login", (req, res) => {
  if (!TWITCH_CLIENT_ID || !TWITCH_BOT_REDIRECT_URI) {
    return res
      .status(500)
      .send("Missing TWITCH_CLIENT_ID or TWITCH_LUBOT_REDIRECT_URI env");
  }

  const scope = [
    "chat:read",
    "chat:edit",
    "moderator:manage:chat_messages",
    "channel:bot",
  ].join(" ");

  const state = Math.random().toString(36).slice(2);

  res.cookie("lubot_oauth_state", state, oauthStateCookieOptions);

  const url =
    `https://id.twitch.tv/oauth2/authorize` +
    `?client_id=${encodeURIComponent(TWITCH_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(TWITCH_BOT_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  return res.redirect(url);
});

// 2) Handle callback, exchange code for token, store in lubot_tokens
TwitchBotAuthRouter.get("/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");

  if (!code || !state) {
    return res.status(400).json({ success: false, error: "missing code/state" });
  }

  const savedState = req.cookies?.lubot_oauth_state;
  if (!savedState || savedState !== state) {
    return res.status(400).json({ success: false, error: "invalid CSRF state" });
  }

  res.clearCookie("lubot_oauth_state");

  const body = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: TWITCH_BOT_REDIRECT_URI,
  });

  try {
    // 1) Exchange code -> tokens
    const tokenRes = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      body.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, expires_in, scope } = tokenRes.data;

    // 2) Get the user behind this token (should be lutikbot)
    const meRes = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": TWITCH_CLIENT_ID,
      },
    });

    const me = meRes.data.data[0];


    // 3) Store in lubot_tokens as a GLOBAL row (id = 'global')
    await saveBotRow({ access_token, refresh_token, expires_in, scope });

    console.log("🤖 LuBot authorized as", me.login);

    // You can render something prettier if you want
    return res.send(
      `LuBot (${me.display_name}) authorized successfully. You can close this window.`
    );
  } catch (e) {
    const msg = e.response?.data?.message || e.message || "unknown";
    console.error("LuBot OAuth failed:", msg);
    return res.status(400).send("LuBot OAuth failed: " + msg);
  }
});