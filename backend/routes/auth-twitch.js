import { Router } from "express";
import dotenv from "dotenv"
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });


export const TwitchRouter = Router();

TwitchRouter.get("/login", (req, res) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = "http://localhost:3000/auth/twitch/callback";
  const scope = "user:read:email";
  const state = Math.random().toString(36).slice(2);

  const twitchAuthUrl =
    `https://id.twitch.tv/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  res.redirect(twitchAuthUrl);
});

TwitchRouter.get("/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TWITCH_REDIRECT_URI,
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    console.log("Tokens recieved: ", { access_token, refresh_token });

    const userResponse = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });

    const user = userResponse.data.data[0];
    console.log("User info: ", user);

    res.json({ success: true, user });
  } catch (e) {
    console.error('Twitch OAuth error: ', error.response?.data || error.message)
  }
});
