package utils

import "golang.org/x/crypto/bcrypt"

// dummyPasswordHash is a pre-computed bcrypt hash of an unguessable value.
// It is used to keep login timings constant when the user does not exist
// or the email is wrong, so attackers cannot enumerate accounts via timing.
var dummyPasswordHash = mustGenerateDummyHash()

func mustGenerateDummyHash() string {
	hash, err := bcrypt.GenerateFromPassword([]byte("diagonals-dummy-prevent-timing-attack"), bcrypt.DefaultCost)
	if err != nil {
		panic("failed to initialize dummy password hash: " + err.Error())
	}
	return string(hash)
}

func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hashedPassword), nil
}

func CheckPasswordHash(password string, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// DummyPasswordHash returns a bcrypt hash that is not associated with any
// real account. Callers should compare against it on user-not-found paths
// to equalize login timings.
func DummyPasswordHash() string {
	return dummyPasswordHash
}
