import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { FileUtilsService } from './file-utils.service';
import { AlertService } from './alert.service';
import { PrintUtilsService } from './print-utils.service';

@Injectable({
  providedIn: 'root',
})
export class QrUtilsService {
  myAngularxQrCode: string = '';
  qrCodeDownloadLink: string = '';
  isQrCodeGenerated = false;

  constructor(
    private readonly sanitizer: DomSanitizer,
    private readonly fileUtilsService: FileUtilsService,
    private readonly alertService: AlertService,
    private readonly printUtilsService: PrintUtilsService
  ) {}

  generateQRCode(data: string | null | undefined) {
    try {
      this.myAngularxQrCode = data ?? '';
      this.isQrCodeGenerated = true;
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.myAngularxQrCode = '';
      this.isQrCodeGenerated = false;
    }
  }

  async printQRCode() {
    const fileName = this.fileUtilsService.fileNamePdf;

    const printContent = document.getElementById('qrcode');
    if (printContent) {
      const canvas = printContent.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');

        const pdfBlob = await this.printUtilsService.printQRCode(dataUrl);

        const base64Data = await this.fileUtilsService.blobToBase64(pdfBlob);

        try {
          // store PDF on device
          await this.fileUtilsService.saveFile(fileName, base64Data);

          // Optional: open PDF  - example for android
          // await Plugins.FileOpener.open({ filePath: result.uri, contentType: 'application/pdf' });
        } catch (error) {
          console.error('Error saving PDF:', error);
          this.alertService.showStoragePermissionError();
        }
      } else {
        console.error('Canvas not found');
        throw new Error('Canvas not found');
      }
    } else {
      console.error('Print content not found');
      throw new Error('Print content not found');
    }
  }

  setDownloadLink(url: SafeUrl) {
    this.qrCodeDownloadLink =
      this.sanitizer.sanitize(SecurityContext.URL, url) ?? '';
  }

  clearQrFields(): void {
    this.isQrCodeGenerated = false;
    this.qrCodeDownloadLink = '';
    this.myAngularxQrCode = '';

    // remove class
    const element = document.querySelector('.no-generation-buttons');
    if (element?.classList.contains('extra-margin-bottom')) {
      element.classList.remove('extra-margin-bottom');
    }
  }
}
