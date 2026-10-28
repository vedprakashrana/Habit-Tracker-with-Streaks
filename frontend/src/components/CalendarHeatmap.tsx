import React, { useState } from 'react';
import { HeatmapDay } from '../types';

interface CalendarHeatmapProps {
  days: HeatmapDay[];
  habitColor?: string;
  habitName?: string;
  totalCompleted?: number;
  totalScheduled?: number;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  days,
  habitColor = '#6366F1',
  habitName,
  totalCompleted = 0,
  totalScheduled = 0,
}) => {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Group days into 26 weeks (columns)
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Calculate month labels above weeks
  const monthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, colIdx) => {
    const firstDay = week[0];
    if (firstDay && firstDay.month !== lastMonth) {
      monthLabels.push({ label: firstDay.month, colIndex: colIdx });
      lastMonth = firstDay.month;
    }
  });

  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getCellClass = (day: HeatmapDay) => {
    switch (day.status) {
      case 'completed':
        return 'hover:scale-125 transition-transform duration-150 z-10';
      case 'missed':
        return 'bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 hover:scale-125 transition-transform duration-150';
      case 'unscheduled':
        return 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800';
      case 'future':
        return 'bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 opacity-60';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getStatusText = (day: HeatmapDay) => {
    if (day.status === 'future') return 'Future date';
    if (day.status === 'completed') return 'Completed';
    if (day.status === 'missed') return 'Missed scheduled day';
    return 'Not scheduled';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      {/* Header with completion summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            6-Month Consistency Heatmap
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Past 26 calendar weeks across local days
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {totalCompleted}
            </span>
            <span className="text-slate-500">completions</span>
          </div>
          {totalScheduled > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.round((totalCompleted / totalScheduled) * 100)}%
              </span>
              <span className="text-slate-500">completion rate</span>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Grid Overflow Container */}
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="min-w-[680px]">
          {/* Month Labels */}
          <div className="flex text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2 pl-9">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                style={{
                  minWidth: `${(m.colIndex === 0 ? 1 : m.colIndex) * 20}px`,
                  textAlign: 'left',
                }}
                className="inline-block"
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid: Weekdays on left + Week columns */}
          <div className="flex items-start gap-2">
            {/* Weekday indicators (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between h-[116px] text-[10px] font-medium text-slate-400 dark:text-slate-500 pr-1 select-none">
              <span>Mon</span>
              <span className="text-transparent">Tue</span>
              <span>Wed</span>
              <span className="text-transparent">Thu</span>
              <span>Fri</span>
              <span className="text-transparent">Sat</span>
              <span>Sun</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex items-center gap-1.5">
              {weeks.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1.5">
                  {week.map((day) => {
                    const isCompleted = day.status === 'completed';
                    return (
                      <div
                        key={day.date}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay(day);
                          setTooltipPos({
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        style={
                          isCompleted
                            ? {
                                backgroundColor: habitColor,
                                boxShadow: `0 1px 4px ${habitColor}40`,
                              }
                            : {}
                        }
                        className={`w-3.5 h-3.5 rounded-sm cursor-pointer ${getCellClass(day)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip */}
      {hoveredDay && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none bg-slate-900 dark:bg-slate-800 text-white rounded-lg px-2.5 py-1.5 text-xs shadow-xl border border-slate-700 whitespace-nowrap animate-fade-in"
        >
          <div className="font-semibold">{hoveredDay.date}</div>
          <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                hoveredDay.status === 'completed'
                  ? 'bg-emerald-400'
                  : hoveredDay.status === 'missed'
                  ? 'bg-rose-400'
                  : hoveredDay.status === 'future'
                  ? 'bg-slate-400'
                  : 'bg-slate-500'
              }`}
            />
            {getStatusText(hoveredDay)}
          </div>
        </div>
      )}

      {/* Accessible Legend */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: habitColor }}
            />
            <span>Completed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800" />
            <span>Missed scheduled</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <span>Unscheduled</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700" />
            <span>Future</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          Unscheduled days do not break streaks
        </span>
      </div>
    </div>
  );
};
