# Media Upload System - Frontend

React + TypeScript web application for uploading media files with chunked upload support, drag & drop, and real-time progress tracking.

## Features

- Multiple file selection (1-10 files)
- Drag and drop upload support
- File type filtering (images and videos only)
- Instant client-side validation
- Image preview thumbnails (on click)
- File metadata display (name, size, type)


## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Axios** - HTTP client
- **SparkMD5** - MD5 hash calculation
- **Heroicons** - Icon library

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see backend/README.md)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Development

```bash
npm run dev
```

Visit `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/         # React components
├── config/             # Configuration
├── services/           # API and upload logic
├── store/              # State management
├── types/              # TypeScript types
└── utils/              # Utility functions
```
