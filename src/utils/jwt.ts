import jwt from 'jsonwebtoken';

// Chave secreta para JWT - em produção, use uma variável de ambiente
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'your-super-secret-refresh-key-change-in-production';

// Tempo de expiração dos tokens
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'teacher';
}

export interface RefreshTokenPayload {
  userId: number;
  tokenVersion: number;
}

/**
 * Gera um token de acesso JWT
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'projeto-presenca-api',
    audience: 'projeto-presenca-client',
  });
}

/**
 * Gera um refresh token JWT
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'projeto-presenca-api',
    audience: 'projeto-presenca-client',
  });
}

/**
 * Verifica e decodifica um token de acesso
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'projeto-presenca-api',
      audience: 'projeto-presenca-client',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verifica e decodifica um refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'projeto-presenca-api',
      audience: 'projeto-presenca-client',
    }) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Extrai o token do header Authorization
 */
export function extractTokenFromHeader(
  authHeader: string | undefined,
): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}
