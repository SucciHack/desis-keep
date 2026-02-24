package models

import (
	"time"

	"gorm.io/gorm"
)

// Link represents a saved bookmark/link.
type Link struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	URL          string         `gorm:"size:2048;not null" json:"url" binding:"required,url"`
	Title        string         `gorm:"size:500" json:"title"`
	Description  string         `gorm:"type:text" json:"description"`
	ThumbnailURL string         `gorm:"size:2048" json:"thumbnail_url"`
	FaviconURL   string         `gorm:"size:2048" json:"favicon_url"`
	IsPinned     bool           `gorm:"default:false" json:"is_pinned"`
	IsArchived   bool           `gorm:"default:false" json:"is_archived"`
	IsTrashed    bool           `gorm:"default:false" json:"is_trashed"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Labels       []Label        `gorm:"many2many:link_labels;" json:"labels,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
