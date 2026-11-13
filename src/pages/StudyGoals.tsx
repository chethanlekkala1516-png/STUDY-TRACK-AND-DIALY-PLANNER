import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Trophy,
  Calendar,
  CheckCircle2,
  Trash2,
  FileEdit,
  TrendingUp,
  Sparkles,
  Award,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ProgressRing } from '@/components/ui/progress-ring';
import { EmptyState } from '@/components/ui/empty-state';
import { calculateGoalProgress, calculateAverageGoalProgress } from '@/lib/calculations';
import { todayStr, formatDateShort, daysUntil } from '@/lib/date-utils';
import { toast } from '@/lib/notifications';
import type { StudyGoal, GoalStatus } from '@/types';

export default function StudyGoals() {
  const { goals, subjects, addGoal, updateGoal, deleteGoal } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  // Create/Edit Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null);

  // Quick Progress Increment Dialog
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [targetGoalForProgress, setTargetGoalForProgress] = useState<StudyGoal | null>(null);
  const [incrementValue, setIncrementValue] = useState<number>(1);
  const [directNewValue, setDirectNewValue] = useState<number>(0);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');
  const [formTargetValue, setFormTargetValue] = useState<number>(50);
  const [formAchievedValue, setFormAchievedValue] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('chapters');
  const [formStartDate, setFormStartDate] = useState(todayStr());
  const [formDeadline, setFormDeadline] = useState('');
  const [formStatus, setFormStatus] = useState<GoalStatus>('active');

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (filterStatus === 'all') return true;
      return g.status === filterStatus;
    });
  }, [goals, filterStatus]);

  const avgProgress = useMemo(() => {
    return calculateAverageGoalProgress(goals);
  }, [goals]);

  const completedCount = useMemo(() => {
    return goals.filter((g) => g.status === 'completed' || g.achieved_value >= g.target_value).length;
  }, [goals]);

  const openCreateDialog = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormDescription('');
    setFormSubjectId('none');
    setFormTargetValue(50);
    setFormAchievedValue(0);
    setFormUnit('chapters');
    setFormStartDate(todayStr());
    setFormDeadline('');
    setFormStatus('active');
    setDialogOpen(true);
  };

  const openEditDialog = (goal: StudyGoal) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormDescription(goal.description || '');
    setFormSubjectId(goal.subject_id || 'none');
    setFormTargetValue(goal.target_value);
    setFormAchievedValue(goal.achieved_value);
    setFormUnit(goal.unit);
    setFormStartDate(goal.start_date || todayStr());
    setFormDeadline(goal.deadline || '');
    setFormStatus(goal.status);
    setDialogOpen(true);
  };

  const openUpdateProgressDialog = (goal: StudyGoal) => {
    setTargetGoalForProgress(goal);
    setIncrementValue(1);
    setDirectNewValue(goal.achieved_value);
    setProgressDialogOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Goal title is required', type: 'warning' });
      return;
    }
    if (formTargetValue <= 0) {
      toast({ title: 'Target value must be greater than 0', type: 'error' });
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      target_value: Number(formTargetValue),
      achieved_value: Number(formAchievedValue),
      unit: formUnit.trim() || 'units',
      start_date: formStartDate || todayStr(),
      deadline: formDeadline || null,
      status: formStatus,
    };

    if (editingGoal) {
      await updateGoal(editingGoal.id, payload);
    } else {
      await addGoal(payload);
    }
    setDialogOpen(false);
  };

  const handleApplyProgressIncrement = async () => {
    if (!targetGoalForProgress) return;
    const newAchieved = Math.max(0, targetGoalForProgress.achieved_value + Number(incrementValue));
    const isNowDone = newAchieved >= targetGoalForProgress.target_value;

    await updateGoal(targetGoalForProgress.id, {
      achieved_value: newAchieved,
      status: isNowDone ? 'completed' : targetGoalForProgress.status,
    });
    setProgressDialogOpen(false);
    toast({
      title: `Progress updated: +${incrementValue} ${targetGoalForProgress.unit}`,
      type: 'success',
    });
  };

  const handleApplyDirectProgress = async () => {
    if (!targetGoalForProgress) return;
    const newAchieved = Math.max(0, Number(directNewValue));
    const isNowDone = newAchieved >= targetGoalForProgress.target_value;

    await updateGoal(targetGoalForProgress.id, {
      achieved_value: newAchieved,
      status: isNowDone ? 'completed' : targetGoalForProgress.status,
    });
    setProgressDialogOpen(false);
    toast({
      title: `Achieved value set to ${newAchieved} ${targetGoalForProgress.unit}`,
      type: 'success',
    });
  };

  const getSubject = (subId: string | null) => {
    if (!subId) return null;
    return subjects.find((s) => s.id === subId);
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Stats Bar ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-amber-100 dark:border-amber-900/30">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Average Goal Progress
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {avgProgress}%
            </p>
            <p className="text-[11px] text-gray-400">Across active targets</p>
          </div>
          <ProgressRing value={avgProgress} size={56} strokeWidth={6} color="#f59e0b" />
        </Card>

        <Card className="p-4 border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Goals Achieved
          </p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {completedCount}
          </p>
          <p className="text-[11px] text-gray-400">Milestones reached</p>
        </Card>

        <Card className="p-4 border-indigo-100 dark:border-indigo-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Total Academic Goals
          </p>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
            {goals.length}
          </p>
          <p className="text-[11px] text-gray-400">Tracked in StudyFlow</p>
        </Card>
      </div>

      {/* ─── Controls ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500" />
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Measurable Academic Goals</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-0.5">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="h-8 px-3 text-xs"
            >
              All Goals
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('active')}
              className="h-8 px-3 text-xs"
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('completed')}
              className="h-8 px-3 text-xs"
            >
              Completed
            </Button>
          </div>

          <Button onClick={openCreateDialog} size="sm" className="h-8 gap-1.5 shadow-sm text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Goal</span>
          </Button>
        </div>
      </div>

      {/* ─── Goals Cards Grid ────────────────────────────────────────── */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No study goals found"
          description="Create measurable targets like 'Complete 100 chapters' or 'Study 3 hours daily'."
          actionLabel="Create Goal"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const percentage = calculateGoalProgress(goal);
            const sub = getSubject(goal.subject_id);
            const daysLeft = goal.deadline ? daysUntil(goal.deadline) : null;
            const isCompleted = goal.status === 'completed' || percentage >= 100;

            return (
              <Card
                key={goal.id}
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
                        <Badge
                          variant={isCompleted ? 'success' : 'default'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {isCompleted ? 'Achieved' : goal.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold line-clamp-1">
                        {goal.title}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDialog(goal)}
                        className="text-gray-400 hover:text-indigo-600 p-1"
                        title="Edit goal"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Delete goal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {goal.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{goal.description}</p>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Achieved
                      </span>
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        {goal.achieved_value}{' '}
                        <span className="text-xs font-normal text-gray-500">
                          / {goal.target_value} {goal.unit}
                        </span>
                      </p>
                      {daysLeft !== null && (
                        <p className="text-[11px] text-gray-400">
                          {daysLeft < 0 ? 'Deadline passed' : `${daysLeft} days remaining`}
                        </p>
                      )}
                    </div>
                    <ProgressRing
                      value={percentage}
                      size={64}
                      strokeWidth={6}
                      color="#f59e0b"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => openUpdateProgressDialog(goal)}
                      className="w-full text-xs gap-1.5 shadow-xs bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>Update Progress</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Update Progress Dialog ─────────────────────────────────── */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Progress: {targetGoalForProgress?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-1">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                Current Record
              </span>
              <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
                {targetGoalForProgress?.achieved_value} / {targetGoalForProgress?.target_value}{' '}
                {targetGoalForProgress?.unit}
              </p>
            </div>

            {/* Option A: Quick Add */}
            <div className="space-y-2">
              <Label htmlFor="incVal">Option 1: Add Increment</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="incVal"
                  type="number"
                  min="1"
                  value={incrementValue}
                  onChange={(e) => setIncrementValue(Number(e.target.value))}
                />
                <Button onClick={handleApplyProgressIncrement} className="shrink-0 text-xs">
                  + Add Progress
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-400">OR</span>
              </div>
            </div>

            {/* Option B: Set Exact Value */}
            <div className="space-y-2">
              <Label htmlFor="setVal">Option 2: Set New Total Achieved</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="setVal"
                  type="number"
                  min="0"
                  value={directNewValue}
                  onChange={(e) => setDirectNewValue(Number(e.target.value))}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyDirectProgress}
                  className="shrink-0 text-xs"
                >
                  Set New Total
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Add/Edit Goal Dialog ───────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Establish Academic Goal'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gTitle">Goal Title *</Label>
              <Input
                id="gTitle"
                placeholder="e.g. Complete 100 Chapters of Core CS"
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
                    <SelectItem value="none">General Academic</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as GoalStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gTarget">Target Value *</Label>
                <Input
                  id="gTarget"
                  type="number"
                  min="1"
                  value={formTargetValue}
                  onChange={(e) => setFormTargetValue(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gAchieved">Achieved So Far</Label>
                <Input
                  id="gAchieved"
                  type="number"
                  min="0"
                  value={formAchievedValue}
                  onChange={(e) => setFormAchievedValue(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gUnit">Measurement Unit</Label>
                <Input
                  id="gUnit"
                  placeholder="chapters / hours"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gStart">Start Date</Label>
                <Input
                  id="gStart"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gDeadline">Target Deadline</Label>
                <Input
                  id="gDeadline"
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gDesc">Description (Optional)</Label>
              <Input
                id="gDesc"
                placeholder="What is your strategy or textbook reference?"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingGoal ? 'Save Goal' : 'Establish Goal'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
