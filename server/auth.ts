import crypto from 'node:crypto';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 10;

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const revokedTokenIds = new Set<string>();
const failedLoginTracker = new Map<string, { count: number; resetAt: number }>();

export function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function verifyPlaintextConstantTime(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  const maxLen = Math.max(a.length, b.length, 1);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  a.copy(paddedA);
  b.copy(paddedB);
  return crypto.timingSafeEqual(paddedA, paddedB) && a.length === b.length;
}

export function getEnvAdminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  if (!value || !value.trim()) return null;
  return value.trim();
}

export function issueAdminToken(): string {
  const payload = {
    sub: 'auraglow-admin',
    jti: crypto.randomBytes(16).toString('hex'),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): { valid: boolean; jti?: string } {
  if (!token || typeof token !== 'string') return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [encoded, sig] = parts;
  if (!encoded || !sig) return { valid: false };

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      sub?: string;
      jti?: string;
      exp?: number;
    };
    if (parsed.sub !== 'auraglow-admin' || !parsed.jti || !parsed.exp) {
      return { valid: false };
    }
    if (Date.now() > parsed.exp || revokedTokenIds.has(parsed.jti)) {
      return { valid: false };
    }
    return { valid: true, jti: parsed.jti };
  } catch {
    return { valid: false };
  }
}

export function revokeAdminToken(token: string | undefined | null): void {
  const check = verifyAdminToken(token);
  if (check.valid && check.jti) {
    revokedTokenIds.add(check.jti);
  }
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

export function isRateLimited(clientKey: string): boolean {
  const entry = failedLoginTracker.get(clientKey);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    failedLoginTracker.delete(clientKey);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

export function recordFailedLogin(clientKey: string): void {
  const now = Date.now();
  const entry = failedLoginTracker.get(clientKey);
  if (!entry || now > entry.resetAt) {
    failedLoginTracker.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearFailedLogins(clientKey: string): void {
  failedLoginTracker.delete(clientKey);
}
