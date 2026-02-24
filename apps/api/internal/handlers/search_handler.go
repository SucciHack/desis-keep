package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
)

// SearchHandler handles cross-resource search.
type SearchHandler struct {
	DB *gorm.DB
}

// NewSearchHandler creates a new SearchHandler instance.
func NewSearchHandler(db *gorm.DB) *SearchHandler {
	return &SearchHandler{DB: db}
}

// SearchResult represents a unified search result.
type SearchResult struct {
	ID        uint   `json:"id"`
	Type      string `json:"type"` // "note", "link", "image", "file"
	Title     string `json:"title"`
	Content   string `json:"content"`
	URL       string `json:"url,omitempty"`
	CreatedAt string `json:"created_at"`
}

// Search performs a cross-resource search.
func (h *SearchHandler) Search(c *gin.Context) {
	userID := c.GetUint("user_id")
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Search query is required",
			},
		})
		return
	}

	var results []SearchResult

	// Search Notes
	var notes []models.Note
	h.DB.Where("user_id = ? AND is_trashed = ? AND (title ILIKE ? OR body ILIKE ?)", 
		userID, false, "%"+query+"%", "%"+query+"%").
		Limit(20).Find(&notes)
	
	for _, note := range notes {
		results = append(results, SearchResult{
			ID:        note.ID,
			Type:      "note",
			Title:     note.Title,
			Content:   note.Body,
			CreatedAt: note.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	// Search Links
	var links []models.Link
	h.DB.Where("user_id = ? AND is_trashed = ? AND (title ILIKE ? OR url ILIKE ? OR description ILIKE ?)", 
		userID, false, "%"+query+"%", "%"+query+"%", "%"+query+"%").
		Limit(20).Find(&links)
	
	for _, link := range links {
		results = append(results, SearchResult{
			ID:        link.ID,
			Type:      "link",
			Title:     link.Title,
			Content:   link.Description,
			URL:       link.URL,
			CreatedAt: link.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	// Search Images
	var images []models.Image
	h.DB.Where("user_id = ? AND is_trashed = ? AND title ILIKE ?", 
		userID, false, "%"+query+"%").
		Limit(20).Find(&images)
	
	for _, image := range images {
		results = append(results, SearchResult{
			ID:        image.ID,
			Type:      "image",
			Title:     image.Title,
			URL:       image.URL,
			CreatedAt: image.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	// Search Files
	var files []models.File
	h.DB.Where("user_id = ? AND is_trashed = ? AND (title ILIKE ? OR original_name ILIKE ?)", 
		userID, false, "%"+query+"%", "%"+query+"%").
		Limit(20).Find(&files)
	
	for _, file := range files {
		results = append(results, SearchResult{
			ID:        file.ID,
			Type:      "file",
			Title:     file.Title,
			Content:   file.OriginalName,
			URL:       file.URL,
			CreatedAt: file.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": results,
		"meta": gin.H{
			"query": query,
			"total": len(results),
		},
	})
}
