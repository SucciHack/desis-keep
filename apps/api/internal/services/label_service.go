package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
)

// LabelService handles business logic for labels.
type LabelService struct {
	DB *gorm.DB
}

// NewLabelService creates a new LabelService instance.
func NewLabelService(db *gorm.DB) *LabelService {
	return &LabelService{DB: db}
}

// List returns a paginated list of labels for a user.
func (s *LabelService) List(userID uint, page, pageSize int, search, sortKey, sortDir string) ([]models.Label, int64, int, error) {
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

	query := s.DB.Model(&models.Label{}).Where("user_id = ?", userID)

	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var labels []models.Label
	offset := (page - 1) * pageSize
	if err := query.Order(sortKey + " " + sortDir).Offset(offset).Limit(pageSize).Find(&labels).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching labels: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))
	return labels, total, pages, nil
}

// GetByID returns a single label by ID (scoped to user).
func (s *LabelService) GetByID(id, userID uint) (*models.Label, error) {
	var label models.Label
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&label).Error; err != nil {
		return nil, fmt.Errorf("label not found: %w", err)
	}
	return &label, nil
}

// Create creates a new label.
func (s *LabelService) Create(label *models.Label) error {
	if err := s.DB.Create(label).Error; err != nil {
		return fmt.Errorf("creating label: %w", err)
	}
	return nil
}

// Update modifies an existing label.
func (s *LabelService) Update(id, userID uint, data map[string]interface{}) (*models.Label, error) {
	var label models.Label
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&label).Error; err != nil {
		return nil, fmt.Errorf("label not found: %w", err)
	}

	if err := s.DB.Model(&label).Updates(data).Error; err != nil {
		return nil, fmt.Errorf("updating label: %w", err)
	}

	s.DB.First(&label, id)
	return &label, nil
}

// Delete soft-deletes a label.
func (s *LabelService) Delete(id, userID uint) error {
	var label models.Label
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&label).Error; err != nil {
		return fmt.Errorf("label not found: %w", err)
	}
	if err := s.DB.Delete(&label).Error; err != nil {
		return fmt.Errorf("deleting label: %w", err)
	}
	return nil
}
