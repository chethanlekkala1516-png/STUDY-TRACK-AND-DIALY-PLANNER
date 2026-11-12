import { toast } from '@/lib/notifications';
import type { Task, DailyActivity, Examination, Assignment, TimetableSession, Subject } from '@/types';

export interface CalendarEventPayload {
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string | null; // HH:mm
  endDate?: string | null; // YYYY-MM-DD
  endTime?: string | null; // HH:mm
  description?: string;
  location?: string;
  recurrence?: string; // e.g. 'RRULE:FREQ=WEEKLY'
}

/**
 * Format date & time into Google Calendar format:
 * Timed: YYYYMMDDTHHmm00
 * All day: YYYYMMDD
 */
function formatGCalDateTime(dateStr: string, timeStr?: string | null): string {
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) {
    return cleanDate;
  }
  const cleanTime = timeStr.replace(/:/g, '').padEnd(4, '0') + '00';
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Compute end datetime for Google Calendar:
 * If no end date/time, default to start + 1 hour (or next day for all day)
 */
function getEndGCalDateTime(
  startDate: string,
  startTime?: string | null,
  endDate?: string | null,
  endTime?: string | null
): string {
  if (endDate && endTime) {
    return formatGCalDateTime(endDate, endTime);
  }

  if (startTime) {
    // Add 1 hour to start time
    const [h, m] = startTime.split(':').map(Number);
    const endH = (h + 1) % 24;
    const endHStr = endH.toString().padStart(2, '0');
    const endMStr = (m || 0).toString().padStart(2, '0');
    const endTargetDate = endH < h ? addOneDay(startDate) : (endDate || startDate);
    return `${endTargetDate.replace(/-/g, '')}T${endHStr}${endMStr}00`;
  }

  // All day event: Google Calendar end date is exclusive (day + 1)
  return addOneDay(endDate || startDate).replace(/-/g, '');
}

function addOneDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

/**
 * Generate full Google Calendar Web Intent URL
 */
export function buildGoogleCalendarUrl(payload: CalendarEventPayload): string {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const startGCal = formatGCalDateTime(payload.startDate, payload.startTime);
  const endGCal = getEndGCalDateTime(
    payload.startDate,
    payload.startTime,
    payload.endDate,
    payload.endTime
  );

  const params = new URLSearchParams();
  params.set('text', payload.title);
  params.set('dates', `${startGCal}/${endGCal}`);

  if (payload.description) {
    params.set('details', payload.description);
  }
  if (payload.location) {
    params.set('location', payload.location);
  }
  if (payload.recurrence) {
    params.set('recur', payload.recurrence);
  }

  return `${base}&${params.toString()}`;
}

/**
 * Helper to open the Google Calendar link in a new tab with user feedback
 */
export function openInGoogleCalendar(payload: CalendarEventPayload, itemLabel: string = 'Reminder') {
  const url = buildGoogleCalendarUrl(payload);
  window.open(url, '_blank', 'noopener,noreferrer');
  toast({
    title: `Adding ${itemLabel} to Google Calendar`,
    description: `Opening Google Calendar with pre-configured alerts & reminder details!`,
    type: 'success',
  });
}

/**
 * 1. Task Reminder -> Google Calendar
 */
export function addTaskToGoogleCalendar(task: Task, subjectName?: string) {
  const desc = [
    `📚 STUDYFLOW TASK REMINDER`,
    `----------------------------------------`,
    `Task: ${task.title}`,
    subjectName ? `Subject: ${subjectName}` : null,
    `Priority: ${task.priority.toUpperCase()}`,
    `Category: ${task.category || 'General'}`,
    task.estimated_minutes ? `Estimated: ${task.estimated_minutes} mins` : null,
    task.description ? `\nDetails: ${task.description}` : null,
    task.notes ? `\nNotes: ${task.notes}` : null,
    `\nCreated via STUDYFLOW Student App`,
  ]
    .filter(Boolean)
    .join('\n');

  openInGoogleCalendar(
    {
      title: `Task Due: ${task.title} ${subjectName ? `(${subjectName})` : ''}`,
      startDate: task.due_date,
      startTime: task.due_time || '18:00',
      description: desc,
      location: 'Study Workspace',
    },
    'Task Reminder'
  );
}

/**
 * 2. Daily Planner Activity -> Google Calendar
 */
export function addActivityToGoogleCalendar(activity: DailyActivity, subjectName?: string) {
  const desc = [
    `⏱️ STUDYFLOW PLANNED ACTIVITY`,
    `----------------------------------------`,
    `Activity: ${activity.title}`,
    subjectName ? `Subject: ${subjectName}` : null,
    `Category: ${activity.category.toUpperCase()}`,
    `Priority: ${activity.priority.toUpperCase()}`,
    activity.estimated_minutes ? `Estimated Duration: ${activity.estimated_minutes} mins` : null,
    activity.description ? `\nDetails: ${activity.description}` : null,
    activity.notes ? `\nNotes: ${activity.notes}` : null,
    `\nCreated via STUDYFLOW Student App`,
  ]
    .filter(Boolean)
    .join('\n');

  openInGoogleCalendar(
    {
      title: `Study Session: ${activity.title} ${subjectName ? `(${subjectName})` : ''}`,
      startDate: activity.activity_date,
      startTime: activity.start_time,
      endTime: activity.end_time,
      description: desc,
      location: 'Study Desk',
    },
    'Study Session'
  );
}

