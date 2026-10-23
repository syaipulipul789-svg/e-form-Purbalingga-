package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/utils"
	"github.com/xuri/excelize/v2"
)

var allowedVerificationStatuses = map[string]bool{
	"PENDING":  true,
	"ACCEPTED": true,
	"REJECTED": true,
	"REVISION": true,
}

type ResponseListParams struct {
	Page               int
	Limit              int
	Search             string
	VerificationStatus string
	KodeKec            string
	DateFrom           *time.Time
	DateTo             *time.Time
}

type AdminResponseService interface {
	List(ctx context.Context, user *domain.AuthUser, formID uuid.UUID, params ResponseListParams) ([]domain.AdminResponse, int, domain.ResponseSummary, error)
	Get(ctx context.Context, user *domain.AuthUser, formID, responseID uuid.UUID) (*domain.AdminResponse, error)
	UpdateVerification(ctx context.Context, user *domain.AuthUser, formID, responseID uuid.UUID, status, note string) (*domain.AdminResponse, error)
	Export(ctx context.Context, user *domain.AuthUser, formID uuid.UUID, format string, params ResponseListParams) (string, string, []byte, error)
}

type adminResponseService struct {
	forms     *repository.FormRepository
	responses *repository.ResponseRepository
}

func NewAdminResponseService(forms *repository.FormRepository, responses *repository.ResponseRepository) AdminResponseService {
	return &adminResponseService{forms: forms, responses: responses}
}

func (s *adminResponseService) List(ctx context.Context, user *domain.AuthUser, formID uuid.UUID, params ResponseListParams) ([]domain.AdminResponse, int, domain.ResponseSummary, error) {
	form, err := s.accessibleForm(ctx, user, formID)
	if err != nil {
		return nil, 0, domain.ResponseSummary{}, err
	}
	status := strings.ToUpper(strings.TrimSpace(params.VerificationStatus))
	if status != "" && !allowedVerificationStatuses[status] {
		return nil, 0, domain.ResponseSummary{}, domain.BadRequest("INVALID_STATUS", "Status verifikasi tidak valid", nil)
	}

	items, total, summary, err := s.responses.ListByForm(ctx, form.ID, repository.ResponseListFilter{
		Search:             params.Search,
		VerificationStatus: status,
		KodeKec:            params.KodeKec,
		RegionalFieldID:    utils.FindRegionalFieldID(form.Schema),
		DateFrom:           params.DateFrom,
		DateTo:             params.DateTo,
		Page:               params.Page,
		Limit:              params.Limit,
	})
	if err != nil {
		return nil, 0, domain.ResponseSummary{}, domain.Internal("Gagal mengambil data respons")
	}
	return items, total, summary, nil
}

func (s *adminResponseService) Get(ctx context.Context, user *domain.AuthUser, formID, responseID uuid.UUID) (*domain.AdminResponse, error) {
	form, err := s.accessibleForm(ctx, user, formID)
	if err != nil {
		return nil, err
	}
	response, err := s.responses.GetByID(ctx, form.ID, responseID)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil detail respons")
	}
	if response == nil {
		return nil, domain.NotFound("Respons tidak ditemukan")
	}
	return response, nil
}

