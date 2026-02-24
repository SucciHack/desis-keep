package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"

	"desis-keep/apps/api/internal/config"
	"desis-keep/apps/api/internal/models"
	"desis-keep/apps/api/internal/services"
)

// OAuthHandler handles OAuth authentication.
type OAuthHandler struct {
	DB          *gorm.DB
	Config      *config.Config
	AuthService *services.AuthService
}

// NewOAuthHandler creates a new OAuthHandler instance.
func NewOAuthHandler(db *gorm.DB, cfg *config.Config, authService *services.AuthService) *OAuthHandler {
	return &OAuthHandler{
		DB:          db,
		Config:      cfg,
		AuthService: authService,
	}
}

// getGoogleOAuthConfig returns the Google OAuth2 configuration.
func (h *OAuthHandler) getGoogleOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     h.Config.GoogleClientID,
		ClientSecret: h.Config.GoogleClientSecret,
		RedirectURL:  h.Config.GoogleRedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

// generateStateToken generates a random state token for OAuth.
func generateStateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// GoogleLogin initiates the Google OAuth flow.
func (h *OAuthHandler) GoogleLogin(c *gin.Context) {
	redirectURL := c.Query("redirect_url")
	if redirectURL == "" {
		redirectURL = "http://localhost:3001/auth/callback"
	}

	// Generate state token
	state, err := generateStateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate state token",
			},
		})
		return
	}

	// Store state and redirect URL in session/cookie
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)
	c.SetCookie("oauth_redirect", redirectURL, 600, "/", "", false, true)

	// Get OAuth config and generate auth URL
	oauthConfig := h.getGoogleOAuthConfig()
	url := oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)

	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleUserInfo represents the user info from Google.
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}

// GoogleCallback handles the OAuth callback from Google.
func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	// Verify state token
	state := c.Query("state")
	storedState, err := c.Cookie("oauth_state")
	if err != nil || state != storedState {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "INVALID_STATE",
				"message": "Invalid state token",
			},
		})
		return
	}

	// Get redirect URL from cookie
	redirectURL, err := c.Cookie("oauth_redirect")
	if err != nil {
		redirectURL = "http://localhost:3001/auth/callback"
	}

	// Clear cookies
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)
	c.SetCookie("oauth_redirect", "", -1, "/", "", false, true)

	// Exchange code for token
	code := c.Query("code")
	if code == "" {
		c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=missing_code")
		return
	}

	oauthConfig := h.getGoogleOAuthConfig()
	token, err := oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=token_exchange_failed")
		return
	}

	// Get user info from Google
	client := oauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=failed_to_get_user_info")
		return
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=failed_to_read_user_info")
		return
	}

	var googleUser GoogleUserInfo
	if err := json.Unmarshal(data, &googleUser); err != nil {
		c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=failed_to_parse_user_info")
		return
	}

	// Find or create user
	var user models.User
	result := h.DB.Where("google_id = ?", googleUser.ID).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		// Check if user exists with this email
		emailResult := h.DB.Where("email = ?", googleUser.Email).First(&user)
		
		if emailResult.Error == gorm.ErrRecordNotFound {
			// Create new user
			user = models.User{
				GoogleID:   googleUser.ID,
				Email:      googleUser.Email,
				Name:       googleUser.Name,
				FirstName:  googleUser.GivenName,
				LastName:   googleUser.FamilyName,
				AvatarURL:  googleUser.Picture,
				Role:       models.RoleUser,
				Active:     true,
				EmailVerifiedAt: func() *time.Time {
					if googleUser.VerifiedEmail {
						t := time.Now()
						return &t
					}
					return nil
				}(),
			}

			if err := h.DB.Create(&user).Error; err != nil {
				c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=failed_to_create_user")
				return
			}
		} else if emailResult.Error != nil {
			c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=database_error")
			return
		} else {
			// Update existing user with Google ID
			user.GoogleID = googleUser.ID
			user.AvatarURL = googleUser.Picture
			user.Name = googleUser.Name
			if err := h.DB.Save(&user).Error; err != nil {
				c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=failed_to_update_user")
				return
			}
		}
	} else if result.Error != nil {
		c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=database_error")
		return
	} else {
		// Update user info
		user.AvatarURL = googleUser.Picture
		user.Name = googleUser.Name
		if err := h.DB.Save(&user).Error; err != nil {
			c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=failed_to_update_user")
			return
		}
	}

	// Generate JWT tokens
	tokenPair, err := h.AuthService.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, redirectURL+"?error=failed_to_generate_token")
		return
	}

	// Redirect to frontend with tokens
	finalURL := fmt.Sprintf("%s?access_token=%s&refresh_token=%s", redirectURL, tokenPair.AccessToken, tokenPair.RefreshToken)
	c.Redirect(http.StatusTemporaryRedirect, finalURL)
}
