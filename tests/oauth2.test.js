require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  startGoogleOAuthController,
  googleOAuthCallbackController,
} = require("../src/controllers/oauthController");
const {
  googleOAuthService,
  OAuthFlowError,
} = require("../src/services/googleOAuthService");

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    redirectUrl: "",
    cookies: [],
    clearedCookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    redirect(url) {
      this.redirectUrl = url;
      this.statusCode = 302;
      return this;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookies.push({ name, options });
      return this;
    },
  };

  return res;
};

test("inicio OAuth redirige a Google y setea cookie de estado", async () => {
  const originalStart = googleOAuthService.startGoogleOAuth;
  googleOAuthService.startGoogleOAuth = () => ({
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=abc",
    nonce: "nonce123",
  });

  const req = {
    query: {
      redirect_uri: "https://victory-craft-front.vercel.app/auth/callback",
      return_to: "/fields/videos",
    },
  };
  const res = createMockRes();

  try {
    await startGoogleOAuthController(req, res);

    assert.equal(res.statusCode, 302);
    assert.equal(res.redirectUrl, "https://accounts.google.com/o/oauth2/v2/auth?state=abc");
    assert.equal(res.cookies.length, 1);
    assert.equal(res.cookies[0].name, "oauth_state_nonce");
    assert.equal(res.cookies[0].value, "nonce123");
  } finally {
    googleOAuthService.startGoogleOAuth = originalStart;
  }
});

test("callback OAuth exitoso redirige al frontend con token interno", async () => {
  const originalComplete = googleOAuthService.completeGoogleOAuth;
  googleOAuthService.completeGoogleOAuth = async () => ({
    redirectUri: "https://victory-craft-front.vercel.app/auth/callback",
    returnTo: "/fields/videos",
    token: "jwt-app-token",
  });

  const req = {
    query: { code: "ok", state: "state123" },
    headers: { cookie: "oauth_state_nonce=nonce123" },
  };
  const res = createMockRes();

  try {
    await googleOAuthCallbackController(req, res);

    assert.equal(res.statusCode, 302);
    assert.equal(
      res.redirectUrl,
      "https://victory-craft-front.vercel.app/auth/callback?token=jwt-app-token&return_to=%2Ffields%2Fvideos",
    );
  } finally {
    googleOAuthService.completeGoogleOAuth = originalComplete;
  }
});

test("callback OAuth con state invalido redirige con error", async () => {
  const originalComplete = googleOAuthService.completeGoogleOAuth;
  googleOAuthService.completeGoogleOAuth = async () => {
    throw new OAuthFlowError(
      "invalid_state",
      "State inválido",
      "https://victory-craft-front.vercel.app/auth/callback",
      "/",
    );
  };

  const req = {
    query: { code: "ok", state: "bad" },
    headers: { cookie: "oauth_state_nonce=nonce123" },
  };
  const res = createMockRes();

  try {
    await googleOAuthCallbackController(req, res);

    assert.equal(res.statusCode, 302);
    assert.equal(
      res.redirectUrl,
      "https://victory-craft-front.vercel.app/auth/callback?error=invalid_state",
    );
  } finally {
    googleOAuthService.completeGoogleOAuth = originalComplete;
  }
});

test("inicio OAuth con redirect_uri no permitido responde 400", async () => {
  const originalStart = googleOAuthService.startGoogleOAuth;
  googleOAuthService.startGoogleOAuth = () => {
    throw new OAuthFlowError("invalid_redirect_uri");
  };

  const req = {
    query: {
      redirect_uri: "https://evil.example.com/auth/callback",
    },
  };
  const res = createMockRes();

  try {
    await startGoogleOAuthController(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, "invalid_redirect_uri");
  } finally {
    googleOAuthService.startGoogleOAuth = originalStart;
  }
});
