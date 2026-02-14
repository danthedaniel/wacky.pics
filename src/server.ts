import { join } from "node:path";
import fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifyBasicAuth from "@fastify/basic-auth";
import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyHtml from "@kitajs/fastify-html-plugin";
import config from "./config";
import { registerRoutes } from "./routes";

const AUTH_COOKIE = "auth";
const AUTH_COOKIE_MAX_AGE = 180 * 24 * 60 * 60;

const app = fastify({ logger: true });

await app.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      mediaSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

await app.register(fastifyRateLimit, {
  global: false,
});

await app.register(fastifyHtml);

await app.register(fastifyMultipart, {
  limits: { fileSize: 20 * 1024 * 1024 },
});

await app.register(fastifyStatic, {
  root: join(import.meta.dirname, "assets"),
  prefix: "/assets/",
});

await app.register(fastifyCookie);

function checkUserPass(username: string, password: string) {
  const usernameOk =
    username.length === config.authUser.length &&
    crypto.timingSafeEqual(Buffer.from(username), Buffer.from(config.authUser));
  const passwordOk =
    password.length === config.authPass.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(config.authPass));
  if (!usernameOk || !passwordOk) {
    return false;
  }

  return true;
}

await app.register(fastifyBasicAuth, {
  validate(username, password, _req, _reply, done) {
    if (!checkUserPass(username, password)) {
      done(new Error("Invalid credentials"));
      return;
    }

    done();
  },
  authenticate: { realm: config.siteName },
});

function cookieAuth(cookie: string) {
  const sep = cookie.indexOf(":");
  if (sep <= 0) {
    return false;
  }

  const username = cookie.slice(0, sep);
  const password = cookie.slice(sep + 1);
  if (!checkUserPass(username, password)) {
    return false;
  }

  return true;
}

async function basicAuth(req: FastifyRequest, reply: FastifyReply) {
  return await new Promise<void>((resolve, reject) => {
    app.basicAuth(req, reply, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

async function checkAuth(req: FastifyRequest, reply: FastifyReply) {
  const cookie = req.cookies[AUTH_COOKIE] ?? "";
  if (!cookieAuth(cookie)) {
    await basicAuth(req, reply);
  }

  reply.setCookie(AUTH_COOKIE, `${config.authUser}:${config.authPass}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });
}

registerRoutes(app, checkAuth);

app.listen({ port: Number(process.env["PORT"] ?? 3000), host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
