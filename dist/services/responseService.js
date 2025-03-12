"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStringifyResponse = exports.getProcessedResponse = void 0;
/**
 * Procesa la respuesta y agrega los encabezados CORS adecuados.
 * @param params - Parámetros de la respuesta.
 * @param allowCredentials - Si se deben permitir credenciales en la respuesta.
 * @returns Objeto de respuesta con los encabezados CORS configurados.
 */
const getProcessedResponse = (params, allowCredentials = false) => {
    return Object.assign(Object.assign({}, params), { headers: Object.assign(Object.assign(Object.assign({}, (allowCredentials
            ? { "Access-Control-Allow-Credentials": "true" }
            : {})), { "Access-Control-Allow-Headers": "Content-Type,Authorization", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "OPTIONS,POST,GET" }), params.headers) });
};
exports.getProcessedResponse = getProcessedResponse;
/**
 * Convierte el `body` de la respuesta en JSON.
 * @param params - Parámetros de la respuesta.
 * @param allowCredentials - Si se deben permitir credenciales en la respuesta.
 * @returns Objeto de respuesta con el `body` en formato JSON.
 */
const getStringifyResponse = (params, allowCredentials = false) => {
    var _a;
    return Object.assign(Object.assign({}, (0, exports.getProcessedResponse)(params, allowCredentials)), { body: JSON.stringify((_a = params.body) !== null && _a !== void 0 ? _a : {}) });
};
exports.getStringifyResponse = getStringifyResponse;
//# sourceMappingURL=responseService.js.map