func (s *adminResponseService) UpdateVerification(ctx context.Context, user *domain.AuthUser, formID, responseID uuid.UUID, status, note string) (*domain.AdminResponse, error) {
	form, err := s.accessibleForm(ctx, user, formID)
	if err != nil {
		return nil, err
	}

	status = strings.ToUpper(strings.TrimSpace(status))
	if !allowedVerificationStatuses[status] {
		return nil, domain.Unprocessable("INVALID_STATUS", "Status verifikasi tidak valid", []utils.ValidationDetail{{Field: "verification_status", Issue: "Status verifikasi tidak valid"}})
	}

	note = strings.TrimSpace(note)
	if len([]rune(note)) > 1000 {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Catatan verifikasi terlalu panjang", []utils.ValidationDetail{{Field: "verification_note", Issue: "Maksimal 1000 karakter"}})
	}
	if (status == "REJECTED" || status == "REVISION") && note == "" {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Catatan verifikasi wajib diisi", []utils.ValidationDetail{{Field: "verification_note", Issue: "Catatan wajib diisi untuk status Ditolak atau Perlu Revisi"}})
	}

	var notePtr *string
	if note != "" && status != "PENDING" {
		notePtr = &note
	}
	var verifierID any
	if status == "PENDING" {
		verifierID = nil
	} else {
		verifierID = user.ID
	}

	if err := s.responses.UpdateVerification(ctx, form.ID, responseID, status, notePtr, verifierID); err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, domain.NotFound("Respons tidak ditemukan")
		}
		return nil, domain.Internal("Gagal menyimpan status verifikasi")
	}

	return s.Get(ctx, user, form.ID, responseID)
}

func (s *adminResponseService) Export(ctx context.Context, user *domain.AuthUser, formID uuid.UUID, format string, params ResponseListParams) (string, string, []byte, error) {
	form, err := s.accessibleForm(ctx, user, formID)
	if err != nil {
		return "", "", nil, err
	}

	format = strings.ToLower(strings.TrimSpace(format))
	if format == "" {
		format = "xlsx"
	}
	if format != "csv" && format != "xlsx" {
		return "", "", nil, domain.BadRequest("INVALID_FORMAT", "Format ekspor harus csv atau xlsx", nil)
	}

	var schema utils.Schema
	if err := json.Unmarshal(form.Schema, &schema); err != nil {
		return "", "", nil, domain.Internal("Schema formulir tidak dapat dibaca")
	}

	filter := repository.ResponseListFilter{
		Search:             params.Search,
		VerificationStatus: strings.ToUpper(strings.TrimSpace(params.VerificationStatus)),
		KodeKec:            params.KodeKec,
		RegionalFieldID:    utils.FindRegionalFieldID(form.Schema),
		DateFrom:           params.DateFrom,
		DateTo:             params.DateTo,
	}
	rows, err := s.responses.ExportRows(ctx, form.ID, filter)
	if err != nil {
		return "", "", nil, domain.Internal("Gagal mengambil data ekspor")
	}
	defer rows.Close()

	headers := []string{"No", "Nomor Registrasi", "Waktu Kirim", "Status Verifikasi", "Catatan Verifikasi"}
	fieldIDs := make([]string, 0)
	for _, section := range schema.Sections {
		for _, field := range section.Fields {
			headers = append(headers, field.Label)
			fieldIDs = append(fieldIDs, field.ID)
		}
	}

	dataRows := make([][]string, 0)
	index := 0
	for rows.Next() {
		var item domain.AdminResponse
		if err := rows.StructScan(&item); err != nil {
			return "", "", nil, domain.Internal("Gagal membaca data respons")
		}
		index++

		var answers map[string]any
		_ = json.Unmarshal(item.Answers, &answers)

		registration := ""
		if item.RegistrationNumber != nil {
			registration = *item.RegistrationNumber
		}
		note := ""
		if item.VerificationNote != nil {
			note = *item.VerificationNote
		}
		row := []string{
			fmt.Sprintf("%d", index),
			registration,
			item.SubmittedAt.In(time.Local).Format("2006-01-02 15:04:05"),
			item.VerificationStatus,
			note,
		}
		for _, fieldID := range fieldIDs {
			row = append(row, formatAnswerValue(answers[fieldID]))
		}
		dataRows = append(dataRows, row)
	}
	if err := rows.Err(); err != nil {
		return "", "", nil, domain.Internal("Gagal membaca data respons")
	}

	timestamp := time.Now().Format("20060102_150405")
	baseName := "respons_" + form.Slug + "_" + timestamp

	if format == "csv" {
		var buffer bytes.Buffer
		buffer.WriteString("\xEF\xBB\xBF")
		writer := csv.NewWriter(&buffer)
		if err := writer.Write(headers); err != nil {
			return "", "", nil, domain.Internal("Gagal membuat berkas CSV")
		}
		for _, row := range dataRows {
			if err := writer.Write(row); err != nil {
				return "", "", nil, domain.Internal("Gagal membuat berkas CSV")
			}
		}
		writer.Flush()
		if err := writer.Error(); err != nil {
			return "", "", nil, domain.Internal("Gagal membuat berkas CSV")
		}
		return baseName + ".csv", "text/csv; charset=utf-8", buffer.Bytes(), nil
	}

	file := excelize.NewFile()
	sheet := "Respons"
	defaultSheet := file.GetSheetName(0)
	if defaultSheet != "Sheet1" {
		defaultSheet = file.GetSheetName(0)
	}
	_ = file.SetSheetName(defaultSheet, sheet)

	headerStyle, _ := file.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"0F172A"}, Pattern: 1},
		Alignment: &excelize.Alignment{Vertical: "center", Horizontal: "center", WrapText: true},
	})
	if err := file.SetSheetRow(sheet, "A1", &headers); err != nil {
		return "", "", nil, domain.Internal("Gagal membuat berkas Excel")
	}
	lastColumn, _ := excelize.ColumnNumberToName(len(headers))
	_ = file.SetCellStyle(sheet, "A1", lastColumn+"1", headerStyle)
	_ = file.SetRowHeight(sheet, 1, 28)

	for i, row := range dataRows {
		cell, _ := excelize.CoordinatesToCellName(1, i+2)
		values := make([]any, len(row))
		for j, value := range row {
			values[j] = value
		}
		if err := file.SetSheetRow(sheet, cell, &values); err != nil {
			return "", "", nil, domain.Internal("Gagal membuat berkas Excel")
		}
	}

	widths := []float64{5, 22, 20, 18, 32}
	for len(widths) < len(headers) {
		widths = append(widths, 28)
	}
	for i, width := range widths[:len(headers)] {
		column, _ := excelize.ColumnNumberToName(i + 1)
		_ = file.SetColWidth(sheet, column, column, width)
	}
	_ = file.SetPanes(sheet, &excelize.Panes{Freeze: true, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})

	buffer, err := file.WriteToBuffer()
	if err != nil {
		return "", "", nil, domain.Internal("Gagal membuat berkas Excel")
	}
	return baseName + ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes(), nil
}