/**
 * 3. Examination Reminder -> Google Calendar
 */
export function addExamToGoogleCalendar(exam: Examination, subjectName?: string) {
  let syllabusText = '';
  try {
    const items = typeof exam.syllabus === 'string' ? JSON.parse(exam.syllabus) : exam.syllabus;
    if (Array.isArray(items) && items.length > 0) {
      syllabusText =
        '\nSyllabus Checklist:\n' +
        items.map((i: any) => `• [${i.completed ? 'X' : ' '}] ${i.title || i}`).join('\n');
    }
  } catch {
    if (exam.syllabus) syllabusText = `\nSyllabus: ${exam.syllabus}`;
  }

  const desc = [
    `🎯 STUDYFLOW EXAMINATION ALERT`,
    `----------------------------------------`,
    `Exam: ${exam.title}`,
    subjectName ? `Subject: ${subjectName}` : null,
    `Preparation Status: ${exam.preparation_status.replace('_', ' ').toUpperCase()}`,
    syllabusText || null,
    exam.important_questions ? `\nImportant Questions:\n${exam.important_questions}` : null,
    exam.notes ? `\nNotes:\n${exam.notes}` : null,
    `\nCreated via STUDYFLOW Student App`,
  ]
    .filter(Boolean)
    .join('\n');

  // Exams default to 3 hours duration
  const startTime = exam.exam_time || '09:30';
  const [h, m] = startTime.split(':').map(Number);
  const endH = (h + 3).toString().padStart(2, '0');
  const endTime = `${endH}:${m.toString().padStart(2, '0')}`;

  openInGoogleCalendar(
    {
      title: `🎯 EXAM: ${exam.title} ${subjectName ? `[${subjectName}]` : ''}`,
      startDate: exam.exam_date,
      startTime,
      endTime,
      description: desc,
      location: 'Exam Hall / Campus',
    },
    'Exam Reminder'
  );
}

/**
 * 4. Assignment Deadline -> Google Calendar
 */
export function addAssignmentToGoogleCalendar(assignment: Assignment, subjectName?: string) {
  const desc = [
    `📝 STUDYFLOW ASSIGNMENT DEADLINE`,
    `----------------------------------------`,
    `Assignment: ${assignment.title}`,
    subjectName ? `Subject: ${subjectName}` : null,
    `Priority: ${assignment.priority.toUpperCase()}`,
    `Status: ${assignment.status.toUpperCase()}`,
    assignment.description ? `\nDetails:\n${assignment.description}` : null,
    assignment.notes ? `\nNotes:\n${assignment.notes}` : null,
    `\nCreated via STUDYFLOW Student App`,
  ]
    .filter(Boolean)
    .join('\n');

  openInGoogleCalendar(
    {
      title: `📝 Assignment Due: ${assignment.title} ${subjectName ? `(${subjectName})` : ''}`,
      startDate: assignment.deadline,
      startTime: '23:00',
      endTime: '23:59',
      description: desc,
      location: 'Submission Portal',
    },
    'Assignment Deadline'
  );
}

/**
 * 5. Timetable Session -> Google Calendar (with Weekly Recurrence)
 */
