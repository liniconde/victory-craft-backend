import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { getJwtSecret, signAppToken } from "../config/auth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const OAUTH_STATE_TTL_SECONDS = 60 * 10;

export class OAuthFlowError extends Error {
  code: string;
  redirectUri?: string;
  returnTo?: string;

  constructor(code: string, message?: string, redirectUri?: string, returnTo?: string) {
    super(message || code);
    this.code = code;
    this.redirectUri = redirectUri;
    this.returnTo = returnTo;
  }
}

type OAuthStatePayload = {
  redirectUri: string;
  returnTo: string;
  nonce: string;
};

type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
};

const getAllowedRedirectUris = () =>
  (process.env.OAUTH_ALLOWED_REDIRECT_URIS || "")
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean);

const ensureRedirectUriAllowed = (redirectUri: string) => {
  const allowed = getAllowedRedirectUris();
  if (!allowed.includes(redirectUri)) {
    throw new OAuthFlowError("invalid_redirect_uri", "redirect_uri is not allowed");
  }
};

const getCallbackUrl = () => {
  const callback = process.env.GOOGLE_CALLBACK_URL;
  if (!callback) {
    throw new OAuthFlowError("oauth_config_error", "GOOGLE_CALLBACK_URL is not configured");
  }
  return callback;
};

const getGoogleClientId = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new OAuthFlowError("oauth_config_error", "GOOGLE_CLIENT_ID is not configured");
  }
  return clientId;
};

const getGoogleClientSecret = () => {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new OAuthFlowError("oauth_config_error", "GOOGLE_CLIENT_SECRET is not configured");
  }
  return clientSecret;
};

const createSignedState = (payload: OAuthStatePayload) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: OAUTH_STATE_TTL_SECONDS });

const decodeStateUnsafe = (state: string): Partial<OAuthStatePayload> | null => {
  try {
    return (jwt.decode(state) as Partial<OAuthStatePayload>) || null;
  } catch (_error) {
    return null;
  }
};

const verifyState = (state: string): OAuthStatePayload => {
  try {
    return jwt.verify(state, getJwtSecret()) as OAuthStatePayload;
  } catch (_error) {
    const decoded = decodeStateUnsafe(state);
    throw new OAuthFlowError(
      "invalid_state",
      "State token is invalid or expired",
      decoded?.redirectUri,
      decoded?.returnTo || "/",
    );
  }
};

const buildGoogleAuthUrl = (state: string) => {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getCallbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

const exchangeCodeForTokens = async (code: string) => {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getCallbackUrl(),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new OAuthFlowError("oauth_exchange_failed", "Failed to exchange OAuth code");
  }

  return response.json();
};

const fetchGoogleProfile = async (accessToken: string): Promise<GoogleProfile> => {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new OAuthFlowError("oauth_profile_failed", "Failed to fetch Google profile");
  }

  const profile = (await response.json()) as GoogleProfile;
  if (!profile.email || !profile.sub) {
    throw new OAuthFlowError("oauth_profile_invalid", "Google profile is missing required fields");
  }

  return profile;
};

const parseName = (profile: GoogleProfile) => {
  if (profile.given_name || profile.family_name) {
    return {
      firstName: profile.given_name || "Google",
      lastName: profile.family_name || "User",
    };
  }

  if (profile.name) {
    const parts = profile.name.trim().split(" ");
    return {
      firstName: parts[0] || "Google",
      lastName: parts.slice(1).join(" ") || "User",
    };
  }

  return { firstName: "Google", lastName: "User" };
};

const buildUsernameBase = (email: string) =>
  email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24) || "user";

const generateUniqueUsername = async (email: string) => {
  const base = buildUsernameBase(email);
  let candidate = base;
  let suffix = 0;

  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }

  return candidate;
};

const upsertOAuthUser = async (profile: GoogleProfile) => {
  const existingUser = await User.findOne({
    $or: [{ googleSub: profile.sub }, { email: profile.email }],
  });

  if (existingUser) {
    if (!existingUser.googleSub) {
      existingUser.googleSub = profile.sub;
    }
    if (profile.picture && existingUser.profileImage !== profile.picture) {
      existingUser.profileImage = profile.picture;
    }
    await existingUser.save();
    return existingUser;
  }

  const { firstName, lastName } = parseName(profile);
  const username = await generateUniqueUsername(profile.email);
  const password = await bcrypt.hash(crypto.randomUUID(), 10);

  const newUser = await User.create({
    username,
    email: profile.email,
    googleSub: profile.sub,
    password,
    firstName,
    lastName,
    profileImage: profile.picture,
    role: "user",
  });

  return newUser;
};

export const startGoogleOAuth = (params: {
  redirectUri: string;
  returnTo?: string;
}) => {
  const redirectUri = params.redirectUri;
  const returnTo = params.returnTo || "/";

  ensureRedirectUriAllowed(redirectUri);
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = createSignedState({ redirectUri, returnTo, nonce });

  return {
    authUrl: buildGoogleAuthUrl(state),
    nonce,
  };
};

export const completeGoogleOAuth = async (params: {
  code: string;
  state: string;
  cookieNonce?: string;
}) => {
  if (!params.code || !params.state) {
    throw new OAuthFlowError("invalid_request", "Missing code or state");
  }

  const state = verifyState(params.state);
  ensureRedirectUriAllowed(state.redirectUri);

  if (!params.cookieNonce || params.cookieNonce !== state.nonce) {
    throw new OAuthFlowError(
      "invalid_state",
      "OAuth state does not match",
      state.redirectUri,
      state.returnTo,
    );
  }

  const tokenPayload = await exchangeCodeForTokens(params.code);
  const accessToken = tokenPayload.access_token as string;
  if (!accessToken) {
    throw new OAuthFlowError(
      "oauth_exchange_failed",
      "Google token response did not include access_token",
      state.redirectUri,
      state.returnTo,
    );
  }

  const profile = await fetchGoogleProfile(accessToken);
  const user = await upsertOAuthUser(profile);
  const token = signAppToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  return {
    redirectUri: state.redirectUri,
    returnTo: state.returnTo,
    token,
  };
};

export const googleOAuthService = {
  startGoogleOAuth,
  completeGoogleOAuth,
};
