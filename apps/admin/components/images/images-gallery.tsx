"use client";

import { useState } from "react";
import { useResource, useUpdateResource, useDeleteResource } from "@/hooks/use-resource";
import { Pin, Archive, Trash2, Download, X, ZoomIn, Image as ImageIcon, Upload as UploadIcon, Folder } from "lucide-react";
import { UploadModal } from "@/components/upload/upload-modal";

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
  is_trashed: boolean;
  folder: string | null;
  created_at: string;
  updated_at: string;
}

export function ImagesGallery() {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const { data, isLoading, refetch } = useResource<Image>("/api/images", {
    pageSize: 100,
    filters: { is_trashed: "false" },
  });

  const updateMutation = useUpdateResource("/api/images");
  const deleteMutation = useDeleteResource("/api/images");

  const images = data?.data ?? [];
  
  // Get unique folders
  const folders = Array.from(new Set(images.map(i => i.folder).filter(Boolean))) as string[];
  
  // Filter by folder
  const filteredImages = selectedFolder 
    ? images.filter(i => i.folder === selectedFolder)
    : images;
    
  const pinnedImages = filteredImages.filter((i) => i.is_pinned && !i.is_archived);
  const regularImages = filteredImages.filter((i) => !i.is_pinned && !i.is_archived);
  const archivedImages = filteredImages.filter((i) => i.is_archived);

  const handleUpdateImage = async (image: Image, updates: Partial<Image>) => {
    await updateMutation.mutateAsync({
      id: image.id,
      body: { ...image, ...updates },
    });
  };

  const handleDeleteImage = async (id: number) => {
    if (confirm("Delete this image permanently?")) {
      await deleteMutation.mutateAsync(id);
      setSelectedImage(null);
    }
  };

  const togglePin = (image: Image) => {
    handleUpdateImage(image, { is_pinned: !image.is_pinned });
  };

  const toggleArchive = (image: Image) => {
    handleUpdateImage(image, { is_archived: !image.is_archived });
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
          <p className="mt-4 text-text-secondary">Loading images...</p>
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
              All Images ({images.length})
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
                {folder} ({images.filter(i => i.folder === folder).length})
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 font-medium"
          >
            <UploadIcon size={18} />
            Upload Images
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
                <ImageIcon size={32} className="text-accent" />
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">Click to upload images</p>
                <p className="text-sm text-text-muted">or drag and drop images here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Images */}
        {pinnedImages.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Pinned
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pinnedImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onPin={togglePin}
                  onArchive={toggleArchive}
                  onDelete={handleDeleteImage}
                  onView={setSelectedImage}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Images */}
        {regularImages.length > 0 && (
          <div>
            {pinnedImages.length > 0 && (
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                All Images
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {regularImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onPin={togglePin}
                  onArchive={toggleArchive}
                  onDelete={handleDeleteImage}
                  onView={setSelectedImage}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived Images */}
        {archivedImages.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Archived
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {archivedImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onPin={togglePin}
                  onArchive={toggleArchive}
                  onDelete={handleDeleteImage}
                  onView={setSelectedImage}
                />
              ))}
            </div>
          </div>
        )}

        {images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <ImageIcon size={48} className="text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No images yet</h3>
            <p className="text-text-muted mb-4">Upload your first image to get started</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Upload Images
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          type="image"
          folders={folders}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onPin={togglePin}
          onArchive={toggleArchive}
          onDelete={handleDeleteImage}
          formatFileSize={formatFileSize}
        />
      )}
    </>
  );
}

function ImageCard({
  image,
  onPin,
  onArchive,
  onDelete,
  onView,
}: {
  image: Image;
  onPin: (image: Image) => void;
  onArchive: (image: Image) => void;
  onDelete: (id: number) => void;
  onView: (image: Image) => void;
}) {
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer">
      <img
        src={image.url}
        alt={image.title}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        onClick={() => onView(image)}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" onClick={() => onView(image)}>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin(image);
            }}
            className={`p-2 rounded-full bg-white/90 hover:bg-white transition-colors ${
              image.is_pinned ? "text-accent" : "text-gray-700"
            }`}
            title={image.is_pinned ? "Unpin" : "Pin"}
          >
            <Pin size={14} />
          </button>
        </div>

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(image);
            }}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 transition-colors"
            title="View"
          >
            <ZoomIn size={14} />
          </button>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(image);
              }}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 transition-colors"
              title={image.is_archived ? "Unarchive" : "Archive"}
            >
              <Archive size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-danger transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageViewer({
  image,
  onClose,
  onPin,
  onArchive,
  onDelete,
  formatFileSize,
}: {
  image: Image;
  onClose: () => void;
  onPin: (image: Image) => void;
  onArchive: (image: Image) => void;
  onDelete: (id: number) => void;
  formatFileSize: (bytes: number) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
        >
          <X size={32} />
        </button>

        {/* Image */}
        <div className="flex items-center justify-center mb-4">
          <img
            src={image.url}
            alt={image.title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>

        {/* Info and Actions */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{image.title}</h3>
              <p className="text-sm text-text-muted">
                {image.width} × {image.height} • {formatFileSize(image.size_bytes)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPin(image)}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                  image.is_pinned ? "text-accent" : "text-text-muted"
                }`}
                title={image.is_pinned ? "Unpin" : "Pin"}
              >
                <Pin size={18} />
              </button>
              <button
                onClick={() => onArchive(image)}
                className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors"
                title={image.is_archived ? "Unarchive" : "Archive"}
              >
                <Archive size={18} />
              </button>
              <a
                href={image.url}
                download
                className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors"
                title="Download"
              >
                <Download size={18} />
              </a>
              <button
                onClick={() => onDelete(image.id)}
                className="p-2 rounded-full hover:bg-red-50 text-danger transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
