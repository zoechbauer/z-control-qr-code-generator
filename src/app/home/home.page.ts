import { Component, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  myAngularxQrCode: string = '';
  qrCodeDownloadLink: string = '';

  constructor(private sanitizer: DomSanitizer) {}

  generateQRCode(data: string | null | undefined) {
    this.myAngularxQrCode = data || ' ';
    console.log('QR Code data:', this.myAngularxQrCode);
  }

  onChangeURL(url: SafeUrl) {
    this.qrCodeDownloadLink =
      this.sanitizer.sanitize(SecurityContext.URL, url) || '';
    console.log('QR Code URL:', this.qrCodeDownloadLink);
  }

  downloadQRCode() {
    if (this.qrCodeDownloadLink) {
      const link = document.createElement('a');
      link.href = this.qrCodeDownloadLink;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('QR Code URL is not available');
    }
  }

  printQRCode() {
    const printContent = document.getElementById('qrcode');
    if (printContent) {
      const canvas = printContent.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const windowContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              img {
                max-width: 80%;
                max-height: 80%;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="QR Code">
          </body>
          </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(windowContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 250);
        }
      }
    }
  }
}
