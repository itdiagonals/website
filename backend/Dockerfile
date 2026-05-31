FROM golang:1.25-alpine AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates tzdata libwebp-dev build-base

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/server .
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migration

FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata libwebp

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /out/server /app/server
COPY --from=builder /out/migrate /app/migrate

USER app

EXPOSE 8080

CMD ["/app/server"]
