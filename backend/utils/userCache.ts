// backend/utils/userCache.ts
import User from '../models/User';
import { decryptPassword } from './cryptoUtils';

// Cache simples em memória (reinicia quando o servidor reinicia)
// Em produção considere Redis ou outro cache persistente/distribuído
const phoneCache = new Map<string, { encrypted: string; user: any }>();

export async function getUserByPhone(plainPhone: string): Promise<{ encrypted: string; user: any } | null> {
    const cached = phoneCache.get(plainPhone);
    if (cached) {
        return cached;
    }

    const user = await User.findOne({}).lean(); // ajuste se tiver filtro melhor
    if (!user) return null;

    const decrypted = decryptPassword(user.phone);
    if (decrypted !== plainPhone) {
        return null; // não é esse usuário
    }

    // Se encontrou, cacheia
    const entry = { encrypted: user.phone, user };
    phoneCache.set(plainPhone, entry);

    return entry;
}


export async function getEncryptedPhone(plainPhone: string): Promise<string | null> {
    const result = await getUserByPhone(plainPhone);
    return result ? result.encrypted : null;
}

export function clearUserCache() {
    phoneCache.clear();
}