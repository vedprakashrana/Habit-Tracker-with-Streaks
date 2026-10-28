import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getUserToday, addDaysToDateString } from '../src/utils/dateUtils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting HabitFlow database seed...');

  const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@habitflow.app';
  const demoPassword = process.env.DEMO_USER_PASSWORD || 'password123';
  const demoName = process.env.DEMO_USER_NAME || 'Alex Morgan';
  const demoTimezone = process.env.DEMO_USER_TIMEZONE || 'UTC';

  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      name: demoName,
      passwordHash,
      timezone: demoTimezone,
    },
    create: {
      name: demoName,
      email: demoEmail,
      passwordHash,
      timezone: demoTimezone,
    },
  });

  console.log(`👤 Seeded User: ${user.name} (${user.email})`);

  // Define Demo Habits
  const habitsData = [
    {
      name: 'Read 20 minutes',
      description: 'Read non-fiction or tech articles to sharpen skills',
      icon: 'BookOpen',
      color: '#6366F1',
      scheduleType: 'DAILY' as const,
      scheduleConfiguration: '{}',
      reminderTime: '21:00',
      activeStreakDays: 14,
    },
    {
      name: 'Practice coding',
      description: 'Work on personal projects and algorithms',
      icon: 'Code',
      color: '#10B981',
      scheduleType: 'WEEKDAYS' as const,
      scheduleConfiguration: JSON.stringify({ weekdays: [1, 3, 5] }), // Mon, Wed, Fri
      reminderTime: '18:30',
      activeStreakDays: 10,
    },
    {
      name: 'Exercise 3x per week',
      description: 'Gym workout, running, or swimming',
      icon: 'Dumbbell',
      color: '#F59E0B',
      scheduleType: 'TIMES_PER_WEEK' as const,
      scheduleConfiguration: JSON.stringify({ targetPerWeek: 3 }),
      reminderTime: '07:30',
      activeStreakDays: 14,
    },
    {
      name: 'Learn a new concept',
      description: 'Explore new architectures, patterns, or tools daily',
      icon: 'Brain',
      color: '#EC4899',
      scheduleType: 'DAILY' as const,
      scheduleConfiguration: '{}',
      reminderTime: '20:00',
      activeStreakDays: 5,
    },
  ];

  const today = getUserToday(demoTimezone);

  for (const h of habitsData) {
    // Find or create habit
    let habit = await prisma.habit.findFirst({
      where: { userId: user.id, name: h.name },
    });

    if (!habit) {
      habit = await prisma.habit.create({
        data: {
          userId: user.id,
          name: h.name,
          description: h.description,
          icon: h.icon,
          color: h.color,
          scheduleType: h.scheduleType,
          scheduleConfiguration: h.scheduleConfiguration,
          reminderTime: h.reminderTime,
        },
      });
      console.log(`✨ Created Habit: ${habit.name}`);
    }

    // Seed 180 days of completions
    const completionsToInsert: { habitId: string; localDate: string }[] = [];
    for (let offset = 180; offset >= 0; offset--) {
      const dateStr = addDaysToDateString(today, -offset);
      const dObj = new Date(Date.UTC(
        parseInt(dateStr.split('-')[0]),
        parseInt(dateStr.split('-')[1]) - 1,
        parseInt(dateStr.split('-')[2])
      ));
      const dow = dObj.getUTCDay() === 0 ? 7 : dObj.getUTCDay();

      let shouldComplete = false;
      if (h.scheduleType === 'DAILY') {
        shouldComplete = offset <= h.activeStreakDays || (offset % 5 !== 0 && offset % 9 !== 0);
      } else if (h.scheduleType === 'WEEKDAYS') {
        if ([1, 3, 5].includes(dow)) {
          shouldComplete = offset <= h.activeStreakDays || offset % 7 !== 0;
        }
      } else if (h.scheduleType === 'TIMES_PER_WEEK') {
        if ([2, 4, 6].includes(dow)) {
          shouldComplete = offset <= h.activeStreakDays || offset % 4 !== 0;
        }
      }

      if (shouldComplete) {
        completionsToInsert.push({ habitId: habit.id, localDate: dateStr });
      }
    }

    for (const comp of completionsToInsert) {
      await prisma.habitCompletion.upsert({
        where: {
          habitId_localDate: {
            habitId: comp.habitId,
            localDate: comp.localDate,
          },
        },
        update: {},
        create: {
          habitId: comp.habitId,
          localDate: comp.localDate,
        },
      });
    }
  }

  // Also seed an archived habit
  const archivedName = 'Morning Jogging';
  let archivedHabit = await prisma.habit.findFirst({
    where: { userId: user.id, name: archivedName },
  });
  if (!archivedHabit) {
    archivedHabit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: archivedName,
        description: 'Past summer habit, preserved with all history',
        icon: 'Flame',
        color: '#8B5CF6',
        scheduleType: 'DAILY',
        scheduleConfiguration: '{}',
        reminderTime: '06:30',
        archivedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('\n===========================================');
  console.log('🎉 Seed complete! Demo credentials:');
  console.log(`📧 Email:    ${demoEmail}`);
  console.log(`🔑 Password: ${demoPassword}`);
  console.log('===========================================\n');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