export function addSessionToGoogleCalendar(session: TimetableSession, subjectName?: string) {
  const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const dayCode = dayNames[session.day_of_week] || 'MO';

  // Find next date matching day_of_week
  const today = new Date();
  const currentDay = today.getDay();
  const daysDiff = (session.day_of_week - currentDay + 7) % 7;
  const nextSessionDate = new Date(today);
  nextSessionDate.setDate(today.getDate() + daysDiff);
  const dateStr = nextSessionDate.toISOString().slice(0, 10);

  const desc = [
    `🏛️ STUDYFLOW TIMETABLE CLASS`,
    `----------------------------------------`,
    `Course/Class: ${session.title}`,
    subjectName ? `Subject: ${subjectName}` : null,
    session.teacher ? `Instructor: ${session.teacher}` : null,
    session.location ? `Room/Hall: ${session.location}` : null,
    `Recurrence: Weekly (${dayNames[session.day_of_week]})`,
    `\nCreated via STUDYFLOW Student App`,
  ]
    .filter(Boolean)
    .join('\n');

  openInGoogleCalendar(
    {
      title: `Class: ${session.title} ${subjectName ? `(${subjectName})` : ''}`,
      startDate: session.session_date || dateStr,
      startTime: session.start_time,
      endTime: session.end_time,
      location: session.location || 'University Campus',
      description: desc,
      recurrence: `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
    },
    'Class Timetable'
  );
}

/**
 * 6. Generate and Download Full .ICS file for Bulk Google Calendar Import
 */
export function generateStudyScheduleICS(data: {
  activities?: DailyActivity[];
  tasks?: Task[];
  examinations?: Examination[];
  assignments?: Assignment[];
  timetableSessions?: TimetableSession[];
  subjects?: Subject[];
}): string {
  const {
    activities = [],
    tasks = [],
    examinations = [],
    assignments = [],
    timetableSessions = [],
    subjects = [],
  } = data;

  const getSubName = (subId?: string | null) =>
    subjects.find((s) => s.id === subId)?.name || '';

  const formatICSDate = (dateStr: string, timeStr?: string | null) => {
    const cleanDate = dateStr.replace(/-/g, '');
    if (!timeStr) return cleanDate;
    return `${cleanDate}T${timeStr.replace(/:/g, '').padEnd(4, '0')}00`;
  };

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//STUDYFLOW//Student Timetable and Daily Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:STUDYFLOW Academic Schedule',
    'X-WR-TIMEZONE:UTC',
  ];

  // Activities
  activities.forEach((act) => {
    if (act.status === 'cancelled') return;
    const sub = getSubName(act.subject_id);
    const start = formatICSDate(act.activity_date, act.start_time);
    const end = formatICSDate(act.activity_date, act.end_time);
    lines.push(
      'BEGIN:VEVENT',
      `UID:act-${act.id}@studyflow.app`,
      `DTSTAMP:${formatICSDate(new Date().toISOString().slice(0, 10), '00:00')}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:Study: ${act.title} ${sub ? `(${sub})` : ''}`,
      `DESCRIPTION:${act.description || 'StudyFlow Planned Activity'}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Upcoming Study Session',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  // Tasks
  tasks.forEach((tsk) => {
    if (tsk.status === 'cancelled') return;
    const sub = getSubName(tsk.subject_id);
    const time = tsk.due_time || '18:00';
    const start = formatICSDate(tsk.due_date, time);
    lines.push(
      'BEGIN:VEVENT',
      `UID:task-${tsk.id}@studyflow.app`,
      `DTSTAMP:${formatICSDate(new Date().toISOString().slice(0, 10), '00:00')}Z`,
      `DTSTART:${start}`,
      `SUMMARY:Task Due: ${tsk.title} ${sub ? `(${sub})` : ''}`,
      `DESCRIPTION:Priority: ${tsk.priority}\\n${tsk.description || ''}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Task Deadline Approaching',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  // Exams
  examinations.forEach((exm) => {
    const sub = getSubName(exm.subject_id);
    const time = exm.exam_time || '09:30';
    const start = formatICSDate(exm.exam_date, time);
    lines.push(
      'BEGIN:VEVENT',
      `UID:exam-${exm.id}@studyflow.app`,
      `DTSTAMP:${formatICSDate(new Date().toISOString().slice(0, 10), '00:00')}Z`,
      `DTSTART:${start}`,
      `SUMMARY:🎯 EXAM: ${exm.title} ${sub ? `[${sub}]` : ''}`,
      `DESCRIPTION:Preparation: ${exm.preparation_status}\\n${exm.notes || ''}`,
      'LOCATION:Campus Exam Hall',
      'BEGIN:VALARM',
      'TRIGGER:-PT1D', // 1 day before
      'ACTION:DISPLAY',
      'DESCRIPTION:Exam Tomorrow! Final Review Reminder',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H', // 2 hours before
      'ACTION:DISPLAY',
      'DESCRIPTION:Exam starting soon! Bring essentials.',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  // Assignments
  assignments.forEach((ass) => {
    const sub = getSubName(ass.subject_id);
    const start = formatICSDate(ass.deadline, '23:59');
    lines.push(
      'BEGIN:VEVENT',
      `UID:assign-${ass.id}@studyflow.app`,
      `DTSTAMP:${formatICSDate(new Date().toISOString().slice(0, 10), '00:00')}Z`,
      `DTSTART:${start}`,
      `SUMMARY:📝 Assignment Due: ${ass.title} ${sub ? `(${sub})` : ''}`,
      `DESCRIPTION:${ass.description || ''}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT4H', // 4 hours before
      'ACTION:DISPLAY',
      'DESCRIPTION:Assignment deadline tonight!',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Download the .ics file directly to student's device
 */
export function downloadStudyScheduleICS(data: Parameters<typeof generateStudyScheduleICS>[0]) {
  const icsContent = generateStudyScheduleICS(data);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studyflow_calendar_${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast({
    title: 'Downloaded Calendar (.ics)',
    description: 'You can now import this file into Google Calendar (Settings → Import & Export).',
    type: 'success',
  });
}

/**
 * Open Google Calendar in a new browser tab
 */
export function openGoogleCalendarWeb() {
  window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer');
}
