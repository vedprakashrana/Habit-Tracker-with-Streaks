import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { DashboardData, Habit } from '../types';
import { HabitCard } from '../components/HabitCard';
import { HabitModal } from '../components/HabitModal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Modals for actions
  const [confirmArchiveHabit, setConfirmArchiveHabit] = useState<Habit | null>(null);
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState<Habit | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleComplete = async (habitId: string, isCurrentlyCompleted: boolean) => {
    if (!data) return;
    const today = data.todayLocalDate;

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updatedTodayHabits = prev.todayHabits.map((h) => {
        if (h.id === habitId) {
          const nextCompleted = !isCurrentlyCompleted;
          return {
            ...h,
            isCompletedToday: nextCompleted,
            currentStreak: nextCompleted ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1),
          };
        }
        return h;
      });

      const nextCompletedTodayCount = updatedTodayHabits.filter(
        (h) => h.isScheduledToday && h.isCompletedToday
      ).length;
      const scheduledCount = prev.scheduledTodayCount;
      const nextPct = scheduledCount > 0 ? Math.round((nextCompletedTodayCount / scheduledCount) * 100) : 0;

      return {
        ...prev,
        todayHabits: updatedTodayHabits,
        completedTodayCount: nextCompletedTodayCount,
        todayCompletionPercentage: nextPct,
      };
    });

    try {
      if (isCurrentlyCompleted) {
        await api.removeCompletion(habitId, today);
        showToast('Habit marked as incomplete for today', 'info');
      } else {
        await api.setCompletion(habitId, today);
        showToast('Great job! Habit completed for today! 🎉', 'success');
      }
      // Re-fetch to sync backend streak calculations accurately
      fetchDashboard();
    } catch (err: any) {
      showToast(err.message || 'Failed to update completion status', 'error');
      fetchDashboard(); // Rollback
    }
  };

  const handleCreateOrUpdateHabit = async (formData: any) => {
    if (selectedHabit) {
      await api.updateHabit(selectedHabit.id, formData);
      showToast('Habit updated successfully!', 'success');
    } else {
      await api.createHabit(formData);
      showToast('New habit created!', 'success');
    }
    setSelectedHabit(null);
    fetchDashboard();
  };

  const handleArchive = async () => {
    if (!confirmArchiveHabit) return;
    try {
      await api.archiveHabit(confirmArchiveHabit.id);
      showToast('Habit archived. Historical completions preserved.', 'info');
      fetchDashboard();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive habit', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteHabit) return;
    try {
      await api.deleteHabit(confirmDeleteHabit.id);
      showToast('Habit permanently deleted.', 'info');
      fetchDashboard();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete habit', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  // Greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = data?.todayLocalDate
    ? (() => {
        try {
          return format(parseISO(data.todayLocalDate), 'EEEE, MMMM d, yyyy');
        } catch {
          return data.todayLocalDate;
        }
      })()
    : '';

  const scheduledTodayHabits = data?.todayHabits.filter((h) => h.isScheduledToday) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner: Greeting, Date, Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Friend'}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {data?.motivationalMessage}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedHabit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-102 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Completion Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {data?.todayCompletionPercentage || 0}%
              </span>
              <span className="text-xs text-slate-500">
                ({data?.completedTodayCount}/{data?.scheduledTodayCount} habits)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${data?.todayCompletionPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Total Active Habits */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Habits
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {data?.totalActiveHabits || 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {data?.scheduledTodayCount || 0} scheduled for today
            </p>
          </div>
        </div>

        {/* Card 3: Top Current Streak */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Top Active Streak
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {data?.currentStreakHighlight?.streak || 0}
              </span>
              <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
                streak
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {data?.currentStreakHighlight?.habitName || 'Start a streak today!'}
            </p>
          </div>
        </div>

        {/* Card 4: Longest Streak Highlight */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Best All-Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {data?.longestStreakHighlight?.streak || 0}
              </span>
              <span className="text-xs font-bold uppercase text-violet-600 dark:text-violet-400">
                best
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {data?.longestStreakHighlight?.habitName || 'Record to beat'}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Activity Summary Bar */}
      {data?.weeklyActivity && data.weeklyActivity.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                7-Day Activity Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Completed vs scheduled occurrences this week
              </p>
            </div>
            <button
              onClick={() => navigate('/stats')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {data.weeklyActivity.map((day) => {
              const pct = day.totalScheduled > 0 ? Math.round((day.completed / day.totalScheduled) * 100) : 0;
              const isToday = day.date === data.todayLocalDate;

              return (
                <div
                  key={day.date}
                  className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                    isToday
                      ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    {day.dayLabel}
                  </span>
                  <div className="my-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {day.completed}
                    <span className="text-[10px] text-slate-400 font-normal">/{day.totalScheduled}</span>
                  </div>
                  {/* Mini gauge */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-indigo-500' : 'bg-transparent'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Habits Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Today's Scheduled Habits
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mark items complete as you progress through your day
            </p>
          </div>
          <button
            onClick={() => navigate('/habits')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Manage All Habits <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {scheduledTodayHabits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              No habits scheduled for today
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              You either completed all your routines or today is a scheduled rest day!
            </p>
            <button
              onClick={() => {
                setSelectedHabit(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create a Daily Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledTodayHabits.map((h: any) => (
              <HabitCard
                key={h.id}
                habit={h}
                todayDate={data!.todayLocalDate}
                onToggleComplete={handleToggleComplete}
                onEdit={(habitToEdit) => {
                  setSelectedHabit(habitToEdit);
                  setIsModalOpen(true);
                }}
                onArchive={(habitToArchive) => setConfirmArchiveHabit(habitToArchive)}
                onDelete={(habitToDelete) => setConfirmDeleteHabit(habitToDelete)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        initialHabit={selectedHabit}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedHabit(null);
        }}
        onSubmit={handleCreateOrUpdateHabit}
      />

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!confirmArchiveHabit}
        title="Archive Habit?"
        message={`Are you sure you want to archive "${confirmArchiveHabit?.name}"? Its completion history and streak statistics will be safely preserved.`}
        confirmLabel="Archive Habit"
        onConfirm={handleArchive}
        onClose={() => setConfirmArchiveHabit(null)}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteHabit}
        title="Permanently Delete Habit?"
        message={`Are you sure you want to permanently delete "${confirmDeleteHabit?.name}"? All associated completion records will be deleted. This cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDestructive={true}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteHabit(null)}
      />
    </div>
  );
};
