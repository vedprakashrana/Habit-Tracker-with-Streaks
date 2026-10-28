import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from '../db/store';

const JWT_SECRET = process.env.JWT_SECRET || 'habitflow_super_secret_jwt_key_default';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  // 1. Check cookies (httpOnly cookie)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Check Authorization header
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    res.status(401).json({
      error: 'Authentication required. Please log in.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // Check if user still exists in repository
    const user = await userRepository.findById(payload.id);
    if (!user) {
      res.status(401).json({
        error: 'User account not found or has been removed.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone || 'UTC',
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Invalid or expired authentication session.',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Basic in-memory rate limiter for auth endpoints.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 50; // allow generous limit for testing

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  record.count++;
  if (record.count > maxAttempts) {
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.',
      code: 'TOO_MANY_REQUESTS',
    });
    return;
  }

  next();
}
