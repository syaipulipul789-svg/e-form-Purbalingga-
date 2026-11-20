package utils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenClaims struct {
	Role  string `json:"role"`
	OPDID string `json:"opd_id,omitempty"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uuid.UUID, role string, opdID *uuid.UUID, secret string, expiresAt time.Time) (string, error) {
	claims := TokenClaims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    "eform-purbalingga",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}
	if opdID != nil {
		claims.OPDID = opdID.String()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseToken(tokenString, secret string) (*TokenClaims, error) {
	claims := &TokenClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode signing token tidak valid")
		}
		return []byte(secret), nil
	}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer("eform-purbalingga"))
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, fmt.Errorf("token tidak valid")
	}
	return claims, nil
}
