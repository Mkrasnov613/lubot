import { Router } from "express";
import axios from "axios";
import { requireAuth } from "../../middleware/requireAuth.js";
import { refreshTokenRow } from "../../lib/twitchTokens.js";
import { chunk } from "../../utils/chunk.js";

export const TwitchRouter = Router();

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

TwitchRouter.get("/channel", requireAuth, async (req, res) => {
  const twitchUserID = req.user.sid;
  try {
    const token = await refreshTokenRow(
      twitchUserID,
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
      TWITCH_CLIENT_SECRET
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

    return res.json({ ok: true });
  } catch (e) {
    return res
      .status(400)
      .json({ ok: false, message: e?.response?.data?.message || String(e) });
  }
});



TwitchRouter.get("/followers", requireAuth, async (req, res) => {
  try {
    const twitchUserID = req.user.sid;
    const targetUserId = req.query?.follower;

    const token = await refreshTokenRow(
      twitchUserID,
      "twitch_tokens"
    );

    const twitch = axios.create({
      baseURL: "https://api.twitch.tv/helix",
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": TWITCH_CLIENT_ID,
      },
    });

    // 1. Avatar lookup for a single user
    
    if (targetUserId) {
      const usersRes = await twitch.get("/users", {
        params: { id: targetUserId },
      });

      const user = usersRes.data?.data?.[0];
      return res.json({ profile_image_url: user?.profile_image_url ?? "" });
    }

    // 2. Fetch followers + subs in parallel

    const [followersResult, subsResult] = await Promise.allSettled([
      twitch.get("/channels/followers", {
        params: { broadcaster_id: twitchUserID, first: 25 },
      }),
      twitch.get("/subscriptions", {
        params: { broadcaster_id: twitchUserID, first: 25 },
      }),
    ]);
    
    const followersRaw =
      followersResult.status === "fulfilled"
        ? followersResult.value.data?.data ?? []
        : [];

    const followersTotal =
      followersResult.status === "fulfilled"
        ? followersResult.value.data?.total ?? 0
        : 0;

    const cursor =
      followersResult.status === "fulfilled"
        ? followersResult.value.data?.pagination?.cursor ?? null
        : null;

    const subsRaw =
      subsResult.status === "fulfilled"
        ? subsResult.value.data?.data ?? []
        : [];

    // 3. Batch user profile lookup
    const userIds = new Set();

    for (const f of followersRaw) userIds.add(f.user_id);
    for (const s of subsRaw) userIds.add(s.user_id);

    const profileMap = new Map();

    const ids = Array.from(userIds);
    if (ids.length) {
      for (const part of chunk(ids, 100)) {
        const usersRes = await twitch.get("/users", {
          params: { id: part },
        });

        for (const u of usersRes.data?.data ?? []) {
          profileMap.set(u.id, {
            display_name: u.display_name || u.login,
            profile_image_url: u.profile_image_url || "",
          });
        }
      }
    }

    
    // 4. Normalize followers → ActivityItem
        const followersActivity = followersRaw.map((f) => {
      const profile = profileMap.get(f.user_id) || {};
      return {
        id: `follow:${f.user_id}:${f.followed_at}`,
        user_id: f.user_id,
        user_name: profile.display_name || f.user_name,
        profile_image_url: profile.profile_image_url || "",
        type: "follow",
        occurred_at: f.followed_at, 
      };
    });

    // 5. Normalize subs → ActivityItem
    
    const nowIso = new Date().toISOString();

    const subsActivity = subsRaw.map((s) => {
      const profile = profileMap.get(s.user_id) || {};
      return {
        id: `sub:${s.user_id}:${s.tier}:${s.is_gift ? "gift" : "paid"}`,
        user_id: s.user_id,
        user_name: profile.display_name || s.user_name,
        profile_image_url: profile.profile_image_url || "",
        type: "sub",
        occurred_at: nowIso,
        tier: s.tier,
        is_gift: s.is_gift,
      };
    });

    // 6. Merge + sort (desc by occurred_at)

    const activity = [...followersActivity, ...subsActivity]
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() -
          new Date(a.occurred_at).getTime()
      )
      .slice(0, 50);

    return res.json({
      activity,
      followersTotal,
      cursor,
    });
  } catch (error) {
    console.error(
      "[twitch] followers_or_subscribers_fetch_error:",
      error?.response?.data || String(error)
    );

    return res.status(500).json({
      error: "followers_or_subscribers_fetch_error",
      details: error?.response?.data || String(error),
    });
  }
});
