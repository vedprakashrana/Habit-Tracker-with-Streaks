import bcrypt from 'bcryptjs';
import { HabitModel, HabitCompletionModel, UserModel, ScheduleType } from '../types';
import { getPrisma, isUsingPostgres } from './prisma';
import { addDaysToDateString, getUserToday } from '../utils/dateUtils';

// In-Memory store state for development / evaluation without PostgreSQL
class InMemoryStore {
  users: Map<string, UserModel> = new Map();
  habits: Map<string, HabitModel> = new Map();
  completions: Map<string, HabitCompletionModel> = new Map(); // key: `${habitId}:${localDate}`

  clear() {
    this.users.clear();
    this.habits.clear();
    this.completions.clear();
  }
}

export const memoryStore = new InMemoryStore();

// Seed Demo Data into memoryStore
export async function seedInMemoryDemoData() {
  if (memoryStore.users.size > 0) return; // Already seeded

  const demoPasswordHash = await bcrypt.hash('password123', 10);
  const demoUserId = 'demo-user-alex';

  const demoUser: UserModel = {
    id: demoUserId,
    name: 'Alex Morgan',
    email: 'demo@habitflow.app',
    passwordHash: demoPasswordHash,
    timezone: 'UTC',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  memoryStore.users.set(demoUser.id, demoUser);

  const habit1: HabitModel = {
    id: 'habit-read-daily',
    userId: demoUserId,
    name: 'Read 20 minutes',
    description: 'Read non-fiction or tech articles to sharpen skills',
    icon: 'BookOpen',
    color: '#6366F1', // Indigo
    scheduleType: 'DAILY',
    scheduleConfiguration: '{}',
    reminderTime: '21:00',
    archivedAt: null,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  const habit2: HabitModel = {
    id: 'habit-code-weekdays',
    userId: demoUserId,
    name: 'Practice coding',
    description: 'Work on personal projects and algorithms',
    icon: 'Code',
    color: '#10B981', // Emerald
    scheduleType: 'WEEKDAYS',
    scheduleConfiguration: JSON.stringify({ weekdays: [1, 3, 5] }), // Mon, Wed, Fri
    reminderTime: '18:30',
    archivedAt: null,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  const habit3: HabitModel = {
    id: 'habit-exercise-weekly',
    userId: demoUserId,
    name: 'Exercise 3x per week',
    description: 'Gym workout, running, or swimming',
    icon: 'Dumbbell',
    color: '#F59E0B', // Amber
    scheduleType: 'TIMES_PER_WEEK',
    scheduleConfiguration: JSON.stringify({ targetPerWeek: 3 }),
    reminderTime: '07:30',
    archivedAt: null,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  const habit4: HabitModel = {
    id: 'habit-learn-daily',
    userId: demoUserId,
    name: 'Learn a new concept',
    description: 'Explore new architectures, patterns, or tools daily',
    icon: 'Brain',
    color: '#EC4899', // Pink
    scheduleType: 'DAILY',
    scheduleConfiguration: '{}',
    reminderTime: '20:00',
    archivedAt: null,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  const habit5Archived: HabitModel = {
    id: 'habit-morning-jog',
    userId: demoUserId,
    name: 'Morning Jogging',
    description: 'Past summer habit, preserved with all history',
    icon: 'Flame',
    color: '#8B5CF6', // Violet
    scheduleType: 'DAILY',
    scheduleConfiguration: '{}',
    reminderTime: '06:30',
    archivedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  memoryStore.habits.set(habit1.id, habit1);
  memoryStore.habits.set(habit2.id, habit2);
  memoryStore.habits.set(habit3.id, habit3);
  memoryStore.habits.set(habit4.id, habit4);
  memoryStore.habits.set(habit5Archived.id, habit5Archived);

  // Generate 6 months (180 days) of realistic historical completion records
  const today = getUserToday('UTC');

  for (let offset = 180; offset >= 0; offset--) {
    const dateStr = addDaysToDateString(today, -offset);
    const dayOfWeek = (offset % 7) + 1;

    // Habit 1: Daily reading - strong habit (~85% completed, active last 14 days)
    if (offset <= 14 || (offset % 5 !== 0 && offset % 9 !== 0)) {
      addMemoryCompletion(habit1.id, dateStr);
    }

    // Habit 2: Code Mon/Wed/Fri (weekdays 1, 3, 5)
    // Check if date is Mon, Wed, or Fri
    const dObj = new Date(Date.UTC(
      parseInt(dateStr.split('-')[0]),
      parseInt(dateStr.split('-')[1]) - 1,
      parseInt(dateStr.split('-')[2])
    ));
    const dow = dObj.getUTCDay() === 0 ? 7 : dObj.getUTCDay();
    if ([1, 3, 5].includes(dow)) {
      if (offset <= 10 || offset % 7 !== 0) {
        addMemoryCompletion(habit2.id, dateStr);
      }
    }

    // Habit 3: Exercise 3x per week (typically Tue, Thu, Sat)
    if ([2, 4, 6].includes(dow)) {
      if (offset <= 14 || offset % 4 !== 0) {
        addMemoryCompletion(habit3.id, dateStr);
      }
    }

    // Habit 4: Learn concept (~70% completed)
    if (offset <= 5 || offset % 3 !== 0) {
      addMemoryCompletion(habit4.id, dateStr);
    }

    // Habit 5: Archived habit (active until 30 days ago)
    if (offset > 30 && offset % 2 === 0) {
      addMemoryCompletion(habit5Archived.id, dateStr);
    }
  }
}

function addMemoryCompletion(habitId: string, localDate: string) {
  const key = `${habitId}:${localDate}`;
  memoryStore.completions.set(key, {
    id: `comp-${habitId}-${localDate}`,
    habitId,
    localDate,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// User Repository
export const userRepository = {
  async findByEmail(email: string): Promise<UserModel | null> {
    if (isUsingPostgres()) {
      try {
        const u = await getPrisma().user.findUnique({ where: { email: email.toLowerCase() } });
        return u;
      } catch {
        // Fallback to memory
      }
    }
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return u;
      }
    }
    return null;
  },

  async findById(id: string): Promise<UserModel | null> {
    if (isUsingPostgres()) {
      try {
        const u = await getPrisma().user.findUnique({ where: { id } });
        return u;
      } catch {
        // Fallback to memory
      }
    }
    return memoryStore.users.get(id) || null;
  },

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    timezone?: string;
  }): Promise<UserModel> {
    const timezone = data.timezone || 'UTC';
    if (isUsingPostgres()) {
      try {
        const u = await getPrisma().user.create({
          data: {
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash: data.passwordHash,
            timezone,
          },
        });
        return u;
      } catch (e) {
        // if db error, fall through to memory store
      }
    }

    const newUser: UserModel = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      timezone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.set(newUser.id, newUser);
    return newUser;
  },

  async updateTimezone(userId: string, timezone: string): Promise<UserModel | null> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().user.update({
          where: { id: userId },
          data: { timezone },
        });
      } catch {
        // Fallback
      }
    }
    const u = memoryStore.users.get(userId);
    if (!u) return null;
    u.timezone = timezone;
    u.updatedAt = new Date();
    return u;
  },
};

// Habit Repository
export const habitRepository = {
  async findById(id: string): Promise<HabitModel | null> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habit.findUnique({ where: { id } });
      } catch {
        // Fallback
      }
    }
    return memoryStore.habits.get(id) || null;
  },

  async findByUserId(userId: string, includeArchived = false): Promise<HabitModel[]> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habit.findMany({
          where: {
            userId,
            ...(includeArchived ? {} : { archivedAt: null }),
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch {
        // Fallback
      }
    }

    const list: HabitModel[] = [];
    for (const h of memoryStore.habits.values()) {
      if (h.userId === userId) {
        if (includeArchived || h.archivedAt === null) {
          list.push(h);
        }
      }
    }
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async create(data: {
    userId: string;
    name: string;
    description?: string | null;
    icon?: string;
    color?: string;
    scheduleType: ScheduleType;
    scheduleConfiguration: string;
    reminderTime?: string | null;
  }): Promise<HabitModel> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habit.create({
          data: {
            userId: data.userId,
            name: data.name,
            description: data.description || null,
            icon: data.icon || 'Target',
            color: data.color || '#6366F1',
            scheduleType: data.scheduleType,
            scheduleConfiguration: data.scheduleConfiguration || '{}',
            reminderTime: data.reminderTime || null,
          },
        });
      } catch {
        // Fallback
      }
    }

    const newHabit: HabitModel = {
      id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      name: data.name,
      description: data.description || null,
      icon: data.icon || 'Target',
      color: data.color || '#6366F1',
      scheduleType: data.scheduleType,
      scheduleConfiguration: data.scheduleConfiguration || '{}',
      reminderTime: data.reminderTime || null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.habits.set(newHabit.id, newHabit);
    return newHabit;
  },

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      icon?: string;
      color?: string;
      scheduleType?: ScheduleType;
      scheduleConfiguration?: string;
      reminderTime?: string | null;
    }
  ): Promise<HabitModel | null> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habit.update({
          where: { id },
          data,
        });
      } catch {
        // Fallback
      }
    }

    const h = memoryStore.habits.get(id);
    if (!h) return null;
    if (data.name !== undefined) h.name = data.name;
    if (data.description !== undefined) h.description = data.description;
    if (data.icon !== undefined) h.icon = data.icon;
    if (data.color !== undefined) h.color = data.color;
    if (data.scheduleType !== undefined) h.scheduleType = data.scheduleType;
    if (data.scheduleConfiguration !== undefined)
      h.scheduleConfiguration = data.scheduleConfiguration;
    if (data.reminderTime !== undefined) h.reminderTime = data.reminderTime;
    h.updatedAt = new Date();
    return h;
  },

  async archive(id: string): Promise<HabitModel | null> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habit.update({
          where: { id },
          data: { archivedAt: new Date() },
        });
      } catch {
        // Fallback
      }
    }

    const h = memoryStore.habits.get(id);
    if (!h) return null;
    h.archivedAt = new Date();
    h.updatedAt = new Date();
    return h;
  },

  async restore(id: string): Promise<HabitModel | null> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habit.update({
          where: { id },
          data: { archivedAt: null },
        });
      } catch {
        // Fallback
      }
    }

    const h = memoryStore.habits.get(id);
    if (!h) return null;
    h.archivedAt = null;
    h.updatedAt = new Date();
    return h;
  },

  async delete(id: string): Promise<boolean> {
    if (isUsingPostgres()) {
      try {
        await getPrisma().habit.delete({ where: { id } });
        return true;
      } catch {
        // Fallback
      }
    }

    const removed = memoryStore.habits.delete(id);
    // Delete completions
    for (const [key, c] of memoryStore.completions.entries()) {
      if (c.habitId === id) {
        memoryStore.completions.delete(key);
      }
    }
    return removed;
  },
};

