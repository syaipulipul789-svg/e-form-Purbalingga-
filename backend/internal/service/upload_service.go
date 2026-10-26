package service

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

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
	}

	return &domain.UploadResult{
		FileID:       fileID,
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
