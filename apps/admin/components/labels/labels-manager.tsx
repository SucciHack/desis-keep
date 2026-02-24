"use client";

import { useState } from "react";
import { useResource, useCreateResource, useUpdateResource, useDeleteResource } from "@/hooks/use-resource";
import { Plus, Edit2, Trash2, Tag, Check, X } from "lucide-react";
import { useTheme } from "@/components/shared/theme-provider";
import { adjustColorForDarkMode, getContrastTextColor } from "@/lib/color-utils";

interface Label {
  id: number;
  name: string;
  slug: string;
  color: string;
  created_at: string;
  updated_at: string;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#6b7280", "#000000",
];

export function LabelsManager() {
  const [newLabel, setNewLabel] = useState({ name: "", color: PRESET_COLORS[0] });
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading } = useResource<Label>("/api/labels", {
    pageSize: 100,
  });

  const createMutation = useCreateResource("/api/labels");
  const updateMutation = useUpdateResource("/api/labels");
  const deleteMutation = useDeleteResource("/api/labels");

  const labels = data?.data ?? [];

  const handleCreateLabel = async () => {
    if (!newLabel.name) return;

    await createMutation.mutateAsync({
      name: newLabel.name,
      color: newLabel.color,
    });

    setNewLabel({ name: "", color: PRESET_COLORS[0] });
    setIsCreating(false);
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel || !editingLabel.name) return;

    await updateMutation.mutateAsync({
      id: editingLabel.id,
      body: editingLabel as unknown as Record<string, unknown>,
    });

    setEditingLabel(null);
  };

  const handleDeleteLabel = async (id: number) => {
    if (confirm("Delete this label permanently?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading labels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Create Label */}
      <div className="rounded-lg border border-border bg-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Create New Label</h2>
        
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full rounded-lg border-2 border-dashed border-border bg-bg-tertiary p-4 text-left text-text-muted hover:border-accent/50 transition-colors flex items-center gap-3"
          >
            <Plus size={20} />
            <span>Add a new label...</span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Label name"
                value={newLabel.name}
                onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                className="flex-1 px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent bg-bg-tertiary text-foreground"
                autoFocus
              />
              <div className="relative">
                <button
                  className="w-12 h-10 rounded-lg border border-border"
                  style={{ backgroundColor: adjustColorForDarkMode(newLabel.color, isDark) }}
                  title="Choose color"
                />
              </div>
            </div>

            {/* Color Picker */}
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewLabel({ ...newLabel, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    newLabel.color === color ? "border-accent scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: adjustColorForDarkMode(color, isDark) }}
                  title={color}
                />
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setNewLabel({ name: "", color: PRESET_COLORS[0] });
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-sm font-medium hover:bg-bg-hover rounded-md transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLabel}
                disabled={!newLabel.name}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Label
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Labels List */}
      <div className="rounded-lg border border-border bg-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Labels ({labels.length})
        </h2>

        {labels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Tag size={32} className="text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No labels yet</h3>
            <p className="text-text-muted">Create your first label to organize your content</p>
          </div>
        ) : (
          <div className="space-y-2">
            {labels.map((label) => (
              <div key={label.id}>
                {editingLabel?.id === label.id ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-tertiary">
                    <div
                      className="w-8 h-8 rounded-lg shrink-0"
                      style={{ backgroundColor: adjustColorForDarkMode(editingLabel.color, isDark) }}
                    />
                    <input
                      type="text"
                      value={editingLabel.name}
                      onChange={(e) =>
                        setEditingLabel({ ...editingLabel, name: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 border border-border rounded-md outline-none focus:ring-2 focus:ring-accent bg-bg-secondary text-foreground"
                      autoFocus
                    />
                    
                    {/* Color Picker for Edit */}
                    <div className="flex gap-1">
                      {PRESET_COLORS.slice(0, 10).map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setEditingLabel({ ...editingLabel, color })
                          }
                          className={`w-6 h-6 rounded border-2 transition-all ${
                            editingLabel.color === color
                              ? "border-accent scale-110"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: adjustColorForDarkMode(color, isDark) }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleUpdateLabel}
                      className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                      title="Save"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => setEditingLabel(null)}
                      className="p-2 rounded-full hover:bg-bg-hover text-text-muted transition-colors"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors">
                    <div
                      className="w-8 h-8 rounded-lg shrink-0"
                      style={{ backgroundColor: adjustColorForDarkMode(label.color, isDark) }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{label.name}</h3>
                      <p className="text-xs text-text-muted">{label.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingLabel(label)}
                        className="p-2 rounded-full hover:bg-bg-hover text-text-muted transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLabel(label.id)}
                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Label Cloud Preview */}
      {labels.length > 0 && (
        <div className="rounded-lg border border-border bg-bg-secondary p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Label Cloud</h2>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => {
              const adjustedColor = adjustColorForDarkMode(label.color, isDark);
              const textColor = getContrastTextColor(adjustedColor);
              return (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  style={{ 
                    backgroundColor: adjustedColor,
                    color: textColor
                  }}
                >
                  <Tag size={14} />
                  {label.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
