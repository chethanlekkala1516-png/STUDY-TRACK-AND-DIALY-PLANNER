import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Copy,
  Trash2,
  CalendarDays,
  Sparkles,
  BookMarked,
  Filter,
  Layers,
  ArrowRight,
  FileEdit,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProgressRing } from '@/components/ui/progress-ring';
import { EmptyState } from '@/components/ui/empty-state';
import {
  todayStr,
  formatDateFull,
  formatTime,
  getNextDay,
  getPrevDay,
  getTimeSlots,
  parseTimeToMinutes,
  getDurationBetweenTimes,
  formatDuration,
} from '@/lib/date-utils';
import { calculateDailyPlannerProgress } from '@/lib/calculations';
import { CATEGORY_COLORS, PRIORITY_COLORS } from '@/lib/utils';
import { toast } from '@/lib/notifications';
import { GoogleCalendarIcon } from '@/components/GoogleCalendarIcon';
import { GoogleCalendarSyncModal } from '@/components/GoogleCalendarSyncModal';
import { addActivityToGoogleCalendar } from '@/lib/google-calendar';
import type { DailyActivity, ActivityCategory, Priority, ActivityStatus } from '@/types';

// Reusable Daily Templates
const TEMPLATES: Record<string, { label: string; activities: Partial<DailyActivity>[] }> = {
  college_day: {
    label: 'College Day (Classes & Evening Study)',
    activities: [
      { title: 'Morning Prep & Commute', start_time: '08:00', end_time: '08:45', category: 'personal', priority: 'medium' },
      { title: 'College Core Lectures Block', start_time: '09:00', end_time: '12:30', category: 'college', priority: 'high' },
      { title: 'Lunch & Social Break', start_time: '12:30', end_time: '13:30', category: 'break', priority: 'low' },
      { title: 'Afternoon Lab / Seminars', start_time: '13:30', end_time: '16:00', category: 'college', priority: 'medium' },
      { title: 'Outdoor Walk / Exercise', start_time: '17:00', end_time: '18:00', category: 'exercise', priority: 'low' },
      { title: 'Daily Assignment Work & Homework', start_time: '19:00', end_time: '20:30', category: 'homework', priority: 'urgent' },
      { title: 'Deep Study & Note Revision', start_time: '21:00', end_time: '22:30', category: 'study', priority: 'high' },
    ],
  },
  study_day: {
    label: 'Study Day (Deep Focus Blocks)',
    activities: [
      { title: 'Morning Review & Concept Mapping', start_time: '08:30', end_time: '10:30', category: 'study', priority: 'high' },
      { title: 'Short Walk & Coffee Break', start_time: '10:30', end_time: '11:00', category: 'break', priority: 'low' },
      { title: 'Problem Solving & Practice Set', start_time: '11:00', end_time: '13:00', category: 'homework', priority: 'urgent' },
      { title: 'Lunch & Relax', start_time: '13:00', end_time: '14:30', category: 'break', priority: 'low' },
      { title: 'Reading & Literature Review', start_time: '14:30', end_time: '16:30', category: 'study', priority: 'medium' },
      { title: 'Evening Mock Quiz / Flashcards', start_time: '19:00', end_time: '20:30', category: 'revision', priority: 'high' },
    ],
  },
  exam_prep: {
    label: 'Exam Preparation (Intensive Cramming)',
    activities: [
      { title: 'Formula & Proof Review Session', start_time: '07:30', end_time: '09:30', category: 'revision', priority: 'urgent' },
      { title: 'Past Year Exam Paper 1 (Timed)', start_time: '10:00', end_time: '13:00', category: 'study', priority: 'urgent' },
      { title: 'Nutritional Lunch & Rest', start_time: '13:00', end_time: '14:15', category: 'break', priority: 'low' },
      { title: 'Mistake Analysis & Weak Topic Drill', start_time: '14:30', end_time: '17:30', category: 'revision', priority: 'high' },
      { title: 'Evening High-Yield Summary Review', start_time: '19:30', end_time: '21:30', category: 'study', priority: 'high' },
    ],
  },
  weekend: {
    label: 'Weekend Balance (Study + Personal)',
    activities: [
      { title: 'Weekly Summary & Plan Next Week', start_time: '09:30', end_time: '11:00', category: 'study', priority: 'medium' },
      { title: 'Personal Projects & Coding Hobby', start_time: '11:30', end_time: '13:30', category: 'personal', priority: 'low' },
      { title: 'Leisure / Social Activities', start_time: '14:00', end_time: '18:00', category: 'break', priority: 'low' },
      { title: 'Light Reading / Podcast', start_time: '20:00', end_time: '21:30', category: 'personal', priority: 'low' },
    ],
  },
  holiday: {
    label: 'Holiday / Rest Day',
    activities: [
      { title: 'Recharge & Free Time', start_time: '10:00', end_time: '18:00', category: 'break', priority: 'low' },
    ],
  },
};

