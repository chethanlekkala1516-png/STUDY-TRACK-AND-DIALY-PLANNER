import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  ListChecks,
  HelpCircle,
  BookOpen,
  Trash2,
  FileEdit,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { todayStr, formatDateShort, formatTime, daysUntil } from '@/lib/date-utils';
import { toast } from '@/lib/notifications';
import { GoogleCalendarIcon } from '@/components/GoogleCalendarIcon';
import { GoogleCalendarSyncModal } from '@/components/GoogleCalendarSyncModal';
import { addExamToGoogleCalendar } from '@/lib/google-calendar';
import type { Examination, PreparationStatus, SyllabusItem } from '@/types';

export default function Examinations() {
  const { examinations, subjects, addExam, updateExam, deleteExam } = useApp();

  const [filterType, setFilterType] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [gcalModalOpen, setGcalModalOpen] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');
  const [formExamDate, setFormExamDate] = useState(todayStr());
  const [formExamTime, setFormExamTime] = useState('10:00');
  const [formPrepStatus, setFormPrepStatus] = useState<PreparationStatus>('not_started');
  const [formSyllabusRaw, setFormSyllabusRaw] = useState('');
  const [formQuestions, setFormQuestions] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const today = todayStr();

  const filteredExams = useMemo(() => {
    return examinations
      .filter((e) => {
        if (filterType === 'upcoming') return e.exam_date >= today;
        if (filterType === 'past') return e.exam_date < today;
        return true;
      })
      .sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  }, [examinations, filterType, today]);

  const openCreateDialog = () => {
    setEditingExam(null);
    setFormTitle('');
    setFormSubjectId('none');
    setFormExamDate(todayStr());
    setFormExamTime('10:00');
    setFormPrepStatus('not_started');
    setFormSyllabusRaw('Chapter 1: Foundations\nChapter 2: Algorithms\nChapter 3: Problem Solving');
    setFormQuestions('');
    setFormNotes('');
    setDialogOpen(true);
  };

  const openEditDialog = (exam: Examination) => {
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormSubjectId(exam.subject_id || 'none');
    setFormExamDate(exam.exam_date);
    setFormExamTime(exam.exam_time || '10:00');
    setFormPrepStatus(exam.preparation_status);

    // Parse syllabus JSON to multiline text
    try {
      const items: SyllabusItem[] = JSON.parse(exam.syllabus || '[]');
      setFormSyllabusRaw(items.map((i) => i.topic).join('\n'));
    } catch {
      setFormSyllabusRaw('');
    }

    setFormQuestions(exam.important_questions || '');
    setFormNotes(exam.notes || '');
    setDialogOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Exam title is required', type: 'warning' });
      return;
    }

    // Convert syllabus lines to items
    const lines = formSyllabusRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let existingItems: SyllabusItem[] = [];
    if (editingExam) {
      try {
        existingItems = JSON.parse(editingExam.syllabus || '[]');
      } catch {}
    }

    const syllabusItems: SyllabusItem[] = lines.map((line) => {
      const found = existingItems.find((i) => i.topic === line);
      return { topic: line, checked: found ? found.checked : false };
    });

    const payload = {
      title: formTitle.trim(),
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      exam_date: formExamDate,
      exam_time: formExamTime,
      syllabus: JSON.stringify(syllabusItems),
      important_questions: formQuestions.trim() || null,
      preparation_status: formPrepStatus,
      notes: formNotes.trim() || null,
    };

    if (editingExam) {
      await updateExam(editingExam.id, payload);
    } else {
      await addExam(payload);
    }
    setDialogOpen(false);
  };

  const handleToggleSyllabusItem = async (exam: Examination, index: number) => {
    try {
      const items: SyllabusItem[] = JSON.parse(exam.syllabus || '[]');
      if (items[index]) {
        items[index].checked = !items[index].checked;
        const total = items.length;
        const checkedCount = items.filter((i) => i.checked).length;
        let nextPrep: PreparationStatus = exam.preparation_status;
        if (checkedCount === total && total > 0) nextPrep = 'ready';
        else if (checkedCount > 0) nextPrep = 'in_progress';

        await updateExam(exam.id, {
          syllabus: JSON.stringify(items),
          preparation_status: nextPrep,
        });
      }
    } catch (err) {
      console.warn('Could not update syllabus checklist', err);
    }
  };

  const getSubject = (subId: string | null) => {
    if (!subId) return null;
    return subjects.find((s) => s.id === subId);
  };

  return (
    <div className="space-y-6">
      {/* ─── Control Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-rose-500" />
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Examination & Midterm Hub</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-0.5">
            <Button
              variant={filterType === 'upcoming' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('upcoming')}
              className="h-8 px-3 text-xs"
            >
              Upcoming
            </Button>
            <Button
              variant={filterType === 'past' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('past')}
              className="h-8 px-3 text-xs"
            >
              Past Exams
            </Button>
            <Button
              variant={filterType === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="h-8 px-3 text-xs"
            >
              All
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

          <Button onClick={openCreateDialog} size="sm" className="h-8 gap-1.5 shadow-sm text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Exam</span>
          </Button>
        </div>
      </div>

      {/* ─── Exam Countdown Cards ────────────────────────────────────── */}
      {filteredExams.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No examinations listed"
          description="Schedule midterms, finals, and quizzes to enable automated countdowns."
          actionLabel="Schedule Exam"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam) => {
            const daysLeft = daysUntil(exam.exam_date);
            const isTodayExam = daysLeft === 0;
            const isPast = daysLeft < 0;
            const sub = getSubject(exam.subject_id);
            const isExpanded = expandedExamId === exam.id;

            let syllabusItems: SyllabusItem[] = [];
            try {
              syllabusItems = JSON.parse(exam.syllabus || '[]');
            } catch {}

            const checkedCount = syllabusItems.filter((i) => i.checked).length;
            const syllabusProgress =
              syllabusItems.length > 0 ? Math.round((checkedCount / syllabusItems.length) * 100) : 0;

            let badgeColor = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60';
            if (isTodayExam) badgeColor = 'bg-rose-600 text-white animate-pulse';
            else if (daysLeft <= 3 && !isPast) badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60';
            else if (daysLeft <= 7 && !isPast) badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60';

            return (
              <Card
                key={exam.id}
                className="hover:shadow-md transition-shadow border-gray-200/80 dark:border-gray-800"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Countdown Display Ring / Box */}
                    <div
                      className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 border ${badgeColor}`}
                    >
                      {isTodayExam ? (
                        <>
                          <span className="text-xs font-black tracking-wider uppercase">EXAM</span>
                          <span className="text-sm font-extrabold">TODAY</span>
                        </>
                      ) : isPast ? (
                        <>
                          <span className="text-[10px] font-bold text-gray-400">PAST</span>
                          <span className="text-xs font-semibold text-gray-500">Ended</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-black leading-none">{daysLeft}</span>
                          <span className="text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                            Days
                          </span>
                        </>
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {sub && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${sub.color}15`, color: sub.color }}
                          >
                            {sub.name}
                          </span>
                        )}
                        <Badge
                          variant={
                            exam.preparation_status === 'ready'
                              ? 'success'
                              : exam.preparation_status === 'in_progress'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {exam.preparation_status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {exam.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-mono font-medium">
                          <Calendar className="h-3.5 w-3.5 text-rose-500" />
                          {formatDateShort(exam.exam_date)}
                        </span>
                        {exam.exam_time && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatTime(exam.exam_time)}
                          </span>
                        )}
                        {syllabusItems.length > 0 && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            Syllabus: {checkedCount}/{syllabusItems.length} ({syllabusProgress}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Expand Button */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addExamToGoogleCalendar(exam, subjects.find((s) => s.id === exam.subject_id)?.name)}
                      className="h-8 px-2.5 text-xs gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-medium shrink-0"
                      title="Add 24h & 2h reminder alerts to Google Calendar"
                    >
                      <GoogleCalendarIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Add Reminder</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                      className="text-xs gap-1"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                      <span>{isExpanded ? 'Hide Checklist' : 'Checklist & Notes'}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(exam)}
                      className="h-8 w-8 p-0"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteExam(exam.id)}
                      className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* ─── Expandable Details: Syllabus Checklist & Notes ── */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-4 bg-gray-50/40 dark:bg-gray-800/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Syllabus checklist */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Syllabus Checklist ({checkedCount}/{syllabusItems.length})
                          </Label>
                          <span className="text-xs font-semibold text-indigo-600">
                            {syllabusProgress}% Covered
                          </span>
                        </div>

                        {syllabusItems.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">
                            No syllabus chapters configured. Click Edit to add topic lines.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-56 overflow-y-auto">
                            {syllabusItems.map((item, idx) => (
                              <label
                                key={idx}
                                className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 text-xs cursor-pointer hover:border-indigo-500 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => handleToggleSyllabusItem(exam, idx)}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                />
                                <span
                                  className={`flex-1 font-medium ${
                                    item.checked
                                      ? 'line-through text-gray-400'
                                      : 'text-gray-800 dark:text-gray-200'
                                  }`}
                                >
                                  {item.topic}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Important Questions & Revision Notes */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Important Exam Questions
                          </Label>
                          <div className="mt-1 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line min-h-[60px]">
                            {exam.important_questions || 'No high-priority questions recorded.'}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Revision Strategies & Formulas
                          </Label>
                          <div className="mt-1 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line min-h-[50px]">
                            {exam.notes || 'No revision notes logged.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Add/Edit Exam Dialog ───────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Edit Examination' : 'Schedule Examination'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveExam} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="exTitle">Exam Title *</Label>
              <Input
                id="exTitle"
                placeholder="e.g. Midterm: Data Structures & Algorithms"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Preparation Status</Label>
                <Select
                  value={formPrepStatus}
                  onValueChange={(val) => setFormPrepStatus(val as PreparationStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="ready">Ready / Fully Prepared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exDate">Exam Date *</Label>
                <Input
                  id="exDate"
                  type="date"
                  value={formExamDate}
                  onChange={(e) => setFormExamDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exTime">Exam Time</Label>
                <Input
                  id="exTime"
                  type="time"
                  value={formExamTime}
                  onChange={(e) => setFormExamTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exSyllabus">Syllabus Topics (One item per line)</Label>
              <Textarea
                id="exSyllabus"
                rows={4}
                placeholder="Topic 1: Asymptotic Complexity&#10;Topic 2: Binary Search Trees&#10;Topic 3: Dijkstra Algorithm"
                value={formSyllabusRaw}
                onChange={(e) => setFormSyllabusRaw(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exQuestions">Important Questions to Master</Label>
              <Textarea
                id="exQuestions"
                rows={2}
                placeholder="High-probability exam questions..."
                value={formQuestions}
                onChange={(e) => setFormQuestions(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exNotes">Revision Notes & Flashcard references</Label>
              <Input
                id="exNotes"
                placeholder="Room number, allowed calculators, etc."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingExam ? 'Save Exam' : 'Schedule Exam'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <GoogleCalendarSyncModal open={gcalModalOpen} onOpenChange={setGcalModalOpen} />
    </div>
  );
}
