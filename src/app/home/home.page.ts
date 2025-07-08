import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import {
  IonText,
  IonTextarea,
  ModalController,
  PopoverController,
  Platform,
  AlertController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';
import { Subscription } from 'rxjs';

import { EmailUtilsService } from './../services/email-utils.service';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { FileUtilsService } from '../services/file-utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { QrUtilsService } from '../services/qr-utils.service';
import { LanguagePopoverComponent } from './language-popover.component';
import { ValidationService } from '../services/validation.service';
import { ManualInstructionsModalComponent } from './manual-instructions-modal.component';
import { environment } from 'src/environments/environment';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('qrDataInput') qrDataInput!: IonTextarea;
  @ViewChild('emailInput') emailInput!: IonText;

  showAddress: boolean = false;
  private readonly langSub?: Subscription;

  constructor(
    public qrService: QrUtilsService,
    public localStorage: LocalStorageService,
    public emailService: EmailUtilsService,
    public readonly validationService: ValidationService,
    public translate: TranslateService,
    private readonly modalController: ModalController,
    private readonly fileService: FileUtilsService,
    private readonly popoverController: PopoverController,
    private readonly platform: Platform,
    private readonly alertController: AlertController,
    private readonly alertService: AlertService
  ) {
    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
    });
  }

  get maxInputLength(): number {
    // 2953 = Maximum capacity for QR code version 40 with error correction level L according to Perplexity AI,
    // but scanning no longer works, therefore we are using 1000 - results determined by testing

    return environment.maxInputLength ?? 1000;
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

  async openHelpModal() {
    const modal = await this.modalController.create({
      component: HelpModalComponent,
      componentProps: {
        maxInputLength: this.maxInputLength,
      },
      cssClass: 'manual-instructions-modal',
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
    this.fileService.setNowFormatted();
    await this.fileService.downloadQRCode(this.qrService.qrCodeDownloadLink);
    await this.qrService.printQRCode();

    // Platform-aware email handling
    await this.handleEmailBasedOnPlatform();

    this.fileService.deleteFilesAfterSpecifiedTime();
    this.fileService.clearNowFormatted();
  }

  private async handleEmailBasedOnPlatform() {
    if (Capacitor.isNativePlatform()) {
      // Native app - full email client integration works
      await this.emailService.sendEmail();
    } else if (this.platform.is('desktop')) {
      // Desktop browser - mailto usually works, but show alert for attachments
      await this.emailService.displayEmailAttachmentAlert(() => {
        this.emailService.sendEmail();
      });
    } else {
      // Mobile web browser - show alternative options
      await this.showMobileWebEmailOptions();
    }
  }

  private async showMobileWebEmailOptions() {
    const alert = await this.alertController.create({
      header: this.translate.instant('MOBILE_WEB_EMAIL_TITLE'),
      message: this.translate.instant('MOBILE_WEB_EMAIL_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('MOBILE_WEB_TRY_EMAIL'),
          handler: () => {
            this.emailService.sendEmail();
          },
        },
        {
          text: this.translate.instant('MOBILE_WEB_COPY_TEXT'),
          handler: async () => {
            await this.copyQRTextToClipboard();
          },
        },
        {
          text: this.translate.instant('MOBILE_WEB_INSTRUCTIONS'),
          handler: async () => {
            await this.showManualInstructions();
          },
        },
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
        },
      ],
      cssClass: 'show-mobile-web-email-options',
    });

    await alert.present();
  }

  private async copyQRTextToClipboard() {
    try {
      const qrText = this.qrService.myAngularxQrCode;

      // Use navigator.clipboard for web
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(qrText);
        await this.showCopySuccessAlert(qrText);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = qrText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy'); // Legacy fallback
        document.body.removeChild(textArea);
        await this.showCopySuccessAlert(qrText);
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      await this.alertService.showErrorAlert('MOBILE_WEB_COPY_ERROR');
    }
  }

  private async showManualInstructions() {
    // Use proper ion-modal component for better HTML/CSS support
    const baseMessage = this.translate.instant('MOBILE_WEB_MANUAL_MESSAGE');
    const qrText = this.qrService.myAngularxQrCode;

    const modal = await this.modalController.create({
      component: ManualInstructionsModalComponent,
      componentProps: {
        title: this.translate.instant('MOBILE_WEB_MANUAL_TITLE'),
        instructions: baseMessage,
        qrText: qrText,
        qrTextLabel: this.translate.instant('MOBILE_WEB_QR_TEXT'),
        copyButtonLabel: this.translate.instant('MOBILE_WEB_COPY_TEXT'),
        copyCallback: () => this.copyQRTextToClipboard(),
      },
      cssClass: 'manual-instructions-modal',
    });

    await modal.present();
  }

  async addEmailAddress(newEmailAddress: string | undefined | null | number) {
    if (typeof newEmailAddress === 'string') {
      await this.localStorage.saveEmail(newEmailAddress);
    }
  }

  private async showCopySuccessAlert(copiedText: string) {
    const maxPreviewLength = environment.maxPreviewLengthOfCopiedText ?? 50;
    const textPreview =
      copiedText.length > maxPreviewLength
        ? copiedText.substring(0, maxPreviewLength) + '...'
        : copiedText;

    const message =
      this.translate.instant('MOBILE_WEB_COPIED_TEXT_PREVIEW') +
      '"' +
      textPreview +
      '"';

    const alert = await this.alertController.create({
      header: this.translate.instant('MOBILE_WEB_COPY_SUCCESS_TITLE'),
      subHeader: this.translate.instant('MOBILE_WEB_COPY_SUCCESS'),
      message: message,
      buttons: [this.translate.instant('OK')],
      cssClass: 'copy-success-alert',
    });
    await alert.present();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();

    this.qrService.clearQrFields();
    this.emailService.clearEmailSent();
    this.fileService.clearNowFormatted();
  }
}
