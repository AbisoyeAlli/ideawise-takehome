import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { FilePicker } from '@/components/FilePicker';
import { UploadItem } from '@/components/UploadItem';
import { UploadStats } from '@/components/UploadStats';
import { useUploadStore } from '@/store/uploadStore';
import type { UploadFile } from '@/types/upload';

export const UploadScreen: React.FC = () => {
  const uploads = useUploadStore((state) => state.uploads);
  const addFile = useUploadStore((state) => state.addFile);
  const removeFile = useUploadStore((state) => state.removeFile);
  const startUpload = useUploadStore((state) => state.startUpload);
  const pauseUpload = useUploadStore((state) => state.pauseUpload);
  const pauseAllUploads = useUploadStore((state) => state.pauseAllUploads);
  const clearCompleted = useUploadStore((state) => state.clearCompleted);
  const getUploadStats = useUploadStore((state) => state.getUploadStats);
  const loadHistory = useUploadStore((state) => state.loadHistory);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFilesSelected = (files: UploadFile[]) => {
    files.forEach((file) => {
      addFile(file);
      startUpload(file.fileId);
    });
  };

  const handleStartAll = () => {
    const uploadsArray = Array.from(uploads.values());
    uploadsArray.forEach((file) => {
      if (file.status === 'idle' || file.status === 'paused' || file.status === 'failed') {
        startUpload(file.fileId);
      }
    });
  };

  const handlePauseAll = () => {
    Alert.alert(
      'Pause All Uploads',
      'Are you sure you want to pause all uploads?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause All',
          style: 'destructive',
          onPress: () => pauseAllUploads(),
        },
      ]
    );
  };

  const handleClearCompleted = () => {
    Alert.alert(
      'Clear Completed',
      'Remove all completed uploads from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearCompleted(),
        },
      ]
    );
  };

  const stats = getUploadStats();
  const uploadsArray = Array.from(uploads.values());
  const hasActiveUploads = uploadsArray.some(
    (f) =>
      f.status === 'uploading' ||
      f.status === 'hashing' ||
      f.status === 'initiating' ||
      f.status === 'finalizing'
  );
  const hasIdleUploads = uploadsArray.some(
    (f) => f.status === 'idle' || f.status === 'paused' || f.status === 'failed'
  );
  const hasCompletedUploads = uploadsArray.some(
    (f) => f.status === 'completed' || f.status === 'duplicate'
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Upload</Text>
      </View>

      <ScrollView style={styles.content}>
        <FilePicker onFilesSelected={handleFilesSelected} disabled={hasActiveUploads} />

        {stats.totalFiles > 0 && (
          <>
            <View style={styles.section}>
              <UploadStats stats={stats} />
            </View>

            <View style={styles.actions}>
              {hasIdleUploads && (
                <TouchableOpacity style={styles.actionButton} onPress={handleStartAll}>
                  <Text style={styles.actionButtonText}>Start All</Text>
                </TouchableOpacity>
              )}
              {hasActiveUploads && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={handlePauseAll}
                >
                  <Text style={styles.actionButtonText}>Pause All</Text>
                </TouchableOpacity>
              )}
              {hasCompletedUploads && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={handleClearCompleted}
                >
                  <Text style={styles.actionButtonText}>Clear Completed</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Uploads ({uploadsArray.length})</Text>
              {uploadsArray.map((file) => (
                <UploadItem
                  key={file.fileId}
                  file={file}
                  onStart={() => startUpload(file.fileId)}
                  onPause={() => pauseUpload(file.fileId)}
                  onRemove={() => removeFile(file.fileId)}
                />
              ))}
            </View>
          </>
        )}

        {stats.totalFiles === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No uploads yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Select files or take a photo to start uploading
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#F59E0B',
  },
  actionButtonDanger: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
