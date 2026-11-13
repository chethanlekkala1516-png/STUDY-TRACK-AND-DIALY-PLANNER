import React, { useState, useMemo } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  BookOpen,
  Trash2,
  FileEdit,
  Tag,
  Calendar,
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
import { formatDateShort } from '@/lib/date-utils';
import { toast } from '@/lib/notifications';
import type { Note } from '@/types';

export default function Notes() {
  const { notes, subjects, addNote, updateNote, deleteNote } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');
  const [formType, setFormType] = useState<'study' | 'revision' | 'journal' | 'general'>('study');
  const [formContent, setFormContent] = useState('');

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          if (!matchTitle && !matchContent) return false;
        }
        if (selectedType !== 'all' && n.note_type !== selectedType) return false;
        if (selectedSubject !== 'all' && n.subject_id !== selectedSubject) return false;
        return true;
      })
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [notes, searchQuery, selectedType, selectedSubject]);

  const openCreateDialog = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormSubjectId('none');
    setFormType('study');
    setFormContent('');
    setDialogOpen(true);
  };

  const openEditDialog = (n: Note) => {
    setEditingNote(n);
    setFormTitle(n.title);
    setFormSubjectId(n.subject_id || 'none');
    setFormType(n.note_type);
    setFormContent(n.content);
    setDialogOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Note title required', type: 'warning' });
      return;
    }

    const payload = {
      title: formTitle.trim(),
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      note_type: formType,
      content: formContent.trim(),
    };

    if (editingNote) {
      await updateNote(editingNote.id, payload);
    } else {
      await addNote(payload);
    }
    setDialogOpen(false);
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
          <StickyNote className="h-5 w-5 text-indigo-600" />
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Academic Notes & Journal</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openCreateDialog} size="sm" className="h-8 gap-1.5 shadow-sm text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* ─── Search & Filters Strip ──────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes content or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Note Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Note Types</SelectItem>
                <SelectItem value="study">Study Notes</SelectItem>
                <SelectItem value="revision">Revision Notes</SelectItem>
                <SelectItem value="journal">Daily Journal</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
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
          </div>
        </CardContent>
      </Card>

      {/* ─── Notes Grid ──────────────────────────────────────────────── */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes found"
          description="Capture lecture summaries, conceptual proofs, revision outlines, or reflections."
          actionLabel="Create Note"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const sub = getSubject(note.subject_id);

            return (
              <Card
                key={note.id}
                className="hover:shadow-md transition-shadow border-gray-200/80 dark:border-gray-800 flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
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
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                          {note.note_type}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold line-clamp-1">
                        {note.title}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDialog(note)}
                        className="text-gray-400 hover:text-indigo-600 p-1"
                        title="Edit"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line line-clamp-5 leading-relaxed bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    {note.content || 'Empty note content.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>Updated {formatDateShort(note.updated_at)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(note)}
                      className="text-xs text-indigo-600 h-7"
                    >
                      Read & Edit &rarr;
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Add/Edit Note Dialog ───────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Academic Note' : 'Create New Note'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveNote} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nTitle">Note Title *</Label>
              <Input
                id="nTitle"
                placeholder="e.g. Master Theorem & Recurrence Patterns"
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
                <Label>Note Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study Notes</SelectItem>
                    <SelectItem value="revision">Revision Notes</SelectItem>
                    <SelectItem value="journal">Daily Reflection / Journal</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nContent">Content</Label>
              <Textarea
                id="nContent"
                rows={8}
                placeholder="Write your study notes, formulas, questions, or ideas here..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingNote ? 'Save Note' : 'Create Note'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
