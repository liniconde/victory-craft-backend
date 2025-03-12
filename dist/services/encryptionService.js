"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptText = void 0;
const crypto_1 = require("crypto");
/**
 * Encripta un texto utilizando AES-256-CBC.
 * @param text - Texto a encriptar.
 * @param encryptionKey - Clave de encriptación en formato hexadecimal (debe ser de 32 bytes).
 * @returns Texto encriptado en formato `IV:EncryptedData`.
 */
const encryptText = (text, encryptionKey) => {
    if (encryptionKey.length !== 64) {
        throw new Error("Encryption key must be a 32-byte (64 hex characters) string.");
    }
    const iv = (0, crypto_1.randomBytes)(16); // Genera un vector de inicialización de 16 bytes
    const keyBuffer = Buffer.from(encryptionKey, "hex"); // Convierte la clave de encriptación a Buffer
    const cipher = (0, crypto_1.createCipheriv)("aes-256-cbc", keyBuffer, iv);
    let encrypted = cipher.update(text, "utf-8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
};
exports.encryptText = encryptText;
//# sourceMappingURL=encryptionService.js.map