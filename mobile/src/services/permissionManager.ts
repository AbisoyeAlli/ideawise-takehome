import { Platform } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';
import type { PermissionStatus } from '@/types/upload';

class PermissionManager {
  async checkCameraPermission(): Promise<boolean> {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
    }) as Permission;

    const result = await check(permission);
    return result === RESULTS.GRANTED;
  }

  async requestCameraPermission(): Promise<boolean> {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
    }) as Permission;

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }

  async checkGalleryPermission(): Promise<boolean> {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
      android: PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
    }) as Permission;

    const result = await check(permission);
    return result === RESULTS.GRANTED;
  }

  async requestGalleryPermission(): Promise<boolean> {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
      android: PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
    }) as Permission;

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }

  async checkStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true;
    }

    const permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
    const result = await check(permission);
    return result === RESULTS.GRANTED;
  }

  async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true;
    }

    const permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }

  async checkAllPermissions(): Promise<PermissionStatus> {
    const [camera, gallery, storage] = await Promise.all([
      this.checkCameraPermission(),
      this.checkGalleryPermission(),
      this.checkStoragePermission(),
    ]);

    return { camera, gallery, storage };
  }

  async requestAllPermissions(): Promise<PermissionStatus> {
    const [camera, gallery, storage] = await Promise.all([
      this.requestCameraPermission(),
      this.requestGalleryPermission(),
      this.requestStoragePermission(),
    ]);

    return { camera, gallery, storage };
  }
}

export const permissionManager = new PermissionManager();
