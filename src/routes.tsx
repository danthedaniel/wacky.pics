import { join, extname } from "node:path";
import { createReadStream } from "node:fs";
import { stat, utimes } from "node:fs/promises";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { saveUpload } from "./upload";
import { UploadPage } from "./views/upload";

type Hook = (req: FastifyRequest, reply: FastifyReply) => Promise<void>;

const UPLOADS_DIR = join(import.meta.dirname, "..", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

export function registerRoutes(app: FastifyInstance, checkAuth: Hook) {
  app.after(() => {
    const auth = { onRequest: checkAuth };

    app.get("/", { ...auth }, async (_req, reply) => {
      return reply.html(<UploadPage />);
    });

    app.post("/upload", { ...auth }, async (req, reply) => {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({ error: "No file provided" });
      }

      const ext = extname(file.filename).toLowerCase();
      if (!MIME_TYPES[ext]) {
        return reply.code(400).send({ error: "Unsupported file type" });
      }

      const name = await saveUpload(file, ext);
      return { url: `/i/${name}` };
    });

    app.get("/i/:name", {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: "1 minute",
        },
      },
    }, async (req, reply) => {
      const { name } = req.params as { name: string };

      if (!/^[a-z0-9]{1,255}\.[a-z]{1,5}$/.test(name)) {
        return reply.code(400).send("Invalid filename");
      }

      const filePath = join(UPLOADS_DIR, name);
      const ext = extname(name).toLowerCase();
      const contentType = MIME_TYPES[ext];
      if (!contentType) {
        return reply.code(404).send("Not found");
      }

      let size: number;
      try {
        size = (await stat(filePath)).size;
      } catch {
        return reply.code(404).send("Not found");
      }

      // Touch the file so we can track its access time
      const now = new Date();
      await utimes(filePath, now, now);

      reply.header("content-type", contentType);
      reply.header("content-length", size);
      reply.header("content-disposition", "inline");
      reply.header("cache-control", `public, max-age=${60 * 60 * 24 * 365}, immutable`);
      return reply.send(createReadStream(filePath));
    });
  });
}
