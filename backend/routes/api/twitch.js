import { Router } from "express";
import axios from "axios";
import { requireAuth } from "../../middleware/requireAuth.js";
import { refreshTokenRow } from "../../lib/twitch-tokens.js";

export const TwitchRouter = Router();

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

TwitchRouter.get("/channel", requireAuth, async (req, res) => {
  const twitchUserID = req.user.sid;
  try {
    const token = await refreshTokenRow(
      twitchUserID,
      TWITCH_CLIENT_ID,
      TWITCH_CLIENT_SECRET,
      "twitch_tokens"
    );

    const response = await axios.get(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${encodeURIComponent(
        twitchUserID
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": TWITCH_CLIENT_ID,
        },
      }
    );

    const channel = response.data?.data[0];
    if (!channel) {
      return res
        .status(404)
        .json({ success: false, error: "Channel not found" });
    }
    console.log(channel);
    return res.json({ channel: channel });
  } catch (e) {
    return res.status(400).json({ success: false, error: e });
  }
});

TwitchRouter.get("/game-art", requireAuth, async (req, res) => {
  const twitchUserID = req.user.sid;
  const gameId = req.query.id;
  try {
    const token = await refreshTokenRow(
      twitchUserID,
      TWITCH_CLIENT_ID,
      TWITCH_CLIENT_SECRET,
      "twitch_tokens"
    );

    const response = await axios.get(
      `https://api.twitch.tv/helix/games?id=${gameId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": TWITCH_CLIENT_ID,
        },
      }
    );

    const game = response.data?.data?.[0];
    const boxArtUrl = game?.box_art_url
      ? game.box_art_url.replace("{width}", "144").replace("{height}", "192")
      : null;

    return res.json({ boxArtUrl });
  } catch (e) {
    return res.status(400).json({ success: false, error: e });
  }
});

TwitchRouter.get("/search/categories", requireAuth, async (req, res) => {
  const twitchUserID = req.user.sid;
  const query = req.query.category.toString().trim();
  if (!query) return res.json({ data: [] });

  try {
    const token = await refreshTokenRow(
      twitchUserID,
      TWITCH_CLIENT_ID,
      TWITCH_CLIENT_SECRET,
      "twitch_tokens"
    );

    const response = await axios.get(
      "https://api.twitch.tv/helix/search/categories",
      {
        params: { query, first: 10 },
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": TWITCH_CLIENT_ID,
        },
      }
    );

    const data = (response.data?.data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      boxArtUrl: (g.box_art_url || "")
        .replace("{width}", "52")
        .replace("{height}", "72"),
    }));

    return res.json({ data });
  } catch (e) {
    return res.status(400).json({ success: false, error: String(e) });
  }
});

TwitchRouter.post("/channel/update", requireAuth, async (req, res) => {
  const twitchUserID = req.user.sid;
  const { title, gameId } = req.body ?? {};
  try {
    const token = await refreshTokenRow(
      twitchUserID,
      TWITCH_CLIENT_ID,
      TWITCH_CLIENT_SECRET,
      "twitch_tokens"
    );

    const payload = {};
    if (title) payload.title = title;
    if (gameId) payload.game_id = gameId;

    await axios.patch("https://api.twitch.tv/helix/channels", payload, {
      params: { broadcaster_id: twitchUserID },
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": TWITCH_CLIENT_ID,
      },
    });

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});
