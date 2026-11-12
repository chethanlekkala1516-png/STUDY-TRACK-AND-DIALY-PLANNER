import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  SkipForward,
  Trash2,
  FileEdit,
  MapPin,
  User,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ProgressRing } from '@/components/ui/progress-ring';
import { EmptyState } from '@/components/ui/empty-state';
import { calculateTimetableAdherence } from '@/lib/calculations';
import {
  todayStr,
  formatTime,
  getDayName,
  getDurationBetweenTimes,
  formatDateShort,
} from '@/lib/date-utils';
import { STATUS_COLORS } from '@/lib/utils';
import { toast } from '@/lib/notifications';
import type { TimetableSession, SessionStatus, Recurrence } from '@/types';

const DAYS = [
  { index: 1, name: 'Monday' },
  { index: 2, name: 'Tuesday' },
  { index: 3, name: 'Wednesday' },
  { index: 4, name: 'Thursday' },
  { index: 5, name: 'Friday' },
  { index: 6, name: 'Saturday' },
  { index: 0, name: 'Sunday' },
];

export default function Timetable() {
  const { timetableSessions, subjects, addSession, updateSession, deleteSession } = useApp();

  const [currentView, setCurrentView] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TimetableSession | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:30');
  const [formTeacher, setFormTeacher] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formRecurrence, setFormRecurrence] = useState<Recurrence>('weekly');
  const [formSessionDate, setFormSessionDate] = useState(todayStr());
  const [formStatus, setFormStatus] = useState<SessionStatus>('upcoming');

  // Adherence stats using exact requirement formula
  const stats = useMemo(() => {
    return calculateTimetableAdherence(timetableSessions);
  }, [timetableSessions]);

  const openCreateDialog = (dayIndex?: number) => {
    setEditingSession(null);
    setFormTitle('');
    setFormSubjectId('none');
    setFormDayOfWeek(dayIndex !== undefined ? dayIndex : 1);
    setFormStartTime('09:00');
    setFormEndTime('10:30');
    setFormTeacher('');
    setFormLocation('');
    setFormRecurrence('weekly');
    setFormSessionDate(todayStr());
    setFormStatus('upcoming');
    setDialogOpen(true);
  };

  const openEditDialog = (sess: TimetableSession) => {
    setEditingSession(sess);
    setFormTitle(sess.title);
    setFormSubjectId(sess.subject_id || 'none');
    setFormDayOfWeek(sess.day_of_week);
    setFormStartTime(sess.start_time);
    setFormEndTime(sess.end_time);
    setFormTeacher(sess.teacher || '');
    setFormLocation(sess.location || '');
    setFormRecurrence(sess.recurrence);
    setFormSessionDate(sess.session_date || todayStr());
    setFormStatus(sess.status);
    setDialogOpen(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Session title is required', type: 'warning' });
      return;
    }
    const payload = {
      title: formTitle.trim(),
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      day_of_week: Number(formDayOfWeek),
      start_time: formStartTime,
      end_time: formEndTime,
      teacher: formTeacher.trim() || null,
      location: formLocation.trim() || null,
      recurrence: formRecurrence,
      session_date: formSessionDate,
      status: formStatus,
    };

    if (editingSession) {
      await updateSession(editingSession.id, payload);
    } else {
      await addSession(payload);
    }
    setDialogOpen(false);
  };

  const handleStartSession = async (sess: TimetableSession) => {
    await updateSession(sess.id, { status: 'in_progress' });
    toast({ title: `Started session: ${sess.title}`, type: 'info' });
  };

  const handleCompleteSession = async (sess: TimetableSession) => {
    await updateSession(sess.id, { status: 'completed' });
    toast({ title: `Completed class session: ${sess.title}`, type: 'success' });
  };

  const handleMarkMissed = async (sess: TimetableSession) => {
    await updateSession(sess.id, { status: 'missed' });
    toast({ title: `Session marked as missed`, type: 'warning' });
  };

  const handleSkipSession = async (sess: TimetableSession) => {
    await updateSession(sess.id, { status: 'skipped' });
    toast({ title: `Session skipped`, type: 'info' });
  };

  const getSubject = (subId: string | null) => {
    if (!subId) return null;
    return subjects.find((s) => s.id === subId);
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Stats Bar ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between border-emerald-100 dark:border-emerald-900/30">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Timetable Adherence
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {stats.percentage}%
            </p>
            <p className="text-[11px] text-gray-400">
              {stats.completed} of {stats.total} eligible sessions
            </p>
          </div>
          <ProgressRing value={stats.percentage} size={56} strokeWidth={6} color="#10b981" />
        </Card>

        <Card className="p-4 border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Attended Sessions
          </p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.completed}
          </p>
          <p className="text-[11px] text-gray-400">Classes marked complete</p>
        </Card>

        <Card className="p-4 border-rose-100 dark:border-rose-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Missed Sessions
          </p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {stats.missed}
          </p>
          <p className="text-[11px] text-gray-400">Eligible but uncompleted</p>
        </Card>

        <Card className="p-4 border-indigo-100 dark:border-indigo-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Attended Hours
          </p>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
            {stats.actualHours}h
            <span className="text-xs font-normal text-gray-400"> / {stats.plannedHours}h</span>
          </p>
          <p className="text-[11px] text-gray-400">Actual vs planned class time</p>
        </Card>
      </div>

      {/* ─── Control Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Class & Lecture Schedule</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-0.5">
            <Button
              variant={currentView === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('weekly')}
              className="h-8 px-3 text-xs"
            >
              Weekly View
            </Button>
            <Button
              variant={currentView === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('daily')}
              className="h-8 px-3 text-xs"
            >
              Daily View
            </Button>
          </div>

          <Button onClick={() => openCreateDialog()} size="sm" className="h-8 gap-1.5 shadow-sm text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Session</span>
          </Button>
        </div>
      </div>

      {/* ─── VIEW 1: WEEKLY VIEW (MON - SUN) ─────────────────────────── */}
      {currentView === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAYS.map((day) => {
            const daySessions = timetableSessions
              .filter((s) => s.day_of_week === day.index)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            const isTodayDay = new Date().getDay() === day.index;

            return (
              <div
                key={day.index}
                className={`flex flex-col rounded-2xl border p-3 min-h-[380px] transition-all ${
                  isTodayDay
                    ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                    : 'border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                      {day.name}
                    </span>
                    {isTodayDay && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                    )}
                  </div>
                  <button
                    onClick={() => openCreateDialog(day.index)}
                    className="h-6 w-6 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-indigo-600"
                    title={`Add session to ${day.name}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Day Sessions */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {daySessions.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-[11px] text-gray-400 italic">
                      No classes
                    </div>
                  ) : (
                    daySessions.map((sess) => {
                      const sub = getSubject(sess.subject_id);
                      const isCompleted = sess.status === 'completed';
                      const isMissed = sess.status === 'missed';
                      const isFuture = sess.session_date && sess.session_date > todayStr();

                      return (
                        <div
                          key={sess.id}
                          className="p-3 rounded-xl border border-gray-200/70 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:shadow-sm transition-all space-y-2"
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftColor: sub?.color || '#6366f1',
                          }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-1">
                              {sess.title}
                            </h5>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                STATUS_COLORS[sess.status] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {sess.status}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                            <p className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                              {formatTime(sess.start_time)} – {formatTime(sess.end_time)}
                            </p>
                            {sess.location && (
                              <p className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span>{sess.location}</span>
                              </p>
                            )}
                            {sess.teacher && (
                              <p className="flex items-center gap-1 truncate">
                                <User className="h-3 w-3 shrink-0" />
                                <span>{sess.teacher}</span>
                              </p>
                            )}
                          </div>

                          {/* Quick session status actions */}
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              {sess.status === 'upcoming' && (
                                <button
                                  onClick={() => handleStartSession(sess)}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
                                  title="Start class session"
                                >
                                  <Play className="h-3 w-3" />
                                  <span>Start</span>
                                </button>
                              )}
                              {sess.status === 'in_progress' && (
                                <button
                                  onClick={() => handleCompleteSession(sess)}
                                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
                                  title="Mark completed"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Complete</span>
                                </button>
                              )}
                              {sess.status !== 'completed' && sess.status !== 'in_progress' && (
                                <button
                                  onClick={() => handleCompleteSession(sess)}
                                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold"
                                  title="Mark attended"
                                >
                                  Attend
                                </button>
                              )}
                              {sess.status !== 'missed' && !isCompleted && (
                                <button
                                  onClick={() => handleMarkMissed(sess)}
                                  className="text-[10px] text-rose-500 hover:text-rose-600 ml-1"
                                  title="Mark missed"
                                >
                                  Miss
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditDialog(sess)}
                                className="text-gray-400 hover:text-indigo-600 p-0.5"
                              >
                                <FileEdit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => deleteSession(sess.id)}
                                className="text-gray-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── VIEW 2: DAILY VIEW ──────────────────────────────────────── */}
      {currentView === 'daily' && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Daily Class Timetable</CardTitle>
              <CardDescription className="text-xs">
                Inspect details and status controls for a specific weekday
              </CardDescription>
            </div>
            <Select
              value={String(selectedDay)}
              onValueChange={(val) => setSelectedDay(Number(val))}
            >
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d.index} value={String(d.index)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {timetableSessions.filter((s) => s.day_of_week === selectedDay).length === 0 ? (
              <EmptyState
                icon={Clock}
                title={`No classes on ${getDayName(selectedDay)}`}
                description="Add regular lectures, labs, and study tutorials for this day."
                actionLabel="Add Session"
                onAction={() => openCreateDialog(selectedDay)}
              />
            ) : (
              <div className="space-y-3">
                {timetableSessions
                  .filter((s) => s.day_of_week === selectedDay)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((sess) => {
                    const sub = getSubject(sess.subject_id);

                    return (
                      <div
                        key={sess.id}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        style={{
                          borderLeftWidth: '5px',
                          borderLeftColor: sub?.color || '#6366f1',
                        }}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {sess.title}
                            </h4>
                            {sub && (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{ backgroundColor: `${sub.color}15`, color: sub.color }}
                              >
                                {sub.name}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {sess.recurrence}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                              {formatTime(sess.start_time)} – {formatTime(sess.end_time)}
                            </span>
                            {sess.location && <span>📍 {sess.location}</span>}
                            {sess.teacher && <span>👨‍🏫 {sess.teacher}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={sess.status}
                            onValueChange={(val) => updateSession(sess.id, { status: val as SessionStatus })}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs capitalize">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="missed">Missed</SelectItem>
                              <SelectItem value="skipped">Skipped</SelectItem>
                              <SelectItem value="cancelled">Cancelled (Excluded)</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(sess)}
                            className="h-8 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSession(sess.id)}
                            className="h-8 text-xs text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Add/Edit Timetable Session Dialog ───────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Edit Class Session' : 'Schedule Timetable Session'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSession} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sessTitle">Session Title *</Label>
              <Input
                id="sessTitle"
                placeholder="e.g. Operating Systems Lecture"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General / Unassigned</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Day of Week</Label>
                <Select
                  value={String(formDayOfWeek)}
                  onValueChange={(val) => setFormDayOfWeek(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.index} value={String(d.index)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sessStart">Start Time *</Label>
                <Input
                  id="sessStart"
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sessEnd">End Time *</Label>
                <Input
                  id="sessEnd"
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sessTeacher">Instructor / Professor</Label>
                <Input
                  id="sessTeacher"
                  placeholder="e.g. Dr. Tanenbaum"
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sessLoc">Classroom / Hall</Label>
                <Input
                  id="sessLoc"
                  placeholder="e.g. Hall B-205"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sessDate">Target Session Date</Label>
                <Input
                  id="sessDate"
                  type="date"
                  value={formSessionDate}
                  onChange={(e) => setFormSessionDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as SessionStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                    <SelectItem value="cancelled">Cancelled (Excluded)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingSession ? 'Save Session' : 'Create Session'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
