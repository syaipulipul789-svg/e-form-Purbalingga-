package service

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type formSchema struct {
	Sections []formSection `json:"sections"`
}

type formSection struct {
	ID     string      `json:"id"`
	Title  string      `json:"title"`
	Fields []formField `json:"fields"`
}

type formField struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"`
	Label    string       `json:"label"`
	Required bool         `json:"required"`
	Options  []formOption `json:"options"`
	Config   formConfig   `json:"config"`
}

type formOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type formConfig struct {
	Min *int `json:"min"`
	Max *int `json:"max"`
}

var nikPattern = regexp.MustCompile(`^\d{16}$`)

func parseSchema(raw json.RawMessage) (*formSchema, error) {
	if len(raw) == 0 {
		return &formSchema{}, nil
	}
	var schema formSchema
	if err := json.Unmarshal(raw, &schema); err != nil {
		return nil, err
	}
	return &schema, nil
}

func parseAnswers(raw json.RawMessage) (map[string]interface{}, error) {
	if len(raw) == 0 {
		return nil, fmt.Errorf("jawaban kosong")
	}
	var answers map[string]interface{}
	if err := json.Unmarshal(raw, &answers); err != nil {
		return nil, err
	}
	if answers == nil {
		return nil, fmt.Errorf("jawaban kosong")
	}
	return answers, nil
}

func validateAnswers(schema *formSchema, answers map[string]interface{}) map[string]string {
	fields := make(map[string]string)

	for _, section := range schema.Sections {
		for _, field := range section.Fields {
			value, exists := answers[field.ID]
			if !exists || isEmptyValue(value) {
				if field.Required {
					fields[field.ID] = requiredMessage(field)
				}
				continue
			}

			if msg := validateFieldValue(field, value); msg != "" {
				fields[field.ID] = msg
			}
		}
	}

	return fields
}

func validateFieldValue(field formField, value interface{}) string {
	switch field.Type {
	case "nik":
		nik, ok := value.(string)
		if !ok {
			return "NIK harus berupa teks"
		}
		return validateNIK(nik)
	case "regional_purbalingga":
		region, ok := value.(map[string]interface{})
		if !ok {
			return "Wilayah tidak valid"
		}
		if numberValue(region["kode_kec"]) <= 0 || numberValue(region["kode_desa"]) <= 0 {
			return "Kecamatan dan desa wajib dipilih"
		}
	case "file_upload":
		file, ok := value.(map[string]interface{})
		if !ok {
			return "Berkas tidak valid"
		}
		url, _ := file["file_url"].(string)
		if strings.TrimSpace(url) == "" {
			return "Berkas wajib diunggah"
		}
	case "checkbox":
		values, ok := value.([]interface{})
		if !ok || len(values) == 0 {
			return "Pilih minimal satu opsi"
		}
		if !allOptionsValid(values, field.Options) {
			return "Pilihan tidak valid"
		}
	case "rating":
		score, ok := intValue(value)
		if !ok {
			return "Nilai rating tidak valid"
		}
		min, max := 1, 5
		if field.Config.Min != nil {
			min = *field.Config.Min
		}
		if field.Config.Max != nil {
			max = *field.Config.Max
		}
		if score < min || score > max {
			return fmt.Sprintf("Rating harus antara %d dan %d", min, max)
		}
	case "date":
		text, ok := value.(string)
		if !ok {
			return "Tanggal tidak valid"
		}
		if !validDate(text) {
			return "Format tanggal tidak valid"
		}
	case "select", "radio":
		text, ok := value.(string)
		if !ok {
			return "Pilihan tidak valid"
		}
		if len(field.Options) > 0 && !optionExists(text, field.Options) {
			return "Pilihan tidak valid"
		}
	}

	return ""
}

func nikFromAnswers(schema *formSchema, answers map[string]interface{}) string {
	for _, section := range schema.Sections {
		for _, field := range section.Fields {
			if field.Type != "nik" {
				continue
			}
			value, ok := answers[field.ID].(string)
			if ok {
				return strings.TrimSpace(value)
			}
		}
	}
	return ""
}

func validateNIK(nik string) string {
	nik = strings.TrimSpace(nik)
	if nik == "" {
		return "NIK wajib diisi"
	}
	if !nikPattern.MatchString(nik) {
		return "NIK harus 16 digit angka"
	}
	if !strings.HasPrefix(nik, "3303") {
		return "NIK harus diawali kode Kabupaten Purbalingga (3303)"
	}
	return ""
}

func requiredMessage(field formField) string {
	label := strings.TrimSpace(field.Label)
	if label == "" {
		label = field.ID
	}
	return label + " wajib diisi"
}

func isEmptyValue(value interface{}) bool {
	if value == nil {
		return true
	}
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed) == ""
	case []interface{}:
		return len(typed) == 0
	case map[string]interface{}:
		return len(typed) == 0
	case bool:
		return !typed
	default:
		return false
	}
}

func allOptionsValid(values []interface{}, options []formOption) bool {
	if len(options) == 0 {
		return true
	}
	for _, value := range values {
		text, ok := value.(string)
		if !ok || !optionExists(text, options) {
			return false
		}
	}
	return true
}

func optionExists(value string, options []formOption) bool {
	for _, option := range options {
		if option.Value == value {
			return true
		}
	}
	return false
}

func numberValue(value interface{}) float64 {
	switch typed := value.(type) {
	case float64:
		return typed
	case int:
		return float64(typed)
	case string:
		number, _ := strconv.ParseFloat(typed, 64)
		return number
	default:
		return 0
	}
}

func intValue(value interface{}) (int, bool) {
	switch typed := value.(type) {
	case float64:
		return int(typed), typed == float64(int(typed))
	case int:
		return typed, true
	case string:
		number, err := strconv.Atoi(typed)
		if err != nil {
			return 0, false
		}
		return number, true
	default:
		return 0, false
	}
}

func validDate(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}
	if _, err := time.Parse("2006-01-02", value); err == nil {
		return true
	}
	_, err := time.Parse(time.RFC3339, value)
	return err == nil
}
