import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';

import { FileUtilsService } from './file-utils.service';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root',
})
export class QrUtilsService {
  // info see qrcode tag in home.page.html

  myAngularxQrCode: string = '';
  qrCodeDownloadLink: string = '';
  isQrCodeGenerated = false;

  constructor(
    private readonly sanitizer: DomSanitizer,
    private readonly fileUtilsService: FileUtilsService,
    private readonly alertService: AlertService
  ) {}

  generateQRCode(data: string | null | undefined) {
    this.myAngularxQrCode = data ? data.trim() : ' ';
    this.isQrCodeGenerated = true;
  }

  async printQRCode() {
    const fileName = this.fileUtilsService.fileNamePdf;

    const printContent = document.getElementById('qrcode');
    if (printContent) {
      const canvas = printContent.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');

        // create pdf
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // add QR-Code
        pdf.addImage(dataUrl, 'PNG', 10, 10, 190, 190);

        // store PDF as blob
        const pdfBlob = pdf.output('blob');
        const base64Data = await this.fileUtilsService.blobToBase64(pdfBlob);

        try {
          // store PDF on device
          await this.fileUtilsService.saveFile(fileName, base64Data);

          // Optional: open PDF  - example for android
          // await Plugins.FileOpener.open({ filePath: result.uri, contentType: 'application/pdf' });
        } catch (error) {
          console.error('Error saving PDF:', error);
          this.alertService.showErrorAlert('ERROR_MESSAGE_SAVE_QR_PDF');
        }
      } else {
        console.error('Canvas not found');
      }
    } else {
      console.error('Print content not found');
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
  }
}
