const crypto = require('crypto');

const ALG = 'aes-256-gcm';

function getKey() {
  const key = process.env.MODMAIL_KEY || process.env.APP_SECRET || '';
  if (!key || key.length < 16) return null;
  return crypto.createHash('sha256').update(key).digest();
}

function encryptText(plain) {
  try {
    const key = getKey();
    if (!key) return { data: plain, enc: false };
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALG, key, iv);
    const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const payload = Buffer.concat([iv, tag, enc]).toString('base64');
    return { data: payload, enc: true };
  } catch {
    return { data: plain, enc: false };
  }
}

function decryptText(payload) {
  try {
    const key = getKey();
    if (!key) return { data: payload, enc: false };
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    return { data: dec, enc: true };
  } catch {
    return { data: payload, enc: false };
  }
}

module.exports = { encryptText, decryptText };

