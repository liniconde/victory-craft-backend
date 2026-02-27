import { Request, Response } from "express";
import { googleOAuthService, OAuthFlowError } from "../services/googleOAuthService";

const OAUTH_NONCE_COOKIE = "oauth_state_nonce";

const parseCookies = (cookieHeader?: string) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, chunk) => {
    const [rawKey, ...rawValue] = chunk.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
};

const appendQuery = (baseUrl: string, params: Record<string, string>) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const clearOAuthCookie = (res: Response) => {
  res.clearCookie(OAUTH_NONCE_COOKIE, {
    path: "/users/oauth2/google/callback",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const startGoogleOAuthController = async (req: Request, res: Response) => {
  try {
    const redirectUri = req.query.redirect_uri as string;
    const returnTo = (req.query.return_to as string) || "/";

    const { authUrl, nonce } = googleOAuthService.startGoogleOAuth({
      redirectUri,
      returnTo,
    });

    res.cookie(OAUTH_NONCE_COOKIE, nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
      path: "/users/oauth2/google/callback",
    });

    res.redirect(authUrl);
  } catch (error: any) {
    const code = error instanceof OAuthFlowError ? error.code : "oauth_start_failed";
    res.status(400).json({ error: code });
  }
};

export const googleOAuthCallbackController = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const cookies = parseCookies(req.headers.cookie);
    const nonce = cookies[OAUTH_NONCE_COOKIE];

    const result = await googleOAuthService.completeGoogleOAuth({
      code,
      state,
      cookieNonce: nonce,
    });

    clearOAuthCookie(res);
    const redirectUrl = appendQuery(result.redirectUri, {
      token: result.token,
      return_to: result.returnTo,
    });
    res.redirect(redirectUrl);
  } catch (error: any) {
    clearOAuthCookie(res);
    if (error instanceof OAuthFlowError && error.redirectUri) {
      const redirectUrl = appendQuery(error.redirectUri, {
        error: error.code,
      });
      res.redirect(redirectUrl);
      return;
    }

    const code = error instanceof OAuthFlowError ? error.code : "oauth_callback_failed";
    res.status(400).json({ error: code });
  }
};
