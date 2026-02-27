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
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleOAuthCallbackController = exports.startGoogleOAuthController = void 0;
const googleOAuthService_1 = require("../services/googleOAuthService");
const OAUTH_NONCE_COOKIE = "oauth_state_nonce";
const parseCookies = (cookieHeader) => {
    if (!cookieHeader)
        return {};
    return cookieHeader.split(";").reduce((acc, chunk) => {
        const [rawKey, ...rawValue] = chunk.trim().split("=");
        if (!rawKey)
            return acc;
        acc[rawKey] = decodeURIComponent(rawValue.join("="));
        return acc;
    }, {});
};
const appendQuery = (baseUrl, params) => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
};
const clearOAuthCookie = (res) => {
    res.clearCookie(OAUTH_NONCE_COOKIE, {
        path: "/users/oauth2/google/callback",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
};
const startGoogleOAuthController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const redirectUri = req.query.redirect_uri;
        const returnTo = req.query.return_to || "/";
        const { authUrl, nonce } = googleOAuthService_1.googleOAuthService.startGoogleOAuth({
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
    }
    catch (error) {
        const code = error instanceof googleOAuthService_1.OAuthFlowError ? error.code : "oauth_start_failed";
        res.status(400).json({ error: code });
    }
});
exports.startGoogleOAuthController = startGoogleOAuthController;
const googleOAuthCallbackController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const code = req.query.code;
        const state = req.query.state;
        const cookies = parseCookies(req.headers.cookie);
        const nonce = cookies[OAUTH_NONCE_COOKIE];
        const result = yield googleOAuthService_1.googleOAuthService.completeGoogleOAuth({
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
    }
    catch (error) {
        clearOAuthCookie(res);
        if (error instanceof googleOAuthService_1.OAuthFlowError && error.redirectUri) {
            const redirectUrl = appendQuery(error.redirectUri, {
                error: error.code,
            });
            res.redirect(redirectUrl);
            return;
        }
        const code = error instanceof googleOAuthService_1.OAuthFlowError ? error.code : "oauth_callback_failed";
        res.status(400).json({ error: code });
    }
});
exports.googleOAuthCallbackController = googleOAuthCallbackController;
//# sourceMappingURL=oauthController.js.map