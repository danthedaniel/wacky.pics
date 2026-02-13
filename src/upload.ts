import type { MultipartFile } from "@fastify/multipart";
import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomId(length = 8): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[(bytes[i] ?? 0) % ALPHABET.length];
  }
  return result;
}


const UPLOADS_DIR = join(import.meta.dirname, "..", "uploads");
const STRIP_EXIF_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

async function uniqueName(ext: string): Promise<{ name: string; dest: string }> {
  for (let i = 0; i < 10; i++) {
    const name = randomId() + ext;
    const dest = join(UPLOADS_DIR, name);

    try {
      await access(dest);
    } catch {
      // File doesn't exist, use this name
      return { name, dest };
    }
  }

  throw new Error("Failed to generate a unique filename");
}

export async function saveUpload(file: MultipartFile, ext: string): Promise<string> {
  const { name, dest } = await uniqueName(ext);

  if (STRIP_EXIF_EXTS.has(ext)) {
    const buf = await file.toBuffer();
    await sharp(buf).rotate().toFile(dest);
  } else {
    await pipeline(file.file, createWriteStream(dest));
  }

  return name;
}
