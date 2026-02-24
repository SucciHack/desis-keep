package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
	"desis-keep/apps/api/internal/services"
)

// LabelHandler handles label endpoints.
type LabelHandler struct {
	DB      *gorm.DB
	Service *services.LabelService
}

// NewLabelHandler creates a new LabelHandler instance.
func NewLabelHandler(db *gorm.DB) *LabelHandler {
	return &LabelHandler{
		DB:      db,
		Service: services.NewLabelService(db),
	}
}

// List returns a paginated list of labels for the authenticated user.
func (h *LabelHandler) List(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	labels, total, pages, err := h.Service.List(userID, page, pageSize, search, sortBy, sortOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch labels",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": labels,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     pages,
		},
	})
}

// Create adds a new label.
func (h *LabelHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Name  string `json:"name" binding:"required"`
		Color string `json:"color"`
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

	label := models.Label{
		Name:   req.Name,
		Color:  req.Color,
		UserID: userID,
	}

	if err := h.Service.Create(&label); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create label",
			},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    label,
		"message": "Label created successfully",
	})
}

// Update modifies an existing label.
func (h *LabelHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid label ID",
			},
		})
		return
	}

	var req struct {
		Name  string `json:"name"`
		Color string `json:"color"`
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
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Color != "" {
		updates["color"] = req.Color
	}

	label, err := h.Service.Update(uint(id), userID, updates)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Label not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    label,
		"message": "Label updated successfully",
	})
}

// Delete soft-deletes a label.
func (h *LabelHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_ID",
				"message": "Invalid label ID",
			},
		})
		return
	}

	if err := h.Service.Delete(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Label not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Label deleted successfully",
	})
}
