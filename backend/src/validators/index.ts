import { z } from 'zod';
import { isValidISODateString, isValidTimezone } from '../utils/dateUtils';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters long').max(100),
  timezone: z
    .string()
    .trim()
    .optional()
    .refine((tz) => !tz || isValidTimezone(tz), {
      message: 'Invalid IANA timezone identifier',
    }),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateTimezoneSchema = z.object({
  timezone: z.string().trim().refine(isValidTimezone, {
    message: 'Invalid IANA timezone identifier',
  }),
});

export const habitScheduleConfigSchema = z.union([
  z.object({
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'At least one weekday must be selected for weekday schedule'),
  }),
  z.object({
    targetPerWeek: z
      .number()
      .int()
      .min(1, 'Target per week must be between 1 and 7')
      .max(7, 'Target per week must be between 1 and 7'),
  }),
  z.object({}).passthrough(),
]);

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, 'Habit name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
  icon: z.string().trim().default('Target'),
  color: z.string().trim().default('#6366F1'),
  scheduleType: z.enum(['DAILY', 'WEEKDAYS', 'TIMES_PER_WEEK']),
  scheduleConfiguration: z.union([habitScheduleConfigSchema, z.string()]).optional(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Reminder time must be in HH:MM format')
    .optional()
    .nullable(),
});

export const updateHabitSchema = createHabitSchema.partial();

export const dateParamSchema = z.object({
  date: z.string().refine(isValidISODateString, {
    message: 'Invalid date format. Expected YYYY-MM-DD (e.g. 2026-10-28)',
  }),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const heatmapQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).default(6),
});
