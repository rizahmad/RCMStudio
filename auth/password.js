import crypto from 'crypto';

// Simple demo hashing (aligns with in-memory seed). Replace with bcrypt for production.
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password, hashed) {
  return hashPassword(password) === hashed;
}
