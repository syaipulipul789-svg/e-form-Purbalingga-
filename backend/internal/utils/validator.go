package utils

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

type Schema struct {
	Sections []Section `json:"sections"`
}

type Section struct {
	ID     string  `json:"id"`
	Title  string  `json:"title"`
	Fields []Field `json:"fields"`
}

type Field struct {
	ID          string     `json:"id"`
	Type        string     `json:"type"`
	Label       string     `json:"label"`
	Placeholder string     `json:"placeholder"`
	HelpText    string     `json:"helpText"`
	Required    bool       `json:"required"`
	Options     []Option   `json:"options"`
	Validation  Validation `json:"validation"`
	Config      Config     `json:"config"`
}

type Option struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type Validation struct {
	Pattern           string   `json:"pattern"`
	MinLength         *int     `json:"minLength"`
	MaxLength         *int     `json:"maxLength"`
	Min               *float64 `json:"min"`
	Max               *float64 `json:"max"`
	AllowedExtensions []string `json:"allowedExtensions"`
	MaxSizeInMB       int      `json:"maxSizeInMB"`
}

type Config struct {
	Min *float64 `json:"min"`
	Max *float64 `json:"max"`
}

type ValidationDetail struct {
	Field string `json:"field"`
	Label string `json:"label"`
	Issue string `json:"issue"`
}

var (
	nikPattern   = regexp.MustCompile(`^3303[0-9]{12}$`)
	emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
)

func ValidateAnswers(schemaRaw json.RawMessage, answers map[string]any) []ValidationDetail {
	var schema Schema
	if err := json.Unmarshal(schemaRaw, &schema); err != nil {
		return []ValidationDetail{{
			Field: "schema",
			Issue: "Struktur formulir tidak valid",
		}}
	}

	details := make([]ValidationDetail, 0)
	for _, section := range schema.Sections {
		for _, field := range section.Fields {
			value, exists := answers[field.ID]
			if !exists || isEmpty(value) {
				if field.Required {
					details = append(details, ValidationDetail{
						Field: field.ID,
						Label: field.Label,
						Issue: "Field ini wajib diisi",
					})
				}
				continue
			}

			if issue := validateField(field, value); issue != "" {
				details = append(details, ValidationDetail{
					Field: field.ID,
					Label: field.Label,
					Issue: issue,
				})
			}
		}
	}

	return details
}

