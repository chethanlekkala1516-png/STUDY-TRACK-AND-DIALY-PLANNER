import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { todayStr, formatTime, formatDateTime } from '@/lib/date-utils';
import { toast } from '@/lib/notifications';

type Mode = 'focus' | 'break' | 'long_break';

const DEFAULT_DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  break: 5 * 60,
  long_break: 15 * 60,
};

export default function FocusMode() {
  const { subjects, focusSessions, addFocusSession } = useApp();

  const [mode, setMode] = useState<Mode>('focus');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('none');
  const [customMinutes, setCustomMinutes] = useState<number>(25);

  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_DURATIONS.focus);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  const today = todayStr();

  // Summary counts for today
  const todaySessions = useMemo(() => {
    return focusSessions.filter((s) => s.started_at?.startsWith(today) && s.completed);
  }, [focusSessions, today]);

  const totalTodayMinutes = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  }, [todaySessions]);

  // Timer interval effect
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Completed session
      handleSessionCompleted();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionCompleted = async () => {
    setIsActive(false);

    const durationMin = Math.round(
      (DEFAULT_DURATIONS[mode] - timeLeft > 0
        ? DEFAULT_DURATIONS[mode]
        : (customMinutes || 25) * 60) / 60
    );

    await addFocusSession({
      subject_id: selectedSubjectId === 'none' ? null : selectedSubjectId,
      duration_minutes: durationMin,
      session_type: mode,
      completed: true,
      started_at: sessionStartTime || new Date().toISOString(),
      ended_at: new Date().toISOString(),
    });

    toast({
      title: `${mode === 'focus' ? 'Focus Session' : 'Break'} Completed! 🎉`,
      description: 'Your session has been logged in focus history.',
      type: 'success',
    });

    // Auto-advance mode
    if (mode === 'focus') {
      setMode('break');
      setTimeLeft(DEFAULT_DURATIONS.break);
    } else {
      setMode('focus');
      setTimeLeft(DEFAULT_DURATIONS.focus);
    }
  };

  const startTimer = () => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date().toISOString());
    }
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(DEFAULT_DURATIONS[mode]);
    setSessionStartTime(null);
  };

  const switchMode = (newMode: Mode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(DEFAULT_DURATIONS[newMode]);
    setSessionStartTime(null);
  };

  const applyCustomDuration = () => {
    if (customMinutes <= 0) return;
    setIsActive(false);
    setTimeLeft(customMinutes * 60);
    setSessionStartTime(null);
    toast({ title: `Duration set to ${customMinutes} minutes`, type: 'info' });
  };

  const formatTimerDigits = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = DEFAULT_DURATIONS[mode];
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  const getSubject = (subId: string | null) => {
    if (!subId) return null;
    return subjects.find((s) => s.id === subId);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ─── Top Stats Bar ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-indigo-100 dark:border-indigo-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Today's Deep Focus
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {totalTodayMinutes} mins
          </p>
          <p className="text-[11px] text-gray-400">Recorded study minutes today</p>
        </Card>

        <Card className="p-4 border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Completed Pomodoros
          </p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {todaySessions.length}
          </p>
          <p className="text-[11px] text-gray-400">Sessions finished today</p>
        </Card>

        <Card className="p-4 border-violet-100 dark:border-violet-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Total Logged Sessions
          </p>
          <p className="text-2xl font-black text-violet-700 dark:text-violet-300 mt-1">
            {focusSessions.length}
          </p>
          <p className="text-[11px] text-gray-400">Lifetime history in StudyFlow</p>
        </Card>
      </div>

      {/* ─── Main Pomodoro Timer Card ─────────────────────────────────── */}
      <Card className="p-8 text-center space-y-6 border-indigo-200 dark:border-indigo-950/70 shadow-lg bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950">
        {/* Mode Selector Buttons */}
        <div className="inline-flex items-center rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
          <Button
            variant={mode === 'focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchMode('focus')}
            className="rounded-xl text-xs font-semibold px-4"
          >
            25m Focus
          </Button>
          <Button
            variant={mode === 'break' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchMode('break')}
            className="rounded-xl text-xs font-semibold px-4"
          >
            5m Short Break
          </Button>
          <Button
            variant={mode === 'long_break' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchMode('long_break')}
            className="rounded-xl text-xs font-semibold px-4"
          >
            15m Long Break
          </Button>
        </div>

        {/* Subject selector */}
        <div className="max-w-xs mx-auto">
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger className="h-9 text-xs">
              <BookOpen className="h-3.5 w-3.5 mr-1 text-indigo-500" />
              <SelectValue placeholder="Study Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">General Focus / Any Subject</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Big Digital Display */}
        <div className="relative inline-flex items-center justify-center my-4">
          <div className="h-64 w-64 rounded-full border-8 border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center relative shadow-inner">
            <span className="font-mono text-6xl font-black tracking-tighter text-gray-900 dark:text-white">
              {formatTimerDigits(timeLeft)}
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 mt-2">
              {mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          {!isActive ? (
            <Button
              onClick={startTimer}
              size="lg"
              className="h-12 px-8 rounded-xl gap-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Start Focus</span>
            </Button>
          ) : (
            <Button
              onClick={pauseTimer}
              size="lg"
              variant="secondary"
              className="h-12 px-8 rounded-xl gap-2 font-bold"
            >
              <Pause className="h-5 w-5" />
              <span>Pause</span>
            </Button>
          )}

          <Button
            onClick={resetTimer}
            variant="outline"
            size="lg"
            className="h-12 px-4 rounded-xl gap-1.5"
            title="Reset timer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Custom Duration Strip */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
          <span>Custom Duration:</span>
          <Input
            type="number"
            min="1"
            max="180"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="w-20 h-8 text-center text-xs"
          />
          <span>mins</span>
          <Button variant="outline" size="sm" onClick={applyCustomDuration} className="h-8 text-xs">
            Set Custom
          </Button>
        </div>
      </Card>

      {/* ─── Focus History Log ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Focus Session History</CardTitle>
          <CardDescription className="text-xs">
            Recorded study blocks and Pomodoro completions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {focusSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              No focus sessions logged yet. Complete a Pomodoro block to record history.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {focusSessions.slice(0, 10).map((sess) => {
                const sub = getSubject(sess.subject_id);
                return (
                  <div key={sess.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white capitalize">
                            {sess.session_type.replace('_', ' ')}
                          </span>
                          {sub && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                              style={{ backgroundColor: `${sub.color}15`, color: sub.color }}
                            >
                              {sub.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {sess.started_at?.replace('T', ' ').slice(0, 16)}
                        </p>
                      </div>
                    </div>

                    <Badge variant="secondary" className="font-mono text-xs">
                      {sess.duration_minutes} mins
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
