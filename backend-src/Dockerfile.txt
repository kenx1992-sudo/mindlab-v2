# Mindlab Backend - Multi-stage Docker Build
# Build stage
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /mindlab-server ./cmd/server

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata postgresql-client curl

WORKDIR /app

COPY --from=builder /mindlab-server /app/mindlab-server
COPY schema.sql /app/schema.sql

ENV PORT=8080
ENV APP_REGION=HK
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=mindlab
ENV DB_USER=mindlab
ENV DB_PASSWORD=""
ENV REDIS_ADDR=localhost:6379
ENV NATS_ADDR=localhost:4222
ENV ENCRYPTION_KEY=""

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/app/mindlab-server"]
