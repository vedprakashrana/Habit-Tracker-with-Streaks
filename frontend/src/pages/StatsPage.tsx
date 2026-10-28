import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { StatsResponse } from '../types';
import { renderHabitIcon } from '../utils/iconMap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Flame,
  Sparkles,
} from 'lucide-react';

export const StatsPage: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getStats(30);
      setStats(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const overall = stats?.overall || {
    totalCompleted: 0,
    totalEligible: 0,
    completionRate: 0,
  };

  const missedTotal = Math.max(0, overall.totalEligible - overall.totalCompleted);

  // Prepare data for Daily Activity Area Chart
  const dailyChartData =
    stats?.dailyActivity.map((d) => ({
      date: d.date.substring(5), // MM-DD
      dayLabel: d.dayLabel,
      completions: d.completedCount,
    })) || [];

  // Prepare data for Habit Comparison Bar Chart
  const habitComparisonData =
    stats?.perHabit.map((h) => ({
      name: h.habitName.length > 15 ? `${h.habitName.substring(0, 15)}...` : h.habitName,
      rate: h.completionRate,
      color: h.habitColor,
    })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            30-Day Completion Statistics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Evaluation window:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {stats?.range.startDate} to {stats?.range.endDate}
            </span>{' '}
            (30 calendar days)
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Local Timezone Normalized</span>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Overall Completion Rate */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overall Completion Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                {overall.completionRate}%
              </span>
              <span className="text-xs text-slate-500">
                ({overall.totalCompleted} / {overall.totalEligible} scheduled)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Formula: Completed / Eligible Scheduled Occurrences × 100
            </p>
          </div>
        </div>

        {/* Card 2: Completed Scheduled Occurrences */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Completed Occurrences
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100">
              {overall.totalCompleted}
            </span>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Valid habit completions recorded
            </p>
          </div>
        </div>

        {/* Card 3: Missed Scheduled Occurrences */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Missed Scheduled Days
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100">
              {missedTotal}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Unscheduled days are never penalized
            </p>
          </div>
        </div>
      </div>

      {/* Chart 1: 30-Day Daily Activity Velocity */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Daily Check-in Volume
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total habit completions per calendar day over the last 30 days
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-700">
                        <div className="font-bold">{d.date} ({d.dayLabel})</div>
                        <div className="text-indigo-300 mt-0.5">{d.completions} completions</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="completions"
                stroke="#6366F1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCompletions)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Per-Habit Comparison */}
      {habitComparisonData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Habit Performance Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              30-day completion rate (%) across all active habits
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-700">
                          <div className="font-bold">{d.name}</div>
                          <div className="text-emerald-400 mt-0.5">{d.rate}% completion rate</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rate" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          Detailed Habit Breakdown (Previous 30 Days)
        </h3>

        {stats?.perHabit.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No active habits available for comparison.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Habit</th>
                  <th className="pb-3">Schedule</th>
                  <th className="pb-3">Current Streak</th>
                  <th className="pb-3">Best Streak</th>
                  <th className="pb-3">Eligible</th>
                  <th className="pb-3">Completed</th>
                  <th className="pb-3">Missed</th>
                  <th className="pb-3 pr-2 text-right">30-Day Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {stats?.perHabit.map((h) => (
                  <tr key={h.habitId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pl-2 flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${h.habitColor}15`,
                          color: h.habitColor,
                        }}
                      >
                        {renderHabitIcon(h.habitIcon, 'w-4 h-4')}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {h.habitName}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      {h.scheduleLabel}
                    </td>
                    <td className="py-3.5 text-amber-600 dark:text-amber-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        {h.currentStreak}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      {h.longestStreak}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      {h.eligibleCount}
                    </td>
                    <td className="py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      {h.completedCount}
                    </td>
                    <td className="py-3.5 text-rose-500 font-semibold">
                      {h.missedCount}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <span className="inline-flex items-center gap-1 font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                        {h.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
