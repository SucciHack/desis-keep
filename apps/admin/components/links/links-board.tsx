"use client";

import { useState } from "react";
import { useResource, useCreateResource, useUpdateResource, useDeleteResource } from "@/hooks/use-resource";
import { Plus, Pin, Archive, Trash2, ExternalLink, Globe, Link as LinkIcon } from "lucide-react";

interface Link {
  id: number;
  url: string;
  title: string;
  description: string;
  thumbnail_url: string;
  favicon_url: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}

export function LinksBoard() {
  const [newLink, setNewLink] = useState({ url: "", title: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useResource<Link>("/api/links", {
    pageSize: 100,
    filters: { is_trashed: "false" },
  });

  const createMutation = useCreateResource("/api/links");
  const updateMutation = useUpdateResource("/api/links");
  const deleteMutation = useDeleteResource("/api/links");

  const links = data?.data ?? [];
  const pinnedLinks = links.filter((l) => l.is_pinned && !l.is_archived);
  const regularLinks = links.filter((l) => !l.is_pinned && !l.is_archived);
  const archivedLinks = links.filter((l) => l.is_archived);

  const handleCreateLink = async () => {
    if (!newLink.url) {
      return;
    }

    await createMutation.mutateAsync({
      url: newLink.url,
      title: newLink.title || new URL(newLink.url).hostname,
      description: newLink.description,
      is_pinned: false,
      is_archived: false,
    });

    setNewLink({ url: "", title: "", description: "" });
    setIsCreating(false);
  };

  const handleUpdateLink = async (link: Link, updates: Partial<Link>) => {
    await updateMutation.mutateAsync({
      id: link.id,
      body: { ...link, ...updates },
    });
  };

  const handleDeleteLink = async (id: number) => {
    if (confirm("Delete this link permanently?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const togglePin = (link: Link) => {
    handleUpdateLink(link, { is_pinned: !link.is_pinned });
  };

  const toggleArchive = (link: Link) => {
    handleUpdateLink(link, { is_archived: !link.is_archived });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Create Link */}
      <div className="flex justify-center">
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full max-w-2xl rounded-lg border border-border bg-bg-secondary p-4 text-left text-text-muted hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <LinkIcon size={20} />
            <span>Add a link...</span>
          </button>
        ) : (
          <div className="w-full max-w-2xl rounded-lg border border-border shadow-lg bg-bg-secondary p-6 space-y-4">
            <input
              type="url"
              placeholder="https://example.com"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent bg-bg-tertiary text-foreground"
              autoFocus
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent bg-bg-tertiary text-foreground"
            />
            <textarea
              placeholder="Description (optional)"
              value={newLink.description}
              onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent resize-none bg-bg-tertiary text-foreground"
              rows={3}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setNewLink({ url: "", title: "", description: "" });
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-sm font-medium hover:bg-bg-hover rounded-md transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLink}
                disabled={!newLink.url}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pinned Links */}
      {pinnedLinks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            Pinned
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onPin={togglePin}
                onArchive={toggleArchive}
                onDelete={handleDeleteLink}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Links */}
      {regularLinks.length > 0 && (
        <div>
          {pinnedLinks.length > 0 && (
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              All Links
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onPin={togglePin}
                onArchive={toggleArchive}
                onDelete={handleDeleteLink}
              />
            ))}
          </div>
        </div>
      )}

      {/* Archived Links */}
      {archivedLinks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            Archived
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onPin={togglePin}
                onArchive={toggleArchive}
                onDelete={handleDeleteLink}
              />
            ))}
          </div>
        </div>
      )}

      {links.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <LinkIcon size={48} className="text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No links yet</h3>
          <p className="text-text-muted">Click "Add a link..." to save your first bookmark</p>
        </div>
      )}
    </div>
  );
}

function LinkCard({
  link,
  onPin,
  onArchive,
  onDelete,
}: {
  link: Link;
  onPin: (link: Link) => void;
  onArchive: (link: Link) => void;
  onDelete: (id: number) => void;
}) {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div className="group relative rounded-lg border border-border bg-white hover:shadow-lg transition-all overflow-hidden">
      {/* Thumbnail */}
      {link.thumbnail_url ? (
        <div className="w-full h-48 bg-gray-100 overflow-hidden">
          <img
            src={link.thumbnail_url}
            alt={link.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
          <Globe size={48} className="text-accent/30" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          {link.favicon_url ? (
            <img
              src={link.favicon_url}
              alt=""
              className="w-5 h-5 mt-0.5 rounded"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Globe size={16} className="text-text-muted mt-1" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1 truncate">{link.title}</h3>
            <p className="text-xs text-text-muted mb-2">{getDomain(link.url)}</p>
            {link.description && (
              <p className="text-sm text-text-secondary line-clamp-2">{link.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPin(link)}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                link.is_pinned ? "text-accent" : "text-text-muted"
              }`}
              title={link.is_pinned ? "Unpin" : "Pin"}
            >
              <Pin size={16} />
            </button>
            <button
              onClick={() => onArchive(link)}
              className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors"
              title={link.is_archived ? "Unarchive" : "Archive"}
            >
              <Archive size={16} />
            </button>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors"
              title="Open link"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          <button
            onClick={() => onDelete(link.id)}
            className="p-2 rounded-full hover:bg-red-50 text-danger transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
