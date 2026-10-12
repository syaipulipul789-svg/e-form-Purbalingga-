package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type WilayahHandler struct {
	service service.WilayahService
}

func NewWilayahHandler(service service.WilayahService) *WilayahHandler {
	return &WilayahHandler{service: service}
}

func (h *WilayahHandler) GetKecamatan(c *gin.Context) {
	items, err := h.service.GetKecamatanList(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengambil data kecamatan",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Daftar kecamatan Kabupaten Purbalingga berhasil dimuat",
		"data":    items,
	})
}

func (h *WilayahHandler) GetDesa(c *gin.Context) {
	kodeKecStr := c.Query("kode_kec")
	if kodeKecStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Parameter kode_kec wajib diisi",
		})
		return
	}

	kodeKec, err := strconv.Atoi(kodeKecStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Parameter kode_kec harus berupa angka valid",
		})
		return
	}

	items, err := h.service.GetDesaList(c.Request.Context(), kodeKec)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengambil data desa",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Daftar desa / kelurahan berhasil dimuat",
		"data":    items,
	})
}
