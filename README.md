# Media File Upload System

A full-stack cross-platform media file upload solution with chunked upload, progress tracking, and resumable uploads. Built for the Fullstack Offline Assignment.

## Project Overview

This system enables reliable uploading of large media files (images and videos) with the following key features:

- **Chunked Upload**: Files split into 1MB chunks for reliable transfer
- **Concurrent Uploads**: Up to 3 parallel file uploads
- **Pause/Resume**: Pause and resume uploads at any time
- **Progress Tracking**: Real-time progress for each file and chunk
- **Auto-Retry**: Exponential backoff with up to 3 retry attempts
- **File Validation**: Client and server-side validation with magic number detection
- **Deduplication**: MD5-based duplicate file detection
- **Upload History**: Persistent upload history in browser storage

##  Architecture

```
ideaWise/
├── backend/          # Symfony 7.1 REST API
├── frontend/         # React 18 + TypeScript web app
├── mobile/           # (React Native)
├── Implementing.md   # Detailed implementation log
└── README.md         # This file
```

## Quick Start

### Prerequisites

- PHP 8.1+ with extensions: pdo, pdo_sqlite, redis
- Composer
- Node.js 18+
- npm or yarn
- Redis server

### 1. Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Configure environment
cp .env .env.local
# Edit .env.local if needed (default uses SQLite)

# Run migrations
php bin/console doctrine:migrations:migrate

# Start Redis
redis-server

# Start Symfony server (option 1 - using PHP)
php -S localhost:8000 -t public/

# OR option 2 - using Symfony CLI (if installed)
symfony server:start
```

Backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env .env.example
# Edit .env if backend URL is different

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 3. Test the Application

1. Open `http://localhost:5173` in your browser
2. Drag and drop image or video files
3. Watch uploads progress in real-time
4. Try pause/resume/cancel features
5. Check upload history

## Documentations

- [Backend README](./backend/README.md) - Detailed backend documentation
- [Frontend README](./frontend/README.md) - Frontend setup and features
- [Mobile README](./mobile/README.md) - Mobile setup and features
- [Implementing.md](./Implementing.md) - Step-by-step implementation log


## Configuration

### Backend Configuration

Edit `backend/.env`:
```env
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
REDIS_URL=redis://localhost:6379
UPLOAD_CHUNK_SIZE=1048576
UPLOAD_MAX_FILE_SIZE=524288000
UPLOAD_MAX_FILES=10
```

### Frontend Configuration

Edit `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

##  Troubleshooting

### Backend Issues

**Database errors:**
```bash
# Reset database
rm backend/var/data.db
php bin/console doctrine:migrations:migrate
```

**Redis not running:**
```bash
redis-server
```

### Frontend Issues

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```