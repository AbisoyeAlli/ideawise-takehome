import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { UploadFile } from '@/types/upload';

interface UploadItemProps {
  file: UploadFile;
  onStart: () => void;
  onPause: () => void;
  onRemove: () => void;
}

export const UploadItem: React.FC<UploadItemProps> = ({ file, onStart, onPause, onRemove }) => {
  const getStatusText = () => {
    switch (file.status) {
      case 'idle':
        return 'Ready to upload';
      case 'hashing':
        return 'Calculating hash...';
      case 'initiating':
        return 'Initiating upload...';
      case 'uploading':
        return `Uploading (${file.uploadedChunks}/${file.totalChunks} chunks)`;
      case 'paused':
        return 'Paused';
      case 'finalizing':
        return 'Finalizing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return `Failed: ${file.error}`;
      case 'duplicate':
        return 'Duplicate detected';
      default:
        return file.status;
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'completed':
      case 'duplicate':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'uploading':
      case 'hashing':
      case 'initiating':
      case 'finalizing':
        return '#3B82F6';
      case 'paused':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const canStart =
    file.status === 'idle' || file.status === 'paused' || file.status === 'failed';
  const canPause =
    file.status === 'uploading' ||
    file.status === 'hashing' ||
    file.status === 'initiating' ||
    file.status === 'finalizing';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.fileInfo}>
          <Text style={styles.filename} numberOfLines={1}>
            {file.filename}
          </Text>
          <Text style={styles.filesize}>{formatFileSize(file.filesize)}</Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${file.progress}%`, backgroundColor: getStatusColor() },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{file.progress}%</Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.status, { color: getStatusColor() }]}>{getStatusText()}</Text>
        <View style={styles.actions}>
          {canStart && (
            <TouchableOpacity onPress={onStart} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Start</Text>
            </TouchableOpacity>
          )}
          {canPause && (
            <TouchableOpacity onPress={onPause} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Pause</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  filesize: {
    fontSize: 14,
    color: '#6B7280',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    minWidth: 45,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#000',
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
