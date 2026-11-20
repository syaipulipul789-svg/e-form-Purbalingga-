package service_test

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type fakeFormRepo struct {
	forms     map[uuid.UUID]*domain.Form
	createErr error
	updateErr error
}

func newFakeFormRepo() *fakeFormRepo {
	return &fakeFormRepo{forms: map[uuid.UUID]*domain.Form{}}
}

func (f *fakeFormRepo) ListByOPD(_ context.Context, opdID *uuid.UUID, q domain.FormListQuery) ([]domain.Form, int, error) {
	var items []domain.Form
	for _, form := range f.forms {
		if opdID != nil && form.OPDID != *opdID {
			continue
		}
		if q.Status != "" && form.Status != q.Status {
			continue
		}
		items = append(items, *form)
	}
	return items, len(items), nil
}

func (f *fakeFormRepo) FindByID(_ context.Context, id uuid.UUID) (*domain.Form, error) {
	if form, ok := f.forms[id]; ok {
		return form, nil
	}
	return nil, repository.ErrNotFound
}

func (f *fakeFormRepo) FindBySlug(_ context.Context, slug string) (*domain.Form, error) {
	for _, form := range f.forms {
		if form.Slug == slug {
			return form, nil
		}
	}
	return nil, repository.ErrNotFound
}

func (f *fakeFormRepo) Create(_ context.Context, form *domain.Form) error {
	if f.createErr != nil {
		return f.createErr
	}
	f.forms[form.ID] = form
	return nil
}

func (f *fakeFormRepo) Update(_ context.Context, form *domain.Form) error {
	if f.updateErr != nil {
		return f.updateErr
	}
	f.forms[form.ID] = form
	return nil
}

func (f *fakeFormRepo) UpdateStatus(_ context.Context, id uuid.UUID, status string) error {
	form, ok := f.forms[id]
	if !ok {
		return repository.ErrNotFound
	}
	form.Status = status
	return nil
}

func (f *fakeFormRepo) Delete(_ context.Context, id uuid.UUID) error {
	if _, ok := f.forms[id]; !ok {
		return repository.ErrNotFound
	}
	delete(f.forms, id)
	return nil
}

func adminActor(opdID uuid.UUID) service.Actor {
	return service.Actor{UserID: uuid.New(), Role: "ADMIN_OPD", OPDID: &opdID}
}

func seedForm(repo *fakeFormRepo, opdID uuid.UUID, status string) *domain.Form {
	form := &domain.Form{
		ID:        uuid.New(),
		OPDID:     opdID,
		CreatorID: uuid.New(),
		Slug:      "form-" + uuid.NewString()[:8],
		Title:     "Form Uji",
		Status:    status,
		Schema:    json.RawMessage(`{"sections":[]}`),
		Settings:  json.RawMessage(`{}`),
	}
	repo.forms[form.ID] = form
	return form
}

func TestCreateFormDefaultsAndDates(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)
	opdID := uuid.New()

	res, err := svc.Create(context.Background(), adminActor(opdID), domain.CreateFormRequest{
		Title: "Pendataan UMKM",
		Settings: json.RawMessage(`{
			"start_date": "2026-10-15T00:00:00Z",
			"end_date": "2026-10-30T23:59:59Z"
		}`),
	})
	if err != nil {
		t.Fatalf("Create harus berhasil, got %v", err)
	}
	if res.Status != "DRAFT" {
		t.Fatalf("status default harus DRAFT, got %s", res.Status)
	}
	if res.Slug == "" {
		t.Fatal("slug harus di-generate otomatis")
	}
	if res.StartDate == nil || res.EndDate == nil {
		t.Fatal("start_date/end_date harus dipetakan dari settings")
	}
	stored := repo.forms[res.ID]
	if stored == nil {
		t.Fatal("formulir harus tersimpan di repository")
	}
	if stored.OPDID != opdID {
		t.Fatalf("opd_id harus OPD pemanggil, got %s", stored.OPDID)
	}
}

func TestCreateFormInvalidTitle(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)

	_, err := svc.Create(context.Background(), adminActor(uuid.New()), domain.CreateFormRequest{Title: "   "})
	if !errors.Is(err, service.ErrInvalidInput) {
		t.Fatalf("harus ErrInvalidInput, got %v", err)
	}
}

