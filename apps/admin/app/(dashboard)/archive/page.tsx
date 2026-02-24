"use client";

import { useMe } from "@/hooks/use-auth";
import { useResource } from "@/hooks/use-resource";
import { useState } from "react";
import { Pin, Archive as ArchiveIcon, Trash2, ExternalLink, Download, ZoomIn, FileText, Link as LinkIcon, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { useUpdateResource, useDeleteResource } from "@/hooks/use-resource";
import { useTheme } from "@/components/shared/theme-provider";
import { adjustColorForDarkMode, getContrastTextColor } from "@/lib/color-utils";

type ResourceType = "notes" | "links" | "images" | "files";

interface Note {
  id: number;
  title: string;
  body: string;
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
}

interface Link {
  id: number;
  url: string;
  title: string;
  description: string;
  thumbnail_url: string;
  favicon_url: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
}

interface Image {
  id: number;
  url: string;
  title: string;
  mime_type: string;
  size_bytes: number;
  width: number;
  height: number;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
}

interface FileItem {
  id: number;
  url: string;
  title: string;
  original_name: string;
  extension: string;
  mime_type: string;
  size_bytes: number;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
}

export default function ArchivePage() {
  const { data: user, isLoading: userLoading } = useMe();
  const [activeTab, setActiveTab] = useState<ResourceType>("notes");

  const { data: notesData, isLoading: notesLoading } = useResource<Note>("/api/notes", {
    pageSize: 100,
    filters: { is_archived: "true", is_trashed: "false" },
  });

  const { data: linksData, isLoading: linksLoading } = useResource<Link>("/api/links", {
    pageSize: 100,
    filters: { is_archived: "true", is_trashed: "false" },
  });

  const { data: imagesData, isLoading: imagesLoading } = useResource<Image>("/api/images", {
    pageSize: 100,
    filters: { is_archived: "true", is_trashed: "false" },
  });

  const { data: filesData, isLoading: filesLoading } = useResource<FileItem>("/api/files", {
    pageSize: 100,
    filters: { is_archived: "true", is_trashed: "false" },
  });

  const notes = notesData?.data ?? [];
  const links = linksData?.data ?? [];
  const images = imagesData?.data ?? [];
  const files = filesData?.data ?? [];

  const totalArchived = notes.length + links.length + images.length + files.length;

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "notes" as ResourceType, label: "Notes", count: notes.length, icon: FileText },
    { key: "links" as ResourceType, label: "Links", count: links.length, icon: LinkIcon },
    { key: "images" as ResourceType, label: "Images", count: images.length, icon: ImageIcon },
    { key: "files" as ResourceType, label: "Files", count: files.length, icon: FileIcon },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-accent/10 via-bg-secondary to-bg-secondary p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <ArchiveIcon size={24} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Archive</h1>
            <p className="text-text-secondary mt-1">
              {totalArchived} archived {totalArchived === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "notes" && (
          <NotesArchive notes={notes} isLoading={notesLoading} />
        )}
        {activeTab === "links" && (
          <LinksArchive links={links} isLoading={linksLoading} />
        )}
        {activeTab === "images" && (
          <ImagesArchive images={images} isLoading={imagesLoading} />
        )}
        {activeTab === "files" && (
          <FilesArchive files={files} isLoading={filesLoading} />
        )}
      </div>
    </div>
  );
}

