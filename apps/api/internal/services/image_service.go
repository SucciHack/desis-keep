package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
)

// ImageService handles business logic for images.
type ImageService struct {
	DB *gorm.DB
}

// NewImageService creates a new ImageService instance.
func NewImageService(db *gorm.DB) *ImageService {
	return &ImageService{DB: db}
}

// List returns a paginated list of images for a user.
func (s *ImageService) List(userID uint, page, pageSize int, search, sortKey, sortDir string, archived, trashed *bool) ([]models.Image, int64, int, error) {
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

	query := s.DB.Model(&models.Image{}).Where("user_id = ?", userID).Preload("Labels")

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
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var images []models.Image
	offset := (page - 1) * pageSize
	if err := query.Order(sortKey + " " + sortDir).Offset(offset).Limit(pageSize).Find(&images).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching images: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))
	return images, total, pages, nil
}

// GetByID returns a single image by ID (scoped to user).
func (s *ImageService) GetByID(id, userID uint) (*models.Image, error) {
	var image models.Image
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).Preload("Labels").First(&image).Error; err != nil {
		return nil, fmt.Errorf("image not found: %w", err)
	}
	return &image, nil
}

// Create creates a new image.
func (s *ImageService) Create(image *models.Image) error {
	if err := s.DB.Create(image).Error; err != nil {
		return fmt.Errorf("creating image: %w", err)
	}
	return nil
}

// Update modifies an existing image.
func (s *ImageService) Update(id, userID uint, data map[string]interface{}) (*models.Image, error) {
	var image models.Image
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&image).Error; err != nil {
		return nil, fmt.Errorf("image not found: %w", err)
	}

	if err := s.DB.Model(&image).Updates(data).Error; err != nil {
		return nil, fmt.Errorf("updating image: %w", err)
	}

	s.DB.Where("id = ?", id).Preload("Labels").First(&image)
	return &image, nil
}

// Delete soft-deletes an image (sets is_trashed = true).
func (s *ImageService) Delete(id, userID uint) error {
	var image models.Image
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&image).Error; err != nil {
		return fmt.Errorf("image not found: %w", err)
	}
	if err := s.DB.Model(&image).Update("is_trashed", true).Error; err != nil {
		return fmt.Errorf("trashing image: %w", err)
	}
	return nil
}

// Restore restores a trashed image.
func (s *ImageService) Restore(id, userID uint) error {
	var image models.Image
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&image).Error; err != nil {
		return fmt.Errorf("image not found: %w", err)
	}
	if err := s.DB.Model(&image).Update("is_trashed", false).Error; err != nil {
		return fmt.Errorf("restoring image: %w", err)
	}
	return nil
}

// PermanentDelete hard-deletes an image.
func (s *ImageService) PermanentDelete(id, userID uint) error {
	var image models.Image
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&image).Error; err != nil {
		return fmt.Errorf("image not found: %w", err)
	}
	if err := s.DB.Unscoped().Delete(&image).Error; err != nil {
		return fmt.Errorf("permanently deleting image: %w", err)
	}
	return nil
}
