import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from '@/lib/notifications';
import { todayStr, format, addDays, subDays } from '@/lib/date-utils';
import type {
  Subject, Task, DailyActivity, TimetableSession, StudyGoal,
  Examination, Assignment, FocusSession, DailyReflection, Note,
} from '@/types';

interface AppContextType {
  subjects: Subject[];
  tasks: Task[];
  activities: DailyActivity[];
  timetableSessions: TimetableSession[];
  goals: StudyGoal[];
  examinations: Examination[];
  assignments: Assignment[];
  focusSessions: FocusSession[];
  reflections: DailyReflection[];
  notes: Note[];
  loading: boolean;
  // Subjects
  addSubject: (data: Partial<Subject>) => Promise<Subject | null>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  // Tasks
  addTask: (data: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // Activities
  addActivity: (data: Partial<DailyActivity>) => Promise<DailyActivity | null>;
  updateActivity: (id: string, data: Partial<DailyActivity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  // Timetable
  addSession: (data: Partial<TimetableSession>) => Promise<TimetableSession | null>;
  updateSession: (id: string, data: Partial<TimetableSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  // Goals
  addGoal: (data: Partial<StudyGoal>) => Promise<StudyGoal | null>;
  updateGoal: (id: string, data: Partial<StudyGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // Exams
  addExam: (data: Partial<Examination>) => Promise<Examination | null>;
  updateExam: (id: string, data: Partial<Examination>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  // Assignments
  addAssignment: (data: Partial<Assignment>) => Promise<Assignment | null>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  // Focus
  addFocusSession: (data: Partial<FocusSession>) => Promise<FocusSession | null>;
  updateFocusSession: (id: string, data: Partial<FocusSession>) => Promise<void>;
  // Reflections
  saveReflection: (data: Partial<DailyReflection>) => Promise<void>;
  getReflection: (date: string) => DailyReflection | undefined;
  // Notes
  addNote: (data: Partial<Note>) => Promise<Note | null>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  // Reset demo seed
  resetToSampleData: () => void;
  // Refresh
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

// Helper for initial seed generation
function getInitialSeedData(userId: string) {
  const today = todayStr();
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const pastDay = format(subDays(new Date(), 2), 'yyyy-MM-dd');

  const subjects: Subject[] = [
    { id: 'sub-1', user_id: userId, name: 'Data Structures & Algorithms', color: '#6366f1', created_at: today },
    { id: 'sub-2', user_id: userId, name: 'Operating Systems', color: '#3b82f6', created_at: today },
    { id: 'sub-3', user_id: userId, name: 'Computer Networks', color: '#10b981', created_at: today },
    { id: 'sub-4', user_id: userId, name: 'Database Management', color: '#f59e0b', created_at: today },
    { id: 'sub-5', user_id: userId, name: 'Web Engineering', color: '#8b5cf6', created_at: today },
  ];

  // 10 activities: 7 completed, 2 pending, 1 cancelled for today => 7 / (10-1 cancelled = 9) or 7 / 10 depending on status
  // User Prompt Test Case 1: 10 daily activities, 7 completed => 70%
  const activities: DailyActivity[] = [
    { id: 'act-1', user_id: userId, subject_id: 'sub-1', linked_task_id: null, linked_session_id: null, title: 'Binary Trees Revision', description: 'Review traversal algorithms and BST balancing', activity_date: today, start_time: '08:00', end_time: '09:00', category: 'study', priority: 'high', estimated_minutes: 60, actual_minutes: 60, status: 'completed', notes: 'Mastered Morris Traversal', created_at: today },
    { id: 'act-2', user_id: userId, subject_id: 'sub-2', linked_task_id: null, linked_session_id: null, title: 'OS Lecture: Memory Management', description: 'Virtual memory and paging notes', activity_date: today, start_time: '09:15', end_time: '10:15', category: 'college', priority: 'medium', estimated_minutes: 60, actual_minutes: 60, status: 'completed', notes: null, created_at: today },
    { id: 'act-3', user_id: userId, subject_id: null, linked_task_id: null, linked_session_id: null, title: 'Morning Coffee & Routine', description: null, activity_date: today, start_time: '10:15', end_time: '10:30', category: 'break', priority: 'low', estimated_minutes: 15, actual_minutes: 15, status: 'completed', notes: null, created_at: today },
    { id: 'act-4', user_id: userId, subject_id: 'sub-3', linked_task_id: null, linked_session_id: null, title: 'Network Layer Protocols Practice', description: 'Solve subnetting exercises', activity_date: today, start_time: '11:00', end_time: '12:30', category: 'study', priority: 'high', estimated_minutes: 90, actual_minutes: 90, status: 'completed', notes: null, created_at: today },
    { id: 'act-5', user_id: userId, subject_id: 'sub-4', linked_task_id: null, linked_session_id: null, title: 'SQL Query Optimization Lab', description: 'Index creation and EXPLAIN analysis', activity_date: today, start_time: '13:30', end_time: '14:30', category: 'homework', priority: 'medium', estimated_minutes: 60, actual_minutes: 60, status: 'completed', notes: null, created_at: today },
    { id: 'act-6', user_id: userId, subject_id: 'sub-5', linked_task_id: null, linked_session_id: null, title: 'React Performance Profiling', description: 'Explore useMemo, memo and virtualization', activity_date: today, start_time: '15:00', end_time: '16:00', category: 'study', priority: 'medium', estimated_minutes: 60, actual_minutes: 60, status: 'completed', notes: null, created_at: today },
    { id: 'act-7', user_id: userId, subject_id: null, linked_task_id: null, linked_session_id: null, title: 'Jogging & Light Stretching', description: 'Keep the body active', activity_date: today, start_time: '17:00', end_time: '17:45', category: 'exercise', priority: 'low', estimated_minutes: 45, actual_minutes: 45, status: 'completed', notes: null, created_at: today },
    { id: 'act-8', user_id: userId, subject_id: 'sub-1', linked_task_id: null, linked_session_id: null, title: 'Dynamic Programming LeetCode', description: 'Solve 3 medium DP problems', activity_date: today, start_time: '19:00', end_time: '20:30', category: 'study', priority: 'urgent', estimated_minutes: 90, actual_minutes: null, status: 'pending', notes: null, created_at: today },
    { id: 'act-9', user_id: userId, subject_id: 'sub-2', linked_task_id: null, linked_session_id: null, title: 'Review Deadlock Prevention Slides', description: 'Banker algorithm practice', activity_date: today, start_time: '21:00', end_time: '22:00', category: 'revision', priority: 'medium', estimated_minutes: 60, actual_minutes: null, status: 'pending', notes: null, created_at: today },
    { id: 'act-10', user_id: userId, subject_id: null, linked_task_id: null, linked_session_id: null, title: 'Late Evening Reading', description: 'Optional science magazine reading', activity_date: today, start_time: '22:15', end_time: '22:45', category: 'personal', priority: 'low', estimated_minutes: 30, actual_minutes: null, status: 'pending', notes: null, created_at: today },
  ];

  // 20 tasks, 15 completed, 5 pending => 75%
  const tasks: Task[] = [];
  for (let i = 1; i <= 15; i++) {
    tasks.push({
      id: `task-comp-${i}`,
      user_id: userId,
      subject_id: subjects[(i - 1) % subjects.length].id,
      title: `Completed Study Milestone ${i}`,
      description: `Task verified and completed according to syllabus unit ${i}`,
      category: 'Study',
      priority: i % 4 === 0 ? 'urgent' : i % 3 === 0 ? 'high' : 'medium',
      start_date: pastDay,
      due_date: today,
      due_time: '18:00',
      estimated_minutes: 45,
      status: 'completed',
      notes: 'Completed ahead of deadline',
      created_at: pastDay,
      updated_at: today,
    });
  }
  const pendingTitles = [
    'Implement Dijkstra Shortest Path in C++',
    'Write Database Normalization Assignment 3',
    'Simulate Round Robin Process Scheduling',
    'Review IPv6 Header & Subnetting Rules',
    'Build Interactive Analytics Dashboard Component',
  ];
  for (let i = 1; i <= 5; i++) {
    tasks.push({
      id: `task-pend-${i}`,
      user_id: userId,
      subject_id: subjects[(i - 1) % subjects.length].id,
      title: pendingTitles[i - 1],
      description: 'Pending task to complete before weekly submission',
      category: 'Homework',
      priority: i === 1 ? 'urgent' : 'high',
      start_date: today,
      due_date: tomorrow,
      due_time: '20:00',
      estimated_minutes: 60,
      status: 'todo',
      notes: null,
      created_at: today,
      updated_at: today,
    });
  }

  // 10 eligible timetable sessions (session_date <= today), 8 completed, 2 missed => 80%
  // Plus 2 future sessions that must NOT count in eligible calculation
  const timetableSessions: TimetableSession[] = [
    { id: 'sess-1', user_id: userId, subject_id: 'sub-1', title: 'Algorithms Lecture', day_of_week: 1, start_time: '08:00', end_time: '09:30', teacher: 'Prof. Donald Knuth', location: 'Hall A-101', recurrence: 'weekly', session_date: pastDay, status: 'completed', created_at: pastDay },
    { id: 'sess-2', user_id: userId, subject_id: 'sub-2', title: 'OS Lab Practical', day_of_week: 1, start_time: '10:00', end_time: '11:30', teacher: 'Dr. Andrew Tanenbaum', location: 'CS Lab 2', recurrence: 'weekly', session_date: pastDay, status: 'completed', created_at: pastDay },
    { id: 'sess-3', user_id: userId, subject_id: 'sub-3', title: 'Networking Seminar', day_of_week: 2, start_time: '09:00', end_time: '10:30', teacher: 'Prof. Vint Cerf', location: 'Room 304', recurrence: 'weekly', session_date: pastDay, status: 'completed', created_at: pastDay },
    { id: 'sess-4', user_id: userId, subject_id: 'sub-4', title: 'Relational DB Theory', day_of_week: 2, start_time: '11:00', end_time: '12:30', teacher: 'Dr. Edgar Codd', location: 'Hall B-205', recurrence: 'weekly', session_date: pastDay, status: 'completed', created_at: pastDay },
    { id: 'sess-5', user_id: userId, subject_id: 'sub-5', title: 'Web Architectures', day_of_week: 3, start_time: '08:30', end_time: '10:00', teacher: 'Prof. Tim Berners-Lee', location: 'Room 102', recurrence: 'weekly', session_date: today, status: 'completed', created_at: today },
    { id: 'sess-6', user_id: userId, subject_id: 'sub-1', title: 'Data Structures Tutorial', day_of_week: 3, start_time: '10:30', end_time: '11:30', teacher: 'TA Sarah Jenkins', location: 'Lab 4', recurrence: 'weekly', session_date: today, status: 'completed', created_at: today },
    { id: 'sess-7', user_id: userId, subject_id: 'sub-2', title: 'Distributed Systems', day_of_week: 3, start_time: '13:00', end_time: '14:30', teacher: 'Dr. Leslie Lamport', location: 'Auditorium', recurrence: 'weekly', session_date: today, status: 'completed', created_at: today },
    { id: 'sess-8', user_id: userId, subject_id: 'sub-3', title: 'Socket Programming Lab', day_of_week: 3, start_time: '15:00', end_time: '16:30', teacher: 'Prof. Vint Cerf', location: 'Net Lab', recurrence: 'weekly', session_date: today, status: 'completed', created_at: today },
    { id: 'sess-9', user_id: userId, subject_id: 'sub-4', title: 'NoSQL & Graph DBs', day_of_week: 2, start_time: '14:00', end_time: '15:30', teacher: 'Dr. Edgar Codd', location: 'Hall B-205', recurrence: 'weekly', session_date: pastDay, status: 'missed', created_at: pastDay },
    { id: 'sess-10', user_id: userId, subject_id: 'sub-5', title: 'Cloud Deployments', day_of_week: 3, start_time: '17:00', end_time: '18:00', teacher: 'Prof. Tim Berners-Lee', location: 'Room 102', recurrence: 'weekly', session_date: today, status: 'missed', created_at: today },
    // Future sessions (session_date > today): MUST be excluded from eligible calculations
    { id: 'sess-fut-1', user_id: userId, subject_id: 'sub-1', title: 'Advanced Graph Algorithms', day_of_week: 4, start_time: '09:00', end_time: '10:30', teacher: 'Prof. Donald Knuth', location: 'Hall A-101', recurrence: 'weekly', session_date: tomorrow, status: 'upcoming', created_at: today },
    { id: 'sess-fut-2', user_id: userId, subject_id: 'sub-3', title: 'Cybersecurity & TLS', day_of_week: 5, start_time: '11:00', end_time: '12:30', teacher: 'Dr. Bruce Schneier', location: 'Room 201', recurrence: 'weekly', session_date: nextWeek, status: 'upcoming', created_at: today },
  ];

  // Study Goals: Target 100 chapters, achieved 60 => 60%
  const goals: StudyGoal[] = [
    { id: 'goal-1', user_id: userId, subject_id: 'sub-1', title: 'Complete Core CS Chapters', description: 'Master foundational topics across textbook', target_value: 100, achieved_value: 60, unit: 'chapters', start_date: pastDay, deadline: nextWeek, status: 'active', created_at: today },
    { id: 'goal-2', user_id: userId, subject_id: 'sub-1', title: 'Solve 50 LeetCode Mediums', description: 'Focus on Graphs, Trees, and DP', target_value: 50, achieved_value: 38, unit: 'problems', start_date: pastDay, deadline: nextWeek, status: 'active', created_at: today },
    { id: 'goal-3', user_id: userId, subject_id: null, title: 'Study 3 Hours Daily', description: 'Maintain consistent deep focus streak', target_value: 21, achieved_value: 18, unit: 'hours', start_date: pastDay, deadline: nextWeek, status: 'active', created_at: today },
  ];

  const examinations: Examination[] = [
    {
      id: 'exam-1',
      user_id: userId,
      subject_id: 'sub-1',
      title: 'Midterm: Data Structures & Algorithms',
      exam_date: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
      exam_time: '10:00',
      syllabus: JSON.stringify([
        { topic: 'Asymptotic Analysis & Big O', checked: true },
        { topic: 'Red-Black Trees & AVL Trees', checked: true },
        { topic: 'Graph Traversals (BFS, DFS, Dijkstra)', checked: true },
        { topic: 'Dynamic Programming & Memoization', checked: false },
        { topic: 'NP-Completeness Overview', checked: false },
      ]),
      important_questions: '1. Prove Dijkstra correctness with non-negative edges.\n2. Optimal substructure in 0/1 Knapsack.\n3. Master Theorem derivations.',
      preparation_status: 'in_progress',
      notes: 'Prepare flashcards for recurrence tree formulas.',
      created_at: today,
    },
    {
      id: 'exam-2',
      user_id: userId,
      subject_id: 'sub-2',
      title: 'Final Examination: Operating Systems',
      exam_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      exam_time: '14:00',
      syllabus: JSON.stringify([
        { topic: 'Process Scheduling & IPC', checked: true },
        { topic: 'Virtual Memory & Page Replacement', checked: true },
        { topic: 'File System Implementation', checked: false },
      ]),
      important_questions: 'Explain Peterson algorithm and hardware support for synchronization.',
      preparation_status: 'in_progress',
      notes: 'Review Tanenbaum Chapter 4-6.',
      created_at: today,
    },
  ];

  const assignments: Assignment[] = [
    { id: 'ass-1', user_id: userId, subject_id: 'sub-4', title: 'Database Schema Design & Normalization', description: 'Design 3NF relational schema with BCNF verification for an airline booking platform.', deadline: format(addDays(new Date(), 2), 'yyyy-MM-dd'), priority: 'urgent', status: 'in_progress', notes: 'Need to write SQL DDL scripts and ER diagrams.', created_at: today },
    { id: 'ass-2', user_id: userId, subject_id: 'sub-3', title: 'TCP Socket Client-Server Implementation', description: 'Build concurrent multithreaded chat server using raw sockets in C/Python.', deadline: format(addDays(new Date(), 5), 'yyyy-MM-dd'), priority: 'high', status: 'pending', notes: 'Include packet capture wireshark dump.', created_at: today },
    { id: 'ass-3', user_id: userId, subject_id: 'sub-5', title: 'Frontend State Management Analysis', description: 'Comparative report on Zustand vs Redux Toolkit vs React Context.', deadline: pastDay, priority: 'medium', status: 'completed', notes: 'Submitted via portal. Received A grade.', created_at: pastDay },
  ];

  const focusSessions: FocusSession[] = [
    { id: 'foc-1', user_id: userId, subject_id: 'sub-1', duration_minutes: 25, session_type: 'focus', completed: true, started_at: `${today}T08:00:00Z`, ended_at: `${today}T08:25:00Z` },
    { id: 'foc-2', user_id: userId, subject_id: 'sub-1', duration_minutes: 25, session_type: 'focus', completed: true, started_at: `${today}T08:35:00Z`, ended_at: `${today}T09:00:00Z` },
    { id: 'foc-3', user_id: userId, subject_id: 'sub-3', duration_minutes: 50, session_type: 'focus', completed: true, started_at: `${today}T11:00:00Z`, ended_at: `${today}T11:50:00Z` },
  ];

  const reflections: DailyReflection[] = [
    { id: 'ref-1', user_id: userId, reflection_date: today, morning_notes: 'Woke up energized. Primary focus today is cracking the Graph Algorithms problem set.', evening_notes: 'Solid progress made on Tree traversals. Need to increase break intervals.', daily_objectives: 'Complete 3 major study blocks, solve 5 Leetcode mediums, prepare DB normal form report.', top_priorities: JSON.stringify(['Binary Trees Revision', 'Relational DB Schema', 'OS Memory Paging']), created_at: today },
  ];

  const notes: Note[] = [
    { id: 'note-1', user_id: userId, subject_id: 'sub-1', title: 'Dynamic Programming Patterns', content: '# DP Strategy\n\n1. **Identify States**: Parameters determining unique subproblem.\n2. **Transition Function**: Base cases + recurrence.\n3. **Base Cases**: Trivial known outputs.\n4. **Order of Computation**: Bottom-up tabulation vs top-down memoization.', note_type: 'study', created_at: today, updated_at: today },
    { id: 'note-2', user_id: userId, subject_id: 'sub-2', title: 'Deadlock Necessary Conditions', content: 'Coffman Conditions:\n- Mutual Exclusion\n- Hold and Wait\n- No Preemption\n- Circular Wait\n\nTo break deadlock, eliminate at least one condition.', note_type: 'revision', created_at: today, updated_at: today },
  ];

  return { subjects, tasks, activities, timetableSessions, goals, examinations, assignments, focusSessions, reflections, notes };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'demo-student-id-101';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [timetableSessions, setTimetableSessions] = useState<TimetableSession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to load or persist in local storage
  const loadLocal = useCallback((key: string, defaultData: any) => {
    const raw = localStorage.getItem(`studyflow_${userId}_${key}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return defaultData;
      }
    }
    localStorage.setItem(`studyflow_${userId}_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }, [userId]);

  const saveLocal = useCallback((key: string, data: any) => {
    localStorage.setItem(`studyflow_${userId}_${key}`, JSON.stringify(data));
  }, [userId]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const initial = getInitialSeedData(userId);

    if (!isSupabaseConfigured) {
      setSubjects(loadLocal('subjects', initial.subjects));
      setTasks(loadLocal('tasks', initial.tasks));
      setActivities(loadLocal('activities', initial.activities));
      setTimetableSessions(loadLocal('timetableSessions', initial.timetableSessions));
      setGoals(loadLocal('goals', initial.goals));
      setExaminations(loadLocal('examinations', initial.examinations));
      setAssignments(loadLocal('assignments', initial.assignments));
      setFocusSessions(loadLocal('focusSessions', initial.focusSessions));
      setReflections(loadLocal('reflections', initial.reflections));
      setNotes(loadLocal('notes', initial.notes));
      setLoading(false);
      return;
    }

    try {
      const [s, t, a, ts, g, e, as2, fs, r, n] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', user.id).order('name'),
        supabase.from('tasks').select('*').eq('user_id', user.id).order('due_date'),
        supabase.from('daily_activities').select('*').eq('user_id', user.id).order('activity_date', { ascending: false }),
        supabase.from('timetable_sessions').select('*').eq('user_id', user.id).order('day_of_week'),
        supabase.from('study_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('examinations').select('*').eq('user_id', user.id).order('exam_date'),
        supabase.from('assignments').select('*').eq('user_id', user.id).order('deadline'),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }),
        supabase.from('daily_reflections').select('*').eq('user_id', user.id).order('reflection_date', { ascending: false }),
        supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ]);

      // If user has no subjects in Supabase yet, seed initial subjects
      if (!s.data || s.data.length === 0) {
        setSubjects(loadLocal('subjects', initial.subjects));
        setTasks(loadLocal('tasks', initial.tasks));
        setActivities(loadLocal('activities', initial.activities));
        setTimetableSessions(loadLocal('timetableSessions', initial.timetableSessions));
        setGoals(loadLocal('goals', initial.goals));
        setExaminations(loadLocal('examinations', initial.examinations));
        setAssignments(loadLocal('assignments', initial.assignments));
        setFocusSessions(loadLocal('focusSessions', initial.focusSessions));
        setReflections(loadLocal('reflections', initial.reflections));
        setNotes(loadLocal('notes', initial.notes));
      } else {
        setSubjects(s.data || []);
        setTasks(t.data || []);
        setActivities(a.data || []);
        setTimetableSessions(ts.data || []);
        setGoals(g.data || []);
        setExaminations(e.data || []);
        setAssignments(as2.data || []);
        setFocusSessions(fs.data || []);
        setReflections(r.data || []);
        setNotes(n.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch from Supabase, using local store:', err);
      setSubjects(loadLocal('subjects', initial.subjects));
      setTasks(loadLocal('tasks', initial.tasks));
      setActivities(loadLocal('activities', initial.activities));
      setTimetableSessions(loadLocal('timetableSessions', initial.timetableSessions));
      setGoals(loadLocal('goals', initial.goals));
      setExaminations(loadLocal('examinations', initial.examinations));
      setAssignments(loadLocal('assignments', initial.assignments));
      setFocusSessions(loadLocal('focusSessions', initial.focusSessions));
      setReflections(loadLocal('reflections', initial.reflections));
      setNotes(loadLocal('notes', initial.notes));
    } finally {
      setLoading(false);
    }
  }, [user, userId, loadLocal]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset to sample data helper
  const resetToSampleData = useCallback(() => {
    const initial = getInitialSeedData(userId);
    setSubjects(initial.subjects);
    setTasks(initial.tasks);
    setActivities(initial.activities);
    setTimetableSessions(initial.timetableSessions);
    setGoals(initial.goals);
    setExaminations(initial.examinations);
    setAssignments(initial.assignments);
    setFocusSessions(initial.focusSessions);
    setReflections(initial.reflections);
    setNotes(initial.notes);

    saveLocal('subjects', initial.subjects);
    saveLocal('tasks', initial.tasks);
    saveLocal('activities', initial.activities);
    saveLocal('timetableSessions', initial.timetableSessions);
    saveLocal('goals', initial.goals);
    saveLocal('examinations', initial.examinations);
    saveLocal('assignments', initial.assignments);
    saveLocal('focusSessions', initial.focusSessions);
    saveLocal('reflections', initial.reflections);
    saveLocal('notes', initial.notes);

    toast({ title: 'Workspace reset to standard student dataset', type: 'info' });
  }, [userId, saveLocal]);

  // ─── Subjects ───
  async function addSubject(data: Partial<Subject>) {
    const newId = `sub_${Date.now()}`;
    const newSubject: Subject = {
      id: newId,
      user_id: userId,
      name: data.name || 'New Subject',
      color: data.color || '#6366f1',
      created_at: new Date().toISOString(),
      ...data,
    };

    setSubjects((prev) => {
      const updated = [...prev, newSubject];
      saveLocal('subjects', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('subjects').insert(newSubject);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Subject added', type: 'success' });
    return newSubject;
  }

  async function updateSubject(id: string, data: Partial<Subject>) {
    setSubjects((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
      saveLocal('subjects', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('subjects').update(data).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Subject updated', type: 'success' });
  }

  async function deleteSubject(id: string) {
    setSubjects((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveLocal('subjects', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('subjects').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Subject deleted', type: 'success' });
  }

  // ─── Tasks ───
  async function addTask(data: Partial<Task>) {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `task_${Date.now()}`,
      user_id: userId,
      subject_id: data.subject_id || null,
      title: data.title || 'Untitled Task',
      description: data.description || null,
      category: data.category || 'General',
      priority: data.priority || 'medium',
      start_date: data.start_date || todayStr(),
      due_date: data.due_date || todayStr(),
      due_time: data.due_time || '18:00',
      estimated_minutes: data.estimated_minutes || 60,
      status: data.status || 'todo',
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
      ...data,
    };

    setTasks((prev) => {
      const updated = [newTask, ...prev];
      saveLocal('tasks', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').insert(newTask);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Task created successfully', type: 'success' });
    return newTask;
  }

  async function updateTask(id: string, data: Partial<Task>) {
    const now = new Date().toISOString();
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...data, updated_at: now } : t));
      saveLocal('tasks', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').update({ ...data, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Task updated', type: 'success' });
  }

  async function deleteTask(id: string) {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveLocal('tasks', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Task deleted', type: 'info' });
  }

  // ─── Daily Activities ───
  async function addActivity(data: Partial<DailyActivity>) {
    const newAct: DailyActivity = {
      id: `act_${Date.now()}`,
      user_id: userId,
      subject_id: data.subject_id || null,
      linked_task_id: data.linked_task_id || null,
      linked_session_id: data.linked_session_id || null,
      title: data.title || 'Planned Activity',
      description: data.description || null,
      activity_date: data.activity_date || todayStr(),
      start_time: data.start_time || '09:00',
      end_time: data.end_time || '10:00',
      category: data.category || 'study',
      priority: data.priority || 'medium',
      estimated_minutes: data.estimated_minutes || 60,
      actual_minutes: data.actual_minutes || null,
      status: data.status || 'pending',
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      ...data,
    };

    setActivities((prev) => {
      const updated = [newAct, ...prev];
      saveLocal('activities', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('daily_activities').insert(newAct);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Activity added to planner', type: 'success' });
    return newAct;
  }

  async function updateActivity(id: string, data: Partial<DailyActivity>) {
    setActivities((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...data } : a));
      saveLocal('activities', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('daily_activities').update(data).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
  }

  async function deleteActivity(id: string) {
    setActivities((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveLocal('activities', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('daily_activities').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Activity removed from schedule', type: 'info' });
  }

  // ─── Timetable Sessions ───
  async function addSession(data: Partial<TimetableSession>) {
    const newSession: TimetableSession = {
      id: `sess_${Date.now()}`,
      user_id: userId,
      subject_id: data.subject_id || null,
      title: data.title || 'Class Session',
      day_of_week: data.day_of_week !== undefined ? data.day_of_week : 1,
      start_time: data.start_time || '09:00',
      end_time: data.end_time || '10:00',
      teacher: data.teacher || null,
      location: data.location || null,
      recurrence: data.recurrence || 'weekly',
      session_date: data.session_date || todayStr(),
      status: data.status || 'upcoming',
      created_at: new Date().toISOString(),
      ...data,
    };

    setTimetableSessions((prev) => {
      const updated = [...prev, newSession];
      saveLocal('timetableSessions', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('timetable_sessions').insert(newSession);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Timetable session scheduled', type: 'success' });
    return newSession;
  }

  async function updateSession(id: string, data: Partial<TimetableSession>) {
    setTimetableSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
      saveLocal('timetableSessions', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('timetable_sessions').update(data).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
  }

  async function deleteSession(id: string) {
    setTimetableSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveLocal('timetableSessions', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('timetable_sessions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Session deleted', type: 'info' });
  }

  // ─── Study Goals ───
  async function addGoal(data: Partial<StudyGoal>) {
    const newGoal: StudyGoal = {
      id: `goal_${Date.now()}`,
      user_id: userId,
      subject_id: data.subject_id || null,
      title: data.title || 'New Academic Goal',
      description: data.description || null,
      target_value: data.target_value || 10,
      achieved_value: data.achieved_value || 0,
      unit: data.unit || 'units',
      start_date: data.start_date || todayStr(),
      deadline: data.deadline || null,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      ...data,
    };

    setGoals((prev) => {
      const updated = [newGoal, ...prev];
      saveLocal('goals', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('study_goals').insert(newGoal);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Study goal established', type: 'success' });
    return newGoal;
  }

  async function updateGoal(id: string, data: Partial<StudyGoal>) {
    setGoals((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, ...data } : g));
      saveLocal('goals', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('study_goals').update(data).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Goal progress recorded', type: 'success' });
  }

  async function deleteGoal(id: string) {
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      saveLocal('goals', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('study_goals').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Goal removed', type: 'info' });
  }

  // ─── Examinations ───
  async function addExam(data: Partial<Examination>) {
    const newExam: Examination = {
      id: `exam_${Date.now()}`,
      user_id: userId,
      subject_id: data.subject_id || null,
      title: data.title || 'Upcoming Exam',
      exam_date: data.exam_date || todayStr(),
      exam_time: data.exam_time || '09:00',
      syllabus: data.syllabus || '[]',
      important_questions: data.important_questions || null,
      preparation_status: data.preparation_status || 'not_started',
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      ...data,
    };

    setExaminations((prev) => {
      const updated = [...prev, newExam].sort((a, b) => a.exam_date.localeCompare(b.exam_date));
      saveLocal('examinations', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('examinations').insert(newExam);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Exam scheduled', type: 'success' });
    return newExam;
  }

  async function updateExam(id: string, data: Partial<Examination>) {
    setExaminations((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...data } : e));
      saveLocal('examinations', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('examinations').update(data).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Exam updated', type: 'success' });
  }

  async function deleteExam(id: string) {
    setExaminations((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveLocal('examinations', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('examinations').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Exam removed', type: 'info' });
  }

  // ─── Assignments ───
  async function addAssignment(data: Partial<Assignment>) {
    const newAss: Assignment = {
      id: `ass_${Date.now()}`,
      user_id: userId,
      subject_id: data.subject_id || null,
      title: data.title || 'Assignment Task',
      description: data.description || null,
      deadline: data.deadline || todayStr(),
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      ...data,
    };

    setAssignments((prev) => {
      const updated = [newAss, ...prev];
      saveLocal('assignments', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('assignments').insert(newAss);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Assignment added', type: 'success' });
    return newAss;
  }

  async function updateAssignment(id: string, data: Partial<Assignment>) {
    setAssignments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...data } : a));
      saveLocal('assignments', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('assignments').update(data).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Assignment updated', type: 'success' });
  }

  async function deleteAssignment(id: string) {
    setAssignments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveLocal('assignments', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('assignments').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Assignment removed', type: 'info' });
  }

  // ─── Focus Sessions ───
  async function addFocusSession(data: Partial<FocusSession>) {
    const newSession: FocusSession = {
      id: `foc_${Date.now()}`,
      user_id: userId,
      subject_id: data.subject_id || null,
      duration_minutes: data.duration_minutes || 25,
      session_type: data.session_type || 'focus',
      completed: data.completed !== undefined ? data.completed : true,
      started_at: data.started_at || new Date().toISOString(),
      ended_at: data.ended_at || new Date().toISOString(),
      ...data,
    };

    setFocusSessions((prev) => {
      const updated = [newSession, ...prev];
      saveLocal('focusSessions', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('focus_sessions').insert(newSession);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    return newSession;
  }

  async function updateFocusSession(id: string, data: Partial<FocusSession>) {
    setFocusSessions((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, ...data } : f));
      saveLocal('focusSessions', updated);
      return updated;
    });
  }

  // ─── Reflections ───
  function getReflection(date: string) {
    return reflections.find((r) => r.reflection_date === date);
  }

  async function saveReflection(data: Partial<DailyReflection>) {
    const date = data.reflection_date || todayStr();
    const existing = reflections.find((r) => r.reflection_date === date);

    if (existing) {
      const updatedItem = { ...existing, ...data };
      setReflections((prev) => {
        const next = prev.map((r) => (r.id === existing.id ? updatedItem : r));
        saveLocal('reflections', next);
        return next;
      });
      if (isSupabaseConfigured) {
        try {
          await supabase.from('daily_reflections').update(data).eq('id', existing.id);
        } catch (err) {
          console.warn('Supabase sync error', err);
        }
      }
    } else {
      const newRef: DailyReflection = {
        id: `ref_${Date.now()}`,
        user_id: userId,
        reflection_date: date,
        morning_notes: data.morning_notes || null,
        evening_notes: data.evening_notes || null,
        daily_objectives: data.daily_objectives || null,
        top_priorities: data.top_priorities || null,
        created_at: new Date().toISOString(),
        ...data,
      };
      setReflections((prev) => {
        const next = [newRef, ...prev];
        saveLocal('reflections', next);
        return next;
      });
      if (isSupabaseConfigured) {
        try {
          await supabase.from('daily_reflections').insert(newRef);
        } catch (err) {
          console.warn('Supabase sync error', err);
        }
      }
    }
    toast({ title: 'Daily reflections saved', type: 'success' });
  }

  // ─── Notes ───
  async function addNote(data: Partial<Note>) {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: `note_${Date.now()}`,
      user_id: userId,
      subject_id: data.subject_id || null,
      title: data.title || 'Untitled Note',
      content: data.content || '',
      note_type: data.note_type || 'study',
      created_at: now,
      updated_at: now,
      ...data,
    };

    setNotes((prev) => {
      const updated = [newNote, ...prev];
      saveLocal('notes', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notes').insert(newNote);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Note created', type: 'success' });
    return newNote;
  }

  async function updateNote(id: string, data: Partial<Note>) {
    const now = new Date().toISOString();
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, ...data, updated_at: now } : n));
      saveLocal('notes', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('notes').update({ ...data, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Note saved', type: 'success' });
  }

  async function deleteNote(id: string) {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveLocal('notes', updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error', err);
      }
    }
    toast({ title: 'Note deleted', type: 'info' });
  }

  return (
    <AppContext.Provider
      value={{
        subjects,
        tasks,
        activities,
        timetableSessions,
        goals,
        examinations,
        assignments,
        focusSessions,
        reflections,
        notes,
        loading,
        addSubject,
        updateSubject,
        deleteSubject,
        addTask,
        updateTask,
        deleteTask,
        addActivity,
        updateActivity,
        deleteActivity,
        addSession,
        updateSession,
        deleteSession,
        addGoal,
        updateGoal,
        deleteGoal,
        addExam,
        updateExam,
        deleteExam,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        addFocusSession,
        updateFocusSession,
        saveReflection,
        getReflection,
        addNote,
        updateNote,
        deleteNote,
        resetToSampleData,
        refreshAll: fetchAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
