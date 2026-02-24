package handlers

import (
	"fmt"
	"log"
	"math"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"desis-keep/apps/api/internal/jobs"
	"desis-keep/apps/api/internal/models"
	"desis-keep/apps/api/internal/storage"
)

// AllowedMimeTypes defines which file types can be uploaded.
var AllowedMimeTypes = map[string]bool{
	"image/jpeg":       true,
	"image/png":        true,
	"image/gif":        true,
	"image/webp":       true,
	"video/mp4":        true,
	"video/webm":       true,
	"video/quicktime":  true,
	"application/pdf":  true,
	"text/plain":       true,
	"text/csv":         true,
	"application/json": true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":       true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
}

// MaxUploadSize is the maximum file size (50 MB).
const MaxUploadSize = 50 << 20

// UploadHandler handles file upload endpoints.
type UploadHandler struct {
	DB      *gorm.DB
	Storage *storage.Storage
	Jobs    *jobs.Client
}

// Create handles file upload via multipart form.
func (h *UploadHandler) Create(c *gin.Context) {
	if h.Storage == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "STORAGE_UNAVAILABLE",
				"message": "File storage is not configured",
			},
		})
		return
	}

	// Debug logging
	fmt.Printf("=== Upload Request Debug ===\n")
	log.Println("ENTERING CREATE HANDLER")
	fmt.Printf("Content-Type: %s\n", c.GetHeader("Content-Type"))
	fmt.Printf("Content-Length: %s\n", c.GetHeader("Content-Length"))

	// Try to parse multipart form first
	if err := c.Request.ParseMultipartForm(MaxUploadSize); err != nil {
		fmt.Printf("ParseMultipartForm error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_MULTIPART",
				"message": fmt.Sprintf("Failed to parse multipart form: %v", err),
			},
		})
		return
	}

	// List all form fields
	if c.Request.MultipartForm != nil {
		fmt.Printf("Form fields: %v\n", c.Request.MultipartForm.Value)
		fmt.Printf("Form files: %v\n", c.Request.MultipartForm.File)
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		fmt.Printf("FormFile error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_FILE",
				"message": fmt.Sprintf("No file provided: %v", err),
			},
		})
		return
	}
	defer file.Close()

	fmt.Printf("File received: %s, Size: %d bytes\n", header.Filename, header.Size)

	// Validate file size
	if header.Size > MaxUploadSize {
		fmt.Printf("File too large: %d > %d\n", header.Size, MaxUploadSize)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "FILE_TOO_LARGE",
				"message": fmt.Sprintf("File size exceeds maximum of %d MB", MaxUploadSize/(1<<20)),
			},
		})
		return
	}

	// Validate MIME type
	mimeType := header.Header.Get("Content-Type")
	fmt.Printf("MIME type: %s\n", mimeType)
	if !AllowedMimeTypes[mimeType] {
		fmt.Printf("MIME type not allowed: %s\n", mimeType)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_FILE_TYPE",
				"message": "File type not allowed",
			},
		})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), strings.TrimSuffix(filepath.Base(header.Filename), ext), ext)
	key := fmt.Sprintf("uploads/%s/%s", time.Now().Format("2006/01"), filename)
	fmt.Printf("Generated key: %s\n", key)

	// Upload to storage
	fmt.Printf("Uploading to storage...\n")
	if err := h.Storage.Upload(c.Request.Context(), key, file, mimeType); err != nil {
		fmt.Printf("Storage upload error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "UPLOAD_FAILED",
				"message": "Failed to upload file",
			},
		})
		return
	}
	fmt.Printf("Storage upload successful\n")

	userID, exists := c.Get("user_id")
	if !exists {
		fmt.Printf("User not authenticated\n")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User not authenticated",
			},
		})
		return
	}

	// Type assert safely
	userIDUint, ok := userID.(uint)
	if !ok {
		fmt.Printf("Invalid user ID type: %T\n", userID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Invalid user ID type",
			},
		})
		return
	}
	fmt.Printf("User ID: %d\n", userIDUint)

	upload := models.Upload{
		Filename:     filename,
		OriginalName: header.Filename,
		MimeType:     mimeType,
		Size:         header.Size,
		Path:         key,
		URL:          h.Storage.GetURL(key),
		UserID:       userIDUint,
	}

	// Save to database
	fmt.Printf("Saving to database...\n")
	if err := h.DB.Create(&upload).Error; err != nil {
		fmt.Printf("Database save error: %v\n", err)
		// If DB save fails, try to clean up the uploaded file
		_ = h.Storage.Delete(c.Request.Context(), key)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "DATABASE_ERROR",
				"message": "Failed to save upload record",
			},
		})
		return
	}
	fmt.Printf("Database save successful, ID: %d\n", upload.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    upload,
		"message": "File uploaded successfully",
	})
}

// List returns a paginated list of uploads.
func (h *UploadHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	query := h.DB.Model(&models.Upload{})

	// Filter by MIME type
	if mimeType := c.Query("mime_type"); mimeType != "" {
		query = query.Where("mime_type LIKE ?", mimeType+"%")
	}

	var total int64
	query.Count(&total)

	var uploads []models.Upload
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&uploads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch uploads",
			},
		})
		return
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	c.JSON(http.StatusOK, gin.H{
		"data": uploads,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     pages,
		},
	})
}

// GetByID returns a single upload by ID.
func (h *UploadHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var upload models.Upload
	if err := h.DB.First(&upload, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Upload not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": upload,
	})
}

// Delete removes an upload and its stored file.
func (h *UploadHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var upload models.Upload
	if err := h.DB.First(&upload, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Upload not found",
			},
		})
		return
	}

	// Delete from storage
	if h.Storage != nil {
		_ = h.Storage.Delete(c.Request.Context(), upload.Path)
		// Also delete thumbnail if it exists
		if upload.ThumbnailURL != "" {
			thumbKey := strings.Replace(upload.Path, "uploads/", "thumbnails/", 1)
			_ = h.Storage.Delete(c.Request.Context(), thumbKey)
		}
	}

	if err := h.DB.Delete(&upload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete upload",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Upload deleted successfully",
	})
}
