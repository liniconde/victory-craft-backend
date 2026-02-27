"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleOAuthService = exports.completeGoogleOAuth = exports.startGoogleOAuth = exports.OAuthFlowError = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../config/auth");
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const OAUTH_STATE_TTL_SECONDS = 60 * 10;
class OAuthFlowError extends Error {
    constructor(code, message, redirectUri, returnTo) {
        super(message || code);
        this.code = code;
        this.redirectUri = redirectUri;
        this.returnTo = returnTo;
    }
}
exports.OAuthFlowError = OAuthFlowError;
const getAllowedRedirectUris = () => (process.env.OAUTH_ALLOWED_REDIRECT_URIS || "")
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean);
const ensureRedirectUriAllowed = (redirectUri) => {
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
const createSignedState = (payload) => jsonwebtoken_1.default.sign(payload, (0, auth_1.getJwtSecret)(), { expiresIn: OAUTH_STATE_TTL_SECONDS });
const decodeStateUnsafe = (state) => {
    try {
        return jsonwebtoken_1.default.decode(state) || null;
    }
    catch (_error) {
        return null;
    }
};
const verifyState = (state) => {
    try {
        return jsonwebtoken_1.default.verify(state, (0, auth_1.getJwtSecret)());
    }
    catch (_error) {
        const decoded = decodeStateUnsafe(state);
        throw new OAuthFlowError("invalid_state", "State token is invalid or expired", decoded === null || decoded === void 0 ? void 0 : decoded.redirectUri, (decoded === null || decoded === void 0 ? void 0 : decoded.returnTo) || "/");
    }
};
const buildGoogleAuthUrl = (state) => {
    const params = new URLSearchParams({
        client_id: getGoogleClientId(),
        redirect_uri: getCallbackUrl(),
        response_type: "code",
        scope: "openid email profile",
        state,
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};
const exchangeCodeForTokens = (code) => __awaiter(void 0, void 0, void 0, function* () {
    const body = new URLSearchParams({
        code,
        client_id: getGoogleClientId(),
        client_secret: getGoogleClientSecret(),
        redirect_uri: getCallbackUrl(),
        grant_type: "authorization_code",
    });
    const response = yield fetch(GOOGLE_TOKEN_URL, {
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
});
const fetchGoogleProfile = (accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new OAuthFlowError("oauth_profile_failed", "Failed to fetch Google profile");
    }
    const profile = (yield response.json());
    if (!profile.email || !profile.sub) {
        throw new OAuthFlowError("oauth_profile_invalid", "Google profile is missing required fields");
    }
    return profile;
});
const parseName = (profile) => {
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
const buildUsernameBase = (email) => email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24) || "user";
const generateUniqueUsername = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const base = buildUsernameBase(email);
    let candidate = base;
    let suffix = 0;
    while (yield User_1.default.exists({ username: candidate })) {
        suffix += 1;
        candidate = `${base}${suffix}`;
    }
    return candidate;
});
const upsertOAuthUser = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield User_1.default.findOne({
        $or: [{ googleSub: profile.sub }, { email: profile.email }],
    });
    if (existingUser) {
        if (!existingUser.googleSub) {
            existingUser.googleSub = profile.sub;
        }
        if (profile.picture && existingUser.profileImage !== profile.picture) {
            existingUser.profileImage = profile.picture;
        }
        yield existingUser.save();
        return existingUser;
    }
    const { firstName, lastName } = parseName(profile);
    const username = yield generateUniqueUsername(profile.email);
    const password = yield bcrypt_1.default.hash(crypto_1.default.randomUUID(), 10);
    const newUser = yield User_1.default.create({
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
});
const startGoogleOAuth = (params) => {
    const redirectUri = params.redirectUri;
    const returnTo = params.returnTo || "/";
    ensureRedirectUriAllowed(redirectUri);
    const nonce = crypto_1.default.randomBytes(16).toString("hex");
    const state = createSignedState({ redirectUri, returnTo, nonce });
    return {
        authUrl: buildGoogleAuthUrl(state),
        nonce,
    };
};
exports.startGoogleOAuth = startGoogleOAuth;
const completeGoogleOAuth = (params) => __awaiter(void 0, void 0, void 0, function* () {
    if (!params.code || !params.state) {
        throw new OAuthFlowError("invalid_request", "Missing code or state");
    }
    const state = verifyState(params.state);
    ensureRedirectUriAllowed(state.redirectUri);
    if (!params.cookieNonce || params.cookieNonce !== state.nonce) {
        throw new OAuthFlowError("invalid_state", "OAuth state does not match", state.redirectUri, state.returnTo);
    }
    const tokenPayload = yield exchangeCodeForTokens(params.code);
    const accessToken = tokenPayload.access_token;
    if (!accessToken) {
        throw new OAuthFlowError("oauth_exchange_failed", "Google token response did not include access_token", state.redirectUri, state.returnTo);
    }
    const profile = yield fetchGoogleProfile(accessToken);
    const user = yield upsertOAuthUser(profile);
    const token = (0, auth_1.signAppToken)({
        id: user._id,
        email: user.email,
        role: user.role,
    });
    return {
        redirectUri: state.redirectUri,
        returnTo: state.returnTo,
        token,
    };
});
exports.completeGoogleOAuth = completeGoogleOAuth;
exports.googleOAuthService = {
    startGoogleOAuth: exports.startGoogleOAuth,
    completeGoogleOAuth: exports.completeGoogleOAuth,
};
//# sourceMappingURL=googleOAuthService.js.map