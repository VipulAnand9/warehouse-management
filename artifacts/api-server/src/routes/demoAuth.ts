import { createHmac, scrypt, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  DemoAuthLoginBody,
  DemoAuthLoginResponse,
  GetDemoSessionResponse,
} from "@workspace/api-zod";
import { demoAccounts, type DemoAccount } from "../lib/demoAccounts";

const router: IRouter = Router();
const COOKIE_NAME = "shelfwise_demo_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const HASH_BYTES = 64;

interface SessionPayload {
  email: string;
  expiresAt: number;
}

function sessionSecret(): string | null {
  return process.env.SESSION_SECRET || null;
}

function findAccount(email: string): DemoAccount | undefined {
  return demoAccounts.find((account) => account.email === email);
}

function verifyPassword(password: string, account: DemoAccount): Promise<boolean> {
  return new Promise((resolve, reject) => {
    scrypt(password, account.salt, HASH_BYTES, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      const expected = Buffer.from(account.passwordHash, "hex");
      resolve(
        expected.length === derivedKey.length &&
          timingSafeEqual(expected, derivedKey),
      );
    });
  });
}

function signPayload(payload: SessionPayload, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function getSessionToken(req: Request): string | null {
  const cookie = req
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
}

function readPayload(req: Request, secret: string): SessionPayload | null {
  const token = getSessionToken(req);
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const encodedPayload = token.slice(0, separator);
  const receivedSignature = Buffer.from(token.slice(separator + 1), "base64url");
  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (
      !payload ||
      typeof payload !== "object" ||
      !("email" in payload) ||
      typeof payload.email !== "string" ||
      !("expiresAt" in payload) ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return { email: payload.email, expiresAt: payload.expiresAt };
  } catch {
    return null;
  }
}

function setSessionCookie(res: Response, token: string, maxAge: number): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/api/demo-auth; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`,
  );
}

function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/api/demo-auth; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  );
}

function sessionResponse(account: DemoAccount, expiresAt: number) {
  return {
    user: {
      email: account.email,
      name: account.name,
      role: account.role,
    },
    expiresAt: new Date(expiresAt * 1000),
  };
}

router.post("/login", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const parsed = DemoAuthLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password." });
    return;
  }

  const secret = sessionSecret();
  if (!secret) {
    req.log.error("SESSION_SECRET is not configured");
    res.status(503).json({ error: "Demo sign-in is temporarily unavailable." });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const account = findAccount(email);
  const matches = account
    ? await verifyPassword(parsed.data.password, account)
    : false;
  if (!account || !matches) {
    req.log.warn("Demo login rejected");
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  setSessionCookie(
    res,
    signPayload({ email: account.email, expiresAt }, secret),
    SESSION_TTL_SECONDS,
  );
  res.json(DemoAuthLoginResponse.parse(sessionResponse(account, expiresAt)));
});

router.get("/session", (req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  const secret = sessionSecret();
  if (!secret) {
    res.status(503).json({ error: "Demo sign-in is temporarily unavailable." });
    return;
  }

  const payload = readPayload(req, secret);
  const account = payload ? findAccount(payload.email) : undefined;
  if (!payload || !account) {
    clearSessionCookie(res);
    res.json(GetDemoSessionResponse.parse({ user: null, expiresAt: null }));
    return;
  }

  res.json(GetDemoSessionResponse.parse(sessionResponse(account, payload.expiresAt)));
});

router.post("/logout", (_req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  clearSessionCookie(res);
  res.status(204).end();
});

export default router;
