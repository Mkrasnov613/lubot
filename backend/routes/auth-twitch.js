import { Router } from "express";
import axios from "axios";
import { signSession, verifySession } from "../utils/session.js";
import db from "../db.js";
import { initBot } from "../utils/initBot.js";

const frontendBaseUrl = (
  process.env.FRONTEND_BASE_URL ?? "https://twitch-website-bot.vercel.app"
).replace(/\/+$/, "");
const TWITCH_CLIENT_ID = (process.env.TWITCH_CLIENT_ID || "").trim();
const TWITCH_CLIENT_SECRET = (process.env.TWITCH_CLIENT_SECRET || "").trim();
const TWITCH_REDIRECT_URI = (process.env.TWITCH_REDIRECT_URI || "").trim();

export const TwitchRouter = Router();

TwitchRouter.get("/login", (req, res) => {
  const clientId = TWITCH_CLIENT_ID;
  const redirectUri = TWITCH_REDIRECT_URI;
  const scope = process.env.TWITCH_SCOPE ?? "";
  const state = Math.random().toString(36).slice(2);

  res.cookie("twitch_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 10 * 60 * 1000,
  });

  const twitchAuthUrl =
    `https://id.twitch.tv/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  return res.redirect(twitchAuthUrl);
});

TwitchRouter.get("/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");

  if (!code || !state) {
    return res
      .status(400)
      .json({ success: false, error: "missing code/state" });
  }

  const savedState = req.cookies?.twitch_oauth_state;

  if (!savedState || savedState !== state) {
    return res.status(400).json({
      success: false,
      error: "invalid CSRF state",
    });
  }

  res.clearCookie("twitch_oauth_state");

  const body = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TWITCH_REDIRECT_URI,
  });

  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      body.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const { access_token, refresh_token, expires_in, token_type } =
      response.data;

    const userResponse = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });

    const user = userResponse.data.data[0];

    // Save user info
    db.prepare(
      `
  INSERT INTO users (twitch_user_id, login, display_name, avatar_url)
  VALUES (@id, @login, @display_name, @avatar_url)
  ON CONFLICT(twitch_user_id) DO UPDATE SET
    login = excluded.login,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;
`
    ).run({
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      avatar_url: user.profile_image_url ?? null,
    });

    // Save tokens
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    db.prepare(
      `
  INSERT INTO twitch_tokens (tenant_id, access_token, refresh_token, access_expires_at, scope)
  VALUES (@id, @access_token, @refresh_token, @access_expires_at, @scope)
  ON CONFLICT(tenant_id) DO UPDATE SET
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    access_expires_at = excluded.access_expires_at,
    scope = excluded.scope;
`
    ).run({
      id: user.id,
      access_token,
      refresh_token,
      access_expires_at: expiresAt,
      scope: "", // add your scopes later if needed
    });

    // Save tenant (streamer)
    db.prepare(
      `
  INSERT INTO tenants (twitch_user_id, slug, display_name, avatar_url)
  VALUES (@id, @slug, @display_name, @avatar_url)
  ON CONFLICT(twitch_user_id) DO UPDATE SET
    slug = excluded.slug,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;
`
    ).run({
      id: user.id,
      slug: user.login,
      display_name: user.display_name,
      avatar_url: user.profile_image_url ?? null,
    });

    const session = signSession({ uid: user.id, login: user.login });

    res.cookie("sid", session, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    return res.redirect(`${frontendBaseUrl}/dashboard/${user.login}`);
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "unknown";
    return res.status(400).send("OAuth failed: " + msg);
  } 
});
