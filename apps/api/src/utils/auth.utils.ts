import { SignJWT, jwtVerify } from 'jose';

/**
 * Hash a password using Web Crypto API (bcrypt alternative for Workers)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Use SHA-256 with salt (you can enhance this with PBKDF2 for better security)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Combine password with salt
  const combined = new Uint8Array([...salt, ...data]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt + hash
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [saltHex, hash] = hashedPassword.split(':');
  
  if (!saltHex || !hash) {
    return false;
  }
  
  // Convert salt from hex
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Hash the provided password with the same salt
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const combined = new Uint8Array([...salt, ...data]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === hash;
}

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(userId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(secretKey);
  
  return token;
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string, secret: string): Promise<{ userId: string } | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    
    const { payload } = await jwtVerify(token, secretKey);
    
    if (payload.userId && typeof payload.userId === 'string') {
      return { userId: payload.userId };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

