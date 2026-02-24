package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
)

// LinkService handles business logic for links.
type LinkService struct {
	DB *gorm.DB
}

// NewLinkService creates a new LinkService instance.
func NewLinkService(db *gorm.DB) *LinkService {
	return &LinkService{DB: db}
}

// List returns a paginated list of links for a user.
func (s *LinkService) List(userID uint, page, pageSize int, search, sortKey, sortDir string, archived, trashed *bool) ([]models.Link, int64, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if sortDir != "asc" && sortDir != "desc" {
		sortDir = "desc"
	}
	if sortKey == "" {
		sortKey = "created_at"
	}

	query := s.DB.Model(&models.Link{}).Where("user_id = ?", userID).Preload("Labels")

	if archived == nil && trashed == nil {
		query = query.Where("is_archived = ? AND is_trashed = ?", false, false)
	} else {
		if archived != nil {
			query = query.Where("is_archived = ?", *archived)
		}
		if trashed != nil {
			query = query.Where("is_trashed = ?", *trashed)
		}
	}

	if search != "" {
		query = query.Where("title ILIKE ? OR url ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var links []models.Link
	offset := (page - 1) * pageSize
	if err := query.Order(sortKey + " " + sortDir).Offset(offset).Limit(pageSize).Find(&links).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching links: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))
	return links, total, pages, nil
}

// GetByID returns a single link by ID (scoped to user).
func (s *LinkService) GetByID(id, userID uint) (*models.Link, error) {
	var link models.Link
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).Preload("Labels").First(&link).Error; err != nil {
		return nil, fmt.Errorf("link not found: %w", err)
	}
	return &link, nil
}

// Create creates a new link.
func (s *LinkService) Create(link *models.Link) error {
	if err := s.DB.Create(link).Error; err != nil {
		return fmt.Errorf("creating link: %w", err)
	}
	return nil
}

// Update modifies an existing link.
func (s *LinkService) Update(id, userID uint, data map[string]interface{}) (*models.Link, error) {
	var link models.Link
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&link).Error; err != nil {
		return nil, fmt.Errorf("link not found: %w", err)
	}

	if err := s.DB.Model(&link).Updates(data).Error; err != nil {
		return nil, fmt.Errorf("updating link: %w", err)
	}

	s.DB.Where("id = ?", id).Preload("Labels").First(&link)
	return &link, nil
}

// Delete soft-deletes a link (sets is_trashed = true).
func (s *LinkService) Delete(id, userID uint) error {
	var link models.Link
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&link).Error; err != nil {
		return fmt.Errorf("link not found: %w", err)
	}
	if err := s.DB.Model(&link).Update("is_trashed", true).Error; err != nil {
		return fmt.Errorf("trashing link: %w", err)
	}
	return nil
}

// Restore restores a trashed link.
func (s *LinkService) Restore(id, userID uint) error {
	var link models.Link
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&link).Error; err != nil {
		return fmt.Errorf("link not found: %w", err)
	}
	if err := s.DB.Model(&link).Update("is_trashed", false).Error; err != nil {
		return fmt.Errorf("restoring link: %w", err)
	}
	return nil
}

// PermanentDelete hard-deletes a link.
func (s *LinkService) PermanentDelete(id, userID uint) error {
	var link models.Link
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&link).Error; err != nil {
		return fmt.Errorf("link not found: %w", err)
	}
	if err := s.DB.Unscoped().Delete(&link).Error; err != nil {
		return fmt.Errorf("permanently deleting link: %w", err)
	}
	return nil
}
