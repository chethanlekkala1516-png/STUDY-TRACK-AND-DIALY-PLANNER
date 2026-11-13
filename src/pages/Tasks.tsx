import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  LayoutList,
  Kanban,
  Calendar as CalendarIcon,
  Trash2,
  FileEdit,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MoreVertical,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProgressRing } from '@/components/ui/progress-ring';
import { EmptyState } from '@/components/ui/empty-state';
import { calculateTaskCompletion } from '@/lib/calculations';
import {
  todayStr,
  formatDateShort,
  formatTime,
  isOverdue,
  getMonthDays,
  format,
  isSameDay,
  parseISO,
} from '@/lib/date-utils';
import { PRIORITY_COLORS } from '@/lib/utils';
import { toast } from '@/lib/notifications';
import { GoogleCalendarIcon } from '@/components/GoogleCalendarIcon';
import { GoogleCalendarSyncModal } from '@/components/GoogleCalendarSyncModal';
import { addTaskToGoogleCalendar } from '@/lib/google-calendar';
import type { Task, Priority, TaskStatus } from '@/types';

export default function Tasks() {
  const { tasks, subjects, addTask, updateTask, deleteTask } = useApp();

  const [currentView, setCurrentView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created'>('due_date');
  const [gcalModalOpen, setGcalModalOpen] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');
  const [formCategory, setFormCategory] = useState('General');
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formStartDate, setFormStartDate] = useState(todayStr());
  const [formDueDate, setFormDueDate] = useState(todayStr());
  const [formDueTime, setFormDueTime] = useState('18:00');
  const [formEstimated, setFormEstimated] = useState(45);
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formNotes, setFormNotes] = useState('');

  // Calculate task stats using exact formula
  const stats = useMemo(() => {
    return calculateTaskCompletion(tasks);
  }, [tasks]);

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }
        if (selectedSubject !== 'all' && t.subject_id !== selectedSubject) return false;
        if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
        if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'due_date') {
          return a.due_date.localeCompare(b.due_date);
        }
        if (sortBy === 'priority') {
          const map: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (map[a.priority] ?? 2) - (map[b.priority] ?? 2);
        }
        return b.created_at.localeCompare(a.created_at);
      });
  }, [tasks, searchQuery, selectedSubject, selectedPriority, selectedStatus, sortBy]);

  const openCreateDialog = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormSubjectId('none');
    setFormCategory('General');
    setFormPriority('medium');
    setFormStartDate(todayStr());
    setFormDueDate(todayStr());
    setFormDueTime('18:00');
    setFormEstimated(45);
    setFormStatus('todo');
    setFormNotes('');
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormSubjectId(task.subject_id || 'none');
    setFormCategory(task.category || 'General');
    setFormPriority(task.priority);
    setFormStartDate(task.start_date || todayStr());
    setFormDueDate(task.due_date);
    setFormDueTime(task.due_time || '18:00');
    setFormEstimated(task.estimated_minutes || 45);
    setFormStatus(task.status);
    setFormNotes(task.notes || '');
    setDialogOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Task title is required', type: 'warning' });
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      category: formCategory,
      priority: formPriority,
      start_date: formStartDate,
      due_date: formDueDate,
      due_time: formDueTime,
      estimated_minutes: Number(formEstimated) || 45,
      status: formStatus,
      notes: formNotes.trim() || null,
    };

    if (editingTask) {
      await updateTask(editingTask.id, payload);
    } else {
      await addTask(payload);
    }
    setDialogOpen(false);
  };

  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    await updateTask(task.id, { status: nextStatus });
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status });
  };

  const getSubject = (subId: string | null) => {
    if (!subId) return null;
    return subjects.find((s) => s.id === subId);
  };

  // Calendar month days for Calendar view
  const calendarDays = useMemo(() => {
    return getMonthDays(new Date());
  }, []);

  return (
    <div className="space-y-6">
      {/* ─── Top Stats Bar ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between border-violet-100 dark:border-violet-900/30">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Task Completion
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {stats.percentage}%
            </p>
            <p className="text-[11px] text-gray-400">
              {stats.completed} of {stats.total} non-cancelled
            </p>
          </div>
          <ProgressRing value={stats.percentage} size={56} strokeWidth={6} color="#8b5cf6" />
        </Card>

        <Card className="p-4 border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Completed
          </p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.completed}
          </p>
          <p className="text-[11px] text-gray-400">Tasks verified & achieved</p>
        </Card>

        <Card className="p-4 border-amber-100 dark:border-amber-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            In Progress / Pending
          </p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {stats.pending}
          </p>
          <p className="text-[11px] text-gray-400">Action items queue</p>
        </Card>

        <Card className="p-4 border-rose-100 dark:border-rose-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Overdue
          </p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {stats.overdue}
          </p>
          <p className="text-[11px] text-gray-400">Past target deadline</p>
        </Card>
      </div>

      {/* ─── Controls & Search ───────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks by title or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* View Switcher & Add Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-0.5">
                <Button
                  variant={currentView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('list')}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  <span>List</span>
                </Button>
                <Button
                  variant={currentView === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('kanban')}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Kanban</span>
                </Button>
                <Button
                  variant={currentView === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('calendar')}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Calendar</span>
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
                <span>Add Task</span>
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <Filter className="h-3.5 w-3.5 text-gray-400 mr-1" />

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[140px] h-8 text-xs ml-auto">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created">Recently Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ─── VIEW 1: LIST VIEW ───────────────────────────────────────── */}
      {currentView === 'list' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Tasks List ({filteredTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks found"
                description="Create your first study milestone or adjust search filters."
                actionLabel="Create Task"
                onAction={openCreateDialog}
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTasks.map((task) => {
                  const isDone = task.status === 'completed';
                  const isCancelled = task.status === 'cancelled';
                  const overdue = !isDone && !isCancelled && isOverdue(task.due_date, task.due_time);
                  const sub = getSubject(task.subject_id);

                  return (
                    <div
                      key={task.id}
                      className="py-3.5 flex items-center justify-between gap-3 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : isCancelled
                              ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-600'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="h-4 w-4" />}
                          {isCancelled && <XCircle className="h-4 w-4 text-gray-400" />}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-semibold truncate ${
                                isDone
                                  ? 'line-through text-gray-400'
                                  : isCancelled
                                  ? 'line-through text-gray-400 italic'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                            {sub && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{ backgroundColor: `${sub.color}15`, color: sub.color }}
                              >
                                {sub.name}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                PRIORITY_COLORS[task.priority]
                              }`}
                            >
                              {task.priority}
                            </span>
                            {overdue && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                                Overdue
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3 text-indigo-500" />
                              Due {formatDateShort(task.due_date)} {task.due_time && `at ${formatTime(task.due_time)}`}
                            </span>
                            <span>&bull;</span>
                            <span>{task.category || 'General'}</span>
                            {task.estimated_minutes && (
                              <span>&bull; ~{task.estimated_minutes} mins</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Select
                          value={task.status}
                          onValueChange={(val) => handleStatusChange(task.id, val as TaskStatus)}
                        >
                          <SelectTrigger className="w-[110px] h-7 text-[11px] capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addTaskToGoogleCalendar(task, subjects.find((s) => s.id === task.subject_id)?.name)}
                          className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                          title="Add reminder to Google Calendar"
                        >
                          <GoogleCalendarIcon className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(task)}
                          className="h-7 w-7 p-0"
                          title="Edit task"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTask(task.id)}
                          className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── VIEW 2: KANBAN BOARD VIEW ───────────────────────────────── */}
      {currentView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['todo', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((statusKey) => {
            const columnTasks = tasks.filter((t) => t.status === statusKey);
            const titles: Record<TaskStatus, { label: string; color: string }> = {
              todo: { label: 'To Do', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800' },
              in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60' },
              completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60' },
              cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60' },
            };
            const col = titles[statusKey];

            return (
              <div
                key={statusKey}
                className="flex flex-col rounded-2xl bg-gray-50/70 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800 p-3 min-h-[420px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-gray-200/60 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                      {col.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-gray-800 border">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-2.5 pt-3 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-gray-400">
                      No tasks in this lane
                    </div>
                  ) : (
                    columnTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-2 group hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-xs text-gray-900 dark:text-gray-100 line-clamp-2">
                            {t.title}
                          </h5>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                              PRIORITY_COLORS[t.priority]
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        {t.description && (
                          <p className="text-[11px] text-gray-500 line-clamp-2">{t.description}</p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                          <span>Due {formatDateShort(t.due_date)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => addTaskToGoogleCalendar(t, subjects.find((s) => s.id === t.subject_id)?.name)}
                              className="text-gray-400 hover:text-blue-600 p-0.5"
                              title="Add reminder to Google Calendar"
                            >
                              <GoogleCalendarIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => openEditDialog(t)}
                              className="text-gray-400 hover:text-indigo-600 p-0.5"
                              title="Edit"
                            >
                              <FileEdit className="h-3 w-3" />
                            </button>
                            {statusKey !== 'completed' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'completed')}
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                title="Move to completed"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── VIEW 3: CALENDAR VIEW ──────────────────────────────────── */}
      {currentView === 'calendar' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Monthly Tasks Due Calendar</CardTitle>
            <CardDescription className="text-xs">
              Overview of all task target dates across the current month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center font-bold text-xs text-gray-400 py-1 uppercase">
                  {d}
                </div>
              ))}
              {calendarDays.map((dayDate) => {
                const dayStr = format(dayDate, 'yyyy-MM-dd');
                const dayTasks = tasks.filter((t) => t.due_date === dayStr);
                const isCurrentToday = dayStr === todayStr();

                return (
                  <div
                    key={dayStr}
                    className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between ${
                      isCurrentToday
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-bold ${
                          isCurrentToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {format(dayDate, 'd')}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-400">
                          {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-hidden mt-1">
                      {dayTasks.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          onClick={() => openEditDialog(t)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer ${
                            t.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 line-through dark:bg-emerald-950/60'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200'
                          }`}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="text-[9px] text-gray-400 font-semibold pl-1">
                          +{dayTasks.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Add/Edit Task Dialog ───────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Academic Task'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveTask} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="taskTitle">Task Title *</Label>
              <Input
                id="taskTitle"
                placeholder="e.g. Implement Red-Black Tree in C++"
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
                  onValueChange={(v) => setFormPriority(v as Priority)}
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
                <Label htmlFor="taskDueDate">Due Date *</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taskDueTime">Due Time</Label>
                <Input
                  id="taskDueTime"
                  type="time"
                  value={formDueTime}
                  onChange={(e) => setFormDueTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(v) => setFormStatus(v as TaskStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled (Excluded)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taskEst">Estimated (Minutes)</Label>
                <Input
                  id="taskEst"
                  type="number"
                  min="5"
                  step="5"
                  value={formEstimated}
                  onChange={(e) => setFormEstimated(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taskDesc">Description (Optional)</Label>
              <Input
                id="taskDesc"
                placeholder="Specific requirements or submission guidelines"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taskNotes">Notes & References (Optional)</Label>
              <Textarea
                id="taskNotes"
                placeholder="Links to slides, book problems, or textbook page numbers"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingTask ? 'Save Task' : 'Add Task'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <GoogleCalendarSyncModal open={gcalModalOpen} onOpenChange={setGcalModalOpen} />
    </div>
  );
}
