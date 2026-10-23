package service

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

const (
	defaultMaxUploadBytes int64 = 5 * 1024 * 1024
	maxUploadBytes        int64 = 5 * 1024 * 1024
)

var allowedUploadTypes = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"application/pdf": ".pdf",
}

type UploadService interface {
	Save(fileHeader *multipart.FileHeader) (*domain.UploadResult, error)
}

type uploadService struct {
	uploadDir string
	maxBytes  int64
}

func NewUploadService(uploadDir string, maxUploadSizeMB int) UploadService {
	maxBytes := defaultMaxUploadBytes
	if maxUploadSizeMB > 0 {
		configured := int64(maxUploadSizeMB) * 1024 * 1024
		if configured < maxBytes {
			maxBytes = configured
		}
	}
	return &uploadService{
		uploadDir: uploadDir,
		maxBytes:  maxBytes,
	}
}

func (s *uploadService) Save(fileHeader *multipart.FileHeader) (*domain.UploadResult, error) {
	if fileHeader == nil {
		return nil, domain.BadRequest("FILE_REQUIRED", "Berkas wajib diunggah", nil)
	}
	if fileHeader.Size <= 0 {
		return nil, domain.BadRequest("EMPTY_FILE", "Berkas kosong tidak dapat diunggah", nil)
	}
	if fileHeader.Size > s.maxBytes {
		return nil, domain.NewAppError(http.StatusRequestEntityTooLarge, "FILE_TOO_LARGE", "Ukuran berkas maksimal 5 MB", nil)
	}

	file, err := fileHeader.Open()
	if err != nil {
		return nil, domain.Internal("Gagal membuka berkas unggahan")
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, s.maxBytes+1))
	if err != nil {
		return nil, domain.Internal("Gagal membaca berkas unggahan")
	}
	if int64(len(data)) > s.maxBytes {
		return nil, domain.NewAppError(http.StatusRequestEntityTooLarge, "FILE_TOO_LARGE", "Ukuran berkas maksimal 5 MB", nil)
	}

	mimeType := http.DetectContentType(data)
	extension, allowed := allowedUploadTypes[mimeType]
	if !allowed {
		return nil, domain.Unprocessable("INVALID_FILE_TYPE", "Hanya berkas JPG, PNG, atau PDF yang diperbolehkan", nil)
	}

	now := time.Now()
	relativeDir := path.Join("submissions", now.Format("2006"), now.Format("01"))
	absoluteDir := filepath.Join(s.uploadDir, filepath.FromSlash(relativeDir))
	if err := os.MkdirAll(absoluteDir, 0755); err != nil {
		return nil, domain.Internal("Gagal menyiapkan direktori penyimpanan")
	}

	fileID := uuid.New()
	safeName := fmt.Sprintf("%s_%d%s", fileID.String(), now.Unix(), extension)
	finalPath := filepath.Join(absoluteDir, safeName)
	if err := os.WriteFile(finalPath, data, 0644); err != nil {
		return nil, domain.Internal("Gagal menyimpan berkas unggahan")
	}

	return &domain.UploadResult{
		FileID:       fileID,
		OriginalName: filepath.Base(fileHeader.Filename),
		FileURL:      "/uploads/" + path.Join(relativeDir, safeName),
		FileSize:     int64(len(data)),
		MimeType:     mimeType,
	}, nil
}
