import { Component, SecurityContext, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { IonText, IonTextarea, ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Attachment, EmailComposer } from 'capacitor-email-composer';
import jsPDF from 'jspdf';
import { HelpModalComponent } from '../help-modal/help-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('qrDataInput') qrDataInput!: IonTextarea;
  @ViewChild('emailInput') emailInput!: IonText;
  MAX_INPUT_LENGTH = 1000; // 2953 = Maximale Kapazität für QR-Code Version 40 mit Fehlerkorrektur-Level L lt. Perplexity KI,
  // aber scannen funktioniert dann nicht mehr, deshalb 1000 - ermittelt durch Tests

  myAngularxQrCode: string = '';
  qrCodeDownloadLink: string = '';
  qrCodeIsGenerated = false;
  textLengthInfo: string = '';
  toggleAddress: boolean = false;

  savedEmails: string[] = [];

  constructor(
    private sanitizer: DomSanitizer,
    private modalController: ModalController,
    private storage: Storage
  ) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
  }

  toggleShowAddress() {
    this.toggleAddress = !this.toggleAddress;
  }

  async loadSavedEmails() {
    const emails = await this.storage.get('savedEmails');
    if (emails) {
      this.savedEmails = JSON.parse(emails);
    }
  }

  async openModal() {
    const modal = await this.modalController.create({
      component: HelpModalComponent,
      componentProps: {
        folderName: this.folderName,
        fileNamePng: this.getFileNamePng(),
        fileNamePdf: this.getFileNamePdf(),
      },
    });
    return await modal.present();
  }

  clearInputField(): void {
    this.qrCodeIsGenerated = false;
    this.qrCodeDownloadLink = '';
    this.myAngularxQrCode = '';
    this.textLengthInfo = '';

    if (this.qrDataInput) {
      this.qrDataInput.value = '';
    }
  }

  generateQRCode(data: string | null | undefined) {
    this.myAngularxQrCode = data && data.trim() ? data : ' ';
    this.qrCodeIsGenerated = true;

    this.setTextLengthInfo();
    console.log('QR Code data:', this.myAngularxQrCode);
  }

  private setTextLengthInfo() {
    this.textLengthInfo = ` [${this.myAngularxQrCode.length} / ${this.MAX_INPUT_LENGTH}]`;
  }

  onChangeURL(url: SafeUrl) {
    this.qrCodeDownloadLink =
      this.sanitizer.sanitize(SecurityContext.URL, url) || '';
    console.log('QR Code URL:', this.qrCodeDownloadLink);
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

  private base64ToBlob(base64: string): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/octet-stream' });
  }

  async storeAndMailQRCode() {
    await this.downloadQRCode();
    await this.printQRCode();
    await this.sendEmail();
  }

  async downloadQRCode() {
    const fileName = 'qrcode.png';

    if (this.qrCodeDownloadLink) {
      try {
        const response = await fetch(this.qrCodeDownloadLink);
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

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  get folderName() {
    return Capacitor.isNativePlatform() ? 'Dokumentenordner' : 'Downloadordner';
  }

  getFileNamePng(): string {
    return this.getFileName(false);
  }

  getFileNamePdf(): string {
    return this.getFileName(false);
  }

  getFileName(isPdf: boolean | undefined): string {
    const name = 'qrcode';
    return isPdf ? `${name}.pdf` : `${name}.png`;
  }

  async printQRCode() {
    const fileName = 'qrcode.pdf';

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
        const base64Data = await this.blobToBase64(pdfBlob);

        try {
          // store PDF on device
          await this.saveFile(fileName, base64Data);
          console.log('PDF saved:', fileName);

          // Optional: open PDF  - example for android
          // await Plugins.FileOpener.open({ filePath: result.uri, contentType: 'application/pdf' });
        } catch (error) {
          console.error('Error saving PDF:', error);
          alert('Fehler beim Speichern des QR-Code PDFs.');
        }
      } else {
        console.error('Canvas not found');
      }
    } else {
      console.error('Print content not found');
    }
  }

  async sendEmail() {
    await this.loadSavedEmails();

    const sendTo = this.savedEmails.join(",");
    const filePathPng = await this.getDocumentsPath(false);
    const filePathPdf = await this.getDocumentsPath(true);

    const attachmentPng: Attachment = {
      path: filePathPng,
      type: 'absolute',
    };

    const attachmentPdf: Attachment = {
      path: filePathPdf,
      type: 'absolute',
    };

    const available = await EmailComposer.hasAccount();
    if (available.hasAccount) {
      try {
        await EmailComposer.open({
          to: [sendTo],
          subject: 'QR Code mit Textlänge: ' + this.myAngularxQrCode.length,
          body: this.myAngularxQrCode,
          attachments: [attachmentPng, attachmentPdf],
        });

        for (const email of sendTo.split(',')) {
          await this.saveEmail(email.trim());
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('Email account is not available');
    }
  }

  async saveEmail(email: string) {
    if (email && !this.savedEmails.includes(email)) {
      this.savedEmails.push(email);
      await this.storage.set('savedEmails', JSON.stringify(this.savedEmails));
    }
  }

  async addEmail(newEmail: string | undefined | null | number) {
    if (typeof newEmail === 'string') {
      await this.saveEmail(newEmail);
    }
  }

  private async getDocumentsPath(isPdf: boolean): Promise<string> {
    const result = await Filesystem.getUri({
      path: isPdf ? this.getFileNamePdf() : this.getFileNamePng(),
      directory: Directory.Documents,
    });

    // Remove the "file://" prefix
    let path = result.uri;
    if (path.startsWith('file://')) {
      path = path.slice(7);
    }
    return path;
  }

  isValidEmail(email: string | number): boolean {
    if (typeof email !== 'string') {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
