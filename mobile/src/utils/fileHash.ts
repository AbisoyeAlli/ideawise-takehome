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
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeType });
}
