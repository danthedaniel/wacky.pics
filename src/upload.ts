import { join } from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { MultipartFile } from "@fastify/multipart";
import { randomId } from "./random";

const UPLOADS_DIR = join(import.meta.dirname, "..", "uploads");

export async function saveUpload(file: MultipartFile, ext: string): Promise<string> {
  const name = randomId() + ext;
  const dest = join(UPLOADS_DIR, name);
  await pipeline(file.file, createWriteStream(dest));
  return name;
}
