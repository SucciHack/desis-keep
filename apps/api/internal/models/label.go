package models

import (
	"time"

	"gorm.io/gorm"
)

// Label represents a label/tag for organizing resources.
type Label struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Name      string         `gorm:"size:255;not null" json:"name" binding:"required"`
	Slug      string         `gorm:"size:255;uniqueIndex:idx_user_slug" json:"slug"`
	Color     string         `gorm:"size:7;default:#6c5ce7" json:"color"`
	UserID    uint           `gorm:"not null;uniqueIndex:idx_user_slug" json:"user_id"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate generates a slug from the name if not provided.
func (l *Label) BeforeCreate(tx *gorm.DB) error {
	if l.Slug == "" {
		l.Slug = generateSlug(l.Name)
	}
	return nil
}

// BeforeUpdate regenerates slug if name changed.
func (l *Label) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Name") {
		l.Slug = generateSlug(l.Name)
	}
	return nil
}
