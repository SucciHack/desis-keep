"use client";

import { useState } from "react";
import { useResource, useUpdateResource, useDeleteResource } from "@/hooks/use-resource";
import { 
  Pin, Archive, Trash2, Download, File, FileText, FileImage, 
  FileVideo, FileAudio, FileCode, FileSpreadsheet, FileArchive,
  Folder, Upload as UploadIcon
} from "lucide-react";
import { UploadModal } from "@/components/upload/upload-modal";

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
  is_trashed: boolean;
  folder: string | null;
  created_at: string;
  updated_at: string;
}

const getFileIcon = (extension: string, mimeType: string) => {
  const ext = extension?.toLowerCase() || "";
  const mime = mimeType?.toLowerCase() || "";

  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) return FileText;
  if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "html", "css"].includes(ext)) return FileCode;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  
  return File;
};

const getFileColor = (extension: string, mimeType: string) => {
  const ext = extension?.toLowerCase() || "";
  const mime = mimeType?.toLowerCase() || "";

  if (mime.startsWith("image/")) return "text-blue-500 bg-blue-50";
  if (mime.startsWith("video/")) return "text-purple-500 bg-purple-50";
  if (mime.startsWith("audio/")) return "text-pink-500 bg-pink-50";
  if (["pdf"].includes(ext)) return "text-red-500 bg-red-50";
  if (["doc", "docx"].includes(ext)) return "text-blue-600 bg-blue-50";
  if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "html", "css"].includes(ext)) return "text-green-500 bg-green-50";
  if (["xls", "xlsx", "csv"].includes(ext)) return "text-emerald-500 bg-emerald-50";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "text-orange-500 bg-orange-50";
  
  return "text-gray-500 bg-gray-50";
};

export function FilesGrid() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  const { data, isLoading, refetch } = useResource<FileItem>("/api/files", {
    pageSize: 100,
    filters: { is_trashed: "false" },
  });

  const updateMutation = useUpdateResource("/api/files");
  const deleteMutation = useDeleteResource("/api/files");

  const files = data?.data ?? [];
  
  // Get unique folders
  const folders = Array.from(new Set(files.map(f => f.folder).filter(Boolean))) as string[];
  
  // Filter by folder
  const filteredFiles = selectedFolder 
    ? files.filter(f => f.folder === selectedFolder)
    : files;
    
  const pinnedFiles = filteredFiles.filter((f) => f.is_pinned && !f.is_archived);
  const regularFiles = filteredFiles.filter((f) => !f.is_pinned && !f.is_archived);
  const archivedFiles = filteredFiles.filter((f) => f.is_archived);

  const handleUpdateFile = async (file: FileItem, updates: Partial<FileItem>) => {
    await updateMutation.mutateAsync({
      id: file.id,
      body: { ...file, ...updates },
    });
  };

  const handleDeleteFile = async (id: number) => {
    if (confirm("Delete this file permanently?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const togglePin = (file: FileItem) => {
    handleUpdateFile(file, { is_pinned: !file.is_pinned });
  };

  const toggleArchive = (file: FileItem) => {
    handleUpdateFile(file, { is_archived: !file.is_archived });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Folder Filter & Upload */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFolder === null
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-gray-200"
              }`}
            >
              All Files ({files.length})
            </button>
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedFolder === folder
                    ? "bg-accent text-white"
                    : "bg-bg-secondary text-text-secondary hover:bg-gray-200"
                }`}
              >
                <Folder size={14} />
                {folder} ({files.filter(f => f.folder === folder).length})
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 font-medium"
          >
            <UploadIcon size={18} />
            Upload Files
          </button>
        </div>

        {/* Upload Area */}
        <div className="flex justify-center">
          <div 
            onClick={() => setShowUploadModal(true)}
            className="w-full max-w-2xl rounded-lg border-2 border-dashed border-border bg-bg-secondary p-8 text-center hover:border-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Folder size={32} className="text-accent" />
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">Click to upload files</p>
                <p className="text-sm text-text-muted">or drag and drop files here</p>
              </div>
            </div>
          </div>
        </div>

      {/* Pinned Files */}
      {pinnedFiles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            Pinned
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinnedFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPin={togglePin}
                onArchive={toggleArchive}
                onDelete={handleDeleteFile}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Files */}
      {regularFiles.length > 0 && (
        <div>
          {pinnedFiles.length > 0 && (
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              All Files
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {regularFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPin={togglePin}
                onArchive={toggleArchive}
                onDelete={handleDeleteFile}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        </div>
      )}

      {/* Archived Files */}
      {archivedFiles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            Archived
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {archivedFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPin={togglePin}
                onArchive={toggleArchive}
                onDelete={handleDeleteFile}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <Folder size={48} className="text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No files yet</h3>
          <p className="text-text-muted mb-4">Upload your first file to get started</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Upload Files
          </button>
        </div>
      )}
    </div>

    {/* Upload Modal */}
    {showUploadModal && (
      <UploadModal
        type="file"
        folders={folders}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => refetch()}
      />
    )}
  </>
  );
}

function FileCard({
  file,
  onPin,
  onArchive,
  onDelete,
  formatFileSize,
}: {
  file: FileItem;
  onPin: (file: FileItem) => void;
  onArchive: (file: FileItem) => void;
  onDelete: (id: number) => void;
  formatFileSize: (bytes: number) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = getFileIcon(file.extension, file.mime_type);
  const colorClass = getFileColor(file.extension, file.mime_type);

  return (
    <div className="group relative rounded-lg border border-border bg-white hover:shadow-md transition-all p-4">
      {/* File Icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate mb-1">{file.title}</h3>
          <p className="text-xs text-text-muted truncate">{file.original_name}</p>
        </div>
        {file.is_pinned && (
          <Pin size={16} className="text-accent shrink-0" />
        )}
      </div>

      {/* File Info */}
      <div className="flex items-center justify-between text-xs text-text-muted mb-3">
        <span className="uppercase font-medium">{file.extension || "file"}</span>
        <span>{formatFileSize(file.size_bytes)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPin(file)}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
              file.is_pinned ? "text-accent" : "text-text-muted"
            }`}
            title={file.is_pinned ? "Unpin" : "Pin"}
          >
            <Pin size={14} />
          </button>
          <button
            onClick={() => onArchive(file)}
            className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors"
            title={file.is_archived ? "Unarchive" : "Archive"}
          >
            <Archive size={14} />
          </button>
          <a
            href={file.url}
            download
            className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors"
            title="Download"
          >
            <Download size={14} />
          </a>
        </div>
        <button
          onClick={() => onDelete(file.id)}
          className="p-2 rounded-full hover:bg-red-50 text-danger transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
