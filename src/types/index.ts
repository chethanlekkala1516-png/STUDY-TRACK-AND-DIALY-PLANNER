// ─── Priority & Status Types ───────────────────────────────────────
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type ActivityStatus = 'pending' | 'completed' | 'cancelled' | 'postponed';
export type ActivityCategory =
  | 'study' | 'college' | 'homework' | 'assignment'
  | 'revision' | 'exercise' | 'personal' | 'break' | 'other';
export type SessionStatus =
  | 'upcoming' | 'in_progress' | 'completed' | 'missed' | 'skipped' | 'cancelled';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'submitted';
export type PreparationStatus = 'not_started' | 'in_progress' | 'ready';
export type Recurrence = 'once' | 'weekly' | 'biweekly';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  institution: string | null;
  course: string | null;
  semester: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: Priority;
  start_date: string | null;
  due_date: string;
  due_time: string | null;
  estimated_minutes: number | null;
  status: TaskStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  subject_id: string | null;
  linked_task_id: string | null;
  linked_session_id: string | null;
  title: string;
  description: string | null;
  activity_date: string;
  start_time: string;
  end_time: string;
  category: ActivityCategory;
  priority: Priority;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  status: ActivityStatus;
  notes: string | null;
  created_at: string;
}

export interface TimetableSession {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  teacher: string | null;
  location: string | null;
  recurrence: Recurrence;
  session_date: string | null;
  status: SessionStatus;
  created_at: string;
}

export interface StudyGoal {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  target_value: number;
  achieved_value: number;
  unit: string;
  start_date: string | null;
  deadline: string | null;
  status: GoalStatus;
  created_at: string;
}

export interface Examination {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  exam_date: string;
  exam_time: string | null;
  syllabus: string | null;
  important_questions: string | null;
  preparation_status: PreparationStatus;
  notes: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  deadline: string;
  priority: Priority;
  status: AssignmentStatus;
  notes: string | null;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  subject_id: string | null;
  duration_minutes: number;
  session_type: 'focus' | 'break' | 'long_break';
  completed: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface DailyReflection {
  id: string;
  user_id: string;
  reflection_date: string;
  morning_notes: string | null;
  evening_notes: string | null;
  daily_objectives: string | null;
  top_priorities: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  content: string;
  note_type: 'general' | 'study' | 'revision' | 'journal';
  created_at: string;
  updated_at: string;
}

export interface SyllabusItem {
  topic: string;
  checked: boolean;
}

export interface PlannerProgress {
  percentage: number;
  completed: number;
  pending: number;
  overdue: number;
  total: number;
  remainingHours: number;
}

export interface TaskProgress {
  percentage: number;
  completed: number;
  pending: number;
  overdue: number;
  total: number;
}

export interface TimetableProgress {
  percentage: number;
  completed: number;
  missed: number;
  total: number;
  actualHours: number;
  plannedHours: number;
}
