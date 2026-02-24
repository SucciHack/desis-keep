package models

import (
	"time"

	"gorm.io/gorm"
)

// Note represents a text note.
type Note struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	Title      string         `gorm:"size:500" json:"title"`
	Body       string         `gorm:"type:text" json:"body"`
	Color      string         `gorm:"size:7;default:#ffffff" json:"color"`
	IsPinned   bool           `gorm:"default:false" json:"is_pinned"`
	IsArchived bool           `gorm:"default:false" json:"is_archived"`
	IsTrashed  bool           `gorm:"default:false" json:"is_trashed"`
	UserID     uint           `gorm:"not null;index" json:"user_id"`
	User       User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Labels     []Label        `gorm:"many2many:note_labels;" json:"labels,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
