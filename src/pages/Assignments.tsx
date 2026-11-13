import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  FileEdit,
  AlertTriangle,
  FileText,
  Send,
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
import { todayStr, formatDateShort, daysUntil, isOverdue } from '@/lib/date-utils';
import { PRIORITY_COLORS, STATUS_COLORS } from '@/lib/utils';
import { toast } from '@/lib/notifications';
import { GoogleCalendarIcon } from '@/components/GoogleCalendarIcon';
import { GoogleCalendarSyncModal } from '@/components/GoogleCalendarSyncModal';
import { addAssignmentToGoogleCalendar } from '@/lib/google-calendar';
import type { Assignment, Priority, AssignmentStatus } from '@/types';

export default function Assignments() {
  const { assignments, subjects, addAssignment, updateAssignment, deleteAssignment } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [gcalModalOpen, setGcalModalOpen] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');
  const [formDescription, setFormDescription] = useState('');
  const [formDeadline, setFormDeadline] = useState(todayStr());
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formStatus, setFormStatus] = useState<AssignmentStatus>('pending');
  const [formNotes, setFormNotes] = useState('');

  const today = todayStr();

  // Summary counts
  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.status === 'completed' || a.status === 'submitted').length;
  const overdueCount = assignments.filter(
    (a) => a.status !== 'completed' && a.status !== 'submitted' && isOverdue(a.deadline)
  ).length;
  const pendingCount = totalCount - completedCount;

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        if (filterStatus === 'pending') return a.status === 'pending' || a.status === 'in_progress';
        if (filterStatus === 'completed') return a.status === 'completed' || a.status === 'submitted';
        if (filterStatus === 'overdue') return a.status !== 'completed' && a.status !== 'submitted' && isOverdue(a.deadline);
        return true;
      })
      .filter((a) => {
        if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
        return true;
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [assignments, filterStatus, filterPriority]);

  const openCreateDialog = () => {
    setEditingAssignment(null);
    setFormTitle('');
    setFormSubjectId('none');
    setFormDescription('');
    setFormDeadline(todayStr());
    setFormPriority('medium');
    setFormStatus('pending');
    setFormNotes('');
    setDialogOpen(true);
  };

  const openEditDialog = (ass: Assignment) => {
    setEditingAssignment(ass);
    setFormTitle(ass.title);
    setFormSubjectId(ass.subject_id || 'none');
    setFormDescription(ass.description || '');
    setFormDeadline(ass.deadline);
    setFormPriority(ass.priority);
    setFormStatus(ass.status);
    setFormNotes(ass.notes || '');
    setDialogOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Assignment title is required', type: 'warning' });
      return;
    }

    const payload = {
      title: formTitle.trim(),
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      description: formDescription.trim() || null,
      deadline: formDeadline,
      priority: formPriority,
      status: formStatus,
      notes: formNotes.trim() || null,
    };

    if (editingAssignment) {
      await updateAssignment(editingAssignment.id, payload);
    } else {
      await addAssignment(payload);
    }
    setDialogOpen(false);
  };

  const handleMarkSubmitted = async (ass: Assignment) => {
    await updateAssignment(ass.id, { status: 'submitted' });
    toast({ title: `Assignment marked submitted: ${ass.title}`, type: 'success' });
  };

  const getSubject = (subId: string | null) => {
    if (!subId) return null;
    return subjects.find((s) => s.id === subId);
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Stats Bar ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-indigo-100 dark:border-indigo-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Total Tracked
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalCount}</p>
          <p className="text-[11px] text-gray-400">Coursework assignments</p>
        </Card>

        <Card className="p-4 border-amber-100 dark:border-amber-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Pending Submissions
          </p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {pendingCount}
          </p>
          <p className="text-[11px] text-gray-400">Awaiting completion</p>
        </Card>

        <Card className="p-4 border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Completed / Submitted
          </p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {completedCount}
          </p>
          <p className="text-[11px] text-gray-400">Handed in successfully</p>
        </Card>

        <Card className="p-4 border-rose-100 dark:border-rose-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Overdue
          </p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {overdueCount}
          </p>
          <p className="text-[11px] text-gray-400">Past deadline</p>
        </Card>
      </div>

      {/* ─── Control Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Assignments & Coursework</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-0.5">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="h-8 px-3 text-xs"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
              className="h-8 px-3 text-xs"
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('completed')}
              className="h-8 px-3 text-xs"
            >
              Completed
            </Button>
            <Button
              variant={filterStatus === 'overdue' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('overdue')}
              className="h-8 px-3 text-xs"
            >
              Overdue
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
            <span>Add Assignment</span>
          </Button>
        </div>
      </div>

      {/* ─── Assignments List / Grid ─────────────────────────────────── */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments found"
          description="Track problem sets, lab reports, essays, and project submissions."
          actionLabel="Add Assignment"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((ass) => {
            const sub = getSubject(ass.subject_id);
            const daysLeft = daysUntil(ass.deadline);
            const isDone = ass.status === 'completed' || ass.status === 'submitted';
            const overdue = !isDone && isOverdue(ass.deadline);

            return (
              <Card
                key={ass.id}
                className="hover:shadow-md transition-shadow border-gray-200/80 dark:border-gray-800 flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {sub && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${sub.color}15`, color: sub.color }}
                          >
                            {sub.name}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            PRIORITY_COLORS[ass.priority]
                          }`}
                        >
                          {ass.priority}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold line-clamp-1">{ass.title}</CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => addAssignmentToGoogleCalendar(ass, subjects.find((s) => s.id === ass.subject_id)?.name)}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="Add reminder to Google Calendar"
                      >
                        <GoogleCalendarIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEditDialog(ass)}
                        className="text-gray-400 hover:text-indigo-600 p-1"
                        title="Edit"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAssignment(ass.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {ass.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {ass.description}
                    </p>
                  )}

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Deadline:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatDateShort(ass.deadline)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Countdown:</span>
                      {overdue ? (
                        <span className="font-bold text-rose-600">OVERDUE</span>
                      ) : isDone ? (
                        <span className="font-semibold text-emerald-600">Submitted</span>
                      ) : (
                        <span className="font-semibold text-indigo-600">
                          {daysLeft <= 0 ? 'Today' : `${daysLeft} days left`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700">
                      <span className="text-gray-500 font-medium">Status:</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          STATUS_COLORS[ass.status] || 'bg-gray-100'
                        }`}
                      >
                        {ass.status}
                      </span>
                    </div>
                  </div>

                  {ass.notes && (
                    <p className="text-[11px] text-gray-400 italic line-clamp-1">
                      Notes: {ass.notes}
                    </p>
                  )}

                  <div className="pt-1">
                    {!isDone ? (
                      <Button
                        size="sm"
                        onClick={() => handleMarkSubmitted(ass)}
                        className="w-full text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Mark as Submitted</span>
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 py-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed & Handed In</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Add/Edit Assignment Dialog ─────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAssignment} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="asTitle">Assignment Name *</Label>
              <Input
                id="asTitle"
                placeholder="e.g. TCP Socket Server Implementation"
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
                    <SelectItem value="none">General / Unassigned</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={formPriority}
                  onValueChange={(val) => setFormPriority(val as Priority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="asDeadline">Submission Deadline *</Label>
                <Input
                  id="asDeadline"
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as AssignmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="asDesc">Description</Label>
              <Textarea
                id="asDesc"
                rows={2}
                placeholder="Key requirements, formatting rules, or submission portal link"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="asNotes">Attachments & Notes</Label>
              <Input
                id="asNotes"
                placeholder="Dropbox / GitHub link or rubric notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingAssignment ? 'Save Changes' : 'Add Assignment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <GoogleCalendarSyncModal open={gcalModalOpen} onOpenChange={setGcalModalOpen} />
    </div>
  );
}
