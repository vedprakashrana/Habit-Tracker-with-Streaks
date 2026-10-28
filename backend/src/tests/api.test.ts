import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { seedInMemoryDemoData } from '../db/store';
import { getUserToday, addDaysToDateString } from '../utils/dateUtils';

describe('HabitFlow API Integration Tests', () => {
  let userTokenA: string;
  let userTokenB: string;
  let userAHabitId: string;
  const today = getUserToday('UTC');

  beforeAll(async () => {
    await seedInMemoryDemoData();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User A',
        email: `user_a_${Date.now()}@example.com`,
        password: 'password123',
        timezone: 'UTC',
      });
    expect(resA.status).toBe(201);
    userTokenA = resA.body.token;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User B',
        email: `user_b_${Date.now()}@example.com`,
        password: 'password123',
        timezone: 'UTC',
      });
    expect(resB.status).toBe(201);
    userTokenB = resB.body.token;
  });

  it('1. Demo user can log in with demo credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@habitflow.app',
        password: 'password123',
      });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('demo@habitflow.app');
  });

  it('2. Invalid login is rejected', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@habitflow.app',
        password: 'wrong_password',
      });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('3. User A can create a habit with daily schedule', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        name: 'Drink 2L Water',
        description: 'Stay hydrated throughout the day',
        icon: 'Droplet',
        color: '#06B6D4',
        scheduleType: 'DAILY',
        scheduleConfiguration: {},
      });

    expect(res.status).toBe(201);
    expect(res.body.habit.name).toBe('Drink 2L Water');
    expect(res.body.habit.scheduleType).toBe('DAILY');
    userAHabitId = res.body.habit.id;
  });

  it('4. User B CANNOT access User A’s habit (Cross-User Authorization Protection)', async () => {
    const res = await request(app)
      .get(`/api/habits/${userAHabitId}`)
      .set('Authorization', `Bearer ${userTokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('5. User B CANNOT mark User A’s habit as completed', async () => {
    const res = await request(app)
      .put(`/api/habits/${userAHabitId}/completions/${today}`)
      .set('Authorization', `Bearer ${userTokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('6. User A can mark their habit as completed for today', async () => {
    const res = await request(app)
      .put(`/api/habits/${userAHabitId}/completions/${today}`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.currentStreak).toBe(1);
    expect(res.body.isCompletedToday).toBe(true);
  });

  it('7. Duplicate completion for the same habit and date is handled idempotently', async () => {
    const res = await request(app)
      .put(`/api/habits/${userAHabitId}/completions/${today}`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.currentStreak).toBe(1);
  });

  it('8. Future completion dates are rejected with 400', async () => {
    const tomorrow = addDaysToDateString(today, 1);
    const res = await request(app)
      .put(`/api/habits/${userAHabitId}/completions/${tomorrow}`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Future completion dates');
  });

  it('9. Dates older than 7 calendar days are rejected with 400', async () => {
    const eightDaysAgo = addDaysToDateString(today, -8);
    const res = await request(app)
      .put(`/api/habits/${userAHabitId}/completions/${eightDaysAgo}`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('older than 7 calendar days');
  });

  it('10. User A can record a completion for a date within the 7-day window (e.g. yesterday)', async () => {
    const yesterday = addDaysToDateString(today, -1);
    const res = await request(app)
      .put(`/api/habits/${userAHabitId}/completions/${yesterday}`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    // Yesterday + today completed = streak of 2!
    expect(res.body.currentStreak).toBe(2);
  });

  it('11. User A can unmark a completion within the 7-day window', async () => {
    const yesterday = addDaysToDateString(today, -1);
    const res = await request(app)
      .delete(`/api/habits/${userAHabitId}/completions/${yesterday}`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    // With yesterday removed, current streak is now 1 (only today)
    expect(res.body.currentStreak).toBe(1);
  });

  it('12. User A can archive and restore a habit', async () => {
    // Archive
    const archiveRes = await request(app)
      .post(`/api/habits/${userAHabitId}/archive`)
      .set('Authorization', `Bearer ${userTokenA}`);
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.habit.archivedAt).not.toBeNull();

    // Check that active habits list does not include it
    const activeRes = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${userTokenA}`);
    expect(activeRes.body.habits.some((h: any) => h.id === userAHabitId)).toBe(false);

    // Check that archived query includes it
    const archivedRes = await request(app)
      .get('/api/habits?archived=true')
      .set('Authorization', `Bearer ${userTokenA}`);
    expect(archivedRes.body.habits.some((h: any) => h.id === userAHabitId)).toBe(true);

    // Restore
    const restoreRes = await request(app)
      .post(`/api/habits/${userAHabitId}/restore`)
      .set('Authorization', `Bearer ${userTokenA}`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.habit.archivedAt).toBeNull();
  });

  it('13. Dashboard endpoint returns valid summary and calculation', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.todayLocalDate).toBe(today);
    expect(res.body.totalActiveHabits).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.todayCompletionPercentage).toBe('number');
    expect(Array.isArray(res.body.weeklyActivity)).toBe(true);
    expect(res.body.weeklyActivity.length).toBe(7);
  });

  it('14. 30-day stats endpoint returns completion rates safely without NaN', async () => {
    const res = await request(app)
      .get('/api/stats?days=30')
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.overall.completionRate).toBe('number');
    expect(isNaN(res.body.overall.completionRate)).toBe(false);
    expect(Array.isArray(res.body.dailyActivity)).toBe(true);
    expect(res.body.dailyActivity.length).toBe(30);
  });

  it('15. 6-month heatmap endpoint returns 182 cells and distinguishing statuses', async () => {
    const res = await request(app)
      .get(`/api/habits/${userAHabitId}/heatmap?months=6`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.days)).toBe(true);
    expect(res.body.days.length).toBe(182); // 26 full weeks
    expect(res.body.habitId).toBe(userAHabitId);
  });
});
