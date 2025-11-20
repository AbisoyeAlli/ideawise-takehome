# Media Upload System - Backend API

Symfony 7.1 REST API for chunked file uploads with Redis tracking.

## Features

- Chunked file upload (1MB chunks)
- File validation (MIME type, magic number, size)
- MD5 deduplication
- Redis-based chunk tracking
- Organized file storage by date
- Comprehensive logging
- CORS support for web clients

## Requirements

- PHP 8.1 or higher
- Composer
- Redis server
- SQLite (or MySQL/PostgreSQL for production)

## Installation

1. Install dependencies:
```bash
composer install
```

2. Configure environment:
```bash
cp .env .env.local
# Edit .env.local with your settings
```

3. Run database migrations:
```bash
php bin/console doctrine:migrations:migrate
```

4. Start Redis server:
```bash
redis-server
```

5. Start Symfony server:
```bash
symfony server:start
# or
php -S localhost:8000 -t public/
```

## API Endpoints

### 1. Initiate Upload
**POST** `/api/upload/initiate`

Request:
```json
{
  "filename": "video.mp4",
  "filesize": 10485760,
  "mimeType": "video/mp4",
  "md5Hash": "098f6bcd4621d373cade4e832627b4f6"
}
```

Response:
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "chunkSize": 1048576,
  "totalChunks": 10
}
```

### 2. Upload Chunk
**POST** `/api/upload/chunk`

Form Data:
- `uploadId`: Upload session ID
- `chunkIndex`: Chunk index (0-based)
- `chunk`: Chunk file data

Response:
```json
{
  "success": true,
  "chunkIndex": 0,
  "uploadedChunks": 1,
  "totalChunks": 10
}
```

### 3. Finalize Upload
**POST** `/api/upload/finalize`

Request:
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Response:
```json
{
  "success": true,
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "filePath": "/path/to/file",
  "filename": "video.mp4"
}
```

### 4. Get Upload Status
**GET** `/api/upload/status/{uploadId}`

Response:
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "video.mp4",
  "status": "uploading",
  "uploadedChunks": 5,
  "totalChunks": 10,
  "filesize": "10485760",
  "createdAt": "2025-11-17 18:00:00"
}
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"

# Redis
REDIS_URL=redis://localhost:6379

# Upload Settings
UPLOAD_CHUNK_SIZE=1048576          # 1MB
UPLOAD_MAX_FILE_SIZE=524288000     # 500MB
UPLOAD_MAX_FILES=10
UPLOAD_CHUNK_RETENTION=86400       # 24 hours
UPLOAD_FILE_RETENTION=2592000      # 30 days

# CORS
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
```

## Logging

Logs are stored in `var/log/` directory:
- `dev.log` - Development logs
- `prod.log` - Production logs

Log levels: DEBUG, INFO, WARN, ERROR

## Testing

Run tests:
```bash
php bin/phpunit
```
