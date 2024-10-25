import { Component } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  myAngularxQrCode: string = '';
  qrCodeDownloadLink: SafeUrl = '';

  constructor() {
    this.myAngularxQrCode = 'Your initial QR code data';
  }

  // TODO change type any
  generateQRCode(data: any) {
    this.myAngularxQrCode = data;
  }

  onChangeURL(url: SafeUrl) {
    this.qrCodeDownloadLink = url;
  }

  printQRCode() {
    const printContent = document.getElementById('qrcode');
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (windowPrint && printContent) {
      windowPrint.document.write(printContent.innerHTML);
      windowPrint.document.close();
      windowPrint.focus();
      windowPrint.print();
      windowPrint.close();
    }
  }
}