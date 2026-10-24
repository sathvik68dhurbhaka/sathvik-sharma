import crypto from 'crypto';
export function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}
export function comparePassword(password, storedHash) {
    try {
        const [salt, key] = storedHash.split(':');
        if (!salt || !key)
            return false;
        const keyBuffer = Buffer.from(key, 'hex');
        const derivedKey = crypto.scryptSync(password, salt, 64);
        return crypto.timingSafeEqual(keyBuffer, derivedKey);
    }
    catch (err) {
        return false;
    }
}
