"use client";

import { useState } from "react";
import { useResource, useCreateResource, useUpdateResource, useDeleteResource } from "@/hooks/use-resource";
import { Plus, Pin, Archive, Trash2, Palette, X, Copy, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/shared/theme-provider";
import { adjustColorForDarkMode, getContrastTextColor } from "@/lib/color-utils";

interface Note {
  id: number;
  title: string;
  body: string;
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}

const COLORS = [
  { name: "Default", value: "#ffffff" },
  { name: "Red", value: "#f28b82" },
  { name: "Orange", value: "#fbbc04" },
  { name: "Yellow", value: "#fff475" },
  { name: "Green", value: "#ccff90" },
  { name: "Teal", value: "#a7ffeb" },
  { name: "Blue", value: "#cbf0f8" },
  { name: "Purple", value: "#d7aefb" },
  { name: "Pink", value: "#fdcfe8" },
];

export function NotesBoard() {
  const [newNote, setNewNote] = useState({ title: "", body: "", color: "#ffffff" });
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading } = useResource<Note>("/api/notes", {
    pageSize: 100,
    filters: { is_trashed: "false" },
  });

  const createMutation = useCreateResource("/api/notes");
  const updateMutation = useUpdateResource("/api/notes");
  const deleteMutation = useDeleteResource("/api/notes");

  const notes = data?.data ?? [];
  const pinnedNotes = notes.filter((n) => n.is_pinned && !n.is_archived);
  const regularNotes = notes.filter((n) => !n.is_pinned && !n.is_archived);
  const archivedNotes = notes.filter((n) => n.is_archived);

  const handleCreateNote = async () => {
    if (!newNote.title && !newNote.body) {
      setIsCreating(false);
      return;
    }

    await createMutation.mutateAsync({
      title: newNote.title || "Untitled",
      body: newNote.body,
      color: newNote.color,
      is_pinned: false,
      is_archived: false,
    });

    setNewNote({ title: "", body: "", color: "#ffffff" });
    setIsCreating(false);
  };

  const handleUpdateNote = async (note: Note, updates: Partial<Note>) => {
    await updateMutation.mutateAsync({
      id: note.id,
      body: { ...note, ...updates } as Record<string, unknown>,
    });
  };

  const handleDeleteNote = async (id: number) => {
    if (confirm("Delete this note permanently?")) {
      await deleteMutation.mutateAsync(id);
      setViewingNote(null);
    }
  };

  const togglePin = (note: Note) => {
    handleUpdateNote(note, { is_pinned: !note.is_pinned });
  };

  const toggleArchive = (note: Note) => {
    handleUpdateNote(note, { is_archived: !note.is_archived });
  };

  const updateColor = (note: Note, color: string) => {
    handleUpdateNote(note, { color });
    setShowColorPicker(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Create Note */}
        <div className="flex justify-center">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full max-w-2xl rounded-lg border border-border bg-bg-secondary p-4 text-left text-text-muted hover:shadow-md transition-shadow"
            >
              Take a note...
            </button>
          ) : (
            <div
              className="w-full max-w-2xl rounded-lg border border-border shadow-lg p-4 space-y-3"
              style={{ 
                backgroundColor: adjustColorForDarkMode(newNote.color, isDark),
                color: getContrastTextColor(adjustColorForDarkMode(newNote.color, isDark))
              }}
            >
              <input
                type="text"
                placeholder="Title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="w-full bg-transparent border-none outline-none text-lg font-semibold placeholder:text-current placeholder:opacity-50"
                autoFocus
              />
              <textarea
                placeholder="Take a note..."
                value={newNote.body}
                onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
                className="w-full bg-transparent border-none outline-none resize-none placeholder:text-current placeholder:opacity-50"
                rows={3}
              />
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(showColorPicker === -1 ? null : -1)}
                      className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    >
                      <Palette size={18} />
                    </button>
                    {showColorPicker === -1 && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border flex gap-2 z-10">
                        {COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => {
                              setNewNote({ ...newNote, color: c.value });
                              setShowColorPicker(null);
                            }}
                            className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-600 dark:hover:border-gray-400 transition-colors"
                            style={{ backgroundColor: adjustColorForDarkMode(c.value, isDark) }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewNote({ title: "", body: "", color: "#ffffff" });
                      setIsCreating(false);
                    }}
                    className="px-4 py-2 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNote}
                    className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Pinned
            </h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onPin={togglePin}
                  onArchive={toggleArchive}
                  onDelete={handleDeleteNote}
                  onView={setViewingNote}
                  showColorPicker={showColorPicker === note.id}
                  setShowColorPicker={(show) => setShowColorPicker(show ? note.id : null)}
                  onColorChange={updateColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Notes */}
        {regularNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                Others
              </h2>
            )}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {regularNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onPin={togglePin}
                  onArchive={toggleArchive}
                  onDelete={handleDeleteNote}
                  onView={setViewingNote}
                  showColorPicker={showColorPicker === note.id}
                  setShowColorPicker={(show) => setShowColorPicker(show ? note.id : null)}
                  onColorChange={updateColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived Notes */}
        {archivedNotes.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Archived
            </h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {archivedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onPin={togglePin}
                  onArchive={toggleArchive}
                  onDelete={handleDeleteNote}
                  onView={setViewingNote}
                  showColorPicker={showColorPicker === note.id}
                  setShowColorPicker={(show) => setShowColorPicker(show ? note.id : null)}
                  onColorChange={updateColor}
                />
              ))}
            </div>
          </div>
        )}

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Plus size={48} className="text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No notes yet</h3>
            <p className="text-text-muted">Click "Take a note..." to create your first note</p>
          </div>
        )}
      </div>

      {/* Note View/Edit Modal */}
      {viewingNote && (
        <NoteModal
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
          onPin={togglePin}
          onArchive={toggleArchive}
        />
      )}
    </>
  );
}

