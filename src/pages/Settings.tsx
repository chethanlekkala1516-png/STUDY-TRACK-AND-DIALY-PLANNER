import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Clock,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/lib/notifications';
import { SUBJECT_COLORS } from '@/lib/utils';

export default function Settings() {
  const { profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const {
    subjects,
    addSubject,
    deleteSubject,
    activities,
    tasks,
    timetableSessions,
    goals,
    examinations,
    assignments,
    notes,
    resetToSampleData,
  } = useApp();

  // Profile Form state
  const [fullName, setFullName] = useState(profile?.full_name || 'Alex Morgan');
  const [email, setEmail] = useState(profile?.email || 'alex.morgan@studyflow.edu');
  const [institution, setInstitution] = useState(profile?.institution || 'Stanford University');
  const [course, setCourse] = useState(profile?.course || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(profile?.semester || 'Semester 5');

  // Preferences
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>(() => {
    return (localStorage.getItem('studyflow_time_format') as any) || '12';
  });
  const [weekStart, setWeekStart] = useState<'1' | '0'>(() => {
    return (localStorage.getItem('studyflow_week_start') as any) || '1';
  });

  // Subject Modal
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0]);

  // Reset Protection
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      full_name: fullName,
      institution,
      course,
      semester,
    });
    toast({ title: 'Student profile updated', type: 'success' });
  };

  const handleTimeFormatChange = (val: '12' | '24') => {
    setTimeFormat(val);
    localStorage.setItem('studyflow_time_format', val);
    toast({ title: `Time format set to ${val}-hour`, type: 'info' });
  };

  const handleWeekStartChange = (val: '1' | '0') => {
    setWeekStart(val);
    localStorage.setItem('studyflow_week_start', val);
    toast({ title: `Week starts on ${val === '1' ? 'Monday' : 'Sunday'}`, type: 'info' });
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      toast({ title: 'Subject name required', type: 'warning' });
      return;
    }
    await addSubject({
      name: newSubjectName.trim(),
      color: newSubjectColor,
    });
    setNewSubjectName('');
    setSubjectDialogOpen(false);
  };

  const handleExportData = () => {
    const backup = {
      exported_at: new Date().toISOString(),
      profile,
      subjects,
      activities,
      tasks,
      timetableSessions,
      goals,
      examinations,
      assignments,
      notes,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `studyflow_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({ title: 'Student workspace backup downloaded (JSON)', type: 'success' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-indigo-600" />
          <h2 className="font-bold text-base text-gray-900 dark:text-white">
            Profile & Application Settings
          </h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportData}
          className="gap-1.5 text-xs h-8"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export All Data</span>
        </Button>
      </div>

      {/* ─── 1. Student Profile Settings ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" />
            <span>Academic Profile Information</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Manage your personal identity, university institution, and enrolled semester
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sName">Full Name</Label>
                <Input
                  id="sName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sEmail">Registered Student Email</Label>
                <Input id="sEmail" type="email" value={email} disabled className="opacity-70" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sInst">Institution / College</Label>
                <Input
                  id="sInst"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sCourse">Course / Major</Label>
                <Input id="sCourse" value={course} onChange={(e) => setCourse(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sSem">Current Semester</Label>
                <Input id="sSem" value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
            </div>

            <Button type="submit" size="sm" className="text-xs">
              Save Profile Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ─── 2. Appearance & Display Preferences ──────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Palette className="h-4 w-4 text-indigo-600" />
            <span>Interface & Display Preferences</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Personalize dark mode, time format, and weekly schedule orientation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Theme Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <p className="font-semibold text-xs text-gray-900 dark:text-white">Theme Mode</p>
              <p className="text-[11px] text-gray-400">
                Choose between light surfaces, dark mode, or system default
              </p>
            </div>
            <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-0.5">
              <Button
                variant={theme === 'light' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('light')}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('system')}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>System</span>
              </Button>
            </div>
          </div>

          {/* Time Format */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <p className="font-semibold text-xs text-gray-900 dark:text-white">Time Display</p>
              <p className="text-[11px] text-gray-400">12-hour (1:30 PM) vs 24-hour (13:30) clock</p>
            </div>
            <Select value={timeFormat} onValueChange={(v) => handleTimeFormatChange(v as any)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12-Hour AM/PM</SelectItem>
                <SelectItem value="24">24-Hour Clock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Week Start */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <p className="font-semibold text-xs text-gray-900 dark:text-white">Week Start Day</p>
              <p className="text-[11px] text-gray-400">First day of the week on calendar and timetable</p>
            </div>
            <Select value={weekStart} onValueChange={(v) => handleWeekStartChange(v as any)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="0">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ─── 3. Subjects & Color Coding ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Academic Subjects & Color Codes</CardTitle>
            <CardDescription className="text-xs">
              Assign distinct color highlights to your classes and coursework
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setSubjectDialogOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Subject</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-4 w-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                    {sub.name}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSubject(sub.id)}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600"
                  title="Remove Subject"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── 4. Account & Workspace Diagnostics ───────────────────────── */}
      <Card className="border-rose-100 dark:border-rose-950/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-rose-700 dark:text-rose-400">
            Account Management & Workspace Testing
          </CardTitle>
          <CardDescription className="text-xs">
            Reset workspace to default validation dataset or end student session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20">
            <div>
              <p className="font-semibold text-xs text-rose-900 dark:text-rose-200">
                Reset Standard Test Cases Dataset
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Restores standard 10 activities (70%), 20 tasks (75%), 10 timetable sessions (80%),
                and 60/100 goal for verification.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setResetConfirmation(''); setResetDialogOpen(true); }}
              className="text-xs shrink-0 border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              <span>Reset Data</span>
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">Sign out of this computer</span>
            <Button variant="destructive" size="sm" onClick={signOut} className="text-xs gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Add Subject Dialog ─────────────────────────────────────── */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Subject</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subName">Subject Title *</Label>
              <Input
                id="subName"
                placeholder="e.g. Artificial Intelligence"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Color Code</Label>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewSubjectColor(c)}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      newSubjectColor === c
                        ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Subject</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Reset Protection Dialog ─────────────────────────────────── */}
      <Dialog open={resetDialogOpen} onOpenChange={(open) => { setResetDialogOpen(open); if (!open) setResetConfirmation(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Reset Standard Data
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3">
              <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">
                ⚠️ This action is irreversible!
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                All your custom activities, tasks, timetable sessions, goals, examinations,
                assignments, and notes will be permanently replaced with the standard test dataset.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resetConfirm" className="text-sm">
                Type <span className="font-bold font-mono text-rose-600">RESET</span> to confirm
              </Label>
              <Input
                id="resetConfirm"
                placeholder="Type RESET here..."
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                className="border-rose-200 focus:ring-rose-500"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setResetDialogOpen(false); setResetConfirmation(''); }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={resetConfirmation !== 'RESET'}
              onClick={() => {
                resetToSampleData();
                toast({ title: 'Data has been reset to standard test dataset', type: 'success' });
                setResetDialogOpen(false);
                setResetConfirmation('');
              }}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
