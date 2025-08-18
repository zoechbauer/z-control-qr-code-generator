import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

import { AlertService } from './alert.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FileUtilsService {
  private nowFormatted: string = '';

  constructor(private readonly alertService: AlertService) {}

  get fileNamePng(): string {
    return this.getFileName(false);
  }

  get fileNamePdf(): string {
    return this.getFileName(true);
  }

  async getDocumentsPath(isPdf: boolean): Promise<string> {
    const result = await Filesystem.getUri({
      path: isPdf ? this.fileNamePdf : this.fileNamePng,
      directory: Directory.Documents,
    });

    // Remove the "file://" prefix
    let path = result.uri;
    if (path.startsWith('file://')) {
      path = path.slice(7);
    }
    return path;
  }

  private generateTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  setNowFormatted() {
    this.nowFormatted = this.generateTimestamp();
  }

  clearNowFormatted() {
    this.nowFormatted = '';
  }

  private getFileName(isPdf: boolean | undefined): string {
    const name = 'qrcode';
    return isPdf
      ? `${name}_${this.nowFormatted}.pdf`
      : `${name}_${this.nowFormatted}.png`;
  }

  async saveFile(fileName: string, data: string) {
    if (Capacitor.isNativePlatform()) {
      // use Capacitor Filesystem API for mobiles
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: data,
          directory: Directory.Documents,
        });
      } catch (error) {
        console.error('Error saving file:', error);
        this.alertService.showStoragePermissionError();
      }
    } else {
      // for Desktop: create a download link
      const blob = this.base64ToBlob(data);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  }

  async deleteAllQrCodeFiles() {
    if (Capacitor.isNativePlatform()) {
      try {
        // check permissions
        if (!(await this.checkFilesystemPermission())) {
          console.log('Storage permission not granted, skipping file deletion');
          return;
        }

        // delete files
        const files = await Filesystem.readdir({
          directory: Directory.Documents,
          path: '',
        });

        const qrFiles = files.files.filter((f) => f.name.startsWith('qrcode'));

        for (const file of qrFiles) {
          await Filesystem.deleteFile({
            path: file.name,
            directory: Directory.Documents,
          });
        }
      } catch (error) {
        console.error('Error deleting QR code files:', error);
      }
    }
  }

  deleteFilesAfterSpecifiedTime() {
    const fileNamePng = this.fileNamePng;
    const fileNamePdf = this.fileNamePdf;

    const storageDurationInHours = environment.storageDurationInHours ?? 3;
    const storageDurationInMilliseconds =
      storageDurationInHours * 60 * 60 * 1000;

    setTimeout(() => {
      this.deleteFiles(fileNamePng, fileNamePdf);
    }, storageDurationInMilliseconds);
  }

  private async deleteFiles(fileNamePng: string, fileNamePdf: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.deleteFile({
          path: fileNamePng,
          directory: Directory.Documents,
        });
        await Filesystem.deleteFile({
          path: fileNamePdf,
          directory: Directory.Documents,
        });
      } catch (error) {
        console.error('Error deleting file:', error);
        // as soon as we get permission qr codes are automatically deleted
        // this.alertService.showErrorAlert('ERROR_MESSAGE_DELETE_QR');
      }
    } else {
      // Browsers are not allowed to delete files
      // i informed the user with alert on attaching files to email
    }
  }

  async downloadQRCode(qrCodeDownloadLink: string): Promise<boolean> {
    if (!qrCodeDownloadLink?.trim()) {
      console.error('QR Code URL is not available');
      this.alertService.showErrorAlert('ERROR_MESSAGE_MISSING_QR_URL');
      return false;
    }

    if (!(await this.checkAndRequestFilesystemPermission())) {
      return false;
    }

    const fileName = this.fileNamePng;

    try {
      const response = await fetch(qrCodeDownloadLink);
      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);

      await this.saveFile(fileName, base64Data);
      return true;
    } catch (error) {
      console.error('Error saving file in downloadQRCode:', error);
      this.alertService.showStoragePermissionError();
      return false;
    }
  }

  private async checkFilesystemPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const permissions = await Filesystem.checkPermissions();

      if (permissions.publicStorage === 'granted') {
        return true;
      } else {
        return false;
      }
    } catch (permissionError) {
      console.warn(
        'Permission check failed, continuing anyway:',
        permissionError
      );
    }
    return true;
  }

  private async checkAndRequestFilesystemPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const permissions = await Filesystem.checkPermissions();

      if (permissions.publicStorage === 'granted') {
        return true;
      } else {
        // request missing permission
        const requestResult = await Filesystem.requestPermissions();

        if (requestResult.publicStorage !== 'granted') {
          console.error('Storage permission denied by user');
          this.alertService.showStoragePermissionError();
          return false;
        } else {
          return true;
        }
      }
    } catch (permissionError) {
      console.warn(
        'Permission check failed, continuing anyway:',
        permissionError
      );
      // Continue - older Android versions might not support this
    }
    return true;
  }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/octet-stream' });
  }
}
