import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckSquare,
  Clock,
  Target,
  Flame,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  Timer,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  calculateDailyPlannerProgress,
  calculateTaskCompletion,
  calculateTimetableAdherence,
  calculateAverageGoalProgress,
  calculateStudyStreak,
  getGreeting,
} from '@/lib/calculations';
import {
  todayStr,
  formatDateFull,
  formatTime,
  daysUntil,
  formatDateShort,
} from '@/lib/date-utils';
import { MOTIVATIONAL_QUOTES, PRIORITY_COLORS } from '@/lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const {
    activities,
    tasks,
    timetableSessions,
    goals,
    examinations,
    assignments,
    focusSessions,
    subjects,
    updateActivity,
  } = useApp();
  const navigate = useNavigate();

  const today = todayStr();

  // Quote of the day (stable per day)
  const quote = useMemo(() => {
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  }, []);

  // Filter activities for today
  const todayActivities = useMemo(() => {
    return activities.filter((a) => a.activity_date === today);
  }, [activities, today]);

  // CARD 1: DAILY PLANNER PROGRESS
  const plannerStats = useMemo(() => {
    return calculateDailyPlannerProgress(todayActivities);
  }, [todayActivities]);

  // CARD 2: TASK COMPLETION
  const taskStats = useMemo(() => {
    return calculateTaskCompletion(tasks);
  }, [tasks]);

  // CARD 3: TIMETABLE ADHERENCE
  const timetableStats = useMemo(() => {
    return calculateTimetableAdherence(timetableSessions);
  }, [timetableSessions]);

  // CARD 4: STUDY GOAL PROGRESS
  const averageGoalProgress = useMemo(() => {
    return calculateAverageGoalProgress(goals);
  }, [goals]);

  // Study Streak
  const streakDays = useMemo(() => {
    return calculateStudyStreak(activities);
  }, [activities]);

  // Today's focus minutes
  const todayFocusMinutes = useMemo(() => {
    return focusSessions
      .filter((s) => s.started_at?.startsWith(today) && s.completed)
      .reduce((acc, s) => acc + s.duration_minutes, 0);
  }, [focusSessions, today]);

  // Next upcoming class / session today
  const nextClass = useMemo(() => {
    return timetableSessions
      .filter((s) => s.status !== 'cancelled' && (s.session_date === today || !s.session_date))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
  }, [timetableSessions, today]);

  // Upcoming examinations (sorted by proximity)
  const upcomingExams = useMemo(() => {
    return examinations
      .filter((e) => e.exam_date >= today)
      .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
      .slice(0, 3);
  }, [examinations, today]);

  // Upcoming assignments (sorted by deadline)
  const upcomingAssignments = useMemo(() => {
    return assignments
      .filter((a) => a.status !== 'completed' && a.status !== 'submitted')
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 4);
  }, [assignments]);

  // Today's Top Priorities (from high/urgent tasks & activities)
  const topPriorities = useMemo(() => {
    const urgentTasks = tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => {
        const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
      })
      .slice(0, 3);
    return urgentTasks;
  }, [tasks]);

  const handleToggleActivity = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateActivity(id, {
      status: nextStatus as any,
      actual_minutes: nextStatus === 'completed' ? 60 : null,
    });
  };

  const getSubjectName = (subId: string | null) => {
    if (!subId) return null;
    return subjects.find((s) => s.id === subId);
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Greeting & Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white shadow-xl shadow-indigo-900/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-medium backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{formatDateFull(new Date())}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-xs md:text-sm text-indigo-200/90 italic max-w-2xl">
            &ldquo;{quote}&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <Flame className="h-6 w-6 text-amber-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs text-indigo-200 font-medium">Study Streak</span>
              <span className="text-lg font-bold text-white leading-tight">
                {streakDays} {streakDays === 1 ? 'Day' : 'Days'} 🔥
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <Timer className="h-6 w-6 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs text-indigo-200 font-medium">Today's Focus</span>
              <span className="text-lg font-bold text-white leading-tight">
                {todayFocusMinutes} mins
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 INDEPENDENT PROGRESS CARDS (MANDATORY REQUIREMENT) ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: DAILY PLANNER PROGRESS */}
        <Card className="hover:shadow-md transition-shadow border-indigo-100 dark:border-indigo-900/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Daily Planner
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {plannerStats.completed}
                <span className="text-xs font-normal text-gray-400"> / {plannerStats.total}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {plannerStats.pending} pending &bull; {plannerStats.remainingHours}h left
              </p>
              <button
                onClick={() => navigate('/planner')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 mt-2"
              >
                <span>Open planner</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <ProgressRing
              value={plannerStats.percentage}
              size={76}
              strokeWidth={7}
              color="#6366f1"
            />
          </CardContent>
        </Card>

        {/* CARD 2: TASK COMPLETION */}
        <Card className="hover:shadow-md transition-shadow border-violet-100 dark:border-violet-900/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Task Completion
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {taskStats.completed}
                <span className="text-xs font-normal text-gray-400"> / {taskStats.total}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {taskStats.pending} pending &bull; {taskStats.overdue} overdue
              </p>
              <button
                onClick={() => navigate('/tasks')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 mt-2"
              >
                <span>View tasks</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <ProgressRing
              value={taskStats.percentage}
              size={76}
              strokeWidth={7}
              color="#8b5cf6"
            />
          </CardContent>
        </Card>

        {/* CARD 3: TIMETABLE ADHERENCE */}
        <Card className="hover:shadow-md transition-shadow border-emerald-100 dark:border-emerald-900/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Timetable Adherence
            </CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {timetableStats.completed}
                <span className="text-xs font-normal text-gray-400"> / {timetableStats.total}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {timetableStats.actualHours}h attended of {timetableStats.plannedHours}h
              </p>
              <button
                onClick={() => navigate('/timetable')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 mt-2"
              >
                <span>View timetable</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <ProgressRing
              value={timetableStats.percentage}
              size={76}
              strokeWidth={7}
              color="#10b981"
            />
          </CardContent>
        </Card>

        {/* CARD 4: STUDY GOAL PROGRESS */}
        <Card className="hover:shadow-md transition-shadow border-amber-100 dark:border-amber-900/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Study Goals
            </CardTitle>
            <Target className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {averageGoalProgress}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Across {goals.filter((g) => g.status === 'active').length} active goals
              </p>
              <button
                onClick={() => navigate('/goals')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 mt-2"
              >
                <span>Track goals</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <ProgressRing
              value={averageGoalProgress}
              size={76}
              strokeWidth={7}
              color="#f59e0b"
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── Main 2-Column Overview ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Planned Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Today's Schedule & Activities</CardTitle>
                <CardDescription className="text-xs">
                  {todayActivities.length} activities scheduled for today
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/planner')}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Activity</span>
              </Button>
            </CardHeader>
            <CardContent>
              {todayActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No activities planned for today. Jump to Daily Planner to organize your schedule!
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {todayActivities.slice(0, 6).map((activity) => {
                    const isDone = activity.status === 'completed';
                    const sub = getSubjectName(activity.subject_id);
                    return (
                      <div
                        key={activity.id}
                        className="py-3 flex items-center justify-between gap-3 group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleActivity(activity.id, activity.status)}
                            className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-600'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="h-4 w-4" />}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isDone
                                  ? 'line-through text-gray-400 dark:text-gray-500'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="font-mono">
                                {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                              </span>
                              {sub && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    backgroundColor: `${sub.color}15`,
                                    color: sub.color,
                                  }}
                                >
                                  {sub.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant={isDone ? 'success' : 'secondary'}
                          className="shrink-0 capitalize text-[10px]"
                        >
                          {activity.category}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Top Priorities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Top Academic Priorities</CardTitle>
                <CardDescription className="text-xs">
                  Critical assignments and tasks requiring your focus
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tasks')}
                className="text-xs text-indigo-600"
              >
                All Tasks &rarr;
              </Button>
            </CardHeader>
            <CardContent>
              {topPriorities.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  All urgent tasks completed! Great work.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topPriorities.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                            {task.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              PRIORITY_COLORS[task.priority]
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Due {formatDateShort(task.due_date)} at {formatTime(task.due_time || '18:00')}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/tasks')}
                        className="text-xs shrink-0"
                      >
                        Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span) */}
        <div className="space-y-6">
          {/* Next Upcoming Class Card */}
          <Card className="border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-gray-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Next Upcoming Class
                </CardTitle>
                <Clock className="h-4 w-4 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextClass ? (
                <>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">
                      {nextClass.title}
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      {formatTime(nextClass.start_time)} - {formatTime(nextClass.end_time)}
                    </p>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {nextClass.location && (
                      <p>
                        📍 <b>Room:</b> {nextClass.location}
                      </p>
                    )}
                    {nextClass.teacher && (
                      <p>
                        👨‍🏫 <b>Instructor:</b> {nextClass.teacher}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate('/timetable')}
                  >
                    Manage Class Timetable
                  </Button>
                </>
              ) : (
                <div className="text-center py-4 text-xs text-gray-500">
                  No upcoming classes scheduled for today.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Examinations Countdown */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Exam Countdown
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingExams.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No upcoming exams logged.</p>
              ) : (
                upcomingExams.map((exam) => {
                  const left = daysUntil(exam.exam_date);
                  return (
                    <div
                      key={exam.id}
                      className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                          {exam.title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDateShort(exam.exam_date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-extrabold px-2 py-1 rounded-md ${
                            left <= 3
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          }`}
                        >
                          {left <= 0 ? 'TODAY' : `${left}d left`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/examinations')}
              >
                View Syllabus Checklist &rarr;
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Upcoming Deadlines
              </CardTitle>
              <BookOpen className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-2.5">
              {upcomingAssignments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">All assignments submitted.</p>
              ) : (
                upcomingAssignments.map((ass) => (
                  <div
                    key={ass.id}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                        {ass.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Due {formatDateShort(ass.deadline)}
                      </p>
                    </div>
                    <Badge variant="warning" className="text-[10px] shrink-0 uppercase">
                      {ass.priority}
                    </Badge>
                  </div>
                ))
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/assignments')}
              >
                Track Assignments &rarr;
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
