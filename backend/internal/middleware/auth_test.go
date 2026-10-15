package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

const testSecret = "purbalingga-test-secret"

func newTestRouter(roles ...string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.JWTAuth(testSecret))
	r.GET("/protected", middleware.RequireRole(roles...), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func signToken(secret string, userID uuid.UUID, role string) (string, error) {
	claims := service.JWTClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

func doRequest(r *gin.Engine, bearer string) (int, string) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	r.ServeHTTP(w, req)
	return w.Code, w.Body.String()
}

func TestNoToken(t *testing.T) {
	router := newTestRouter("SUPER_ADMIN", "ADMIN_OPD")
	code, body := doRequest(router, "")

	if code != http.StatusUnauthorized {
		t.Fatalf("Tanpa token harus 401, got %d", code)
	}
	if !strings.Contains(body, "UNAUTHORIZED") {
		t.Fatalf("Body harus memuat kode UNAUTHORIZED, got %s", body)
	}
}

func TestInvalidToken(t *testing.T) {
	router := newTestRouter("SUPER_ADMIN", "ADMIN_OPD")
	code, _ := doRequest(router, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token.tidak-valid")

	if code != http.StatusUnauthorized {
		t.Fatalf("Token tidak valid harus 401, got %d", code)
	}
}

func TestTokenSignedWithWrongSecret(t *testing.T) {
	router := newTestRouter("SUPER_ADMIN", "ADMIN_OPD")

	// Token ditandatangani dengan secret berbeda (seolah-olah dipalsukan).
	token, err := signToken("secret-lain-yang-salah", uuid.New(), "SUPER_ADMIN")
	if err != nil {
		t.Fatalf("Gagal membuat token: %v", err)
	}

	code, _ := doRequest(router, token)
	if code != http.StatusUnauthorized {
		t.Fatalf("Token dengan secret salah harus 401, got %d", code)
	}
}

func TestValidTokenAllowedRole(t *testing.T) {
	router := newTestRouter("SUPER_ADMIN", "ADMIN_OPD")

	token, err := signToken(testSecret, uuid.New(), "ADMIN_OPD")
	if err != nil {
		t.Fatalf("Gagal membuat token: %v", err)
	}

	code, body := doRequest(router, token)
	if code != http.StatusOK {
		t.Fatalf("Role diizinkan harus 200, got %d", code)
	}
	if !strings.Contains(body, `"ok":true`) {
		t.Fatalf("Body respon tidak sesuai, got %s", body)
	}
}

func TestValidTokenForbiddenRole(t *testing.T) {
	// Endpoint khusus SUPER_ADMIN, token ber-role ADMIN_OPD.
	router := newTestRouter("SUPER_ADMIN")

	token, err := signToken(testSecret, uuid.New(), "ADMIN_OPD")
	if err != nil {
		t.Fatalf("Gagal membuat token: %v", err)
	}

	code, body := doRequest(router, token)
	if code != http.StatusForbidden {
		t.Fatalf("Role tidak diizinkan harus 403, got %d", code)
	}
	if !strings.Contains(body, "FORBIDDEN") {
		t.Fatalf("Body harus memuat kode FORBIDDEN, got %s", body)
	}
}
