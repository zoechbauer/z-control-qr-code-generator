import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root'
})
export class FileUtilsService {

  constructor() { }

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

  get folderName() {
    return Capacitor.isNativePlatform() ? 'Dokumentenordner' : 'Downloadordner';
  }

  get fileNamePng(): string {
    return this.getFileName(false);
  }

  get fileNamePdf(): string {
    return this.getFileName(true);
  }

  private getFileName(isPdf: boolean | undefined): string {
    const name = 'qrcode';
    return isPdf ? `${name}.pdf` : `${name}.png`;
  }

  async saveFile(fileName: string, data: string) {
    if (Capacitor.isNativePlatform()) {
      // use Capacitor Filesystem API for mobiles
      await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Documents,
      });
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

    //alert(`${fileName} wurde im ${this.folderName} gespeichert.`);
  }

  async downloadQRCode(qrCodeDownloadLink: string) {
    const fileName = 'qrcode.png';

    if (qrCodeDownloadLink) {
      try {
        const response = await fetch(qrCodeDownloadLink);
        const blob = await response.blob();
        const base64Data = await this.blobToBase64(blob);

        await this.saveFile(fileName, base64Data);
      } catch (error) {
        console.error('Error saving file:', error);
        alert('Fehler beim Speichern des QR-Codes.');
      }
    } else {
      console.error('QR Code URL is not available');
      alert('Fehler: QR-Code URL nicht verfügbar.');
    }
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