function NotesArchive({ notes, isLoading }: { notes: Note[]; isLoading: boolean }) {
  const updateMutation = useUpdateResource("/api/notes");
  const deleteMutation = useDeleteResource("/api/notes");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleUnarchive = async (note: Note) => {
    await updateMutation.mutateAsync({
      id: note.id,
      body: { ...note, is_archived: false } as Record<string, unknown>,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this note permanently?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-text-muted">Loading...</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">No archived notes</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes.map((note) => {
        const adjustedColor = adjustColorForDarkMode(note.color, isDark);
        const textColor = getContrastTextColor(adjustedColor);
        
        return (
          <div
            key={note.id}
            className="group relative rounded-lg border border-border p-4 hover:shadow-md transition-shadow"
            style={{ 
              backgroundColor: adjustedColor,
              color: textColor
            }}
          >
            <h3 className="font-semibold mb-2">{note.title}</h3>
            <p className="text-sm opacity-80 whitespace-pre-wrap break-words line-clamp-4">
              {note.body}
            </p>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-current/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleUnarchive(note)}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                title="Unarchive"
              >
                <ArchiveIcon size={14} />
              </button>
              <button
                onClick={() => handleDelete(note.id)}
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-danger transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LinksArchive({ links, isLoading }: { links: Link[]; isLoading: boolean }) {
  const updateMutation = useUpdateResource("/api/links");
  const deleteMutation = useDeleteResource("/api/links");

  const handleUnarchive = async (link: Link) => {
    await updateMutation.mutateAsync({
      id: link.id,
      body: { ...link, is_archived: false } as Record<string, unknown>,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this link permanently?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-text-muted">Loading...</div>;
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">No archived links</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link) => (
        <div key={link.id} className="group relative rounded-lg border border-border bg-bg-secondary hover:shadow-lg transition-all overflow-hidden">
          {link.thumbnail_url && (
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <img
                src={link.thumbnail_url}
                alt={link.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-1 truncate">{link.title}</h3>
            <p className="text-xs text-text-muted mb-2">{getDomain(link.url)}</p>
            {link.description && (
              <p className="text-sm text-text-secondary line-clamp-2">{link.description}</p>
            )}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <button
                  onClick={() => handleUnarchive(link)}
                  className="p-2 rounded-full hover:bg-bg-hover text-text-muted transition-colors"
                  title="Unarchive"
                >
                  <ArchiveIcon size={14} />
                </button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-bg-hover text-text-muted transition-colors"
                  title="Open link"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              <button
                onClick={() => handleDelete(link.id)}
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-danger transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ImagesArchive({ images, isLoading }: { images: Image[]; isLoading: boolean }) {
  const updateMutation = useUpdateResource("/api/images");
  const deleteMutation = useDeleteResource("/api/images");

  const handleUnarchive = async (image: Image) => {
    await updateMutation.mutateAsync({
      id: image.id,
      body: { ...image, is_archived: false } as Record<string, unknown>,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this image permanently?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-text-muted">Loading...</div>;
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">No archived images</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((image) => (
        <div key={image.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={image.url}
            alt={image.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleUnarchive(image)}
                className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                title="Unarchive"
              >
                <ArchiveIcon size={14} />
              </button>
              <button
                onClick={() => handleDelete(image.id)}
                className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-danger transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilesArchive({ files, isLoading }: { files: FileItem[]; isLoading: boolean }) {
  const updateMutation = useUpdateResource("/api/files");
  const deleteMutation = useDeleteResource("/api/files");

  const handleUnarchive = async (file: FileItem) => {
    await updateMutation.mutateAsync({
      id: file.id,
      body: { ...file, is_archived: false } as Record<string, unknown>,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this file permanently?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading) {
    return <div className="text-center py-12 text-text-muted">Loading...</div>;
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">No archived files</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <div key={file.id} className="group relative rounded-lg border border-border bg-bg-secondary hover:shadow-md transition-all p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <FileIcon size={24} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate mb-1">{file.title}</h3>
              <p className="text-xs text-text-muted truncate">{file.original_name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted mb-3">
            <span className="uppercase font-medium">{file.extension || "file"}</span>
            <span>{formatFileSize(file.size_bytes)}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <button
                onClick={() => handleUnarchive(file)}
                className="p-2 rounded-full hover:bg-bg-hover text-text-muted transition-colors"
                title="Unarchive"
              >
                <ArchiveIcon size={14} />
              </button>
              <a
                href={file.url}
                download
                className="p-2 rounded-full hover:bg-bg-hover text-text-muted transition-colors"
                title="Download"
              >
                <Download size={14} />
              </a>
            </div>
            <button
              onClick={() => handleDelete(file.id)}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-danger transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