func TestCreateFormSlugConflict(t *testing.T) {
	repo := newFakeFormRepo()
	repo.createErr = repository.ErrSlugConflict
	svc := service.NewFormService(repo)

	_, err := svc.Create(context.Background(), adminActor(uuid.New()), domain.CreateFormRequest{
		Title: "Form Bentrok",
		Slug:  "slug-sama",
	})
	if !errors.Is(err, service.ErrSlugConflict) {
		t.Fatalf("harus ErrSlugConflict, got %v", err)
	}
}

func TestListScopedToActorOPD(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)
	opdA := uuid.New()
	opdB := uuid.New()
	seedForm(repo, opdA, "DRAFT")
	seedForm(repo, opdB, "PUBLISHED")

	res, err := svc.List(context.Background(), adminActor(opdA), domain.FormListQuery{})
	if err != nil {
		t.Fatalf("List error: %v", err)
	}
	if res.Total != 1 || len(res.Items) != 1 {
		t.Fatalf("Admin OPD hanya boleh melihat 1 form miliknya, got %d", res.Total)
	}
}

func TestListSuperAdminSeesAll(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)
	seedForm(repo, uuid.New(), "DRAFT")
	seedForm(repo, uuid.New(), "PUBLISHED")

	super := service.Actor{UserID: uuid.New(), Role: "SUPER_ADMIN", OPDID: nil}
	res, err := svc.List(context.Background(), super, domain.FormListQuery{})
	if err != nil {
		t.Fatalf("List error: %v", err)
	}
	if res.Total != 2 {
		t.Fatalf("Super Admin harus melihat semua form, got %d", res.Total)
	}
}

func TestGetForbiddenOtherOPD(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)
	form := seedForm(repo, uuid.New(), "DRAFT")

	_, err := svc.Get(context.Background(), adminActor(uuid.New()), form.ID)
	if !errors.Is(err, service.ErrFormForbidden) {
		t.Fatalf("harus ErrFormForbidden, got %v", err)
	}
}

func TestSuperAdminCanGetOtherOPD(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)
	form := seedForm(repo, uuid.New(), "DRAFT")

	super := service.Actor{UserID: uuid.New(), Role: "SUPER_ADMIN", OPDID: nil}
	res, err := svc.Get(context.Background(), super, form.ID)
	if err != nil {
		t.Fatalf("Super Admin harus bisa akses form OPD lain, got %v", err)
	}
	if res.ID != form.ID {
		t.Fatalf("ID form tidak cocok")
	}
}

func TestGetNotFound(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)

	_, err := svc.Get(context.Background(), adminActor(uuid.New()), uuid.New())
	if !errors.Is(err, service.ErrFormNotFound) {
		t.Fatalf("harus ErrFormNotFound, got %v", err)
	}
}

func TestUpdateStatusInvalid(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)
	form := seedForm(repo, uuid.New(), "DRAFT")
	opdID := form.OPDID

	_, err := svc.UpdateStatus(context.Background(), adminActor(opdID), form.ID, "NGACO")
	if !errors.Is(err, service.ErrInvalidInput) {
		t.Fatalf("harus ErrInvalidInput, got %v", err)
	}
}

func TestUpdateStatusSuccess(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)
	form := seedForm(repo, uuid.New(), "DRAFT")

	res, err := svc.UpdateStatus(context.Background(), adminActor(form.OPDID), form.ID, "PUBLISHED")
	if err != nil {
		t.Fatalf("UpdateStatus error: %v", err)
	}
	if res.Status != "PUBLISHED" {
		t.Fatalf("status harus PUBLISHED, got %s", res.Status)
	}
}

func TestDeleteForbiddenOtherOPD(t *testing.T) {
	repo := newFakeFormRepo()
	svc := service.NewFormService(repo)
	form := seedForm(repo, uuid.New(), "DRAFT")

	err := svc.Delete(context.Background(), adminActor(uuid.New()), form.ID)
	if !errors.Is(err, service.ErrFormForbidden) {
		t.Fatalf("harus ErrFormForbidden, got %v", err)
	}
}
