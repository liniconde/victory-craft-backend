require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const User = require("../src/models/User").default;
const { completeGoogleOAuth } = require("../src/services/googleOAuthService");

const originalEnv = {
  OAUTH_ALLOWED_REDIRECT_URIS: process.env.OAUTH_ALLOWED_REDIRECT_URIS,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_ADMIN_EMAILS: process.env.GOOGLE_ADMIN_EMAILS,
  JWT_SECRET: process.env.JWT_SECRET,
};

const createState = () =>
  jwt.sign(
    {
      redirectUri: "https://victory-craft-front.vercel.app/auth/callback",
      returnTo: "/videos/library",
      nonce: "nonce123",
    },
    process.env.JWT_SECRET,
    { expiresIn: 600 },
  );

const createFetchResponse = (payload) => ({
  ok: true,
  json: async () => payload,
});

test.afterEach(() => {
  process.env.OAUTH_ALLOWED_REDIRECT_URIS = originalEnv.OAUTH_ALLOWED_REDIRECT_URIS;
  process.env.GOOGLE_CALLBACK_URL = originalEnv.GOOGLE_CALLBACK_URL;
  process.env.GOOGLE_CLIENT_ID = originalEnv.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_SECRET = originalEnv.GOOGLE_CLIENT_SECRET;
  process.env.GOOGLE_ADMIN_EMAILS = originalEnv.GOOGLE_ADMIN_EMAILS;
  process.env.JWT_SECRET = originalEnv.JWT_SECRET;
});

test("completeGoogleOAuth emite role=admin en el JWT para emails allowlisted", async () => {
  const originalFindOne = User.findOne;
  const originalFetch = global.fetch;

  process.env.JWT_SECRET = "test-secret";
  process.env.OAUTH_ALLOWED_REDIRECT_URIS = "https://victory-craft-front.vercel.app/auth/callback";
  process.env.GOOGLE_CALLBACK_URL = "http://localhost:5001/users/oauth2/google/callback";
  process.env.GOOGLE_CLIENT_ID = "google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
  process.env.GOOGLE_ADMIN_EMAILS = "admin@example.com, scout@example.com";

  const existingUser = {
    _id: "67ed8f71cf3e27c5fe0ce245",
    email: "admin@example.com",
    role: "user",
    googleSub: "google-sub-1",
    profileImage: "https://example.com/avatar.png",
    save: async () => existingUser,
  };

  User.findOne = async () => existingUser;
  global.fetch = async (_url, options = {}) => {
    if (options.method === "POST") {
      return createFetchResponse({ access_token: "google-access-token" });
    }
    return createFetchResponse({
      sub: "google-sub-1",
      email: "admin@example.com",
      name: "Admin User",
      picture: "https://example.com/avatar.png",
    });
  };

  try {
    const result = await completeGoogleOAuth({
      code: "oauth-code",
      state: createState(),
      cookieNonce: "nonce123",
    });

    const payload = jwt.verify(result.token, process.env.JWT_SECRET);
    assert.equal(payload.role, "admin");
    assert.equal(existingUser.role, "user");
  } finally {
    User.findOne = originalFindOne;
    global.fetch = originalFetch;
  }
});

test("completeGoogleOAuth mantiene role=user en el JWT para emails fuera de allowlist", async () => {
  const originalFindOne = User.findOne;
  const originalFetch = global.fetch;

  process.env.JWT_SECRET = "test-secret";
  process.env.OAUTH_ALLOWED_REDIRECT_URIS = "https://victory-craft-front.vercel.app/auth/callback";
  process.env.GOOGLE_CALLBACK_URL = "http://localhost:5001/users/oauth2/google/callback";
  process.env.GOOGLE_CLIENT_ID = "google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
  process.env.GOOGLE_ADMIN_EMAILS = "admin@example.com";

  const existingUser = {
    _id: "67ed8f71cf3e27c5fe0ce245",
    email: "viewer@example.com",
    role: "user",
    googleSub: "google-sub-2",
    profileImage: "https://example.com/avatar.png",
    save: async () => existingUser,
  };

  User.findOne = async () => existingUser;
  global.fetch = async (_url, options = {}) => {
    if (options.method === "POST") {
      return createFetchResponse({ access_token: "google-access-token" });
    }
    return createFetchResponse({
      sub: "google-sub-2",
      email: "viewer@example.com",
      name: "Viewer User",
      picture: "https://example.com/avatar.png",
    });
  };

  try {
    const result = await completeGoogleOAuth({
      code: "oauth-code",
      state: createState(),
      cookieNonce: "nonce123",
    });

    const payload = jwt.verify(result.token, process.env.JWT_SECRET);
    assert.equal(payload.role, "user");
  } finally {
    User.findOne = originalFindOne;
    global.fetch = originalFetch;
  }
});
