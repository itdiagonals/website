-- migration: 0018_seed_superadmin
-- description: Seed default superadmin account

-- up
INSERT INTO users (id, email, password, name, role, is_verified, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@diagonals.id',
    '$2a$10$s2U4JqcFK4U3ueHJmnkI.OiPqATPwt9tJfZnKUQpN8BuXqYHbKwkG',
    'Super Admin',
    'admin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- down
DELETE FROM users WHERE email = 'admin@diagonals.id';
