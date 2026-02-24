package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
	"desis-keep/apps/api/internal/services"
)

// FileHandler handles file endpoints.
type FileHandler struct {
	DB      *gorm.DB
	Service *services.FileService
}

// NewFileHandler creates a new FileHandler instance.
func NewFileHandler(db *gorm.DB) *FileHandler {
	return &FileHandler{
		DB:      db,
		Service: services.NewFileService(db),
	}
}

// List returns a paginated list of files for the authenticated user.
func (h *FileHandler) List(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	var archived, trashed *bool
	if c.Query("archived") != "" {
		val := c.Query("archived") == "true"
		archived = &val
	}
	if c.Query("trashed") != "" {
		val := c.Query("trashed") == "true"
		trashed = &val
	}

	files, total, pages, err := h.Service.List(userID, page, pageSize, search, sortBy, sortOrder, archived, trashed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch files",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": files,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     pages,
		},
	})
}

// Create adds a new file.
func (h *FileHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Title        string `json:"title"`
		OriginalName string `json:"original_name" binding:"required"`
		StorageKey   string `json:"storage_key" binding:"required"`
		URL          string `json:"url" binding:"required"`
		MimeType     string `json:"mime_type"`
		SizeBytes    uint   `json:"size_bytes"`
		Extension    string `json:"extension"`
		Folder       string `json:"folder"`
		Labels       []uint `json:"labels"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	file := models.File{
		Title:        req.Title,
		OriginalName: req.OriginalName,
		StorageKey:   req.StorageKey,
		URL:          req.URL,
		MimeType:     req.MimeType,
		SizeBytes:    req.SizeBytes,
		Extension:    req.Extension,
		Folder:       req.Folder,
		UserID:       userID,
	}

	if err := h.Service.Create(&file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create file",
			},
		})
		return
	}

	// Associate labels if provided
	if len(req.Labels) > 0 {
		var labels []models.Label
		h.DB.Where("id IN ? AND user_id = ?", req.Labels, userID).Find(&labels)
		h.DB.Model(&file).Association("Labels").Replace(labels)
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    file,
		"message": "File created successfully",
	})
}

// Update modifies an existing file.
func (h *FileHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid file ID",
			},
		})
		return
	}

	var req struct {
		Title      *string `json:"title"`
		IsPinned   *bool   `json:"is_pinned"`
		IsArchived *bool   `json:"is_archived"`
		Labels     []uint  `json:"labels"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.IsPinned != nil {
		updates["is_pinned"] = *req.IsPinned
	}
	if req.IsArchived != nil {
		updates["is_archived"] = *req.IsArchived
	}

	file, err := h.Service.Update(uint(id), userID, updates)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "File not found",
			},
		})
		return
	}

	// Update labels if provided
	if req.Labels != nil {
		var labels []models.Label
		h.DB.Where("id IN ? AND user_id = ?", req.Labels, userID).Find(&labels)
		h.DB.Model(file).Association("Labels").Replace(labels)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    file,
		"message": "File updated successfully",
	})
}

// Delete soft-deletes a file.
func (h *FileHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid file ID",
			},
		})
		return
	}

	if err := h.Service.Delete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "File not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File moved to trash",
	})
}

// Restore restores a trashed file.
func (h *FileHandler) Restore(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid file ID",
			},
		})
		return
	}

	if err := h.Service.Restore(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "File not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File restored successfully",
	})
}

// PermanentDelete hard-deletes a file.
func (h *FileHandler) PermanentDelete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid file ID",
			},
		})
		return
	}

	if err := h.Service.PermanentDelete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "File not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File permanently deleted",
	})
}
