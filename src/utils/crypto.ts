import {createCipheriv, createDecipheriv, randomBytes, scryptSync} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const DATA_ENCODING = 'utf-8';
const ENCODING = 'base64';
const START_POINT = 0;
const SALT_LENGTH = 64;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export function encrypt(password: string, data: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, scryptSync(password, salt, KEY_LENGTH), iv);

    const encrypted = Buffer.concat([cipher.update(data, DATA_ENCODING), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString(ENCODING);
}

export function decrypt(password: string, data: string): string {
    const buffer = Buffer.from(data, ENCODING);

    const salt = buffer.slice(START_POINT, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, scryptSync(password, salt, KEY_LENGTH), iv);
    decipher.setAuthTag(tag);

    // eslint-disable-next-line no-undefined
    const decrypted = decipher.update(buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH), undefined, DATA_ENCODING) +
    decipher.final(DATA_ENCODING);

    return decrypted;
}
