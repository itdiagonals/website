package service

import (
	"context"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetAllUsers(ctx context.Context) ([]domain.User, error) {
	return s.repo.FindAll(ctx)
}

func (s *UserService) GetUserByID(ctx context.Context, id uint) (*domain.User, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *UserService) CreateUser(ctx context.Context, user *domain.User) error {
	if user.Email == "" {
		return fmt.Errorf("email is required")
	}
	return s.repo.Create(ctx, user)
}

func (s *UserService) UpdateUser(ctx context.Context, user *domain.User) error {
	if user.ID == 0 {
		return fmt.Errorf("user id is required")
	}
	return s.repo.Update(ctx, user)
}

func (s *UserService) DeleteUser(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}
