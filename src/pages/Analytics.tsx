import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Clock,
  Target,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  calculateDailyPlannerProgress,
  calculateTaskCompletion,
  calculateTimetableAdherence,
  calculateGoalProgress,
  calculateAverageGoalProgress,
} from '@/lib/calculations';
import { todayStr, subDays, format, getDurationBetweenTimes } from '@/lib/date-utils';

export default function Analytics() {
  const { activities, tasks, timetableSessions, goals } = useApp();

  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('7');

  const today = todayStr();
  const daysLimit = Number(dateRange);

  // ─── 1. DAILY PLANNER ANALYTICS DATA ────────────────────────────────
  const dailyPlannerHistory = useMemo(() => {
    const list: { date: string; displayDate: string; completed: number; total: number; percentage: number }[] = [];

    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dStr = format(d, 'yyyy-MM-dd');
      const dayActs = activities.filter((a) => a.activity_date === dStr && a.status !== 'cancelled');
      const comp = dayActs.filter((a) => a.status === 'completed').length;
      const pct = dayActs.length > 0 ? Math.round((comp / dayActs.length) * 100) : 0;

      list.push({
        date: dStr,
        displayDate: format(d, 'MMM d'),
        completed: comp,
        total: dayActs.length,
        percentage: pct,
      });
    }
    return list;
  }, [activities, daysLimit]);

  const plannedVsActualTime = useMemo(() => {
    let plannedMin = 0;
    let actualMin = 0;
    let postponedCount = 0;

    activities.forEach((a) => {
      if (a.status === 'cancelled') return;
      const est = a.estimated_minutes || getDurationBetweenTimes(a.start_time, a.end_time);
      plannedMin += Math.max(0, est);
      if (a.status === 'completed') {
        actualMin += a.actual_minutes || est;
      }
      if (a.status === 'postponed') {
        postponedCount++;
      }
    });

    return {
      plannedHours: Math.round((plannedMin / 60) * 10) / 10,
      actualHours: Math.round((actualMin / 60) * 10) / 10,
      postponedCount,
    };
  }, [activities]);

  const todayPlannerStats = useMemo(() => {
    const todays = activities.filter((a) => a.activity_date === today);
    return calculateDailyPlannerProgress(todays);
  }, [activities, today]);

  // ─── 2. TASK ANALYTICS DATA ─────────────────────────────────────────
  const taskStats = useMemo(() => calculateTaskCompletion(tasks), [tasks]);

  const taskStatusDistribution = useMemo(() => {
    return [
      { name: 'Completed', value: taskStats.completed, color: '#10b981' },
      { name: 'Pending / To Do', value: taskStats.pending, color: '#6366f1' },
      { name: 'Overdue', value: taskStats.overdue, color: '#ef4444' },
    ].filter((x) => x.value > 0);
  }, [taskStats]);

  // ─── 3. TIMETABLE ANALYTICS DATA ────────────────────────────────────
  const timetableStats = useMemo(() => calculateTimetableAdherence(timetableSessions), [
    timetableSessions,
  ]);

  const timetableStatusPie = useMemo(() => {
    return [
      { name: 'Attended', value: timetableStats.completed, color: '#10b981' },
      { name: 'Missed', value: timetableStats.missed, color: '#ef4444' },
      {
        name: 'Scheduled',
        value: Math.max(0, timetableStats.total - timetableStats.completed - timetableStats.missed),
        color: '#3b82f6',
      },
    ].filter((x) => x.value > 0);
  }, [timetableStats]);

  // ─── 4. STUDY GOAL ANALYTICS DATA ───────────────────────────────────
  const goalStats = useMemo(() => {
    const active = goals.filter((g) => g.status === 'active');
    const completed = goals.filter(
      (g) => g.status === 'completed' || calculateGoalProgress(g) >= 100
    );
    const avg = calculateAverageGoalProgress(goals);

    const goalBarData = goals.slice(0, 6).map((g) => ({
      name: g.title.slice(0, 15) + (g.title.length > 15 ? '...' : ''),
      target: g.target_value,
      achieved: g.achieved_value,
      progress: calculateGoalProgress(g),
    }));

    return { active: active.length, completed: completed.length, avg, goalBarData };
  }, [goals]);

  return (
    <div className="space-y-8">
      {/* ─── Control Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h2 className="font-bold text-base text-gray-900 dark:text-white">
            Performance & Academic Analytics
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">History Range:</span>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ════ SECTION 1: DAILY PLANNER ANALYTICS ═══════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white uppercase tracking-wide">
            1. Daily Planner Analytics
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Daily Completion Stats */}
          <Card className="p-5 flex flex-col justify-between border-indigo-100 dark:border-indigo-900/40">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Today's Daily Completion
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                {todayPlannerStats.percentage}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {todayPlannerStats.completed} completed of {todayPlannerStats.total} eligible planned
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
              <span>Overdue activities: <b>{todayPlannerStats.overdue}</b></span>
              <span>Postponed: <b>{plannedVsActualTime.postponedCount}</b></span>
            </div>
          </Card>

          {/* Card 2: Planned vs Actual Hours */}
          <Card className="p-5 flex flex-col justify-between border-indigo-100 dark:border-indigo-900/40">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Planned vs Actual Time
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                  {plannedVsActualTime.actualHours}h{' '}
                  <span className="text-xs font-normal text-gray-400">
                    actually completed of {plannedVsActualTime.plannedHours}h scheduled
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
              Ratio:{' '}
              <b>
                {plannedVsActualTime.plannedHours > 0
                  ? Math.round(
                      (plannedVsActualTime.actualHours / plannedVsActualTime.plannedHours) * 100
                    )
                  : 0}
                %
              </b>{' '}
              time efficiency
            </div>
          </Card>

          {/* Card 3: Completion History Bar Chart */}
          <Card className="p-4 md:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Completion Rate Trend (%)
            </p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPlannerHistory}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="displayDate" fontSize={10} />
                  <YAxis domain={[0, 100]} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* ════ SECTION 2: TASK ANALYTICS ════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-violet-600" />
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white uppercase tracking-wide">
            2. Task Analytics & Completion Trends
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 flex flex-col justify-between border-violet-100 dark:border-violet-900/40">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Task Completion Ratio
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                {taskStats.percentage}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {taskStats.completed} completed &bull; {taskStats.pending} pending &bull;{' '}
                {taskStats.overdue} overdue
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              Cancelled tasks automatically excluded from denominator
            </div>
          </Card>

          <Card className="p-4 md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Task Status Distribution
            </p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" fontSize={10} />
                  <YAxis dataKey="name" type="category" fontSize={10} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* ════ SECTION 3: TIMETABLE ANALYTICS ═══════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" />
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white uppercase tracking-wide">
            3. Timetable Adherence Analytics
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 flex flex-col justify-between border-emerald-100 dark:border-emerald-900/40">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Timetable Adherence
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                {timetableStats.percentage}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {timetableStats.completed} attended &bull; {timetableStats.missed} missed
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
              Attended: <b>{timetableStats.actualHours}h</b> / {timetableStats.plannedHours}h
            </div>
          </Card>

          <Card className="p-4 md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Class Attendance Breakdown
            </p>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timetableStatusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {timetableStatusPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* ════ SECTION 4: STUDY GOAL ANALYTICS ══════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500" />
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white uppercase tracking-wide">
            4. Study Goal Analytics
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 flex flex-col justify-between border-amber-100 dark:border-amber-900/40">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Average Target Progress
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                {goalStats.avg}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {goalStats.completed} goals achieved &bull; {goalStats.active} active in progress
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              Progress capped strictly at 100% per goal
            </div>
          </Card>

          <Card className="p-4 md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Individual Goal Achieved vs Target
            </p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalStats.goalBarData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="achieved" fill="#f59e0b" name="Achieved" />
                  <Bar dataKey="target" fill="#d1d5db" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
