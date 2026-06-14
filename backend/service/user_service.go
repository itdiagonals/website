package service

import (
	"context"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/utils"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetAllUsers(ctx context.Context, page, limit int) ([]domain.User, int64, error) {
	return s.repo.FindAll(ctx, page, limit)
}

func (s *UserService) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *UserService) CreateUser(ctx context.Context, user *domain.User, rawPassword string) error {
	if user.Email == "" {
		return fmt.Errorf("email is required")
	}
	if rawPassword == "" {
		return fmt.Errorf("password is required")
	}
	hashed, err := utils.HashPassword(rawPassword)
	if err != nil {
		return err
	}
	user.Password = hashed
	return s.repo.Create(ctx, user)
}

func (s *UserService) UpdateUser(ctx context.Context, user *domain.User) error {
	if user.ID == "" {
		return fmt.Errorf("user id is required")
	}
	return s.repo.Update(ctx, user)
}

func (s *UserService) DeleteUser(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
