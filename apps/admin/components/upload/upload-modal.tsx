"use client";

import { useState } from "react";
import { X, Upload, Folder, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  type: "image" | "file";
  folders?: string[];
}

export function UploadModal({ onClose, onSuccess, type, folders = [] }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  
  // Get custom folders from localStorage
  const getStoredFolders = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`custom_folders_${type}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };
  
  const [customFolders, setCustomFolders] = useState<string[]>(getStoredFolders);
  
  // Combine existing folders with custom folders
  const allFolders = Array.from(new Set([...folders, ...customFolders])).sort();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      console.log("Files selected:", filesArray.length, filesArray);
      setSelectedFiles(filesArray);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setUploading(true);

    try {
      for (const file of selectedFiles) {
        console.log("=== Starting upload ===");
        console.log("File object:", file);
        console.log("File name:", file.name);
        console.log("File type:", file.type);
        console.log("File size:", file.size);
        console.log("File instanceof File:", file instanceof File);
        console.log("File instanceof Blob:", file instanceof Blob);
        
        // Upload file to storage
        const formData = new FormData();
        formData.append("file", file);
        
        // Log FormData contents
        console.log("FormData entries:");
        for (let pair of formData.entries()) {
          console.log(pair[0], ":", pair[1]);
          if (pair[1] instanceof File) {
            console.log("  -> File name:", pair[1].name);
            console.log("  -> File size:", pair[1].size);
            console.log("  -> File type:", pair[1].type);
          }
        }

        console.log("Sending POST to /api/uploads");

        // Don't set Content-Type header - let browser set it with boundary
        const uploadResponse = await apiClient.post("/api/uploads", formData);

        console.log("Upload successful:", uploadResponse.data);

        const uploadData = uploadResponse.data.data;

        // Create image or file record
        const endpoint = type === "image" ? "/api/images" : "/api/files";
        
        // Build payload based on type
        const payload = type === "image" 
          ? {
              title: file.name,
              storage_key: uploadData.path,
              url: uploadData.url,
              mime_type: file.type,
              size_bytes: file.size,
              folder: selectedFolder || "",
            }
          : {
              title: file.name,
              original_name: file.name,
              storage_key: uploadData.path,
              url: uploadData.url,
              mime_type: file.type,
              size_bytes: file.size,
              extension: file.name.split(".").pop() || "",
              folder: selectedFolder || "",
            };

        console.log("Creating record with payload:", payload);

        await apiClient.post(endpoint, payload);
        
        console.log("Record created successfully");
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("=== Upload error ===");
      console.error("Error:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.response?.data?.error?.message);
      
      const errorMessage = error.response?.data?.error?.message || error.message || "Failed to upload files";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const folderName = newFolderName.trim();
      setSelectedFolder(folderName);
      
      // Save to localStorage
      const updatedFolders = [...customFolders, folderName];
      setCustomFolders(updatedFolders);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`custom_folders_${type}`, JSON.stringify(updatedFolders));
      }
      
      setNewFolderName("");
      setShowNewFolder(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-bg-secondary rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Upload {type === "image" ? "Images" : "Files"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Folder (Optional)
            </label>
            {!showNewFolder ? (
              <div className="flex gap-2">
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent bg-bg-tertiary text-foreground"
                >
                  <option value="">No folder (Root)</option>
                  {allFolders.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-bg-hover transition-colors flex items-center gap-2 text-foreground"
                >
                  <Folder size={16} />
                  New
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="flex-1 px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent bg-bg-tertiary text-foreground"
                  autoFocus
                />
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-bg-hover transition-colors text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Files
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/50 transition-colors bg-bg-tertiary">
              <input
                type="file"
                multiple
                accept={type === "image" ? "image/*" : "*"}
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {type === "image" ? (
                  <ImageIcon size={48} className="text-accent" />
                ) : (
                  <FileIcon size={48} className="text-accent" />
                )}
                <div>
                  <p className="text-foreground font-medium mb-1">
                    Click to select files
                  </p>
                  <p className="text-sm text-text-muted">
                    {type === "image" ? "Select images to upload" : "Select files to upload"}
                  </p>
                </div>
              </label>
            </div>
            {selectedFiles.length === 0 && (
              <p className="text-xs text-text-muted mt-2">
                No files selected yet
              </p>
            )}
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Selected Files ({selectedFiles.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {type === "image" ? (
                        <ImageIcon size={20} className="text-accent shrink-0" />
                      ) : (
                        <FileIcon size={20} className="text-accent shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
                      }
                      className="p-1 rounded-full hover:bg-bg-hover transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium hover:bg-bg-hover rounded-md transition-colors disabled:opacity-50 text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="px-6 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload {selectedFiles.length} file(s)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
