import crypto from 'crypto';

const header = { alg: 'HS256', typ: 'JWT' };

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function sign(payload, secret, expiresInSeconds = 60 * 60 * 8) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const data = { ...payload, exp };
  const headerEncoded = base64url(JSON.stringify(header));
  const payloadEncoded = base64url(JSON.stringify(data));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64url');
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export function verify(token, secret) {
  if (!token) throw new Error('No token');
  const [headerEncoded, payloadEncoded, signature] = token.split('.');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64url');
  if (expected !== signature) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString('utf8'));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}
