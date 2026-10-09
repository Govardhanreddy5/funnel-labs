import crypto from 'crypto';

/**
 * Server-Side Cryptographic Helper for Token Encryption (AES-256-GCM)
 *
 * Requirements:
 * - 256-bit AES encryption key
 * - 96-bit (12-byte) initialization vector (IV) per encryption
 * - 128-bit authentication tag to prevent tampering
 * - Never decrypt tokens in client-accessible responses
 */

function getEncryptionKey(): Buffer {
  const configuredKey = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (configuredKey) {
    if (configuredKey.length === 64) {
      return Buffer.from(configuredKey, 'hex');
    }
    // Fallback: derive 32 bytes from configured string
    return crypto.createHash('sha256').update(configuredKey).digest();
  }

  // In production, require an explicit secure key to prevent predictable encryption
  if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'CRITICAL SECURITY CONFIGURATION ERROR: INTEGRATION_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY must be set in production.'
    );
  }

  // Derive stable 256-bit key from Supabase service role key or fallback secret (dev only)
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY || 'funnel-labs-dev-default-secret-salt-32bytes!';
  return crypto.createHash('sha256').update(seed).digest();
}

export interface EncryptedPayload {
  encrypted: string; // Base64
  iv: string;        // Base64
  authTag: string;   // Base64
}

/**
 * Encrypt a sensitive token using AES-256-GCM
 */
export function encryptToken(plainToken: string): EncryptedPayload {
  if (!plainToken) {
    throw new Error('Cannot encrypt empty token');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encryptedBuffer = Buffer.concat([
    cipher.update(plainToken, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted: encryptedBuffer.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt a sensitive token using AES-256-GCM
 */
export function decryptToken(encrypted: string, iv: string, authTag: string): string {
  if (!encrypted || !iv || !authTag) {
    throw new Error('Missing encryption parameters for token decryption');
  }

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Generate a cryptographically secure random state parameter for OAuth CSRF protection
 */
export function generateOAuthState(organizationId: string, provider: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const payload = JSON.stringify({ organizationId, provider, nonce, timestamp });
  const hmac = crypto
    .createHmac('sha256', getEncryptionKey())
    .update(payload)
    .digest('hex');

  const envelope = JSON.stringify({ payload, hmac });
  return Buffer.from(envelope).toString('base64url');
}

/**
 * Validate an OAuth state parameter
 */
export function verifyOAuthState(stateString: string): { organizationId: string; provider: string } | null {
  try {
    const raw = Buffer.from(stateString, 'base64url').toString('utf8');
    const { payload, hmac } = JSON.parse(raw);

    const expectedHmac = crypto
      .createHmac('sha256', getEncryptionKey())
      .update(payload)
      .digest('hex');

    if (hmac !== expectedHmac) {
      return null;
    }

    const data = JSON.parse(payload);
    // Expire states older than 15 minutes
    if (Date.now() - data.timestamp > 15 * 60 * 1000) {
      return null;
    }

    return { organizationId: data.organizationId, provider: data.provider };
  } catch {
    return null;
  }
}
