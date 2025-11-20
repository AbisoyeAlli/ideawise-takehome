import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { UploadStats as UploadStatsType } from '@/types/upload';

interface UploadStatsProps {
  stats: UploadStatsType;
}

export const UploadStats: React.FC<UploadStatsProps> = ({ stats }) => {
  if (stats.totalFiles === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Overall Progress</Text>
        <Text style={styles.percentage}>{stats.overallProgress}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${stats.overallProgress}%` }]}
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.completedFiles}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.uploadingFiles}</Text>
          <Text style={styles.statLabel}>Uploading</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.failedFiles}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.totalFiles}</Text>
          <Text style={styles.statLabel}>Total</Text>
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
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  percentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  progressBar: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});
