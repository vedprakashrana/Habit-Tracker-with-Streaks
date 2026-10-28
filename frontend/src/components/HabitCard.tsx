import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Habit } from '../types';
import { renderHabitIcon } from '../utils/iconMap';
import {
  Flame,
  Trophy,
  Check,
  MoreVertical,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Clock,
  Calendar,
} from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  todayDate: string;
  onToggleComplete: (habitId: string, isCompleted: boolean) => Promise<void>;
  onEdit?: (habit: Habit) => void;
  onArchive?: (habit: Habit) => void;
  onRestore?: (habit: Habit) => void;
  onDelete?: (habit: Habit) => void;
  isArchivedView?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  todayDate,
  onToggleComplete,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  isArchivedView = false,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isCompleted = habit.isCompletedToday || false;
  const isScheduled = habit.isScheduledToday ?? true;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggling) return;
    try {
      setToggling(true);
      await onToggleComplete(habit.id, isCompleted);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/habits/${habit.id}`)}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Icon + Color + Title + Dropdown Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${habit.color}15`,
                color: habit.color,
                border: `1px solid ${habit.color}30`,
              }}
            >
              {renderHabitIcon(habit.icon, 'w-6 h-6')}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 text-base">
                {habit.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {habit.scheduleLabel || 'Daily'}
                </span>
                {habit.reminderTime && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                    • <Clock className="w-3 h-3" />
                    {habit.reminderTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Menu button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              aria-label="Habit options"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-30 w-40 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 animate-scale-in text-sm">
                  {onEdit && !isArchivedView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(habit);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                      Edit Habit
                    </button>
                  )}
                  {isArchivedView && onRestore && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onRestore(habit);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                  )}
                  {!isArchivedView && onArchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onArchive(habit);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(habit);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Optional Description */}
        {habit.description && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {habit.description}
          </p>
        )}
      </div>

      {/* Bottom Footer: Streaks + Complete Toggle */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Current streak badge */}
          <div
            title="Current Streak"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold">{habit.currentStreak || 0}</span>
            <span className="text-[10px] uppercase font-semibold text-amber-600/80 dark:text-amber-400/80">
              streak
            </span>
          </div>

          {/* Longest streak badge */}
          <div
            title="Longest Streak Record"
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 text-xs"
          >
            <Trophy className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{habit.longestStreak || 0}</span>
            <span className="text-[10px] uppercase text-slate-400">best</span>
          </div>
        </div>

        {/* Prominent Completion Button */}
        {!isArchivedView && (
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                : isScheduled
                ? 'bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                isCompleted
                  ? 'border-white bg-white/20'
                  : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
              }`}
            >
              {isCompleted && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </div>
            <span>
              {isCompleted ? 'Completed' : isScheduled ? 'Mark Done' : 'Optional Today'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
