import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Bell,
  ArrowRight,
  BookOpen,
  GraduationCap,
  ListTodo,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { GoogleCalendarIcon } from './GoogleCalendarIcon';
import {
  addTaskToGoogleCalendar,
  addExamToGoogleCalendar,
  addAssignmentToGoogleCalendar,
  addActivityToGoogleCalendar,
  downloadStudyScheduleICS,
  openGoogleCalendarWeb,
} from '@/lib/google-calendar';
import { formatDateShort } from '@/lib/date-utils';

interface GoogleCalendarSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleCalendarSyncModal({ open, onOpenChange }: GoogleCalendarSyncModalProps) {
  const { activities, tasks, examinations, assignments, timetableSessions, subjects } = useApp();
  const [activeTab, setActiveTab] = useState<'quick' | 'bulk' | 'guide'>('quick');

  const getSubName = (subId?: string | null) => subjects.find((s) => s.id === subId)?.name;

  const upcomingTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 5);
  const upcomingExams = examinations.slice(0, 5);
  const upcomingAssignments = assignments.filter((a) => a.status !== 'completed' && a.status !== 'submitted').slice(0, 5);
  const todayActivities = activities.filter((a) => a.status !== 'cancelled').slice(0, 5);

  const handleDownloadAll = () => {
    downloadStudyScheduleICS({
      activities,
      tasks,
      examinations,
      assignments,
      timetableSessions,
      subjects,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
              <GoogleCalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                Google Calendar Reminders & Sync
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Sync deadlines, exam alerts, and timetable sessions directly into your Google Calendar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="quick" className="text-xs">
              Quick Reminders
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs">
              Full Calendar (.ics)
            </TabsTrigger>
            <TabsTrigger value="guide" className="text-xs">
              How It Works
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Quick Add Reminders */}
          <TabsContent value="quick" className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                Click any item below to open Google Calendar with pre-configured reminders!
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={openGoogleCalendarWeb}
                className="h-7 text-xs text-blue-600 dark:text-blue-400 gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 shrink-0 font-semibold"
              >
                Open GCal <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> Upcoming Exams (Automatic 1-Day & 2-Hour Alerts)
                </h4>
                <div className="space-y-1.5">
                  {upcomingExams.map((exm) => {
                    const sub = getSubName(exm.subject_id);
                    return (
                      <div
                        key={exm.id}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{exm.title}</p>
                          <p className="text-[11px] text-gray-500">
                            {formatDateShort(exm.exam_date)} &bull; {exm.exam_time || '09:30'} {sub ? `&bull; ${sub}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addExamToGoogleCalendar(exm, sub)}
                          className="h-7 text-xs gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                        >
                          <GoogleCalendarIcon className="h-3.5 w-3.5" />
                          <span>Add Reminder</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <ListTodo className="h-3.5 w-3.5" /> Tasks with Deadlines
                </h4>
                <div className="space-y-1.5">
                  {upcomingTasks.map((tsk) => {
                    const sub = getSubName(tsk.subject_id);
                    return (
                      <div
                        key={tsk.id}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{tsk.title}</p>
                          <p className="text-[11px] text-gray-500">
                            Due {formatDateShort(tsk.due_date)} {tsk.due_time ? `at ${tsk.due_time}` : ''} {sub ? `&bull; ${sub}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addTaskToGoogleCalendar(tsk, sub)}
                          className="h-7 text-xs gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                        >
                          <GoogleCalendarIcon className="h-3.5 w-3.5" />
                          <span>Add Reminder</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assignments */}
            {upcomingAssignments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Pending Assignments
                </h4>
                <div className="space-y-1.5">
                  {upcomingAssignments.map((ass) => {
                    const sub = getSubName(ass.subject_id);
                    return (
                      <div
                        key={ass.id}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{ass.title}</p>
                          <p className="text-[11px] text-gray-500">
                            Due {formatDateShort(ass.deadline)} {sub ? `&bull; ${sub}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addAssignmentToGoogleCalendar(ass, sub)}
                          className="h-7 text-xs gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                        >
                          <GoogleCalendarIcon className="h-3.5 w-3.5" />
                          <span>Add Reminder</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Bulk Export / Import (.ics) */}
          <TabsContent value="bulk" className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    One-Click Complete Schedule Export
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                    Downloads an RFC-5545 compliant <code className="bg-white/80 dark:bg-gray-900 px-1 py-0.5 rounded font-mono text-[11px]">.ics</code> file with all your classes, study sessions, deadlines, and exams configured with automated alarms & push notifications.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  onClick={handleDownloadAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold text-xs h-9"
                >
                  <Download className="h-4 w-4" />
                  <span>Download StudyFlow Calendar (.ics)</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={openGoogleCalendarWeb}
                  className="gap-2 text-xs h-9 border-blue-200 text-blue-700 dark:text-blue-300 dark:border-blue-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Go to Google Calendar</span>
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 text-xs">
              <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                How to Import into Google Calendar (Takes 30 seconds):
              </h5>
              <ol className="space-y-2 list-decimal list-inside text-gray-600 dark:text-gray-300 pl-1 leading-relaxed">
                <li>
                  Click the blue <strong>"Download StudyFlow Calendar (.ics)"</strong> button above.
                </li>
                <li>
                  Open{' '}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-semibold"
                  >
                    Google Calendar (calendar.google.com)
                  </a>
                  .
                </li>
                <li>
                  Click the <strong>Settings Cog ⚙️</strong> in the top-right corner &rarr; select <strong>Settings</strong>.
                </li>
                <li>
                  In the left sidebar, click <strong>"Import & export"</strong> &rarr; <strong>"Import"</strong>.
                </li>
                <li>
                  Select the downloaded <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">studyflow_calendar.ics</code> file and choose which calendar to import to.
                </li>
                <li>
                  Click <strong>Import</strong>. Done! All your study sessions, exams, and timetable alerts will sync across all your phones, tablets, and smartwatches.
                </li>
              </ol>
            </div>
          </TabsContent>

          {/* TAB 3: How Reminders Work */}
          <TabsContent value="guide" className="space-y-4 text-xs">
            <div className="space-y-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                Automatic Google Calendar Notifications Configured:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20">
                  <p className="font-bold text-rose-700 dark:text-rose-300">🎯 Examinations</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                    Triggers 2 push notifications: <strong>24 hours before</strong> for final preparation, and <strong>2 hours before</strong> on exam day.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20">
                  <p className="font-bold text-indigo-700 dark:text-indigo-300">📚 Tasks & To-Dos</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                    Triggers a reminder <strong>30 minutes before</strong> task deadline time with priority level and task notes.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20">
                  <p className="font-bold text-amber-700 dark:text-amber-300">📝 Assignments</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                    Triggers an urgent submission reminder <strong>4 hours before</strong> the midnight deadline.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20">
                  <p className="font-bold text-teal-700 dark:text-teal-300">🏛️ Weekly Class Timetable</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                    Includes classroom location, instructor name, and recurring weekly schedule.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
