import { join, extname } from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { FastifyInstance } from "fastify";
import { saveUpload } from "./upload";
import { UploadPage } from "./views/upload";

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
};

export function registerRoutes(app: FastifyInstance) {
  app.after(() => {
    const auth = { onRequest: app.basicAuth };

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

    app.get("/i/:name", async (req, reply) => {
      const { name } = req.params as { name: string };

      // Prevent path traversal
      if (name.includes("/") || name.includes("\\") || name.includes("..")) {
        return reply.code(400).send("Invalid filename");
      }

      const filePath = join(UPLOADS_DIR, name);
      const ext = extname(name).toLowerCase();
      const contentType = MIME_TYPES[ext];

      if (!contentType) {
        return reply.code(404).send("Not found");
      }

      try {
        await stat(filePath);
      } catch {
        return reply.code(404).send("Not found");
      }

      reply.type(contentType);
      return reply.send(createReadStream(filePath));
    });
  });
}
