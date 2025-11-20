# Media Upload Mobile App

A React Native mobile application for uploading photos and videos with support for chunked uploads, progress tracking, and offline resilience.

## Tech Stack

- **Framework**: React Native 0.73.0
- **Language**: TypeScript
- **State Management**: Zustand
- **Storage**: AsyncStorage
- **HTTP Client**: Axios
- **File Operations**: React Native FS
- **Permissions**: React Native Permissions

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- React Native development environment:
  - For iOS: macOS with Xcode 14+
  - For Android: Android Studio with SDK 33+
- CocoaPods (for iOS): `sudo gem install cocoapods`

## Installation

1. **Clone the repository**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Configure API endpoint**

   The app automatically configures the API endpoint based on platform:
   - **iOS Simulator**: Uses `http://localhost:8000/api/upload`
   - **Android Emulator**: Uses `http://10.0.2.2:8000/api/upload`
   - **Physical Devices**: Edit [src/config/constants.ts](src/config/constants.ts:8) and replace with your computer's local IP address (e.g., `http://192.168.1.100:8000/api/upload`)

## Running the App

### Development Mode

**Start Metro Bundler**
```bash
npm start
```

**Run on iOS** (in a new terminal)
```bash
npm run ios
```

**Run on Android** (in a new terminal)
```bash
npm run android
```

### Troubleshooting

**iOS Issues**
- Clean build: `cd ios && xcodebuild clean && cd ..`
- Reset pods: `cd ios && rm -rf Pods Podfile.lock && pod install && cd ..`

**Android Issues**
- Clean build: `cd android && ./gradlew clean && cd ..`
- Clear cache: `npm start -- --reset-cache`

**Metro Bundler Issues**
```bash
# Clear watchman
watchman watch-del-all

# Clear Metro cache
npm start -- --reset-cache
```

## Project Structure

```
mobile/
├── src/
│   ├── components/        # React components
│   │   ├── ErrorBoundary.tsx    # Error boundary wrapper
│   │   ├── FilePicker.tsx       # File selection component
│   │   ├── UploadItem.tsx       # Individual upload item
│   │   └── UploadStats.tsx      # Upload statistics
│   ├── config/
│   │   └── constants.ts         # App configuration
│   ├── screens/
│   │   └── UploadScreen.tsx     # Main upload screen
│   ├── services/
│   │   ├── apiService.ts        # API client
│   │   ├── permissionManager.ts # Permission handling
│   │   └── uploadManager.ts     # Upload orchestration
│   ├── store/
│   │   └── uploadStore.ts       # Zustand state management
│   ├── types/
│   │   └── upload.ts            # TypeScript interfaces
│   └── utils/
│       └── fileHash.ts          # File hashing utilities
├── android/                     # Android native code
├── ios/                         # iOS native code
├── App.tsx                      # Root component
├── index.js                     # Entry point
└── package.json                 # Dependencies
```

## Configuration

### Upload Settings

Edit [src/config/constants.ts](src/config/constants.ts) to customize upload behavior:

```typescript
export const UPLOAD_CONFIG = {
  CHUNK_SIZE: 512 * 1024,         // 512KB chunks (optimized for mobile)
  MAX_CONCURRENT_UPLOADS: 2,       // 2 concurrent uploads (mobile-friendly)
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 30000,
  MAX_FILE_SIZE: 5 * 1024 * 1024   // 5MB max file size
};
```

### Allowed File Types

Supported MIME types (configurable in [src/config/constants.ts](src/config/constants.ts:37)):

- **Images**: JPEG, JPG, PNG, GIF, WebP, HEIC, HEIF
- **Videos**: MP4, QuickTime, AVI, MKV, WebM, 3GP, 3G2


## Permissions

### iOS (Info.plist)

- `NSCameraUsageDescription`: Camera access for photo capture
- `NSPhotoLibraryUsageDescription`: Photo library access for image selection
- `NSPhotoLibraryAddUsageDescription`: Save photos to library

### Android (AndroidManifest.xml)

- `CAMERA`: Camera access
- `READ_EXTERNAL_STORAGE`: File access (Android ≤12)
- `WRITE_EXTERNAL_STORAGE`: File writing (Android ≤12)
- `READ_MEDIA_IMAGES`: Image access (Android 13+)
- `READ_MEDIA_VIDEO`: Video access (Android 13+)


## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run linter
npm run lint
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
cd ios && pod install && cd ..
npm start -- --reset-cache
```

### Upload fails immediately
- Check backend server is running
- Verify API endpoint in [src/config/constants.ts](src/config/constants.ts)
- For physical devices, use your computer's IP address
- Check network permissions are granted

### Files not showing in picker
- Check app permissions in device settings
- For Android 13+, ensure `READ_MEDIA_*` permissions are granted

### App crashes on file selection
- Check error boundary logs in development mode
- Verify file size is under 5MB limit
- Ensure file type is in allowed MIME types list

## Features & Improvements

### Background Upload Support
- Uploads continue even when app is backgrounded or minimized
- Automatic upload resume after app restart
- Pending upload queue with 24-hour retention
- Background fetch integration for iOS and Android
- Persistent upload state across app sessions

### Network State Monitoring
- Automatic network detection and reconnection handling
- Uploads automatically pause when network is lost
- Waits for connectivity before retrying failed chunks
- Prevents upload start when offline

### Optimized for Mobile Devices
- **5MB maximum file size** for better mobile performance
- **512KB chunk size** for mobile bandwidth efficiency
- **2 concurrent uploads** to conserve mobile data
- **Upload history limited to 50 items** with data compression
- Automatic cleanup of old upload history

### Known Limitations
- **File Size**: 5MB maximum (optimized for mobile networks)
- **Upload History**: Limited to 50 most recent uploads
- **Background Upload**: Pending uploads older than 24 hours are automatically cleaned up

## Tech Stack

- **Background Uploads**: react-native-background-fetch, react-native-background-timer
- **Network Monitoring**: @react-native-community/netinfo
- **Framework**: React Native 0.73.0
- **Language**: TypeScript with strict mode
- **State Management**: Zustand
- **Storage**: AsyncStorage (with compression)
- **HTTP Client**: Axios
- **File Operations**: React Native FS
- **Permissions**: React Native Permissions
