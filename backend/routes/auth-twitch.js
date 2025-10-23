import { Router } from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { signSession } from "../utils/session.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const TwitchRouter = Router();

TwitchRouter.get("/login", (req, res) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = process.env.TWITCH_REDIRECT_URI;
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
  const code = req.query.code;
  const state = req.query.state;

  if (!code || !state) {
    return res
      .status(400)
      .json({ success: false, error: "missing code/state" });
  }

  const savedState = req.cookies?.twitch_oauth_state;

  if (!savedState || savedState !== state) {
    return res
      .status(400)
      .json({
        success: false,
        error: "invalid CSRF state",
        state: savedState ?? "none",
      });
  }

  res.clearCookie("twitch_oauth_state");

  const body = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TWITCH_REDIRECT_URI,
  });

  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      body.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10_000,
      }
    );

    const { access_token, refresh_token, expires_in, token_type } =
      response.data;

    console.log("Tokens recieved: ", { access_token, refresh_token });

    const userResponse = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });

    const user = userResponse.data.data[0];
    console.log("User info: ", user);

    const session = signSession({ uid: user.id, login: user.login });

    res.cookie("sid", session, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect("http://localhost:3001/dashboard");
  } catch (error) {
    console.error(
      "Twitch OAuth error: ",
      error.response?.data || error.message
    );
  }
});
