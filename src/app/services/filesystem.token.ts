import { InjectionToken } from '@angular/core';
import { Filesystem as CapacitorFilesystem } from '@capacitor/filesystem';

export interface FilesystemLike {
  writeFile(options: any): Promise<any>;
  getUri(options: any): Promise<any>;
  readdir(options: any): Promise<any>;
  deleteFile(options: any): Promise<any>;
  checkPermissions(): Promise<any>;
  requestPermissions(): Promise<any>;
}

export const FILESYSTEM = new InjectionToken<FilesystemLike>('Filesystem', {
  providedIn: 'root',
  factory: () => CapacitorFilesystem,
});
