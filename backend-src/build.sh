#!/bin/bash
# Mindlab Backend - Local Build Script
# Usage: ./build.sh [build|run|test|clean]

set -e

BINARY_NAME="mindlab-server"
CMD_PATH="./cmd/server"

build() {
    echo "🔨 Building Mindlab backend..."
    go mod tidy
    go vet ./...
    go build -ldflags="-s -w" -o ${BINARY_NAME} ${CMD_PATH}
    echo "✅ Build complete: $(ls -lh ${BINARY_NAME} | awk '{print $5}')"
}

run() {
    build
    echo "🚀 Starting Mindlab backend on :${PORT:-8080}..."
    export PORT=${PORT:-8080}
    export APP_REGION=${APP_REGION:-HK}
    ./${BINARY_NAME}
}

test() {
    echo "🧪 Running tests..."
    go vet ./...
    go test -v ./...
    echo "✅ Tests passed"
}

clean() {
    echo "🧹 Cleaning..."
    rm -f ${BINARY_NAME}
    echo "✅ Clean complete"
}

initdb() {
    echo "📦 Initializing database..."
    if [ -z "$DB_HOST" ]; then
        echo "⚠️  DB_HOST not set. Starting PostgreSQL via docker-compose..."
        docker-compose up -d postgres
        sleep 5
        export DB_HOST=localhost
    fi
    PGPASSWORD=${DB_PASSWORD:-mindlab_dev} psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-mindlab} -d ${DB_NAME:-mindlab} -f schema.sql
    echo "✅ Database initialized"
}

case "${1:-build}" in
    build)   build ;;
    run)     run ;;
    test)    test ;;
    clean)   clean ;;
    initdb)  initdb ;;
    *)       echo "Usage: $0 {build|run|test|clean|initdb}" ;;
esac
