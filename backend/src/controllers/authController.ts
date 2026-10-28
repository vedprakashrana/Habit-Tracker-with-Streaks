import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest, generateToken } from '../middleware/auth';
import { userRepository } from '../db/store';
import { registerSchema, loginSchema, updateTimezoneSchema } from '../validators';

export const authController = {
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.format(),
        });
        return;
      }

      const { name, email, password, timezone } = validation.data;

      const existing = await userRepository.findByEmail(email);
      if (existing) {
        res.status(409).json({
          error: 'An account with this email address already exists.',
          code: 'EMAIL_ALREADY_EXISTS',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await userRepository.create({
        name,
        email,
        passwordHash,
        timezone: timezone || 'UTC',
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
        },
        token,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.format(),
        });
        return;
      }

      const { email, password } = validation.data;
      const user = await userRepository.findByEmail(email);
      if (!user) {
        res.status(401).json({
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        res.status(401).json({
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
        },
        token,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  },

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
      },
    });
  },

  async updateTimezone(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validation = updateTimezoneSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.format(),
      });
      return;
    }

    const updated = await userRepository.updateTimezone(req.user.id, validation.data.timezone);
    res.status(200).json({
      message: 'Timezone updated successfully',
      timezone: updated?.timezone,
    });
  },
};
