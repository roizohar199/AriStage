import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Preferred location in this repo: <server>/uploads
const serverUploadsRoot = path.resolve(__dirname, "..", "..", "..", "uploads");

// Legacy/fallback: current working directory's uploads
const cwdUploadsRoot = path.resolve(process.cwd(), "uploads");

export function getUploadsRoot(): string {
  if (fs.existsSync(serverUploadsRoot)) return serverUploadsRoot;
  if (fs.existsSync(cwdUploadsRoot)) return cwdUploadsRoot;
  return serverUploadsRoot;
}

export function joinUploadsPath(...sub: string[]): string {
  return path.join(getUploadsRoot(), ...sub);
}
