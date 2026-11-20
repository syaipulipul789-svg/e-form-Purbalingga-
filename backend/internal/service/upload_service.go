package service

import (
<<<<<<< HEAD
	"bytes"
	"errors"
	"io"
=======
	"fmt"
	"io"
	"mime/multipart"
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	"net/http"
	"os"
	"path"
	"path/filepath"
<<<<<<< HEAD
	"strings"
=======
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	"time"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

<<<<<<< HEAD
var (
	ErrUploadTooLarge = errors.New("ukuran berkas melebihi batas")
	ErrUploadType     = errors.New("tipe berkas tidak diizinkan")
	ErrUploadInvalid  = errors.New("berkas tidak valid")
)

// UploadService adalah kontrak penyimpanan berkas unggahan publik.
type UploadService interface {
	Store(filename string, size int64, src io.Reader) (*domain.UploadResult, error)
}

type uploadService struct {
	uploadDir   string
	maxSizeByte int64
	now         func() time.Time
}

// NewUploadService membuat instance service unggah berkas.
func NewUploadService(uploadDir string, maxSizeMB int) UploadService {
	if maxSizeMB <= 0 {
		maxSizeMB = 10
	}
	return &uploadService{
		uploadDir:   uploadDir,
		maxSizeByte: int64(maxSizeMB) * 1024 * 1024,
		now:         time.Now,
	}
}

func (s *uploadService) Store(filename string, size int64, src io.Reader) (*domain.UploadResult, error) {
	originalName := filepath.Base(strings.TrimSpace(filename))
	if originalName == "" || originalName == "." || originalName == string(filepath.Separator) {
		return nil, ErrUploadInvalid
	}
	if size <= 0 {
		return nil, ErrUploadInvalid
	}
	if size > s.maxSizeByte {
		return nil, ErrUploadTooLarge
	}

	ext, expectedMIME, ok := allowedExtension(originalName)
	if !ok {
		return nil, ErrUploadType
	}

	header := make([]byte, 512)
	n, err := io.ReadFull(src, header)
	if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) {
		return nil, ErrUploadInvalid
	}
	header = header[:n]
	if len(header) == 0 {
		return nil, ErrUploadInvalid
	}
	if detected := http.DetectContentType(header); detected != expectedMIME {
		return nil, ErrUploadType
	}

	now := s.now()
	relativeDir := path.Join(now.Format("2006"), now.Format("01"))
	dir := filepath.Join(s.uploadDir, filepath.FromSlash(relativeDir))
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}

	fileID := uuid.NewString()
	generatedName := fileID + ext
	filePath := filepath.Join(dir, generatedName)

	destination, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o640)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = destination.Close()
	}()

	reader := io.LimitReader(io.MultiReader(bytes.NewReader(header), src), s.maxSizeByte+1)
	written, err := io.Copy(destination, reader)
	if err != nil {
		_ = os.Remove(filePath)
		return nil, err
	}
	if written > s.maxSizeByte {
		_ = destination.Close()
		_ = os.Remove(filePath)
		return nil, ErrUploadTooLarge
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	}

	return &domain.UploadResult{
		FileID:       fileID,
<<<<<<< HEAD
		OriginalName: originalName,
		FileURL:      path.Join("/uploads", relativeDir, generatedName),
		FileSize:     written,
		MimeType:     expectedMIME,
	}, nil
}

func allowedExtension(filename string) (string, string, bool) {
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".jpg", ".jpeg":
		return ".jpg", "image/jpeg", true
	case ".png":
		return ".png", "image/png", true
	case ".pdf":
		return ".pdf", "application/pdf", true
	default:
		return "", "", false
	}
}
=======
		OriginalName: filepath.Base(fileHeader.Filename),
		FileURL:      "/uploads/" + path.Join(relativeDir, safeName),
		FileSize:     int64(len(data)),
		MimeType:     mimeType,
	}, nil
}
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
