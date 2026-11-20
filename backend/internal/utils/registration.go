package utils

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

func GenerateRegistrationNumber(responseID uuid.UUID) string {
	raw := strings.ReplaceAll(responseID.String(), "-", "")
	suffix := strings.ToUpper(raw[:8])
	return fmt.Sprintf("PBG-%d-%s", time.Now().Year(), suffix)
}
