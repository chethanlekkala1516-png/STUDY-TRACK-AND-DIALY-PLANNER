import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  GraduationCap,
  CheckSquare,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  todayStr,
  getMonthDays,
  getWeekDays,
  format,
  isSameDay,
  formatTime,
  addDays,
  subDays,
  parseISO,
} from '@/lib/date-utils';
import { GoogleCalendarIcon } from '@/components/GoogleCalendarIcon';
import { GoogleCalendarSyncModal } from '@/components/GoogleCalendarSyncModal';
import {
  addTaskToGoogleCalendar,
  addActivityToGoogleCalendar,
  addExamToGoogleCalendar,
  addAssignmentToGoogleCalendar,
} from '@/lib/google-calendar';

export default function CalendarPage() {
  const { activities, tasks, timetableSessions, assignments, examinations, subjects } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [gcalModalOpen, setGcalModalOpen] = useState(false);

  const handleAddToGCal = (ev: { id: string; type: string; title: string; time: string }) => {
    const getSub = (subId?: string | null) => subjects.find((s) => s.id === subId)?.name;
    if (ev.type === 'activity') {
      const act = activities.find((a) => a.id === ev.id);
      if (act) addActivityToGoogleCalendar(act, getSub(act.subject_id));
    } else if (ev.type === 'task') {
      const tsk = tasks.find((t) => t.id === ev.id);
      if (tsk) addTaskToGoogleCalendar(tsk, getSub(tsk.subject_id));
    } else if (ev.type === 'examination') {
      const exm = examinations.find((e) => e.id === ev.id);
      if (exm) addExamToGoogleCalendar(exm, getSub(exm.subject_id));
    } else if (ev.type === 'assignment') {
      const ass = assignments.find((a) => a.id === ev.id);
      if (ass) addAssignmentToGoogleCalendar(ass, getSub(ass.subject_id));
    }
  };

  const today = todayStr();

  const nextPeriod = () => {
    if (viewMode === 'month') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const prevPeriod = () => {
    if (viewMode === 'month') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
    } else if (viewMode === 'week') {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Days for month view
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

  // Days for week view
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // Helper to fetch unified events for any day string
  const getDayEvents = (dateStr: string) => {
    const act = activities
      .filter((a) => a.activity_date === dateStr && a.status !== 'cancelled')
      .map((a) => ({
        id: a.id,
        type: 'activity',
        title: a.title,
        time: a.start_time,
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300',
      }));

    const tsk = tasks
      .filter((t) => t.due_date === dateStr && t.status !== 'cancelled')
      .map((t) => ({
        id: t.id,
        type: 'task',
        title: `Task: ${t.title}`,
        time: t.due_time || '18:00',
        color: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300',
      }));

    const ass = assignments
      .filter((as2) => as2.deadline === dateStr)
      .map((as2) => ({
        id: as2.id,
        type: 'assignment',
        title: `Assign: ${as2.title}`,
        time: '23:59',
        color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
      }));

    const exm = examinations
      .filter((e) => e.exam_date === dateStr)
      .map((e) => ({
        id: e.id,
        type: 'examination',
        title: `EXAM: ${e.title}`,
        time: e.exam_time || '09:00',
        color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 font-bold',
      }));

    return [...exm, ...act, ...tsk, ...ass];
  };

  return (
    <div className="space-y-6">
      {/* ─── Control Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-semibold"
              onClick={jumpToToday}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="font-extrabold text-base md:text-lg text-gray-900 dark:text-white">
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-gray-500 font-semibold mr-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Exam
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Activity
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-violet-500" /> Task
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Assignment
            </span>
          </div>

          <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-0.5">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="h-8 px-3 text-xs"
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="h-8 px-3 text-xs"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="h-8 px-3 text-xs"
            >
              Day
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setGcalModalOpen(true)}
            className="h-8 px-2.5 text-xs gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-medium"
          >
            <GoogleCalendarIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Google Calendar</span>
          </Button>
        </div>
      </div>

      {/* ─── VIEW 1: MONTH VIEW ──────────────────────────────────────── */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div
                  key={d}
                  className="text-center font-bold text-xs text-gray-400 uppercase py-2 border-b border-gray-100 dark:border-gray-800"
                >
                  {d}
                </div>
              ))}

              {monthDays.map((dateObj) => {
                const dateStr = format(dateObj, 'yyyy-MM-dd');
                const isCurToday = dateStr === today;
                const events = getDayEvents(dateStr);

                return (
                  <div
                    key={dateStr}
                    className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                      isCurToday
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-gray-200/70 dark:border-gray-800/80 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          isCurToday
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {format(dateObj, 'd')}
                      </span>
                      {events.length > 0 && (
                        <span className="text-[10px] font-semibold text-gray-400">
                          {events.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1 overflow-hidden">
                      {events.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] truncate border ${ev.color}`}
                          title={`${ev.time} - ${ev.title}`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <span className="text-[9px] text-gray-400 font-semibold pl-1">
                          +{events.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── VIEW 2: WEEK VIEW ───────────────────────────────────────── */}
      {viewMode === 'week' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {weekDays.map((dateObj) => {
                const dateStr = format(dateObj, 'yyyy-MM-dd');
                const isCurToday = dateStr === today;
                const events = getDayEvents(dateStr);

                return (
                  <div
                    key={dateStr}
                    className={`min-h-[300px] p-3 rounded-2xl border flex flex-col gap-2 ${
                      isCurToday
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className="pb-2 border-b border-gray-100 dark:border-gray-800 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {format(dateObj, 'EEE')}
                      </p>
                      <p
                        className={`text-lg font-black ${
                          isCurToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {format(dateObj, 'd')}
                      </p>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {events.length === 0 ? (
                        <span className="text-center block text-[11px] text-gray-400 pt-6 italic">
                          No events
                        </span>
                      ) : (
                        events.map((ev) => (
                          <div
                            key={ev.id}
                            className={`p-2 rounded-xl text-xs border space-y-0.5 ${ev.color}`}
                          >
                            <p className="font-semibold line-clamp-1">{ev.title}</p>
                            <p className="text-[10px] opacity-75 font-mono">{formatTime(ev.time)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── VIEW 3: DAY VIEW ────────────────────────────────────────── */}
      {viewMode === 'day' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">
              Day Schedule & Deadlines ({format(currentDate, 'EEEE, MMMM d, yyyy')})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getDayEvents(format(currentDate, 'yyyy-MM-dd')).length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                No scheduled activities, exam deadlines, or assignments for this specific date.
              </div>
            ) : (
              <div className="space-y-3">
                {getDayEvents(format(currentDate, 'yyyy-MM-dd')).map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${ev.color}`}
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold">{ev.title}</p>
                      <p className="text-xs opacity-80 uppercase font-bold tracking-wider">
                        {ev.type} &bull; {formatTime(ev.time)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToGCal(ev)}
                      className="h-8 px-2.5 text-xs gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 shrink-0 font-medium bg-white dark:bg-gray-900"
                      title="Add reminder to Google Calendar"
                    >
                      <GoogleCalendarIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Add Reminder</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Google Calendar Sync & Reminders Modal */}
      <GoogleCalendarSyncModal open={gcalModalOpen} onOpenChange={setGcalModalOpen} />
    </div>
  );
}
