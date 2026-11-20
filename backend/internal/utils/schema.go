package utils

import (
	"encoding/json"
	"fmt"
	"strings"
)

var supportedFieldTypes = map[string]bool{
	"text":                 true,
	"textarea":             true,
	"number":               true,
	"currency_idr":         true,
	"email":                true,
	"nik":                  true,
	"select":               true,
	"radio":                true,
	"checkbox":             true,
	"date":                 true,
	"time":                 true,
	"datetime":             true,
	"file_upload":          true,
	"regional_purbalingga": true,
	"rating":               true,
	"linear_scale":         true,
}

func ValidateSchema(schemaRaw json.RawMessage, forPublish bool) []ValidationDetail {
	var schema Schema
	if err := json.Unmarshal(schemaRaw, &schema); err != nil {
		return []ValidationDetail{{Field: "schema", Issue: "Struktur schema formulir tidak valid"}}
	}

	details := make([]ValidationDetail, 0)
	sectionIDs := map[string]bool{}
	fieldIDs := map[string]bool{}
	fieldCount := 0

	for sectionIndex, section := range schema.Sections {
		sectionPath := fmt.Sprintf("sections[%d]", sectionIndex)
		if strings.TrimSpace(section.ID) == "" {
			details = append(details, ValidationDetail{Field: sectionPath, Issue: "ID section wajib diisi"})
		} else if sectionIDs[section.ID] {
			details = append(details, ValidationDetail{Field: sectionPath, Issue: "ID section duplikat"})
		} else {
			sectionIDs[section.ID] = true
		}
		if forPublish && strings.TrimSpace(section.Title) == "" {
			details = append(details, ValidationDetail{Field: sectionPath, Issue: "Judul section wajib diisi"})
		}

		for fieldIndex, field := range section.Fields {
			fieldPath := fmt.Sprintf("%s.fields[%d]", sectionPath, fieldIndex)
			fieldCount++

			if strings.TrimSpace(field.ID) == "" {
				details = append(details, ValidationDetail{Field: fieldPath, Issue: "ID field wajib diisi"})
			} else if fieldIDs[field.ID] {
				details = append(details, ValidationDetail{Field: fieldPath, Issue: "ID field duplikat"})
			} else {
				fieldIDs[field.ID] = true
			}
			if strings.TrimSpace(field.Label) == "" {
				details = append(details, ValidationDetail{Field: fieldPath, Issue: "Label field wajib diisi"})
			}
			if !supportedFieldTypes[field.Type] {
				details = append(details, ValidationDetail{Field: fieldPath, Issue: "Tipe field tidak didukung: " + field.Type})
				continue
			}

			switch field.Type {
			case "select", "radio":
				if len(field.Options) == 0 {
					details = append(details, ValidationDetail{Field: fieldPath, Issue: "Field pilihan wajib memiliki minimal satu opsi"})
				}
			}

			if field.Type == "select" || field.Type == "radio" || field.Type == "checkbox" {
				optionValues := map[string]bool{}
				for optionIndex, option := range field.Options {
					optionPath := fmt.Sprintf("%s.options[%d]", fieldPath, optionIndex)
					if strings.TrimSpace(option.Value) == "" {
						details = append(details, ValidationDetail{Field: optionPath, Issue: "Nilai opsi wajib diisi"})
					} else if optionValues[option.Value] {
						details = append(details, ValidationDetail{Field: optionPath, Issue: "Nilai opsi duplikat"})
					} else {
						optionValues[option.Value] = true
					}
					if strings.TrimSpace(option.Label) == "" {
						details = append(details, ValidationDetail{Field: optionPath, Issue: "Label opsi wajib diisi"})
					}
				}
			}

			if field.Type == "rating" || field.Type == "linear_scale" {
				minimum := floatPtr(1)
				maximum := floatPtr(5)
				if field.Config.Min != nil {
					minimum = field.Config.Min
				}
				if field.Config.Max != nil {
					maximum = field.Config.Max
				}
				if *minimum >= *maximum {
					details = append(details, ValidationDetail{Field: fieldPath, Issue: "Nilai minimum harus lebih kecil dari maksimum"})
				}
			}
		}
	}

	if forPublish && fieldCount == 0 {
		details = append(details, ValidationDetail{Field: "schema", Issue: "Formulir harus memiliki minimal satu field sebelum dipublikasikan"})
	}
	if forPublish && len(schema.Sections) == 0 {
		details = append(details, ValidationDetail{Field: "schema", Issue: "Formulir harus memiliki minimal satu section"})
	}

	return details
}

func FindRegionalFieldID(schemaRaw json.RawMessage) string {
	var schema Schema
	if err := json.Unmarshal(schemaRaw, &schema); err != nil {
		return ""
	}
	for _, section := range schema.Sections {
		for _, field := range section.Fields {
			if field.Type == "regional_purbalingga" {
				return field.ID
			}
		}
	}
	return ""
}
