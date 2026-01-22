"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptPhone = encryptPhone;
exports.decryptPassword = decryptPassword;
// backend/utils/cryptoUtils.ts
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}
const IV_LENGTH = 16;
/**
 * Criptografa um número de telefone (ou qualquer string) usando AES-256-CBC
 * Retorna no formato: iv:encrypted (hex)
 */
function encryptPhone(text) {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}
/**
 * Descriptografa o valor criptografado no formato iv:encrypted
 */
function decryptPassword(encrypted) {
    const [ivHex, encryptedText] = encrypted.split(':');
    if (!ivHex || !encryptedText) {
        throw new Error('Formato de dado criptografado inválido');
    }
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
//# sourceMappingURL=cryptoUtils.js.map