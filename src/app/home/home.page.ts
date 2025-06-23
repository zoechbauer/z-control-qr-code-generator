import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('qrDataInput') qrDataInput!: IonTextarea;
  @ViewChild('emailInput') emailInput!: IonText;
  MAX_INPUT_LENGTH = 1000; // 2953 = Maximale Kapazität für QR-Code Version 40 mit Fehlerkorrektur-Level L lt. Perplexity KI,
  // aber scannen funktioniert dann nicht mehr, deshalb 1000 - ermittelt durch Tests

  showAddress: boolean = false;
  private readonly langSub?: Subscription;

  constructor(
    public qrService: QrUtilsService,
    public localStorage: LocalStorageService,
    public emailService: EmailUtilsService,
    public translate: TranslateService,
    private readonly modalController: ModalController,
    private readonly fileService: FileUtilsService,
    private readonly popoverController: PopoverController
  ) {
    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
    });
  }

  ngOnInit(): void {
    this.localStorage
      .init()
      .then(() => this.localStorage.loadSelectedOrDefaultLanguage())
      .then(() => this.fileService.deleteAllQrCodeFiles());
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
        maxInputLength: this.MAX_INPUT_LENGTH,
      },
    });
    return await modal.present();
  }

  clearInputField(): void {
    this.emailService.clearEmailSent();
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

  async storeMailAndDeleteQRCode() {
    this.fileService.SetNowFormatted();
    await this.fileService.downloadQRCode(this.qrService.qrCodeDownloadLink);
    await this.qrService.printQRCode();
    await this.emailService.sendEmail();
    this.fileService.deleteFilesAfterSpecifiedTime();
    this.fileService.ClearNowFormatted();
  }

  async addEmailAddress(newEmailAddress: string | undefined | null | number) {
    if (typeof newEmailAddress === 'string') {
      await this.localStorage.saveEmail(newEmailAddress);
    }
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
    this.qrService.clearQrFields();
    this.emailService.clearEmailSent();
    this.fileService.ClearNowFormatted();
  }
}