export default function DailyPlanner() {
  const {
    activities,
    subjects,
    tasks,
    timetableSessions,
    addActivity,
    updateActivity,
    deleteActivity,
    getReflection,
    saveReflection,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [gcalModalOpen, setGcalModalOpen] = useState(false);

  // Activity modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DailyActivity | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('study');
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');
  const [formLinkedTaskId, setFormLinkedTaskId] = useState<string>('none');
  const [formLinkedSessionId, setFormLinkedSessionId] = useState<string>('none');
  const [formStatus, setFormStatus] = useState<ActivityStatus>('pending');
  const [formNotes, setFormNotes] = useState('');

  // Daily reflections / objectives for this date
  const reflection = useMemo(() => getReflection(selectedDate), [selectedDate, getReflection]);
  const [objectivesText, setObjectivesText] = useState(reflection?.daily_objectives || '');
  const [morningText, setMorningText] = useState(reflection?.morning_notes || '');
  const [eveningText, setEveningText] = useState(reflection?.evening_notes || '');

  // Keep reflection inputs updated when date switches
  React.useEffect(() => {
    setObjectivesText(reflection?.daily_objectives || '');
    setMorningText(reflection?.morning_notes || '');
    setEveningText(reflection?.evening_notes || '');
  }, [reflection, selectedDate]);

  // Filter activities for selected date
  const dayActivities = useMemo(() => {
    return activities
      .filter((a) => a.activity_date === selectedDate)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [activities, selectedDate]);

  // Filtered list for list tab
  const filteredDayActivities = useMemo(() => {
    return dayActivities.filter((a) => {
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
      return true;
    });
  }, [dayActivities, filterCategory, filterPriority]);

  // Calculate stats using exact formula
  const stats = useMemo(() => {
    return calculateDailyPlannerProgress(dayActivities);
  }, [dayActivities]);

  // Detect schedule conflicts (overlapping intervals)
  const conflicts = useMemo(() => {
    const list = dayActivities.filter((a) => a.status !== 'cancelled');
    const setOfConflictedIds = new Set<string>();

    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const aStart = parseTimeToMinutes(a.start_time);
      const aEnd = parseTimeToMinutes(a.end_time);

      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const bStart = parseTimeToMinutes(b.start_time);
        const bEnd = parseTimeToMinutes(b.end_time);

        // Check overlap
        if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
          setOfConflictedIds.add(a.id);
          setOfConflictedIds.add(b.id);
        }
      }
    }
    return setOfConflictedIds;
  }, [dayActivities]);

  const openCreateDialog = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormDescription('');
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormCategory('study');
    setFormPriority('medium');
    setFormSubjectId('none');
    setFormLinkedTaskId('none');
    setFormLinkedSessionId('none');
    setFormStatus('pending');
    setFormNotes('');
    setDialogOpen(true);
  };

  const openEditDialog = (act: DailyActivity) => {
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormDescription(act.description || '');
    setFormStartTime(act.start_time);
    setFormEndTime(act.end_time);
    setFormCategory(act.category);
    setFormPriority(act.priority);
    setFormSubjectId(act.subject_id || 'none');
    setFormLinkedTaskId(act.linked_task_id || 'none');
    setFormLinkedSessionId(act.linked_session_id || 'none');
    setFormStatus(act.status);
    setFormNotes(act.notes || '');
    setDialogOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Activity title required', type: 'warning' });
      return;
    }
    const startMin = parseTimeToMinutes(formStartTime);
    const endMin = parseTimeToMinutes(formEndTime);
    if (endMin <= startMin) {
      toast({ title: 'End time must be after start time', type: 'error' });
      return;
    }

    const estimated = endMin - startMin;
    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      activity_date: selectedDate,
      start_time: formStartTime,
      end_time: formEndTime,
      category: formCategory,
      priority: formPriority,
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      linked_task_id: formLinkedTaskId === 'none' ? null : formLinkedTaskId,
      linked_session_id: formLinkedSessionId === 'none' ? null : formLinkedSessionId,
      estimated_minutes: estimated,
      status: formStatus,
      actual_minutes: formStatus === 'completed' ? estimated : null,
      notes: formNotes.trim() || null,
    };

    if (editingActivity) {
      await updateActivity(editingActivity.id, payload);
      toast({ title: 'Activity updated', type: 'success' });
    } else {
      await addActivity(payload);
    }
    setDialogOpen(false);
  };

  const handleToggleComplete = async (act: DailyActivity) => {
    const nextStatus: ActivityStatus = act.status === 'completed' ? 'pending' : 'completed';
    const dur = getDurationBetweenTimes(act.start_time, act.end_time);
    await updateActivity(act.id, {
      status: nextStatus,
      actual_minutes: nextStatus === 'completed' ? dur : null,
    });
  };

  const handleDuplicate = async (act: DailyActivity) => {
    await addActivity({
      ...act,
      title: `${act.title} (Copy)`,
      activity_date: selectedDate,
      status: 'pending',
      actual_minutes: null,
    });
    toast({ title: 'Activity duplicated', type: 'success' });
  };

  const handlePostpone = async (act: DailyActivity) => {
    const nextDay = getNextDay(selectedDate);
    await updateActivity(act.id, {
      activity_date: nextDay,
      status: 'postponed',
    });
    toast({ title: `Activity postponed to ${nextDay}`, type: 'info' });
  };

  const handleCancelActivity = async (act: DailyActivity) => {
    await updateActivity(act.id, {
      status: act.status === 'cancelled' ? 'pending' : 'cancelled',
    });
    toast({
      title: act.status === 'cancelled' ? 'Activity restored' : 'Activity cancelled (excluded from denominator)',
      type: 'info',
    });
  };

  const handleApplyTemplate = async (templateKey: string) => {
    const template = TEMPLATES[templateKey];
    if (!template) return;

    for (const act of template.activities) {
      const dur = getDurationBetweenTimes(act.start_time || '09:00', act.end_time || '10:00');
      await addActivity({
        title: act.title || 'Template Activity',
        activity_date: selectedDate,
        start_time: act.start_time || '09:00',
        end_time: act.end_time || '10:00',
        category: act.category || 'study',
        priority: act.priority || 'medium',
        estimated_minutes: dur,
        status: 'pending',
      });
    }
    toast({ title: `Template "${template.label}" applied!`, type: 'success' });
  };

  const handleSaveReflection = async () => {
    await saveReflection({
      reflection_date: selectedDate,
      daily_objectives: objectivesText,
      morning_notes: morningText,
      evening_notes: eveningText,
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Control Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
        {/* Date Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedDate(getPrevDay(selectedDate))}
              title="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-semibold"
              onClick={() => setSelectedDate(todayStr())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedDate(getNextDay(selectedDate))}
              title="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-base text-gray-900 dark:text-white">
              {formatDateFull(selectedDate)}
            </span>
          </div>
        </div>

        {/* Template & Add Activity Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Select onValueChange={handleApplyTemplate}>
            <SelectTrigger className="w-[190px] h-9 text-xs">
              <Layers className="h-3.5 w-3.5 mr-1 text-indigo-500" />
              <SelectValue placeholder="Load Day Template" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEMPLATES).map(([key, item]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setGcalModalOpen(true)}
            className="gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-medium"
          >
            <GoogleCalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Google Calendar</span>
          </Button>

          <Button onClick={openCreateDialog} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Add Activity</span>
          </Button>
        </div>
      </div>

      {/* ─── Conflict Warning Banner ────────────────────────────────── */}
      {conflicts.size > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <span>
            <b>Schedule Conflict Detected:</b> You have {conflicts.size} overlapping activities
            scheduled at the same time. Consider rescheduling one of them to prevent overload!
          </span>
        </div>
      )}

      {/* ─── Progress Stats Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 flex items-center justify-between border-indigo-100 dark:border-indigo-900/40">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Completion
            </p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              {stats.percentage}%
            </p>
          </div>
          <ProgressRing value={stats.percentage} size={48} strokeWidth={5} color="#6366f1" />
        </Card>

        <Card className="p-3.5 border-emerald-100 dark:border-emerald-900/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Completed
          </p>
          <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
            {stats.completed}
          </p>
          <span className="text-[10px] text-gray-400">Activities finished</span>
        </Card>

        <Card className="p-3.5 border-amber-100 dark:border-amber-900/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Pending
          </p>
          <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
            {stats.pending}
          </p>
          <span className="text-[10px] text-gray-400">Yet to complete</span>
        </Card>

        <Card className="p-3.5 border-rose-100 dark:border-rose-900/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Overdue
          </p>
          <p className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">
            {stats.overdue}
          </p>
          <span className="text-[10px] text-gray-400">Past time slot</span>
        </Card>

        <Card className="p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Total Scheduled
          </p>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
            {stats.total}
          </p>
          <span className="text-[10px] text-gray-400">Eligible activities</span>
        </Card>

        <Card className="p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Planned Hours Left
          </p>
          <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {stats.remainingHours}h
          </p>
          <span className="text-[10px] text-gray-400">Remaining focus time</span>
        </Card>
      </div>

      {/* ─── Main Content Tabs ───────────────────────────────────────── */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger value="timeline" className="gap-2 text-xs">
            <Clock className="h-4 w-4" />
            <span>Vertical Activity Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2 text-xs">
            <CalendarDays className="h-4 w-4" />
            <span>Activity Management List ({dayActivities.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reflections" className="gap-2 text-xs">
            <BookMarked className="h-4 w-4" />
            <span>Daily Objectives & Reflections</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: VERTICAL TIMELINE VIEW ─────────────────────────── */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Hour-by-Hour Timeline</CardTitle>
              <CardDescription className="text-xs">
                Visual daily schedule from 06:00 AM to 11:00 PM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dayActivities.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No activities scheduled for this date"
                  description="Load a daily template above or click 'Add Activity' to plan your hours."
                  actionLabel="Add Activity"
                  onAction={openCreateDialog}
                />
              ) : (
                <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-4 sm:ml-8 pl-4 sm:pl-6 space-y-6 py-2">
                  {dayActivities.map((act) => {
                    const hasConflict = conflicts.has(act.id);
                    const isDone = act.status === 'completed';
                    const isCancelled = act.status === 'cancelled';
                    const catColor = CATEGORY_COLORS[act.category] || '#6366f1';

                    return (
                      <div key={act.id} className="relative group">
                        {/* Timeline node */}
                        <div
                          className={`absolute -left-[25px] sm:-left-[33px] top-3 h-4 w-4 rounded-full border-2 border-white dark:border-gray-900 transition-transform group-hover:scale-125 ${
                            isDone
                              ? 'bg-emerald-500'
                              : isCancelled
                              ? 'bg-gray-400'
                              : hasConflict
                              ? 'bg-amber-500'
                              : 'bg-indigo-600'
                          }`}
                        />

                        {/* Activity Card */}
                        <div
                          className={`p-4 rounded-xl border transition-all ${
                            isDone
                              ? 'bg-emerald-50/30 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/40 opacity-80'
                              : isCancelled
                              ? 'bg-gray-100/50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700 opacity-60'
                              : hasConflict
                              ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800'
                              : 'bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-800 hover:shadow-md'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: catColor }}
                                />
                                <h4
                                  className={`font-bold text-sm ${
                                    isDone
                                      ? 'line-through text-gray-500 dark:text-gray-400'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {act.title}
                                </h4>
                                <Badge variant="secondary" className="text-[10px] capitalize">
                                  {act.category}
                                </Badge>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    PRIORITY_COLORS[act.priority]
                                  }`}
                                >
                                  {act.priority}
                                </span>
                                {hasConflict && (
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                                    Conflict
                                  </span>
                                )}
                              </div>

                              {act.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {act.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-1">
                                <span className="flex items-center gap-1 font-mono font-medium">
                                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                                  {formatTime(act.start_time)} – {formatTime(act.end_time)}
                                </span>
                                <span>
                                  ({formatDuration(getDurationBetweenTimes(act.start_time, act.end_time))})
                                </span>
                                {act.notes && (
                                  <span className="text-xs italic truncate max-w-xs">
                                    &ldquo;{act.notes}&rdquo;
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <Button
                                size="sm"
                                variant={isDone ? 'default' : 'outline'}
                                onClick={() => handleToggleComplete(act)}
                                className={`h-8 text-xs gap-1 ${
                                  isDone
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'hover:border-emerald-600 hover:text-emerald-600'
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addActivityToGoogleCalendar(act, subjects.find((s) => s.id === act.subject_id)?.name)}
                                className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                                title="Add reminder to Google Calendar"
                              >
                                <GoogleCalendarIcon className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditDialog(act)}
                                className="h-8 px-2 text-xs"
                                title="Edit"
                              >
                                <FileEdit className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDuplicate(act)}
                                className="h-8 px-2 text-xs"
                                title="Duplicate"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePostpone(act)}
                                className="h-8 px-2 text-xs text-orange-600 hover:bg-orange-50"
                                title="Postpone to tomorrow"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelActivity(act)}
                                className="h-8 px-2 text-xs text-gray-500"
                                title={isCancelled ? 'Restore activity' : 'Cancel activity'}
                              >
                                {isCancelled ? 'Restore' : 'Cancel'}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteActivity(act.id)}
                                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: ACTIVITY LIST VIEW ─────────────────────────────── */}
        <TabsContent value="list">
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">Activity Management List</CardTitle>
                <CardDescription className="text-xs">
                  Filter and batch review scheduled items
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDayActivities.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No matching activities found for this filter criteria.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredDayActivities.map((act) => (
                    <div
                      key={act.id}
                      className="py-3 flex items-center justify-between gap-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleComplete(act)}
                          className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                            act.status === 'completed'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {act.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              act.status === 'completed'
                                ? 'line-through text-gray-400'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {act.title}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {formatTime(act.start_time)} – {formatTime(act.end_time)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {act.category}
                        </Badge>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            PRIORITY_COLORS[act.priority]
                          }`}
                        >
                          {act.priority}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addActivityToGoogleCalendar(act, subjects.find((s) => s.id === act.subject_id)?.name)}
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                          title="Add reminder to Google Calendar"
                        >
                          <GoogleCalendarIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(act)}
                          className="h-8 w-8 p-0"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: DAILY REFLECTIONS & OBJECTIVES ─────────────────── */}
        <TabsContent value="reflections">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Daily Objectives & Top 3 Priorities</CardTitle>
                <CardDescription className="text-xs">
                  Set clear targets for {formatDateFull(selectedDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="objectives">Main Objectives</Label>
                  <Textarea
                    id="objectives"
                    rows={4}
                    placeholder="1. Finish 3 chapters of Algorithms&#10;2. Submit OS homework&#10;3. Attend networking seminar..."
                    value={objectivesText}
                    onChange={(e) => setObjectivesText(e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={handleSaveReflection} className="w-full">
                  Save Objectives
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Morning Planning & Evening Reflection</CardTitle>
                <CardDescription className="text-xs">
                  Keep a daily intentional study mindset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="morning">Morning Intentions</Label>
                  <Textarea
                    id="morning"
                    rows={2}
                    placeholder="What mindset will you bring to your studies today?"
                    value={morningText}
                    onChange={(e) => setMorningText(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="evening">Evening Reflection</Label>
                  <Textarea
                    id="evening"
                    rows={2}
                    placeholder="What did you learn? What can be optimized tomorrow?"
                    value={eveningText}
                    onChange={(e) => setEveningText(e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={handleSaveReflection} className="w-full">
                  Save Reflection Journal
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Add/Edit Activity Dialog ───────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Schedule New Activity'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveActivity} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="actTitle">Activity Title *</Label>
              <Input
                id="actTitle"
                placeholder="e.g. Dynamic Programming Study Session"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="actStart">Start Time *</Label>
                <Input
                  id="actStart"
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="actEnd">End Time *</Label>
                <Input
                  id="actEnd"
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={formCategory}
                  onValueChange={(v) => setFormCategory(v as ActivityCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={formPriority}
                  onValueChange={(v) => setFormPriority(v as Priority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject (Optional)</Label>
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / General</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(v) => setFormStatus(v as ActivityStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                    <SelectItem value="cancelled">Cancelled (Excluded)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actDesc">Description (Optional)</Label>
              <Input
                id="actDesc"
                placeholder="Brief summary of tasks in this block"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actNotes">Notes & Observations (Optional)</Label>
              <Textarea
                id="actNotes"
                placeholder="Important formulas, page numbers, or links"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingActivity ? 'Save Changes' : 'Create Activity'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
