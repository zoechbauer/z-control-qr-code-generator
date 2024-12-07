import { Component, ViewChild } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import {
  IonText,
  IonTextarea,
  ModalController,
  PopoverController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { EmailUtilsService } from './../services/email-utils.service';

import { HelpModalComponent } from '../help-modal/help-modal.component';
import { FileUtilsService } from '../services/file-utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { QrUtilsService } from '../services/qr-utils.service';
import { LanguagePopoverComponent } from './language-popover.component';

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

  showAddress: boolean = false;

  constructor(
    public qrService: QrUtilsService,
    public localStorage: LocalStorageService,
    public EmailService: EmailUtilsService,
    public translate: TranslateService,
    private modalController: ModalController,
    private fileService: FileUtilsService,
    private popoverController: PopoverController
  ) {
    this.localStorage.loadSelectedOrDefaultLanguage().then(() => {
      this.translate.setDefaultLang(this.localStorage.selectedLanguage);
      this.translate.use(this.localStorage.selectedLanguage);
    });
  }

  async openLanguagePopover(ev: any) {
    const popover = await this.popoverController.create({
      component: LanguagePopoverComponent,
      event: ev,
      translucent: true,
    });
    return await popover.present();
  }

  toggleShowAddress() {
    this.showAddress = !this.showAddress;
  }

  async openModal() {
    const modal = await this.modalController.create({
      component: HelpModalComponent,
      componentProps: {
        folderName: this.fileService.folderName,
        fileNamePng: this.fileService.fileNamePng,
        fileNamePdf: this.fileService.fileNamePdf,
        maxInputLength: this.MAX_INPUT_LENGTH,
        selectedLanguage: this.localStorage.selectedLanguage,
      },
    });
    return await modal.present();
  }

  clearInputField(): void {
    this.EmailService.clearEmailSent;
    this.qrService.clearQrFields();

    if (this.qrDataInput) {
      this.qrDataInput.value = '';
    }
  }

  hasInputChangedAfterGeneration(): boolean {
    if (this.qrDataInput) {
      return this.qrDataInput.value !== this.qrService.myAngularxQrCode;
    }
    return false;
  }

  isInputFieldEmpty(): boolean {
    return this.qrDataInput ? this.qrDataInput.value === '' : true;
  }

  onChangeURL(url: SafeUrl) {
    this.qrService.setDownloadLink(url);
  }

  async storeAndMailQRCode() {
    await this.fileService.downloadQRCode(this.qrService.qrCodeDownloadLink);
    await this.qrService.printQRCode();
    await this.EmailService.sendEmail();
  }

  async addEmailAddress(newEmailAddress: string | undefined | null | number) {
    if (typeof newEmailAddress === 'string') {
      await this.localStorage.saveEmail(newEmailAddress);
    }
  }
}
