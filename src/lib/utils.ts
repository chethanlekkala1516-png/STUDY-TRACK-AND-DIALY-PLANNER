import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SUBJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#a855f7',
];

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

export const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  postponed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  missed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  skipped: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  active: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export const CATEGORY_COLORS: Record<string, string> = {
  study: '#6366f1',
  college: '#3b82f6',
  homework: '#f97316',
  assignment: '#ec4899',
  revision: '#8b5cf6',
  exercise: '#22c55e',
  personal: '#14b8a6',
  break: '#eab308',
  other: '#6b7280',
};

export const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "The expert in anything was once a beginner. — Helen Hayes",
  "Education is the passport to the future. — Malcolm X",
  "The beautiful thing about learning is that no one can take it away from you. — B.B. King",
  "Study hard, for the well is deep, and our brains are shallow. — Richard Baxter",
  "Push yourself, because no one else is going to do it for you.",
  "The more that you read, the more things you will know. — Dr. Seuss",
  "Learning is not attained by chance, it must be sought for with ardor. — Abigail Adams",
  "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
];
