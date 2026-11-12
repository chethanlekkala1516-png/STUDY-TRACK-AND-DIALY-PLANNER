import type {
  DailyActivity, Task, TimetableSession, StudyGoal,
  PlannerProgress, TaskProgress, TimetableProgress,
} from '@/types';
import { parseTimeToMinutes, getDurationBetweenTimes, isOverdue, todayStr } from './date-utils';

export function calculateDailyPlannerProgress(activities: DailyActivity[]): PlannerProgress {
  const eligible = activities.filter(a => a.status !== 'cancelled');
  const total = eligible.length;
  const completed = eligible.filter(a => a.status === 'completed').length;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const today = todayStr();

  const overdue = eligible.filter(a => {
    if (a.status === 'completed' || a.status === 'cancelled') return false;
    if (a.activity_date < today) return true;
    if (a.activity_date === today) {
      const endMin = parseTimeToMinutes(a.end_time);
      return currentMinutes > endMin;
    }
    return false;
  }).length;

  const pending = total - completed - overdue;
  const remainingMinutes = eligible
    .filter(a => a.status !== 'completed')
    .reduce((acc, a) => {
      const dur = a.estimated_minutes || getDurationBetweenTimes(a.start_time, a.end_time);
      return acc + Math.max(0, dur);
    }, 0);

  return {
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed,
    pending: Math.max(0, pending),
    overdue,
    total,
    remainingHours: Math.round((remainingMinutes / 60) * 10) / 10,
  };
}

export function calculateTaskCompletion(tasks: Task[]): TaskProgress {
  const eligible = tasks.filter(t => t.status !== 'cancelled');
  const total = eligible.length;
  const completed = eligible.filter(t => t.status === 'completed').length;
  const overdue = eligible.filter(t => {
    if (t.status === 'completed') return false;
    return isOverdue(t.due_date, t.due_time);
  }).length;
  const pending = total - completed - overdue;

  return {
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed,
    pending: Math.max(0, pending),
    overdue,
    total,
  };
}

export function calculateTimetableAdherence(sessions: TimetableSession[]): TimetableProgress {
  const today = todayStr();
  const eligible = sessions.filter(s => {
    if (s.status === 'cancelled') return false;
    if (!s.session_date) return false;
    return s.session_date <= today;
  });

  const total = eligible.length;
  const completed = eligible.filter(s => s.status === 'completed').length;
  const missed = eligible.filter(s => s.status === 'missed').length;

  const plannedMinutes = eligible.reduce((acc, s) => {
    return acc + Math.max(0, getDurationBetweenTimes(s.start_time, s.end_time));
  }, 0);

  const completedMinutes = eligible
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => {
      return acc + Math.max(0, getDurationBetweenTimes(s.start_time, s.end_time));
    }, 0);

  return {
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed,
    missed,
    total,
    actualHours: Math.round((completedMinutes / 60) * 10) / 10,
    plannedHours: Math.round((plannedMinutes / 60) * 10) / 10,
  };
}

export function calculateGoalProgress(goal: StudyGoal): number {
  if (!goal.target_value || goal.target_value === 0) return 0;
  return Math.min(100, Math.round((goal.achieved_value / goal.target_value) * 100));
}

export function calculateAverageGoalProgress(goals: StudyGoal[]): number {
  const activeGoals = goals.filter(g => g.status === 'active');
  if (activeGoals.length === 0) return 0;
  const sum = activeGoals.reduce((acc, g) => acc + calculateGoalProgress(g), 0);
  return Math.round(sum / activeGoals.length);
}

export function calculateStudyStreak(activities: DailyActivity[]): number {
  if (activities.length === 0) return 0;

  const completedDates = new Set<string>();
  activities
    .filter(a => a.status === 'completed')
    .forEach(a => completedDates.add(a.activity_date));

  const sortedDates = Array.from(completedDates).sort().reverse();
  if (sortedDates.length === 0) return 0;

  const today = todayStr();
  let streak = 0;
  let checkDate = today;

  // If today has no completed activities, start from yesterday
  if (!completedDates.has(today)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    checkDate = yesterday.toISOString().split('T')[0];
    if (!completedDates.has(checkDate)) return 0;
  }

  while (completedDates.has(checkDate)) {
    streak++;
    const d = new Date(checkDate);
    d.setDate(d.getDate() - 1);
    checkDate = d.toISOString().split('T')[0];
  }

  return streak;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