function NoteCard({
  note,
  onPin,
  onArchive,
  onDelete,
  onView,
  showColorPicker,
  setShowColorPicker,
  onColorChange,
}: {
  note: Note;
  onPin: (note: Note) => void;
  onArchive: (note: Note) => void;
  onDelete: (id: number) => void;
  onView: (note: Note) => void;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  onColorChange: (note: Note, color: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const adjustedColor = adjustColorForDarkMode(note.color, isDark);
  const textColor = getContrastTextColor(adjustedColor);

  return (
    <div
      className="group relative rounded-lg border border-border p-4 hover:shadow-md transition-shadow cursor-pointer break-inside-avoid"
      style={{ 
        backgroundColor: adjustedColor,
        color: textColor
      }}
      onClick={() => onView(note)}
    >
      <h3 className="font-semibold mb-2 pr-8">{note.title}</h3>
      <p className="text-sm opacity-80 whitespace-pre-wrap break-words line-clamp-[12]">
        {note.body}
      </p>

      {/* Actions */}
      <div
        className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPin(note)}
            className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
              note.is_pinned ? "text-accent" : ""
            }`}
            title={note.is_pinned ? "Unpin" : "Pin"}
          >
            <Pin size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Change color"
            >
              <Palette size={16} />
            </button>
            {showColorPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border flex gap-2 z-10">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onColorChange(note, c.value)}
                    className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-600 dark:hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: adjustColorForDarkMode(c.value, isDark) }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => onArchive(note)}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title={note.is_archived ? "Unarchive" : "Archive"}
          >
            <Archive size={16} />
          </button>
        </div>
        <button
          onClick={() => onDelete(note.id)}
          className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-danger transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function NoteModal({
  note,
  onClose,
  onUpdate,
  onDelete,
  onPin,
  onArchive,
}: {
  note: Note;
  onClose: () => void;
  onUpdate: (note: Note, updates: Partial<Note>) => void;
  onDelete: (id: number) => void;
  onPin: (note: Note) => void;
  onArchive: (note: Note) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(note.title);
  const [editedBody, setEditedBody] = useState(note.body);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const adjustedColor = adjustColorForDarkMode(note.color, isDark);
  const textColor = getContrastTextColor(adjustedColor);

  const handleCopy = () => {
    const text = `${note.title}\n\n${note.body}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSave = () => {
    if (editedTitle !== note.title || editedBody !== note.body) {
      onUpdate(note, { title: editedTitle, body: editedBody });
    }
    setIsEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] rounded-lg shadow-xl overflow-hidden"
        style={{ 
          backgroundColor: adjustedColor,
          color: textColor
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-2xl font-semibold"
                placeholder="Title"
                autoFocus
              />
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-base"
                rows={15}
                placeholder="Take a note..."
              />
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold mb-4 pr-8">
                {note.title}
              </h2>
              <p className="text-base opacity-90 whitespace-pre-wrap break-words">
                {note.body}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
          {isEditing ? (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEditedTitle(note.title);
                  setEditedBody(note.body);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onPin(note);
                    onClose();
                  }}
                  className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                    note.is_pinned ? "text-accent" : ""
                  }`}
                  title={note.is_pinned ? "Unpin" : "Pin"}
                >
                  <Pin size={18} />
                </button>
                <button
                  onClick={() => {
                    onArchive(note);
                    onClose();
                  }}
                  className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  title={note.is_archived ? "Unarchive" : "Archive"}
                >
                  <Archive size={18} />
                </button>
                <button
                  onClick={() => onDelete(note.id)}
                  className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-danger transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
