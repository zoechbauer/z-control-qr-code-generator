import { Inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory } from '@capacitor/filesystem';

import { AlertService } from './alert.service';
import { environment } from '@env/environment';
import { FILESYSTEM, FilesystemLike } from './filesystem.token';

@Injectable({
  providedIn: 'root',
})
export class FileUtilsService {
  private nowFormatted: string = '';

  constructor(
    private readonly alertService: AlertService,
    @Inject(FILESYSTEM) private readonly filesystem: FilesystemLike
  ) {}

  /**
   * Returns the current formatted timestamp used in file names.
   */
  get fileNamePng(): string {
    return this.getFileName(false);
  }

  /**
   * Returns the current formatted timestamp used in file names for PDF files.
   */
  get fileNamePdf(): string {
    return this.getFileName(true);
  }

  /**
   * Returns the path to the documents directory for the specified file type.
   * @param isPdf Whether the file is a PDF.
   */
  async getDocumentsPath(isPdf: boolean): Promise<string> {
    const result = await this.filesystem.getUri({
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

  /**
   * Generates a timestamp string in the format YYYYMMDD_HHMMSS.
   */
  private generateTimestamp(): string {
    const now = new Date(Date.now());
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  /**
   * Sets the current formatted timestamp.
   */
  setNowFormatted() {
    this.nowFormatted = this.generateTimestamp();
  }

  /**
   * Clears the current formatted timestamp.
   */
  clearNowFormatted() {
    this.nowFormatted = '';
  }

  /**
   * Returns the file name for the current timestamp and specified file type.
   * @param isPdf Whether the file is a PDF.
   */
  private getFileName(isPdf: boolean | undefined): string {
    const name = 'qrcode';
    return isPdf
      ? `${name}_${this.nowFormatted}.pdf`
      : `${name}_${this.nowFormatted}.png`;
  }

  /**
   * Saves a file with the specified name and data.
   * @param fileName The name of the file to save.
   * @param data The file data in base64 format.
   */
  async saveFile(fileName: string, data: string) {
    if (Capacitor.isNativePlatform()) {
      // use Capacitor Filesystem API for mobiles
      try {
        await this.filesystem.writeFile({
          path: fileName,
          data: data,
          directory: Directory.Documents,
        });
      } catch (error) {
        console.error('Error saving file:', error);
        await this.alertService.showStoragePermissionError();
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

  /**
   * Deletes all QR code files that are older than the specified storage duration.
   */
  async deleteAllQrCodeFilesAfterSpecifiedTime() {
    if (Capacitor.isNativePlatform()) {
      try {
        // check permissions
        if (!(await this.checkFilesystemPermission())) {
          console.log('Storage permission not granted, skipping file deletion');
          return;
        }

        const storageDurationInHours = environment.app.storageDurationInHours ?? 3;
        const storageDurationInMilliseconds =
          storageDurationInHours * 60 * 60 * 1000;
        const now = Date.now();

        // delete files
        const files = await this.filesystem.readdir({
          directory: Directory.Documents,
          path: '',
        });

        const qrFiles = files.files.filter((f: { name: string }) =>
          f.name.startsWith('qrcode')
        );

        const promises = qrFiles.map(async (file: any) => {
          // Extract timestamp from filename: qrcode_YYYYMMDD_HHMMSS.ext
          const match = file.name.match(/^qrcode_(\d{8}_\d{6})\.(png|pdf)$/);

          if (match) {
            const timestampStr = match[1];
            // Parse timestamp
            const year = Number.parseInt(timestampStr.substring(0, 4), 10);
            const month = Number.parseInt(timestampStr.substring(4, 6), 10) - 1; // JS months are 0-based
            const day = Number.parseInt(timestampStr.substring(6, 8), 10);
            const hour = Number.parseInt(timestampStr.substring(9, 11), 10);
            const minute = Number.parseInt(timestampStr.substring(11, 13), 10);
            const second = Number.parseInt(timestampStr.substring(13, 15), 10);
            const fileDate = new Date(
              year,
              month,
              day,
              hour,
              minute,
              second
            ).getTime();

            if (now - fileDate > storageDurationInMilliseconds) {
              await this.filesystem.deleteFile({
                path: file.name,
                directory: Directory.Documents,
              });
            }
          }
        });

        await Promise.all(promises);

      } catch (error) {
        console.error('Error deleting QR code files:', error);
      }
    }
  }

  /**
   * Downloads a QR code from the specified link and saves it to the filesystem.
   * @param qrCodeDownloadLink The URL of the QR code to download.
   * @returns A promise that resolves to true if the download and save were successful, false otherwise.
   */
  async downloadQRCode(qrCodeDownloadLink: string): Promise<boolean> {
    if (!qrCodeDownloadLink?.trim()) {
      console.error('QR Code URL is not available');
      await this.alertService.showErrorAlert('ERROR_MESSAGE_MISSING_QR_URL');
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
      await this.alertService.showStoragePermissionError();
      return false;
    }
  }

  /**
   * Checks if the app has the necessary filesystem permission.
   * @returns A promise that resolves to true if the permission is granted, false otherwise.
   */
  private async checkFilesystemPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const permissions = await this.filesystem.checkPermissions();

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

  /**
   * Checks and requests the necessary filesystem permission if not already granted.
   * @returns A promise that resolves to true if the permission is granted, false otherwise.
   */
  private async checkAndRequestFilesystemPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const permissions = await this.filesystem.checkPermissions();

      if (permissions.publicStorage === 'granted') {
        return true;
      } else {
        // request missing permission
        const requestResult = await this.filesystem.requestPermissions();

        if (requestResult.publicStorage !== 'granted') {
          console.error('Storage permission denied by user');
          await this.alertService.showStoragePermissionError();
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

  /**
   * Converts a Blob to a Base64-encoded string.
   * @param blob The Blob to convert.
   * @returns A promise that resolves to the Base64-encoded string.
   */
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Converts a Base64-encoded string to a Blob.
   * @param base64 The Base64-encoded string.
   * @returns The resulting Blob.
   */
  private base64ToBlob(base64: string): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.codePointAt(i) ?? 0;
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/octet-stream' });
  }
}
