"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByPhone = getUserByPhone;
exports.getEncryptedPhone = getEncryptedPhone;
exports.clearUserCache = clearUserCache;
// backend/utils/userCache.ts
const User_1 = __importDefault(require("../models/User"));
const cryptoUtils_1 = require("./cryptoUtils");
// Cache simples em memória (reinicia quando o servidor reinicia)
// Em produção considere Redis ou outro cache persistente/distribuído
const phoneCache = new Map();
async function getUserByPhone(plainPhone) {
    const cached = phoneCache.get(plainPhone);
    if (cached) {
        return cached;
    }
    const user = await User_1.default.findOne({}).lean(); // ajuste se tiver filtro melhor
    if (!user)
        return null;
    const decrypted = (0, cryptoUtils_1.decryptPassword)(user.phone);
    if (decrypted !== plainPhone) {
        return null; // não é esse usuário
    }
    // Se encontrou, cacheia
    const entry = { encrypted: user.phone, user };
    phoneCache.set(plainPhone, entry);
    return entry;
}
async function getEncryptedPhone(plainPhone) {
    const result = await getUserByPhone(plainPhone);
    return result ? result.encrypted : null;
}
function clearUserCache() {
    phoneCache.clear();
}
//# sourceMappingURL=userCache.js.map