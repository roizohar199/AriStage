import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function signToken(payload) {
  if (!payload?.id) {
    throw new Error("Missing payload for JWT sign");
  }

  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name || "",
      artist_role: payload.artist_role || null,
      avatar: payload.avatar || null,
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
