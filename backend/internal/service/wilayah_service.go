package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

type WilayahService interface {
	GetKecamatanList(ctx context.Context) ([]domain.Kecamatan, error)
	GetDesaList(ctx context.Context, kodeKec int) ([]domain.Desa, error)
}

type wilayahService struct {
	apiBaseURL string
	httpClient *http.Client
}

func NewWilayahService(apiBaseURL string) WilayahService {
	return &wilayahService{
		apiBaseURL: apiBaseURL,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Struct parsing untuk response API Sidami Purbalingga
type sidamiResponse[T any] struct {
	Code   int    `json:"code"`
	Status string `json:"status"`
	Data   struct {
		Items []T `json:"items"`
	} `json:"data"`
}

type sidamiKecamatanItem struct {
	KodeKec       int    `json:"kode_kec"`
	NamaKecamatan string `json:"nama_kecamatan"`
	KodeKab       string `json:"kode_kab"`
	KodeSKPD      int    `json:"kode_skpd"`
}

type sidamiDesaItem struct {
	KodeDesa int64  `json:"kode_desa"`
	KodeKec  int    `json:"kode_kec"`
	NamaDesa string `json:"nama_desa"`
	KodeKab  string `json:"kode_kab"`
}

// GetKecamatanList mengambil langsung data 18 kecamatan dari API Sidami
func (s *wilayahService) GetKecamatanList(ctx context.Context) ([]domain.Kecamatan, error) {
	kecURL := fmt.Sprintf("%s/datakecamatan?size=-1", s.apiBaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, kecURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gagal memanggil API Sidami kecamatan: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API Sidami mengembalikan status HTTP %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed sidamiResponse[sidamiKecamatanItem]
	if err := json.Unmarshal(bodyBytes, &parsed); err != nil {
		return nil, fmt.Errorf("gagal membaca format JSON Sidami: %w", err)
	}

	items := make([]domain.Kecamatan, len(parsed.Data.Items))
	for i, item := range parsed.Data.Items {
		items[i] = domain.Kecamatan{
			KodeKec:       item.KodeKec,
			NamaKecamatan: item.NamaKecamatan,
			KodeKab:       item.KodeKab,
			KodeSKPD:      item.KodeSKPD,
		}
	}

	return items, nil
}

// GetDesaList mengambil langsung data desa/kelurahan dari API Sidami berdasarkan kode_kec
func (s *wilayahService) GetDesaList(ctx context.Context, kodeKec int) ([]domain.Desa, error) {
	desaURL := fmt.Sprintf("%s/datadesa?kode_kec=equal:%d&size=-1", s.apiBaseURL, kodeKec)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, desaURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gagal memanggil API Sidami desa: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API Sidami mengembalikan status HTTP %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed sidamiResponse[sidamiDesaItem]
	if err := json.Unmarshal(bodyBytes, &parsed); err != nil {
		return nil, fmt.Errorf("gagal membaca format JSON Sidami: %w", err)
	}

	items := make([]domain.Desa, len(parsed.Data.Items))
	for i, item := range parsed.Data.Items {
		items[i] = domain.Desa{
			KodeDesa: item.KodeDesa,
			KodeKec:  item.KodeKec,
			NamaDesa: item.NamaDesa,
			KodeKab:  item.KodeKab,
		}
	}

	return items, nil
}
