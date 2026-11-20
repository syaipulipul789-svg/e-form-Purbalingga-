package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strings"
)

var validNIKPattern = regexp.MustCompile(`^3303[0-9]{12}$`)

func NormalizeNIK(nik string) string {
	return strings.TrimSpace(nik)
}

func IsValidNIK(nik string) bool {
	return validNIKPattern.MatchString(NormalizeNIK(nik))
}

func HashNIK(nik, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(NormalizeNIK(nik)))
	return hex.EncodeToString(mac.Sum(nil))
}