// HabitCompletion Repository
export const completionRepository = {
  async findByHabitAndDate(habitId: string, localDate: string): Promise<HabitCompletionModel | null> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habitCompletion.findUnique({
          where: {
            habitId_localDate: {
              habitId,
              localDate,
            },
          },
        });
      } catch {
        // Fallback
      }
    }

    const key = `${habitId}:${localDate}`;
    return memoryStore.completions.get(key) || null;
  },

  async findByHabitId(habitId: string): Promise<HabitCompletionModel[]> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habitCompletion.findMany({
          where: { habitId },
          orderBy: { localDate: 'desc' },
        });
      } catch {
        // Fallback
      }
    }

    const list: HabitCompletionModel[] = [];
    for (const c of memoryStore.completions.values()) {
      if (c.habitId === habitId) {
        list.push(c);
      }
    }
    return list.sort((a, b) => b.localDate.localeCompare(a.localDate));
  },

  async findForHabits(habitIds: string[]): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};
    habitIds.forEach((id) => {
      result[id] = [];
    });

    if (isUsingPostgres()) {
      try {
        const records = await getPrisma().habitCompletion.findMany({
          where: { habitId: { in: habitIds } },
          select: { habitId: true, localDate: true },
        });
        for (const r of records) {
          if (!result[r.habitId]) result[r.habitId] = [];
          result[r.habitId].push(r.localDate);
        }
        return result;
      } catch {
        // Fallback
      }
    }

    for (const c of memoryStore.completions.values()) {
      if (result[c.habitId] !== undefined) {
        result[c.habitId].push(c.localDate);
      }
    }

    return result;
  },

  async create(habitId: string, localDate: string): Promise<HabitCompletionModel> {
    if (isUsingPostgres()) {
      try {
        return await getPrisma().habitCompletion.create({
          data: {
            habitId,
            localDate,
          },
        });
      } catch {
        // Fallback
      }
    }

    const key = `${habitId}:${localDate}`;
    const existing = memoryStore.completions.get(key);
    if (existing) {
      return existing; // idempotent
    }

    const newComp: HabitCompletionModel = {
      id: `comp-${habitId}-${localDate}`,
      habitId,
      localDate,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.completions.set(key, newComp);
    return newComp;
  },

  async delete(habitId: string, localDate: string): Promise<boolean> {
    if (isUsingPostgres()) {
      try {
        await getPrisma().habitCompletion.delete({
          where: {
            habitId_localDate: {
              habitId,
              localDate,
            },
          },
        });
        return true;
      } catch {
        // Fallback
      }
    }

    const key = `${habitId}:${localDate}`;
    return memoryStore.completions.delete(key);
  },
};
