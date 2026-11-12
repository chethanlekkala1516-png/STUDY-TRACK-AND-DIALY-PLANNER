import {
  format, parseISO, isToday as isTodayFns, isFuture as isFutureFns,
  isPast as isPastFns, startOfWeek as startOfWeekFns, endOfWeek as endOfWeekFns,
  addDays, subDays, differenceInDays, differenceInMinutes,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,
  isAfter, isBefore, parse, addMinutes,
} from 'date-fns';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE, MMMM d, yyyy');
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d');
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatTime24(time: string): string {
  return time?.slice(0, 5) || '';
}

export function formatDateTime(date: string, time?: string | null): string {
  const d = formatDate(date);
  if (time) return `${d} at ${formatTime(time)}`;
  return d;
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isTodayFns(d);
}

export function isFutureDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isFutureFns(d);
}

export function isPastDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPastFns(d);
}

export function isSameDateStr(a: string, b: string): boolean {
  return isSameDay(parseISO(a), parseISO(b));
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeekFns(date, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getDayName(dayIndex: number): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[dayIndex] || '';
}

export function getDayNameShort(dayIndex: number): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return names[dayIndex] || '';
}

export function getTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 23; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return slots;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(d, new Date());
}

export function isOverdue(date: string, time?: string | null): boolean {
  const now = new Date();
  const dueDate = parseISO(date);
  if (time) {
    const [h, m] = time.split(':').map(Number);
    dueDate.setHours(h, m, 0, 0);
  } else {
    dueDate.setHours(23, 59, 59, 999);
  }
  return isAfter(now, dueDate);
}

export function getMonthDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
}

export function startOfWeekDate(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  return startOfWeekFns(date, { weekStartsOn });
}

export function endOfWeekDate(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  return endOfWeekFns(date, { weekStartsOn });
}

export function getNextDay(date: string): string {
  return format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
}

export function getPrevDay(date: string): string {
  return format(subDays(parseISO(date), 1), 'yyyy-MM-dd');
}

export function getDurationBetweenTimes(start: string, end: string): number {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  return endMin - startMin;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export { format, parseISO, addDays, subDays, differenceInDays, getDay, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMinutes, isBefore, isAfter };
