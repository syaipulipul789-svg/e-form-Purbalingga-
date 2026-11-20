package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type fakeResponseRepo struct {
	response *domain.FormResponse
	audit    repository.AuditRecord
}

func (f *fakeResponseRepo) Create(_ context.Context, _ uuid.UUID, _ *domain.FormResponse, _ bool, _ int) error {
	return nil
}

func (f *fakeResponseRepo) ListByForm(_ context.Context, _ uuid.UUID, _ domain.FormResponseListQuery) ([]domain.FormResponse, int, error) {
	return nil, 0, nil
}

func (f *fakeResponseRepo) GetByID(_ context.Context, formID, responseID uuid.UUID) (*domain.FormResponse, error) {
	if f.response == nil || f.response.ID != responseID || f.response.FormID != formID {
		return nil, repository.ErrResponseNotFound
	}
	return f.response, nil
}

func (f *fakeResponseRepo) UpdateStatus(_ context.Context, formID, responseID uuid.UUID, status, publicNote, internalNote string, verifiedBy uuid.UUID, audit repository.AuditRecord) (*domain.FormResponse, error) {
	if f.response == nil || f.response.ID != responseID || f.response.FormID != formID {
		return nil, repository.ErrResponseNotFound
	}
	updated := *f.response
	updated.Status = status
	updated.PublicNote = publicNote
	updated.InternalNote = internalNote
	updated.VerifiedBy = &verifiedBy
	f.response = &updated
	f.audit = audit
	return &updated, nil
}

func (f *fakeResponseRepo) FindForTracking(_ context.Context, _, _ string) (*domain.PublicTrackResponse, error) {
	return nil, repository.ErrSubmissionNotFound
}

func responseFixture() (*fakeFormRepo, *fakeResponseRepo, service.Actor, uuid.UUID, uuid.UUID) {
	opdID := uuid.New()
	userID := uuid.New()
	formID := uuid.New()
	responseID := uuid.New()
	registration := "PBG-20261115-ABCDEF"

	formRepo := newFakeFormRepo()
	formRepo.forms[formID] = &domain.Form{ID: formID, OPDID: opdID, Status: "PUBLISHED"}

	responseRepo := &fakeResponseRepo{response: &domain.FormResponse{
		ID:                 responseID,
		FormID:             formID,
		RegistrationNumber: &registration,
		Status:             "SUBMITTED",
	}}

	actor := service.Actor{UserID: userID, Role: "ADMIN_OPD", OPDID: &opdID}
	return formRepo, responseRepo, actor, formID, responseID
}

func TestUpdateStatusVerifiesSubmission(t *testing.T) {
	formRepo, responseRepo, actor, formID, responseID := responseFixture()
	svc := service.NewResponseService(formRepo, responseRepo)

	result, err := svc.UpdateStatus(context.Background(), actor, formID, responseID, domain.UpdateResponseStatusRequest{
		Status:       "verified",
		PublicNote:   "Berkas lengkap.",
		InternalNote: "Sudah dicek.",
	}, "127.0.0.1")
	if err != nil {
		t.Fatalf("UpdateStatus() error = %v", err)
	}
	if result.Status != "VERIFIED" {
		t.Fatalf("status = %q, want VERIFIED", result.Status)
	}
	if responseRepo.audit.Action != "RESPONSE_STATUS_UPDATED" {
		t.Fatalf("audit action = %q", responseRepo.audit.Action)
	}
}

func TestUpdateStatusRejectsInvalidTransition(t *testing.T) {
	formRepo, responseRepo, actor, formID, responseID := responseFixture()
	svc := service.NewResponseService(formRepo, responseRepo)

	_, err := svc.UpdateStatus(context.Background(), actor, formID, responseID, domain.UpdateResponseStatusRequest{
		Status: "APPROVED",
	}, "127.0.0.1")
	if !errors.Is(err, service.ErrInvalidStatusTransition) {
		t.Fatalf("error = %v, want ErrInvalidStatusTransition", err)
	}
}

func TestUpdateStatusRequiresPublicNoteOnRejection(t *testing.T) {
	formRepo, responseRepo, actor, formID, responseID := responseFixture()
	responseRepo.response.Status = "VERIFIED"
	svc := service.NewResponseService(formRepo, responseRepo)

	_, err := svc.UpdateStatus(context.Background(), actor, formID, responseID, domain.UpdateResponseStatusRequest{
		Status: "REJECTED",
	}, "127.0.0.1")
	if !errors.Is(err, service.ErrPublicNoteRequired) {
		t.Fatalf("error = %v, want ErrPublicNoteRequired", err)
	}
}

func TestUpdateStatusForbiddenForOtherOPD(t *testing.T) {
	formRepo, responseRepo, actor, formID, responseID := responseFixture()
	otherOPD := uuid.New()
	actor.OPDID = &otherOPD
	svc := service.NewResponseService(formRepo, responseRepo)

	_, err := svc.UpdateStatus(context.Background(), actor, formID, responseID, domain.UpdateResponseStatusRequest{
		Status: "VERIFIED",
	}, "127.0.0.1")
	if !errors.Is(err, service.ErrFormForbidden) {
		t.Fatalf("error = %v, want ErrFormForbidden", err)
	}
}
