import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import uuid from 'react-native-uuid';
import { permissionManager } from '@/services/permissionManager';
import { ALLOWED_MIME_TYPES, UPLOAD_CONFIG } from '@/config/constants';
import type { UploadFile } from '@/types/upload';

interface FilePickerProps {
  onFilesSelected: (files: UploadFile[]) => void;
  disabled?: boolean;
}

export const FilePicker: React.FC<FilePickerProps> = ({ onFilesSelected, disabled }) => {
  const [isLoading, setIsLoading] = useState(false);

  const validateFile = (file: { size: number; type: string }): string | null => {
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      const maxSizeMB = Math.round(UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024));
      return `File size exceeds maximum allowed size (${maxSizeMB}MB)`;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return 'Only images and videos are allowed';
    }

    return null;
  };

  const handleCamera = async () => {
    try {
      setIsLoading(true);
      const hasPermission = await permissionManager.checkCameraPermission();

      if (!hasPermission) {
        const granted = await permissionManager.requestCameraPermission();
        if (!granted) {
          Alert.alert('Permission Denied', 'Camera permission is required');
          return;
        }
      }

      const result = await launchCamera({
        mediaType: 'mixed',
        quality: 1,
        saveToPhotos: true,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const error = validateFile({
        size: asset.fileSize || 0,
        type: asset.type || 'image/jpeg',
      });

      if (error) {
        Alert.alert('Invalid File', error);
        return;
      }

      const totalChunks = Math.ceil((asset.fileSize || 0) / UPLOAD_CONFIG.CHUNK_SIZE);

      const file: UploadFile = {
        fileId: uuid.v4() as string,
        filename: asset.fileName || `photo_${Date.now()}.jpg`,
        filesize: asset.fileSize || 0,
        mimeType: asset.type || 'image/jpeg',
        status: 'idle',
        progress: 0,
        uploadedChunks: 0,
        totalChunks,
        createdAt: new Date(),
        uri: asset.uri || '',
      };

      onFilesSelected([file]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture photo';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGallery = async () => {
    try {
      setIsLoading(true);
      const hasPermission = await permissionManager.checkGalleryPermission();

      if (!hasPermission) {
        const granted = await permissionManager.requestGalleryPermission();
        if (!granted) {
          Alert.alert('Permission Denied', 'Gallery permission is required');
          return;
        }
      }

      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 1,
        selectionLimit: 0,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const uploadFiles: UploadFile[] = [];

      for (const asset of result.assets) {
        const error = validateFile({
          size: asset.fileSize || 0,
          type: asset.type || 'image/jpeg',
        });

        if (error) {
          Alert.alert('Invalid File', `${asset.fileName}: ${error}`);
          continue;
        }

        const totalChunks = Math.ceil((asset.fileSize || 0) / UPLOAD_CONFIG.CHUNK_SIZE);

        const file: UploadFile = {
          fileId: uuid.v4() as string,
          filename: asset.fileName || `photo_${Date.now()}.jpg`,
          filesize: asset.fileSize || 0,
          mimeType: asset.type || 'image/jpeg',
          status: 'idle',
          progress: 0,
          uploadedChunks: 0,
          totalChunks,
          createdAt: new Date(),
          uri: asset.uri || '',
        };

        uploadFiles.push(file);
      }

      if (uploadFiles.length > 0) {
        onFilesSelected(uploadFiles);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select from gallery';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handleGallery}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Select Photos & Videos</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary, disabled && styles.buttonDisabled]}
        onPress={handleCamera}
        disabled={disabled || isLoading}
      >
        <Text style={styles.buttonText}>Take Photo/Video</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonSecondary: {
    backgroundColor: '#4B5563',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
