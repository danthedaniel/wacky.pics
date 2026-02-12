import { join } from "node:path";
import fastify from "fastify";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifyBasicAuth from "@fastify/basic-auth";
import fastifyHtml from "@kitajs/fastify-html-plugin";
import { registerRoutes } from "./routes";

const USERNAME = process.env["AUTH_USER"] ?? "admin";
const PASSWORD = process.env["AUTH_PASS"] ?? "admin";

const app = fastify({ logger: true });

await app.register(fastifyHtml);

await app.register(fastifyMultipart, {
  limits: { fileSize: 20 * 1024 * 1024 },
});

await app.register(fastifyStatic, {
  root: join(import.meta.dirname, "assets"),
  prefix: "/assets/",
});

await app.register(fastifyBasicAuth, {
  validate(username, password, _req, _reply, done) {
    const usernameOk =
      username.length === USERNAME.length &&
      crypto.timingSafeEqual(Buffer.from(username), Buffer.from(USERNAME));
    const passwordOk =
      password.length === PASSWORD.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(PASSWORD));
    if (usernameOk && passwordOk) {
      done();
    } else {
      done(new Error("Invalid credentials"));
    }
  },
  authenticate: { realm: "wacky.pics" },
});

registerRoutes(app);

app.listen({ port: Number(process.env["PORT"] ?? 3000), host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
