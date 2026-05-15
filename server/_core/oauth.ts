import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/app-auth", async (req: Request, res: Response) => {
  const redirectUri = getQueryParam(req, "redirectUri");
  const state = getQueryParam(req, "state");

  if (!redirectUri || !state) {
    res.status(400).json({
      error: "redirectUri and state are required",
    });
    return;
  }

   const sessionToken = await sdk.createSessionToken("local-user", {
    name: "Local User",
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);

  res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });

  // redireciona para callback
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", "local-auth");
  callbackUrl.searchParams.set("state", state);

  res.redirect(callbackUrl.toString());
});
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    if (!code || !state) {
  res.status(400).json({ error: "code and state are required" });
  return;
}

if (code === "local-auth") {
  const sessionToken = await sdk.createSessionToken("local-user", {
    name: "Local User",
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);

  res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });

  await db.upsertUser({
    openId: "local-user",
    name: "Local User",
    email: "local@example.com",
    loginMethod: "local",
    lastSignedIn: new Date(),
  });

  res.redirect(302, "/");
  return;
}

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
