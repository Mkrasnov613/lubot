import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();

const JWT = process.env.JSON_WEB_TOKEN

export function signSession(payload) {
  return jwt.sign (payload, JWT, {expiresIn: "1Hr"})
}

export function verifySession(token) {
  return jwt.verify(token, JWT)
}