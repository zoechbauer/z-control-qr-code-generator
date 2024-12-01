import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export async function saveFile(fileName: string, data: string) {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: fileName,
      data: data,
      directory: Directory.Documents,
    });
  } else {
    const blob = base64ToBlob(data);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

export function base64ToBlob(base64: string): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'application/octet-stream' });
}

export async function getDocumentsPath(fileName: string): Promise<string> {
  const result = await Filesystem.getUri({
    path: fileName,
    directory: Directory.Documents,
  });

  let path = result.uri;
  if (path.startsWith('file://')) {
    path = path.slice(7);
  }
  return path;
}