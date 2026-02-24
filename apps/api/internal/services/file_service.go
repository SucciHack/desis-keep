package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
)

// FileService handles business logic for files.
type FileService struct {
	DB *gorm.DB
}

// NewFileService creates a new FileService instance.
func NewFileService(db *gorm.DB) *FileService {
	return &FileService{DB: db}
}

// List returns a paginated list of files for a user.
func (s *FileService) List(userID uint, page, pageSize int, search, sortKey, sortDir string, archived, trashed *bool) ([]models.File, int64, int, error) {
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

	query := s.DB.Model(&models.File{}).Where("user_id = ?", userID).Preload("Labels")

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
		query = query.Where("title ILIKE ? OR original_name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var files []models.File
	offset := (page - 1) * pageSize
	if err := query.Order(sortKey + " " + sortDir).Offset(offset).Limit(pageSize).Find(&files).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching files: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))
	return files, total, pages, nil
}

// GetByID returns a single file by ID (scoped to user).
func (s *FileService) GetByID(id, userID uint) (*models.File, error) {
	var file models.File
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).Preload("Labels").First(&file).Error; err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}
	return &file, nil
}

// Create creates a new file.
func (s *FileService) Create(file *models.File) error {
	if err := s.DB.Create(file).Error; err != nil {
		return fmt.Errorf("creating file: %w", err)
	}
	return nil
}

// Update modifies an existing file.
func (s *FileService) Update(id, userID uint, data map[string]interface{}) (*models.File, error) {
	var file models.File
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&file).Error; err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	if err := s.DB.Model(&file).Updates(data).Error; err != nil {
		return nil, fmt.Errorf("updating file: %w", err)
	}

	s.DB.Where("id = ?", id).Preload("Labels").First(&file)
	return &file, nil
}

// Delete soft-deletes a file (sets is_trashed = true).
func (s *FileService) Delete(id, userID uint) error {
	var file models.File
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&file).Error; err != nil {
		return fmt.Errorf("file not found: %w", err)
	}
	if err := s.DB.Model(&file).Update("is_trashed", true).Error; err != nil {
		return fmt.Errorf("trashing file: %w", err)
	}
	return nil
}

// Restore restores a trashed file.
func (s *FileService) Restore(id, userID uint) error {
	var file models.File
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&file).Error; err != nil {
		return fmt.Errorf("file not found: %w", err)
	}
	if err := s.DB.Model(&file).Update("is_trashed", false).Error; err != nil {
		return fmt.Errorf("restoring file: %w", err)
	}
	return nil
}

// PermanentDelete hard-deletes a file.
func (s *FileService) PermanentDelete(id, userID uint) error {
	var file models.File
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&file).Error; err != nil {
		return fmt.Errorf("file not found: %w", err)
	}
	if err := s.DB.Unscoped().Delete(&file).Error; err != nil {
		return fmt.Errorf("permanently deleting file: %w", err)
	}
	return nil
}
