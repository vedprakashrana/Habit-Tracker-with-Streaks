import React, { useState } from 'react';
import { Check, X, Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

interface QuickCorrectionStripProps {
  habitId: string;
  habitColor?: string;
  completedDates: string[]; // List of YYYY-MM-DD
  todayDate: string; // YYYY-MM-DD
  isScheduledOnDate: (date: string) => boolean;
  onToggleDate: (date: string, willBeCompleted: boolean) => Promise<void>;
}

export const QuickCorrectionStrip: React.FC<QuickCorrectionStripProps> = ({
  habitId,
  habitColor = '#6366F1',
  completedDates,
  todayDate,
  isScheduledOnDate,
  onToggleDate,
}) => {
  const [loadingDate, setLoadingDate] = useState<string | null>(null);

  // Generate today and past 7 days (8 days total)
  const days: { dateStr: string; label: string; dayNum: string; isToday: boolean }[] = [];
  try {
    const todayParsed = parseISO(todayDate);
    for (let i = 7; i >= 0; i--) {
      const d = subDays(todayParsed, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      days.push({
        dateStr,
        label: i === 0 ? 'Today' : format(d, 'EEE'),
        dayNum: format(d, 'd'),
        isToday: i === 0,
      });
    }
  } catch {
    // fallback if date parse fails
  }

  const handleToggle = async (dateStr: string, isCurrentlyCompleted: boolean) => {
    if (loadingDate) return;
    try {
      setLoadingDate(dateStr);
      await onToggleDate(dateStr, !isCurrentlyCompleted);
    } finally {
      setLoadingDate(null);
    }
  };

  const completedSet = new Set(completedDates);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            7-Day Completion History & Quick Correction
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any day within the last 7 days to mark done or undo completion
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Editable Window
        </div>
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 mt-4">
        {days.map((item) => {
          const isDone = completedSet.has(item.dateStr);
          const isSched = isScheduledOnDate(item.dateStr);
          const isLoading = loadingDate === item.dateStr;

          return (
            <button
              key={item.dateStr}
              onClick={() => handleToggle(item.dateStr, isDone)}
              disabled={isLoading || !isSched}
              title={
                !isSched
                  ? `${item.dateStr}: Not scheduled for this habit`
                  : `${item.dateStr}: Click to ${isDone ? 'unmark' : 'mark completed'}`
              }
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 ${
                isDone
                  ? 'border-transparent text-white shadow-sm'
                  : isSched
                  ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  : 'bg-slate-50/50 dark:bg-slate-900 border-slate-100 dark:border-slate-800/50 text-slate-400 cursor-not-allowed opacity-50'
              } ${item.isToday ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
              style={
                isDone
                  ? {
                      backgroundColor: habitColor,
                      boxShadow: `0 4px 12px ${habitColor}30`,
                    }
                  : {}
              }
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isDone
                    ? 'text-white/90'
                    : item.isToday
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>

              <span
                className={`text-lg font-bold my-1 ${
                  isDone ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {item.dayNum}
              </span>

              <div className="mt-0.5">
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin inline-block" />
                ) : isDone ? (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </div>
                ) : isSched ? (
                  <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-indigo-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Off</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
