// routes/auth-twitch-bot.ts
import { Router } from "express";
import axios from "axios";
import { db } from "../db.js";
import { signSession, verifySession } from "../utils/session.js";
import { enableBot } from "../lib/botManager.js";

export const TwitchBotAuthRouter = Router();

TwitchBotAuthRouter.get("/login", (req, res) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = process.env.TWITCH_BOT_REDIRECT_URI; // <- new env
  const scope = "chat:read chat:edit";
  const state = Math.random().toString(36).slice(2);

  res.cookie("twitch_bot_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 10 * 60 * 1000,
  });

  const url =
    `https://id.twitch.tv/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  return res.redirect(url);
});

TwitchBotAuthRouter.get("/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  if (!code || !state) {
    return res
      .status(400)
      .json({ success: false, error: "missing code/state" });
  }

  const savedState = req.cookies?.twitch_bot_oauth_state;


  if (!savedState || savedState !== state) {
    return res.status(400).json({
      success: false,
      error: "invalid CSRF state",
    });
  }

  res.clearCookie("twitch_bot_oauth_state");

  const body = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TWITCH_BOT_REDIRECT_URI,
  });

  try {
    const tokenRes = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      body.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, expires_in, scope } = tokenRes.data;


    const meRes = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });
    const me = meRes.data.data[0];

    const session = req.cookies?.sid;
    if (!session) return res.status(401).send("No broadcaster session");
    const { sid: tenantId } = verifySession(session);

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    db.prepare(
      `
      INSERT INTO tenant_bot (
        tenant_id, bot_login, bot_display_name,
        access_token, refresh_token, access_expires_at, scope
      )
      VALUES (@tenant_id, @login, @display_name, @access, @refresh, @at, @scope)
      ON CONFLICT(tenant_id) DO UPDATE SET
        bot_login = excluded.bot_login,
        bot_display_name = excluded.bot_display_name,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        access_expires_at = excluded.access_expires_at,
        scope = excluded.scope;
    `
    ).run({
      tenant_id: tenantId, // broadcaster’s twitch_user_id
      login: me.login,
      display_name: me.display_name,
      access: access_token,
      refresh: refresh_token,
      at: expiresAt,
      scope: (scope || []).join ? scope.join(" ") : String(scope ?? ""),
    });

    const botSession = signSession({ bot_id: me.id, login: me.login });

    res.cookie("bot_id", botSession, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const tenant = db
      .prepare(`SELECT slug FROM tenants WHERE twitch_user_id = ?`)
      .get(tenantId);

    const frontendBase = (process.env.FRONTEND_BASE_URL || "").replace(
      /\/+$/,
      ""
    );
    const slug = tenant?.slug || me.login;
    
    return res.redirect(`${frontendBase}/${slug}/bot?bot=connected`);
  } catch (e) {
    const msg = e.response?.data?.message || e.message || "unknown";
    return res.status(400).send("Bot OAuth failed: " + msg);
  }
});
