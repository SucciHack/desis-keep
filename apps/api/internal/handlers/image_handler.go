package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
	"desis-keep/apps/api/internal/services"
)

// ImageHandler handles image endpoints.
type ImageHandler struct {
	DB      *gorm.DB
	Service *services.ImageService
}

// NewImageHandler creates a new ImageHandler instance.
func NewImageHandler(db *gorm.DB) *ImageHandler {
	return &ImageHandler{
		DB:      db,
		Service: services.NewImageService(db),
	}
}

// List returns a paginated list of images for the authenticated user.
func (h *ImageHandler) List(c *gin.Context) {
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

	images, total, pages, err := h.Service.List(userID, page, pageSize, search, sortBy, sortOrder, archived, trashed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch images",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": images,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     pages,
		},
	})
}

// Create adds a new image.
func (h *ImageHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Title      string `json:"title"`
		StorageKey string `json:"storage_key" binding:"required"`
		URL        string `json:"url" binding:"required"`
		MimeType   string `json:"mime_type"`
		SizeBytes  uint   `json:"size_bytes"`
		Width      int    `json:"width"`
		Height     int    `json:"height"`
		Folder     string `json:"folder"`
		Labels     []uint `json:"labels"`
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

	image := models.Image{
		Title:      req.Title,
		StorageKey: req.StorageKey,
		URL:        req.URL,
		MimeType:   req.MimeType,
		SizeBytes:  req.SizeBytes,
		Width:      req.Width,
		Height:     req.Height,
		Folder:     req.Folder,
		UserID:     userID,
	}

	if err := h.Service.Create(&image); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create image",
			},
		})
		return
	}

	// Associate labels if provided
	if len(req.Labels) > 0 {
		var labels []models.Label
		h.DB.Where("id IN ? AND user_id = ?", req.Labels, userID).Find(&labels)
		h.DB.Model(&image).Association("Labels").Replace(labels)
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    image,
		"message": "Image created successfully",
	})
}

// Update modifies an existing image.
func (h *ImageHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid image ID",
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

	image, err := h.Service.Update(uint(id), userID, updates)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Image not found",
			},
		})
		return
	}

	// Update labels if provided
	if req.Labels != nil {
		var labels []models.Label
		h.DB.Where("id IN ? AND user_id = ?", req.Labels, userID).Find(&labels)
		h.DB.Model(image).Association("Labels").Replace(labels)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    image,
		"message": "Image updated successfully",
	})
}

// Delete soft-deletes an image.
func (h *ImageHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid image ID",
			},
		})
		return
	}

	if err := h.Service.Delete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Image not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Image moved to trash",
	})
}

// Restore restores a trashed image.
func (h *ImageHandler) Restore(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid image ID",
			},
		})
		return
	}

	if err := h.Service.Restore(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Image not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Image restored successfully",
	})
}

// PermanentDelete hard-deletes an image.
func (h *ImageHandler) PermanentDelete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid image ID",
			},
		})
		return
	}

	if err := h.Service.PermanentDelete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Image not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Image permanently deleted",
	})
}
