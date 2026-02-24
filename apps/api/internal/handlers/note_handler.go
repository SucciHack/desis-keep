package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
	"desis-keep/apps/api/internal/services"
)

// NoteHandler handles note endpoints.
type NoteHandler struct {
	DB      *gorm.DB
	Service *services.NoteService
}

// NewNoteHandler creates a new NoteHandler instance.
func NewNoteHandler(db *gorm.DB) *NoteHandler {
	return &NoteHandler{
		DB:      db,
		Service: services.NewNoteService(db),
	}
}

// List returns a paginated list of notes for the authenticated user.
func (h *NoteHandler) List(c *gin.Context) {
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

	notes, total, pages, err := h.Service.List(userID, page, pageSize, search, sortBy, sortOrder, archived, trashed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch notes",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": notes,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     pages,
		},
	})
}

// Create adds a new note.
func (h *NoteHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Title  string `json:"title"`
		Body   string `json:"body"`
		Color  string `json:"color"`
		Labels []uint `json:"labels"`
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

	note := models.Note{
		Title:  req.Title,
		Body:   req.Body,
		Color:  req.Color,
		UserID: userID,
	}

	if err := h.Service.Create(&note); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create note",
			},
		})
		return
	}

	// Associate labels if provided
	if len(req.Labels) > 0 {
		var labels []models.Label
		h.DB.Where("id IN ? AND user_id = ?", req.Labels, userID).Find(&labels)
		h.DB.Model(&note).Association("Labels").Replace(labels)
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    note,
		"message": "Note created successfully",
	})
}

// Update modifies an existing note.
func (h *NoteHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid note ID",
			},
		})
		return
	}

	var req struct {
		Title      *string `json:"title"`
		Body       *string `json:"body"`
		Color      *string `json:"color"`
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
	if req.Body != nil {
		updates["body"] = *req.Body
	}
	if req.Color != nil {
		updates["color"] = *req.Color
	}
	if req.IsPinned != nil {
		updates["is_pinned"] = *req.IsPinned
	}
	if req.IsArchived != nil {
		updates["is_archived"] = *req.IsArchived
	}

	note, err := h.Service.Update(uint(id), userID, updates)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Note not found",
			},
		})
		return
	}

	// Update labels if provided
	if req.Labels != nil {
		var labels []models.Label
		h.DB.Where("id IN ? AND user_id = ?", req.Labels, userID).Find(&labels)
		h.DB.Model(note).Association("Labels").Replace(labels)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    note,
		"message": "Note updated successfully",
	})
}

// Delete soft-deletes a note (sets is_trashed = true).
func (h *NoteHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid note ID",
			},
		})
		return
	}

	if err := h.Service.Delete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Note not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Note moved to trash",
	})
}

// Restore restores a trashed note.
func (h *NoteHandler) Restore(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid note ID",
			},
		})
		return
	}

	if err := h.Service.Restore(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Note not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Note restored successfully",
	})
}

// PermanentDelete hard-deletes a note.
func (h *NoteHandler) PermanentDelete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid note ID",
			},
		})
		return
	}

	if err := h.Service.PermanentDelete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Note not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Note permanently deleted",
	})
}
