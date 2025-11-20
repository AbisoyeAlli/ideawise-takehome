import RNFS from 'react-native-fs';
import { Md5 } from 'ts-md5';

export async function calculateMd5Hash(filePath: string): Promise<string> {
  try {
    const fileData = await RNFS.readFile(filePath, 'base64');
    const hash = Md5.hashStr(fileData);
    return hash;
  } catch (error) {
    console.error('Error calculating MD5 hash:', error);
    throw new Error('Failed to calculate file hash');
  }
}

export async function readFileChunk(
  filePath: string,
  start: number,
  end: number
): Promise<string> {
  try {
    const chunk = await RNFS.read(filePath, end - start, start, 'base64');
    return chunk;
  } catch (error) {
    console.error('Error reading file chunk:', error);
    throw new Error('Failed to read file chunk');
  }
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64);
  const byteNumbers = new Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    byteNumbers[i] = byteString.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  // @ts-ignore - React Native polyfill accepts Uint8Array
  return new Blob([byteArray], { type: mimeType });
}
