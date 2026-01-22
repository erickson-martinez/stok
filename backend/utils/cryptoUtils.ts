// backend/utils/cryptoUtils.ts
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}

const IV_LENGTH = 16;

/**
 * Criptografa um número de telefone (ou qualquer string) usando AES-256-CBC
 * Retorna no formato: iv:encrypted (hex)
 */
export function encryptPhone(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY!, 'hex'),
        iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Descriptografa o valor criptografado no formato iv:encrypted
 */
export function decryptPassword(encrypted: string): string {
    const [ivHex, encryptedText] = encrypted.split(':');
    if (!ivHex || !encryptedText) {
        throw new Error('Formato de dado criptografado inválido');
    }

    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY!, 'hex'),
        Buffer.from(ivHex, 'hex')
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}