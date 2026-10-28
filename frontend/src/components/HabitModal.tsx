import React, { useState, useEffect } from 'react';
import { Habit, ScheduleType } from '../types';
import { availableIcons, renderHabitIcon } from '../utils/iconMap';
import { X, Calendar, Clock, Palette, Sparkles } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialHabit?: Habit | null;
}

const colorPalette = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red / Rose
  '#8B5CF6', // Purple / Violet
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#F97316', // Orange
];

const weekdayOptions = [
  { day: 1, name: 'Mon' },
  { day: 2, name: 'Tue' },
  { day: 3, name: 'Wed' },
  { day: 4, name: 'Thu' },
  { day: 5, name: 'Fri' },
  { day: 6, name: 'Sat' },
  { day: 7, name: 'Sun' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialHabit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#6366F1');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('DAILY');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [targetPerWeek, setTargetPerWeek] = useState<number>(3);
  const [reminderTime, setReminderTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name || '');
      setDescription(initialHabit.description || '');
      setIcon(initialHabit.icon || 'Target');
      setColor(initialHabit.color || '#6366F1');
      setScheduleType(initialHabit.scheduleType || 'DAILY');
      setReminderTime(initialHabit.reminderTime || '');

      try {
        const config = JSON.parse(initialHabit.scheduleConfiguration || '{}');
        if (config.weekdays) {
          setSelectedWeekdays(config.weekdays);
        }
        if (config.targetPerWeek) {
          setTargetPerWeek(config.targetPerWeek);
        }
      } catch {
        // default
      }
    } else {
      // Reset defaults
      setName('');
      setDescription('');
      setIcon('Target');
      setColor('#6366F1');
      setScheduleType('DAILY');
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      setTargetPerWeek(3);
      setReminderTime('');
    }
    setError(null);
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const toggleWeekday = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      if (selectedWeekdays.length === 1) return; // Keep at least one
      setSelectedWeekdays(selectedWeekdays.filter((d) => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    let scheduleConfiguration: any = {};
    if (scheduleType === 'WEEKDAYS') {
      if (selectedWeekdays.length === 0) {
        setError('Please select at least one weekday');
        return;
      }
      scheduleConfiguration = { weekdays: selectedWeekdays };
    } else if (scheduleType === 'TIMES_PER_WEEK') {
      scheduleConfiguration = { targetPerWeek: Number(targetPerWeek) };
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        icon,
        color,
        scheduleType,
        scheduleConfiguration,
        reminderTime: reminderTime.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {initialHabit ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define your routine, flexible schedule, and visual identity
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Habit Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Habit Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 20 minutes daily"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this habit matters to your goals..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Icon & Color Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Icon
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 scrollbar-thin">
                {availableIcons.map((i) => {
                  const isSelected = icon === i.name;
                  return (
                    <button
                      key={i.name}
                      type="button"
                      onClick={() => setIcon(i.name)}
                      title={i.label}
                      className={`p-2 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {renderHabitIcon(i.name, 'w-4 h-4')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Color
              </label>
              <div className="grid grid-cols-4 gap-2 p-1.5">
                {colorPalette.map((c) => {
                  const isSelected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-8 rounded-lg transition-transform ${
                        isSelected ? 'scale-110 ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900 shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Schedule Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'DAILY' as ScheduleType, label: 'Every Day' },
                { type: 'WEEKDAYS' as ScheduleType, label: 'Specific Days' },
                { type: 'TIMES_PER_WEEK' as ScheduleType, label: 'X Times / Week' },
              ].map((s) => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => setScheduleType(s.type)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    scheduleType === s.type
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Weekdays selector */}
            {scheduleType === 'WEEKDAYS' && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-2 block font-medium">
                  Select scheduled weekdays:
                </span>
                <div className="flex items-center justify-between gap-1">
                  {weekdayOptions.map((w) => {
                    const isSelected = selectedWeekdays.includes(w.day);
                    return (
                      <button
                        key={w.day}
                        type="button"
                        onClick={() => toggleWeekday(w.day)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {w.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Times per week selector */}
            {scheduleType === 'TIMES_PER_WEEK' && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Weekly Completion Target:
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {targetPerWeek} times per week
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={targetPerWeek}
                  onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>1x</span>
                  <span>2x</span>
                  <span>3x</span>
                  <span>4x</span>
                  <span>5x</span>
                  <span>6x</span>
                  <span>7x</span>
                </div>
              </div>
            )}
          </div>

          {/* Reminder Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Optional Daily Reminder Time
            </label>
            <div className="relative">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {initialHabit ? 'Save Changes' : 'Create Habit'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
