package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
	"desis-keep/apps/api/internal/services"
)

// LinkHandler handles link endpoints.
type LinkHandler struct {
	DB      *gorm.DB
	Service *services.LinkService
}

// NewLinkHandler creates a new LinkHandler instance.
func NewLinkHandler(db *gorm.DB) *LinkHandler {
	return &LinkHandler{
		DB:      db,
		Service: services.NewLinkService(db),
	}
}

// List returns a paginated list of links for the authenticated user.
func (h *LinkHandler) List(c *gin.Context) {
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

	links, total, pages, err := h.Service.List(userID, page, pageSize, search, sortBy, sortOrder, archived, trashed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch links",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": links,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     pages,
		},
	})
}

// Create adds a new link.
func (h *LinkHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		URL          string `json:"url" binding:"required,url"`
		Title        string `json:"title"`
		Description  string `json:"description"`
		ThumbnailURL string `json:"thumbnail_url"`
		FaviconURL   string `json:"favicon_url"`
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

	link := models.Link{
		URL:          req.URL,
		Title:        req.Title,
		Description:  req.Description,
		ThumbnailURL: req.ThumbnailURL,
		FaviconURL:   req.FaviconURL,
		UserID:       userID,
	}

	if err := h.Service.Create(&link); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create link",
			},
		})
		return
	}

	// Associate labels if provided
	if len(req.Labels) > 0 {
		var labels []models.Label
		h.DB.Where("id IN ? AND user_id = ?", req.Labels, userID).Find(&labels)
		h.DB.Model(&link).Association("Labels").Replace(labels)
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    link,
		"message": "Link created successfully",
	})
}

// Update modifies an existing link.
func (h *LinkHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid link ID",
			},
		})
		return
	}

	var req struct {
		URL          *string `json:"url"`
		Title        *string `json:"title"`
		Description  *string `json:"description"`
		ThumbnailURL *string `json:"thumbnail_url"`
		FaviconURL   *string `json:"favicon_url"`
		IsPinned     *bool   `json:"is_pinned"`
		IsArchived   *bool   `json:"is_archived"`
		Labels       []uint  `json:"labels"`
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
	if req.URL != nil {
		updates["url"] = *req.URL
	}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.ThumbnailURL != nil {
		updates["thumbnail_url"] = *req.ThumbnailURL
	}
	if req.FaviconURL != nil {
		updates["favicon_url"] = *req.FaviconURL
	}
	if req.IsPinned != nil {
		updates["is_pinned"] = *req.IsPinned
	}
	if req.IsArchived != nil {
		updates["is_archived"] = *req.IsArchived
	}

	link, err := h.Service.Update(uint(id), userID, updates)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Link not found",
			},
		})
		return
	}

	// Update labels if provided
	if req.Labels != nil {
		var labels []models.Label
		h.DB.Where("id IN ? AND user_id = ?", req.Labels, userID).Find(&labels)
		h.DB.Model(link).Association("Labels").Replace(labels)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    link,
		"message": "Link updated successfully",
	})
}

// Delete soft-deletes a link.
func (h *LinkHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid link ID",
			},
		})
		return
	}

	if err := h.Service.Delete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Link not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Link moved to trash",
	})
}

// Restore restores a trashed link.
func (h *LinkHandler) Restore(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid link ID",
			},
		})
		return
	}

	if err := h.Service.Restore(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Link not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Link restored successfully",
	})
}

// PermanentDelete hard-deletes a link.
func (h *LinkHandler) PermanentDelete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid link ID",
			},
		})
		return
	}

	if err := h.Service.PermanentDelete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Link not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Link permanently deleted",
	})
}
