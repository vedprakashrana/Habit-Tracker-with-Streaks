import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Habit } from '../types';
import { HabitCard } from '../components/HabitCard';
import { HabitModal } from '../components/HabitModal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Archive,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const HabitsPage: React.FC = () => {
  const { showToast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayDate, setTodayDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [confirmArchiveHabit, setConfirmArchiveHabit] = useState<Habit | null>(null);
  const [confirmRestoreHabit, setConfirmRestoreHabit] = useState<Habit | null>(null);
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState<Habit | null>(null);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const isArchived = activeTab === 'archived';
      const res = await api.getHabits(isArchived);
      setHabits(res.habits || []);
      setTodayDate(res.today);
    } catch (err: any) {
      showToast(err.message || 'Failed to load habits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [activeTab]);

  const handleToggleComplete = async (habitId: string, isCurrentlyCompleted: boolean) => {
    try {
      if (isCurrentlyCompleted) {
        await api.removeCompletion(habitId, todayDate);
        showToast('Habit marked as incomplete for today', 'info');
      } else {
        await api.setCompletion(habitId, todayDate);
        showToast('Habit marked completed! 🎉', 'success');
      }
      fetchHabits();
    } catch (err: any) {
      showToast(err.message || 'Error updating completion', 'error');
    }
  };

  const handleCreateOrUpdate = async (formData: any) => {
    if (selectedHabit) {
      await api.updateHabit(selectedHabit.id, formData);
      showToast('Habit updated successfully', 'success');
    } else {
      await api.createHabit(formData);
      showToast('New habit created!', 'success');
    }
    setSelectedHabit(null);
    fetchHabits();
  };

  const handleArchive = async () => {
    if (!confirmArchiveHabit) return;
    try {
      await api.archiveHabit(confirmArchiveHabit.id);
      showToast('Habit archived successfully.', 'info');
      fetchHabits();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive habit', 'error');
    }
  };

  const handleRestore = async () => {
    if (!confirmRestoreHabit) return;
    try {
      await api.restoreHabit(confirmRestoreHabit.id);
      showToast('Habit restored to active routine!', 'success');
      fetchHabits();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore habit', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteHabit) return;
    try {
      await api.deleteHabit(confirmDeleteHabit.id);
      showToast('Habit permanently deleted.', 'info');
      fetchHabits();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete habit', 'error');
    }
  };

  // Filtered habits
  const filteredHabits = habits.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSchedule =
      scheduleFilter === 'ALL' || h.scheduleType === scheduleFilter;

    return matchesSearch && matchesSchedule;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Habit Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize, monitor, and refine your routines and schedules
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedHabit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Navigation Tabs + Search + Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Tabs: Active vs Archived */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Habits
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'archived'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Archived Habits
          </button>
        </div>

        {/* Search & Schedule Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Schedule Type Select */}
          <div className="relative w-full sm:w-auto">
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Schedules</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKDAYS">Selected Weekdays</option>
              <option value="TIMES_PER_WEEK">Times Per Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Habits Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {activeTab === 'archived' ? 'No archived habits' : 'No habits found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {activeTab === 'archived'
              ? 'Archived habits will appear here with all preserved historical streaks.'
              : 'Create your first habit or adjust your search filters!'}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => {
                setSelectedHabit(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Habit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              todayDate={todayDate}
              isArchivedView={activeTab === 'archived'}
              onToggleComplete={handleToggleComplete}
              onEdit={(habitToEdit) => {
                setSelectedHabit(habitToEdit);
                setIsModalOpen(true);
              }}
              onArchive={(habitToArchive) => setConfirmArchiveHabit(habitToArchive)}
              onRestore={(habitToRestore) => setConfirmRestoreHabit(habitToRestore)}
              onDelete={(habitToDelete) => setConfirmDeleteHabit(habitToDelete)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <HabitModal
        isOpen={isModalOpen}
        initialHabit={selectedHabit}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedHabit(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      <ConfirmModal
        isOpen={!!confirmArchiveHabit}
        title="Archive Habit?"
        message={`Are you sure you want to archive "${confirmArchiveHabit?.name}"? Its completion history and streak statistics will remain safely preserved.`}
        confirmLabel="Archive Habit"
        onConfirm={handleArchive}
        onClose={() => setConfirmArchiveHabit(null)}
      />

      <ConfirmModal
        isOpen={!!confirmRestoreHabit}
        title="Restore Habit?"
        message={`Restore "${confirmRestoreHabit?.name}" back to your active dashboard?`}
        confirmLabel="Restore Habit"
        onConfirm={handleRestore}
        onClose={() => setConfirmRestoreHabit(null)}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteHabit}
        title="Permanently Delete Habit?"
        message={`Are you sure you want to permanently delete "${confirmDeleteHabit?.name}"? All completions and streak records will be removed.`}
        confirmLabel="Delete Permanently"
        isDestructive={true}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteHabit(null)}
      />
    </div>
  );
};
