package models

import (
	"time"

	"gorm.io/gorm"
)

// File represents an uploaded file (non-image).
type File struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	Title        string         `gorm:"size:500" json:"title"`
	OriginalName string         `gorm:"size:500;not null" json:"original_name" binding:"required"`
	StorageKey   string         `gorm:"size:500;not null" json:"storage_key" binding:"required"`
	URL          string         `gorm:"size:2048;not null" json:"url"`
	MimeType     string         `gorm:"size:100" json:"mime_type"`
	SizeBytes    uint           `json:"size_bytes"`
	Extension    string         `gorm:"size:20" json:"extension"`
	Folder       string         `gorm:"size:255" json:"folder"`
	IsPinned     bool           `gorm:"default:false" json:"is_pinned"`
	IsArchived   bool           `gorm:"default:false" json:"is_archived"`
	IsTrashed    bool           `gorm:"default:false" json:"is_trashed"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Labels       []Label        `gorm:"many2many:file_labels;" json:"labels,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
