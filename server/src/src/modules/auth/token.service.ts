import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  full_name: string;
  artist_role?: string | null;
  avatar?: string | null;
}

export function signToken(payload: TokenPayload) {
  if (!payload?.id) {
    throw new Error("Missing payload for JWT sign");
  }

  // `jsonwebtoken` types expect a stricter time string format than `string`.
  // We keep env-config as a string and cast here to satisfy the library types.
  const expiresIn =
    env.jwtAccessExpiresIn as unknown as SignOptions["expiresIn"];

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
    { expiresIn },
  );
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
  return decoded;
}
