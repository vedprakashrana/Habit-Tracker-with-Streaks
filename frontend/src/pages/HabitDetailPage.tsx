import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Habit, HeatmapResponse, HabitCompletion } from '../types';
import { CalendarHeatmap } from '../components/CalendarHeatmap';
import { QuickCorrectionStrip } from '../components/QuickCorrectionStrip';
import { HabitModal } from '../components/HabitModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { renderHabitIcon } from '../utils/iconMap';
import {
  Flame,
  Trophy,
  Calendar,
  Clock,
  ArrowLeft,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [recentCompletions, setRecentCompletions] = useState<HabitCompletion[]>([]);
  const [todayDate, setTodayDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchHabitData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [habitRes, heatmapRes] = await Promise.all([
        api.getHabitById(id),
        api.getHeatmap(id, 6),
      ]);
      setHabit(habitRes.habit);
      setRecentCompletions(habitRes.recentCompletions || []);
      setTodayDate(habitRes.today);
      setHeatmap(heatmapRes);
    } catch (err: any) {
      showToast(err.message || 'Error loading habit details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitData();
  }, [id]);

  const handleToggleDateCompletion = async (dateStr: string, willBeCompleted: boolean) => {
    if (!habit) return;
    try {
      if (willBeCompleted) {
        await api.setCompletion(habit.id, dateStr);
        showToast(`Marked completed for ${dateStr}! 🎉`, 'success');
      } else {
        await api.removeCompletion(habit.id, dateStr);
        showToast(`Completion removed for ${dateStr}`, 'info');
      }
      fetchHabitData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update date completion', 'error');
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!habit) return;
    try {
      await api.updateHabit(habit.id, formData);
      showToast('Habit updated successfully', 'success');
      setIsEditOpen(false);
      fetchHabitData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update habit', 'error');
    }
  };

  const handleArchive = async () => {
    if (!habit) return;
    try {
      await api.archiveHabit(habit.id);
      showToast('Habit archived.', 'info');
      navigate('/habits');
    } catch (err: any) {
      showToast(err.message || 'Failed to archive habit', 'error');
    }
  };

  const handleRestore = async () => {
    if (!habit) return;
    try {
      await api.restoreHabit(habit.id);
      showToast('Habit restored!', 'success');
      fetchHabitData();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore habit', 'error');
    }
  };

  const handleDelete = async () => {
    if (!habit) return;
    try {
      await api.deleteHabit(habit.id);
      showToast('Habit permanently deleted.', 'info');
      navigate('/habits');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete habit', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Habit not found
        </h2>
        <p className="text-sm text-slate-500 mt-2 mb-4">
          This habit might have been deleted or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/habits')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Habits
        </button>
      </div>
    );
  }

  // Helper to test if habit is scheduled on a given date for the 7-day strip
  const isScheduledOnDate = (dateStr: string) => {
    if (habit.scheduleType === 'DAILY' || habit.scheduleType === 'TIMES_PER_WEEK') {
      return true;
    }
    try {
      const d = parseISO(dateStr);
      const dow = d.getDay() === 0 ? 7 : d.getDay();
      const config = JSON.parse(habit.scheduleConfiguration || '{}');
      const weekdays: number[] = config.weekdays || [1, 2, 3, 4, 5];
      return weekdays.includes(dow);
    } catch {
      return true;
    }
  };

  const allCompletionsList = heatmap?.days
    .filter((d) => d.status === 'completed')
    .map((d) => d.date) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate('/habits')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Habits
      </button>

      {/* Habit Overview Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle background glow with habit's color */}
        <div
          className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: habit.color }}
        />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
              style={{
                backgroundColor: `${habit.color}15`,
                color: habit.color,
                border: `1px solid ${habit.color}35`,
              }}
            >
              {renderHabitIcon(habit.icon, 'w-8 h-8')}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {habit.name}
                </h1>
                {habit.archivedAt && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300">
                    Archived
                  </span>
                )}
              </div>

              {habit.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                  {habit.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {habit.scheduleLabel || 'Daily Schedule'}
                </span>

                {habit.reminderTime && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Reminder at {habit.reminderTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start">
            {!habit.archivedAt ? (
              <>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setConfirmArchive(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmRestore(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Habit
              </button>
            )}

            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Permanently"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {habit.currentStreak || 0}
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Current Streak
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {habit.longestStreak || 0}
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Longest Streak
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {habit.totalCompletions || 0}
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Total Check-ins
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {heatmap && heatmap.totalScheduled > 0
                  ? `${Math.round((heatmap.totalCompleted / heatmap.totalScheduled) * 100)}%`
                  : 'N/A'}
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                6-Month Rate
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Completion Correction Strip */}
      <QuickCorrectionStrip
        habitId={habit.id}
        habitColor={habit.color}
        completedDates={allCompletionsList}
        todayDate={todayDate}
        isScheduledOnDate={isScheduledOnDate}
        onToggleDate={handleToggleDateCompletion}
      />

      {/* 6-Month Heatmap */}
      {heatmap && (
        <CalendarHeatmap
          days={heatmap.days}
          habitColor={habit.color}
          habitName={habit.name}
          totalCompleted={heatmap.totalCompleted}
          totalScheduled={heatmap.totalScheduled}
        />
      )}

      {/* Recent Completions Log */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Recent Check-in Log
        </h4>

        {recentCompletions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No check-in history recorded yet. Complete this habit today!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto scrollbar-thin">
            {recentCompletions.map((comp) => (
              <div
                key={comp.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {comp.localDate}
                  </span>
                </div>
                <span className="text-slate-400">
                  {format(new Date(comp.completedAt), 'hh:mm a')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <HabitModal
        isOpen={isEditOpen}
        initialHabit={habit}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
      />

      <ConfirmModal
        isOpen={confirmArchive}
        title="Archive Habit?"
        message={`Are you sure you want to archive "${habit.name}"? It will be removed from your dashboard, but all streaks and completion data are preserved.`}
        confirmLabel="Archive Habit"
        onConfirm={handleArchive}
        onClose={() => setConfirmArchive(false)}
      />

      <ConfirmModal
        isOpen={confirmRestore}
        title="Restore Habit?"
        message={`Restore "${habit.name}" back to your active routines?`}
        confirmLabel="Restore Habit"
        onConfirm={handleRestore}
        onClose={() => setConfirmRestore(false)}
      />

      <ConfirmModal
        isOpen={confirmDelete}
        title="Permanently Delete Habit?"
        message={`Are you sure you want to delete "${habit.name}"? This action is permanent and will delete all historical records.`}
        confirmLabel="Delete Permanently"
        isDestructive={true}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
};
