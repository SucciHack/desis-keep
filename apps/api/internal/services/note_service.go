package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"desis-keep/apps/api/internal/models"
)

// NoteService handles business logic for notes.
type NoteService struct {
	DB *gorm.DB
}

// NewNoteService creates a new NoteService instance.
func NewNoteService(db *gorm.DB) *NoteService {
	return &NoteService{DB: db}
}

// List returns a paginated list of notes for a user.
func (s *NoteService) List(userID uint, page, pageSize int, search, sortKey, sortDir string, archived, trashed *bool) ([]models.Note, int64, int, error) {
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

	query := s.DB.Model(&models.Note{}).Where("user_id = ?", userID).Preload("Labels")

	// Default: exclude archived and trashed
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
		query = query.Where("title ILIKE ? OR body ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var notes []models.Note
	offset := (page - 1) * pageSize
	if err := query.Order(sortKey + " " + sortDir).Offset(offset).Limit(pageSize).Find(&notes).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching notes: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))
	return notes, total, pages, nil
}

// GetByID returns a single note by ID (scoped to user).
func (s *NoteService) GetByID(id, userID uint) (*models.Note, error) {
	var note models.Note
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).Preload("Labels").First(&note).Error; err != nil {
		return nil, fmt.Errorf("note not found: %w", err)
	}
	return &note, nil
}

// Create creates a new note.
func (s *NoteService) Create(note *models.Note) error {
	if err := s.DB.Create(note).Error; err != nil {
		return fmt.Errorf("creating note: %w", err)
	}
	return nil
}

// Update modifies an existing note.
func (s *NoteService) Update(id, userID uint, data map[string]interface{}) (*models.Note, error) {
	var note models.Note
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&note).Error; err != nil {
		return nil, fmt.Errorf("note not found: %w", err)
	}

	if err := s.DB.Model(&note).Updates(data).Error; err != nil {
		return nil, fmt.Errorf("updating note: %w", err)
	}

	s.DB.Where("id = ?", id).Preload("Labels").First(&note)
	return &note, nil
}

// Delete soft-deletes a note (sets is_trashed = true).
func (s *NoteService) Delete(id, userID uint) error {
	var note models.Note
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&note).Error; err != nil {
		return fmt.Errorf("note not found: %w", err)
	}
	if err := s.DB.Model(&note).Update("is_trashed", true).Error; err != nil {
		return fmt.Errorf("trashing note: %w", err)
	}
	return nil
}

// Restore restores a trashed note.
func (s *NoteService) Restore(id, userID uint) error {
	var note models.Note
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&note).Error; err != nil {
		return fmt.Errorf("note not found: %w", err)
	}
	if err := s.DB.Model(&note).Update("is_trashed", false).Error; err != nil {
		return fmt.Errorf("restoring note: %w", err)
	}
	return nil
}

// PermanentDelete hard-deletes a note.
func (s *NoteService) PermanentDelete(id, userID uint) error {
	var note models.Note
	if err := s.DB.Where("id = ? AND user_id = ?", id, userID).First(&note).Error; err != nil {
		return fmt.Errorf("note not found: %w", err)
	}
	if err := s.DB.Unscoped().Delete(&note).Error; err != nil {
		return fmt.Errorf("permanently deleting note: %w", err)
	}
	return nil
}