func (s *adminResponseService) accessibleForm(ctx context.Context, user *domain.AuthUser, formID uuid.UUID) (*domain.Form, error) {
	form, err := s.forms.GetByID(ctx, formID)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil formulir")
	}
	if form == nil || !canAccessForm(user, form) {
		return nil, domain.NotFound("Formulir tidak ditemukan")
	}
	return form, nil
}

func formatAnswerValue(value any) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return typed
	case bool:
		if typed {
			return "Ya"
		}
		return "Tidak"
	case float64:
		return strings.TrimRight(strings.TrimRight(fmt.Sprintf("%.2f", typed), "0"), ".")
	case []any:
		parts := make([]string, 0, len(typed))
		for _, item := range typed {
			parts = append(parts, formatAnswerValue(item))
		}
		return strings.Join(parts, ", ")
	case map[string]any:
		kecamatan, _ := typed["nama_kecamatan"].(string)
		desa, _ := typed["nama_desa"].(string)
		if kecamatan != "" || desa != "" {
			return strings.TrimSpace(strings.Trim(kecamatan+" / "+desa, " /"))
		}
		if fileURL, ok := typed["file_url"].(string); ok {
			return fileURL
		}
		encoded, _ := json.Marshal(typed)
		return string(encoded)
	default:
		encoded, _ := json.Marshal(typed)
		return string(encoded)
	}
}
