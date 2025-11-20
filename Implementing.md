# Media File Upload System - Implementation Log

This document tracks the implementation progress of the Media File Upload System assignment.

**Packages Installed:**
```bash
composer create-project symfony/skeleton:"7.1.*" backend
composer require symfony/orm-pack symfony/maker-bundle --dev
composer require symfony/serializer-pack symfony/validator nelmio/cors-bundle
composer require predis/predis symfony/monolog-bundle symfony/rate-limiter
```

**Directory Structure:**
```
backend/
├── bin/              # Console scripts
├── config/           # Configuration files
├── migrations/       # Database migrations
├── public/           # Web root (index.php)
├── src/              # Application code
├── var/              # Cache, logs, uploads
└── vendor/           # Dependencies
```


**API Endpoints:**
1. **POST /api/upload/initiate**
   - Input: filename, filesize, mimeType, md5Hash
   - Output: uploadId, chunkSize, totalChunks
   - Features: Validates file, checks duplicates, creates session

2. **POST /api/upload/chunk**
   - Input: uploadId, chunkIndex, chunk (file)
   - Output: success, uploadedChunks, totalChunks
   - Features: Saves chunk, tracks in Redis, updates progress

3. **POST /api/upload/finalize**
   - Input: uploadId
   - Output: success, filePath, filename
   - Features: Reassembles file, validates magic number, verifies MD5

4. **GET /api/upload/status/{uploadId}**
   - Output: status, progress, metadata
   - Features: Real-time upload status tracking

**Database Schema:**
- Table: `uploads`
- Fields: id, uploadId, filename, md5Hash, filesize, mimeType, totalChunks, uploadedChunks, status, filePath, errorMessage, createdAt, completedAt, ipAddress, userAgent
- Indexes: uploadId (unique), status

```
frontend/src/
├── config/
│   └── constants.ts                # Configuration constants
├── types/
│   └── upload.ts                   # TypeScript interfaces
├── utils/
│   └── fileUtils.ts                # File utilities and validation
├── services/
│   ├── apiService.ts               # HTTP client for backend API
│   ├── uploadManager.ts            # Upload orchestration
│   └── storageService.ts           # Local storage operations
├── store/
│   └── uploadStore.ts              # Zustand state management
├── components/
│   ├── FilePicker.tsx              # File selection + drag & drop
│   ├── UploadItem.tsx              # Individual upload progress
│   ├── UploadList.tsx              # List of active uploads
│   └── UploadHistory.tsx           # Upload history table
├── App.tsx                         # Main application component
└── index.css                       # Tailwind CSS imports

frontend/
├── .env                            # Environment variables
├── tailwind.config.js              # Tailwind configuration
└── postcss.config.js               # PostCSS configuration
```


**Layout Breakdown:**

see [ideawise.png](./ideawise.png)

```
┌─────────────────────────────────────────────┐
│          File Uploader (Centered)           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │    Click to Upload or drag file      │ │
│  │         here to upload                │ │
│  │                                       │ │
│  │   Images & Videos supported.         │ │
│  │   (50MB max. Up to 10 files)         │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌──────────────┐  ┌────────────────────┐ │
│  │   History    │  │   Display area     │ │
│  │              │  │   when a file on   │ │
│  │ • File 1     │  │   the left is      │ │
│  │ • File 2     │  │   clicked          │ │
│  │ • File 3     │  │                    │ │
│  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────┘
```