func validateField(field Field, value any) string {
	switch field.Type {
	case "nik":
		text, ok := value.(string)
		if !ok {
			return "NIK harus berupa teks"
		}
		if !nikPattern.MatchString(strings.TrimSpace(text)) {
			return "NIK harus 16 digit angka dan diawali kode Purbalingga 3303"
		}

	case "number":
		number, ok := toFloat(value)
		if !ok {
			return "Nilai harus berupa angka"
		}
		return validateRange(number, field.Validation.Min, field.Validation.Max)

	case "currency_idr":
		number, ok := toCurrencyFloat(value)
		if !ok {
			return "Nilai harus berupa angka"
		}
		return validateRange(number, field.Validation.Min, field.Validation.Max)

	case "rating", "linear_scale":
		number, ok := toFloat(value)
		if !ok {
			return "Nilai rating harus berupa angka"
		}
		min := floatPtr(1)
		max := floatPtr(5)
		if field.Config.Min != nil {
			min = field.Config.Min
		}
		if field.Config.Max != nil {
			max = field.Config.Max
		}
		return validateRange(number, min, max)

	case "checkbox":
		if checked, ok := value.(bool); ok {
			if field.Required && !checked {
				return "Pilih setidaknya satu opsi"
			}
			return ""
		}
		values, ok := value.([]any)
		if !ok {
			return "Nilai harus berupa daftar pilihan"
		}
		if field.Required && len(values) == 0 {
			return "Pilih setidaknya satu opsi"
		}
		if len(field.Options) > 0 {
			allowed := optionSet(field.Options)
			for _, item := range values {
				text, ok := item.(string)
				if !ok || !allowed[text] {
					return "Terdapat pilihan yang tidak valid"
				}
			}
		}

	case "select", "radio":
		text, ok := value.(string)
		if !ok {
			return "Nilai harus berupa teks"
		}
		if len(field.Options) > 0 && !optionSet(field.Options)[text] {
			return "Pilihan tidak valid"
		}

	case "file_upload":
		file, ok := value.(map[string]any)
		if !ok {
			return "Berkas tidak valid"
		}
		url, _ := file["file_url"].(string)
		if strings.TrimSpace(url) == "" {
			return "Berkas belum berhasil diunggah"
		}

	case "regional_purbalingga":
		region, ok := value.(map[string]any)
		if !ok {
			return "Wilayah tidak valid"
		}
		if numberValue(region["kode_kec"]) <= 0 || numberValue(region["kode_desa"]) <= 0 {
			return "Kecamatan dan desa wajib dipilih"
		}

	case "text", "textarea", "date", "time", "datetime", "signature":
		text, ok := value.(string)
		if !ok {
			return "Nilai harus berupa teks"
		}
		return validateText(text, field.Validation)

	case "email":
		text, ok := value.(string)
		if !ok {
			return "Email tidak valid"
		}
		if !emailPattern.MatchString(strings.TrimSpace(text)) {
			return "Format email tidak valid"
		}

	case "url":
		text, ok := value.(string)
		if !ok {
			return "URL tidak valid"
		}
		if !strings.HasPrefix(text, "http://") && !strings.HasPrefix(text, "https://") {
			return "Format URL tidak valid"
		}
	}

	return ""
}

func validateText(text string, validation Validation) string {
	length := len([]rune(strings.TrimSpace(text)))
	if validation.MinLength != nil && length < *validation.MinLength {
		return fmt.Sprintf("Minimal %d karakter", *validation.MinLength)
	}
	if validation.MaxLength != nil && length > *validation.MaxLength {
		return fmt.Sprintf("Maksimal %d karakter", *validation.MaxLength)
	}
	if validation.Pattern != "" {
		pattern, err := regexp.Compile(validation.Pattern)
		if err == nil && !pattern.MatchString(text) {
			return "Format isian tidak sesuai"
		}
	}
	return ""
}

func validateRange(value float64, min, max *float64) string {
	if min != nil && value < *min {
		return fmt.Sprintf("Nilai minimal %v", *min)
	}
	if max != nil && value > *max {
		return fmt.Sprintf("Nilai maksimal %v", *max)
	}
	return ""
}

func isEmpty(value any) bool {
	switch v := value.(type) {
	case nil:
		return true
	case string:
		return strings.TrimSpace(v) == ""
	case []any:
		return len(v) == 0
	case map[string]any:
		return len(v) == 0
	case bool:
		return !v
	default:
		return false
	}
}

func optionSet(options []Option) map[string]bool {
	set := make(map[string]bool, len(options))
	for _, option := range options {
		set[option.Value] = true
	}
	return set
}

func toFloat(value any) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case json.Number:
		number, err := v.Float64()
		return number, err == nil
	case string:
		number, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
		return number, err == nil
	default:
		return 0, false
	}
}

func toCurrencyFloat(value any) (float64, bool) {
	text, ok := value.(string)
	if !ok {
		return toFloat(value)
	}
	text = strings.TrimSpace(text)
	text = strings.ReplaceAll(text, "Rp", "")
	text = strings.ReplaceAll(text, " ", "")
	if strings.Contains(text, ",") {
		text = strings.ReplaceAll(text, ".", "")
		text = strings.ReplaceAll(text, ",", ".")
	} else {
		text = strings.ReplaceAll(text, ".", "")
	}
	number, err := strconv.ParseFloat(text, 64)
	return number, err == nil
}

func numberValue(value any) float64 {
	number, _ := toFloat(value)
	return number
}

func floatPtr(value float64) *float64 {
	return &value
}
