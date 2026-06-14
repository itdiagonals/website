package service

import (
	"context"
	"testing"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/utils"
)

type spyUserRepository struct {
	created    *domain.User
	updated    *domain.User
	roleID     string
	roleValue  string
	createErr  error
	byID       map[string]*domain.User
	byEmail    map[string]*domain.User
}

func (s *spyUserRepository) FindAll(context.Context, int, int) ([]domain.User, int64, error) {
	return nil, 0, nil
}

func (s *spyUserRepository) FindByID(_ context.Context, id string) (*domain.User, error) {
	if s.byID != nil {
		if u, ok := s.byID[id]; ok {
			return u, nil
		}
	}
	return &domain.User{ID: id}, nil
}

func (s *spyUserRepository) FindByEmail(_ context.Context, email string) (*domain.User, error) {
	if s.byEmail != nil {
		if u, ok := s.byEmail[email]; ok {
			return u, nil
		}
	}
	return nil, nil
}

func (s *spyUserRepository) ExistsByEmail(context.Context, string) (bool, error) {
	return false, nil
}

func (s *spyUserRepository) Create(_ context.Context, user *domain.User) error {
	if s.createErr != nil {
		return s.createErr
	}
	s.created = user
	return nil
}

func (s *spyUserRepository) Update(_ context.Context, user *domain.User) error {
	s.updated = user
	return nil
}

func (s *spyUserRepository) UpdateRole(_ context.Context, id string, role string) error {
	s.roleID = id
	s.roleValue = role
	return nil
}

func (s *spyUserRepository) Delete(context.Context, string) error { return nil }

func (s *spyUserRepository) VerifyEmail(context.Context, string) error { return nil }

func TestUserService_CreateUser_HashesPassword(t *testing.T) {
	repo := &spyUserRepository{}
	svc := NewUserService(repo)
	raw := "s3cretPassw0rd"

	user := &domain.User{Email: "admin@example.com"}
	if err := svc.CreateUser(context.Background(), user, raw); err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}

	if repo.created == nil {
		t.Fatal("expected user to be persisted")
	}
	if repo.created.Password == raw {
		t.Fatal("password was stored in plaintext")
	}
	if !utils.CheckPasswordHash(raw, repo.created.Password) {
		t.Fatal("stored password is not a valid hash of the raw password")
	}
}

func TestUserService_CreateUser_RejectsEmptyPassword(t *testing.T) {
	repo := &spyUserRepository{}
	svc := NewUserService(repo)

	err := svc.CreateUser(context.Background(), &domain.User{Email: "admin@example.com"}, "")
	if err == nil {
		t.Fatal("expected error for empty password")
	}
	if repo.created != nil {
		t.Fatal("user must not be persisted when password is empty")
	}
}

func TestUserService_CreateUser_RequiresEmail(t *testing.T) {
	repo := &spyUserRepository{}
	svc := NewUserService(repo)

	err := svc.CreateUser(context.Background(), &domain.User{}, "whatever")
	if err == nil {
		t.Fatal("expected error for missing email")
	}
	if repo.created != nil {
		t.Fatal("user must not be persisted when email is missing")
	}
}

func TestInviteService_Promote_UsesRoleOnlyUpdate(t *testing.T) {
	email := "promote@example.com"
	repo := &spyUserRepository{
		byEmail: map[string]*domain.User{
			email: {ID: "user-1", Email: email, Role: "customer", Password: "existing-hash", IsVerified: true},
		},
	}
	svc := NewInviteService(repo, nil, stubEmailSender{}, domain.EmailAddress{Email: "noreply@example.com"})

	if _, err := svc.InviteAdmin(context.Background(), email, "Owner"); err != nil {
		t.Fatalf("InviteAdmin returned error: %v", err)
	}

	if repo.updated != nil {
		t.Fatal("promotion must not use full-row Update (would clobber password/is_verified)")
	}
	if repo.roleID != "user-1" || repo.roleValue != "admin" {
		t.Fatalf("expected role-only update to admin for user-1, got id=%q role=%q", repo.roleID, repo.roleValue)
	}
}
