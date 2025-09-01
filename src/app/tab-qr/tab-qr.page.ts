  import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
  import { SafeUrl } from '@angular/platform-browser';
  import {
    IonTextarea,
    ModalController,
    PopoverController,
    Platform,
    AlertController,
    ToastController,
  } from '@ionic/angular';
  import { TranslateService } from '@ngx-translate/core';
  import { Capacitor } from '@capacitor/core';
  import { Keyboard } from '@capacitor/keyboard';
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
  
  enum Toast {
    TrailingBlanksRemoved = 'TOAST_TRAILING_BLANKS_REMOVED',
    QRCodeDeletedAfterInputChange = 'TOAST_QR_CODE_DELETED_AFTER_INPUT_CHANGE',
  }
  
  enum Workflow {
    StepEnterText = 'WORKFLOW_STEP_ENTER_TEXT',
    StepGenerate = 'WORKFLOW_STEP_GENERATE',
    StepMail = 'WORKFLOW_STEP_MAIL',
    StepMailAgain = 'WORKFLOW_STEP_MAIL_AGAIN',
  }
  
@Component({
  selector: 'app-tab-qr',
  templateUrl: './tab-qr.page.html',
  styleUrls: ['./tab-qr.page.scss'],
})
  export class TabQrPage implements OnInit, OnDestroy {
    @ViewChild('qrDataInput') qrDataInput!: IonTextarea;
  
    newEmailAddressValue: string = '';
    screenWidth: number = window.innerWidth;
    showAddress: boolean = false;
    nbrOfInitialRows: number = 1;
    showSpinner: boolean = false;
    workflowStep: Workflow = Workflow.StepEnterText;
  
    private readonly langSub?: Subscription;
    private isKeyboardOpen = false;
    private hasShownKeyboardAlert = false;
  
    constructor(
      public qrService: QrUtilsService,
      public localStorage: LocalStorageService,
      public emailService: EmailUtilsService,
      public readonly validationService: ValidationService,
      public translate: TranslateService,
      private readonly modalController: ModalController,
      private readonly fileService: FileUtilsService,
      private readonly popoverController: PopoverController,
      private readonly toastController: ToastController,
      private readonly platform: Platform,
      private readonly alertController: AlertController,
      private readonly alertService: AlertService,
    ) {
      this.setNumberOfRows();
      this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
      });
    }
  
    // for unit tests
    public setKeyboardState(isOpen: boolean): void {
      this.isKeyboardOpen = isOpen;
    }
  
    get isSmallScreen(): boolean {
      return window.innerHeight <= 640 && this.isPortrait;
    }
  
    get maxInputLength(): number {
      // 2953 = Maximum capacity for QR code version 40 with error correction level L according to Perplexity AI,
      // but scanning no longer works, therefore we are using 1000 - results determined by testing
  
      return environment.maxInputLength ?? 1000;
    }
  
    get isGenerationButtonDisabled(): boolean {
      return (
        (this.isInputFieldEmpty() ||
          this.emailService.isEmailSent ||
          this.qrService.isQrCodeGenerated) &&
        !this.hasInputChangedAfterGeneration()
      );
    }
  
    get isPortrait(): boolean {
      return window.matchMedia('(orientation: portrait)').matches;
    }
  
    get isNative(): boolean {
      return Capacitor.isNativePlatform();
    }
  
    ngOnInit(): void {
      this.setupEventListeners();
      this.initializeServicesAsync();
    }
  
    private setupEventListeners(): void {
      // Single resize listener
      window.addEventListener('resize', () => {
        this.screenWidth = window.innerWidth;
        this.setNumberOfRows();
      });
  
      // Platform-specific keyboard listeners
      if (Capacitor.isNativePlatform()) {
        Keyboard.addListener('keyboardWillShow', () => {
          this.isKeyboardOpen = true;
        });
        Keyboard.addListener('keyboardWillHide', () => {
          this.isKeyboardOpen = false;
        });
      }
    }
  
    private setNumberOfRows(): void {
      this.nbrOfInitialRows = this.isPortrait ? 6 : 1;
    }
  
    private async initializeServicesAsync(): Promise<void> {
      try {
        await this.localStorage.init();
        await this.localStorage.loadSelectedOrDefaultLanguage();
  
        // Non-critical operation - can fail silently
        try {
          await this.fileService.deleteAllQrCodeFiles();
        } catch (cleanupError) {
          console.warn('File cleanup failed:', cleanupError);
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        await this.initializeWithDefaults();
      }
    }
  
    private async initializeWithDefaults(): Promise<void> {
      try {
        this.translate.setDefaultLang('en');
        this.translate.use('en');
      } catch (fallbackError) {
        console.error('Critical: Even defaults failed:', fallbackError);
      }
    }
  
    async openLanguagePopover(ev: any) {
      const popover = await this.popoverController.create({
        component: LanguagePopoverComponent,
        event: ev,
        side: 'left',
        translucent: true,
      });
      return await popover.present();
    }
  
    toggleShowAddress() {
      this.showAddress = !this.showAddress;
      this.performClear();
    }
  
    async openHelpModal() {
      const isDesktop = !Capacitor.isNativePlatform();
  
      const modal = await this.modalController.create({
        component: HelpModalComponent,
        componentProps: {
          maxInputLength: this.maxInputLength,
        },
        cssClass: isDesktop
          ? 'manual-instructions-modal desktop'
          : 'manual-instructions-modal',
      });
      return await modal.present();
    }
  
    clearInputField(): void {
      const currentText = this.qrDataInput?.value?.trim() || '';
  
      // Show confirmation for longer text (100+ characters)
      if (currentText.length > (environment.clearConfirmationLength ?? 100)) {
        this.showClearConfirmation();
        return;
      }
  
      // Clear immediately for short text
      this.performClear();
    }
  
    private async showClearConfirmation() {
      const alert = await this.alertController.create({
        header: await this.translate.get('CLEAR_CONFIRMATION_HEADER').toPromise(),
        message: await this.translate
          .get('CLEAR_CONFIRMATION_MESSAGE')
          .toPromise(),
        buttons: [
          {
            text: await this.translate.get('CANCEL').toPromise(),
            role: 'cancel',
          },
          {
            text: await this.translate
              .get('CLEAR_CONFIRMATION_BUTTON')
              .toPromise(),
            handler: () => this.performClear(),
          },
        ],
      });
      await alert.present();
    }
  
    private performClear(): void {
      this.emailService.clearEmailSent();
      this.qrService.clearQrFields();
  
      if (this.qrDataInput) {
        this.qrDataInput.value = '';
      }
  
      this.hasShownKeyboardAlert = false;
      this.resetWorkflowStep();
    }
  
    private resetWorkflowStep(): void {
      this.workflowStep = Workflow.StepEnterText;
    }
  
    private showWorkflowStep(currentStep: Workflow): void {
      switch (currentStep) {
        case Workflow.StepEnterText:
          this.workflowStep = Workflow.StepGenerate;
          break;
        case Workflow.StepGenerate:
          this.workflowStep = Workflow.StepMail;
          break;
        case Workflow.StepMail:
          this.workflowStep = Workflow.StepMailAgain;
          break;
        default:
      }
    }
  
    handleAddEmailAddressButtonClick() {
      if (
        !this.newEmailAddressValue ||
        !this.validationService.isValidEmailAddress(this.newEmailAddressValue)
      ) {
        this.showDisabledToast('TOOLTIP_EMAIL_INVALID_ADDRESS').catch((error) => {
          console.error('Error presenting toast:', error);
        });
        return;
      }
  
      // Add email and clear input
      this.addEmailAddress(this.newEmailAddressValue);
      this.newEmailAddressValue = ''; // ✅ Easy to clear!
    }
  
    handleToggleShowAddressButtonClick() {
      if (!this.isInputFieldEmpty()) {
        this.showDisabledToast('TOOLTIP_NAVIGATION_CLEAR_TEXT_TO_SWITCH').catch(
          (error) => {
            console.error('Error presenting toast:', error);
          }
        );
      } else {
        // Input is empty - allow switch to email maintenance
        this.toggleShowAddress();
      }
    }
  
    handleSendEmailButtonClick() {
      if (!this.qrService.isQrCodeGenerated) {
        this.showDisabledToast('TOOLTIP_EMAIL_NO_QR_GENERATED').catch((error) => {
          console.error('Error presenting toast:', error);
        });
      } else {
        // Valid input, send email
        this.storeMailAndDeleteQRCode();
        this.showWorkflowStep(this.workflowStep);
      }
    }
  
    handleGenerateButtonClick() {
      // show toast if disabled or generate qr code
      if (this.isInputFieldEmpty()) {
        this.showDisabledToast('TOOLTIP_GENERATION_ENTER_TEXT_FIRST').catch(
          (error) => {
            console.error('Error presenting toast:', error);
          }
        );
      } else if (this.emailService.isEmailSent) {
        this.showDisabledToast('TOOLTIP_GENERATION_EMAIL_ALREADY_SENT').catch(
          (error) => {
            console.error('Error presenting toast:', error);
          }
        );
      } else if (this.qrService.isQrCodeGenerated) {
        this.showDisabledToast('TOOLTIP_GENERATION_QR_ALREADY_GENERATED').catch(
          (error) => {
            console.error('Error presenting toast:', error);
          }
        );
      } else {
        // Valid input, generate QR code
        this.sanitizeInputAndGenerateQRCode(this.qrDataInput.value);
        this.showWorkflowStep(Workflow.StepGenerate);
      }
    }
  
    sanitizeInputAndGenerateQRCode(data: string | undefined | null) {
      if (typeof data === 'string' && data.trim() !== '') {
        this.showSpinner = true;
        const sanitizedData = this.trimTrailingWhitespace(data);
        this.qrService.generateQRCode(sanitizedData);
  
        this.scrollToNoGenerationButtons();
        this.showSpinner = false;
      }
    }
  
    private async showDisabledToast(toastMsg: string) {
      const translatedMsg = this.translate.instant(toastMsg);
  
      const toast = await this.toastController.create({
        message: translatedMsg,
        duration: 3000,
        position: this.getToastPosition(),
        icon: 'information-circle',
        color: 'medium',
        buttons: [
          {
            text: 'OK',
            role: 'cancel',
          },
        ],
      });
      await toast.present();
    }
  
    private getToastPosition(): 'top' | 'bottom' {
      // return this.isKeyboardOpen ? 'top' : 'bottom';
      // always on top to avoid covering by navigation bar
      return 'top';
    }
  
    private scrollToNoGenerationButtons(): void {
      setTimeout(() => {
        const element = document.querySelector('.no-generation-buttons');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
  
    private trimTrailingWhitespace(data: string): string {
      const trimmedData = data.replace(/\s+$/, '');
  
      if (data.length !== trimmedData.length) {
        this.qrDataInput.value = trimmedData;
        this.showToast(Toast.TrailingBlanksRemoved);
      }
      return trimmedData;
    }
  
    private showToast(toastType: Toast): void {
      const translatedToastMessage = this.getToastMessage(toastType);
  
      this.showToastMessage(translatedToastMessage).catch((error) => {
        console.error('Error presenting toast:', error);
      });
    }
  
    private getToastMessage(toastType: Toast): string {
      switch (toastType) {
        case Toast.TrailingBlanksRemoved:
          return this.translate.instant('TOAST_TRAILING_BLANKS_REMOVED');
        case Toast.QRCodeDeletedAfterInputChange:
          return this.translate.instant(
            'TOAST_QR_CODE_DELETED_AFTER_INPUT_CHANGE'
          );
        default:
          console.warn('Unknown toast type:', toastType);
          return 'undefined toast type';
      }
    }
  
    private async showToastMessage(translatedToastMessage: string) {
      const toast = await this.toastController.create({
        message: translatedToastMessage,
        duration: 3000,
        icon: 'information-circle',
        color: 'medium',
        position: this.getToastPosition(),
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
          },
        ],
      });
      await toast.present();
    }
  
    hasInputChangedAfterGeneration(): boolean {
      if (
        !this.qrDataInput ||
        this.isInputFieldEmpty() ||
        !this.qrService.isQrCodeGenerated
      ) {
        return false;
      }
      return this.qrDataInput.value !== this.qrService.myAngularxQrCode;
    }
  
    deleteQRCodeIfInputChangedAfterGeneration(): void {
      if (this.hasInputChangedAfterGeneration()) {
        this.emailService.clearEmailSent();
        this.qrService.clearQrFields();
        this.showToast(Toast.QRCodeDeletedAfterInputChange);
      }
    }
  
    isInputFieldEmpty(): boolean {
      return this.qrDataInput ? this.qrDataInput.value?.trim() === '' : true;
    }
  
    onChangeURL(url: SafeUrl) {
      this.qrService.setDownloadLink(url);
    }
  
    async storeMailAndDeleteQRCode() {
      try {
        this.showSpinner = true;
        this.fileService.setNowFormatted();
  
        if (
          !(await this.fileService.downloadQRCode(
            this.qrService.qrCodeDownloadLink
          ))
        ) {
          this.showSpinner = false;
          return;
        }
  
        await this.qrService.printQRCode();
        await this.handleEmailBasedOnPlatform();
  
        this.fileService.deleteFilesAfterSpecifiedTime();
        this.fileService.clearNowFormatted();
        this.showSpinner = false;
      } catch (error) {
        console.error('Email workflow failed:', error);
        this.fileService.clearNowFormatted();
        this.showSpinner = false;
        await this.alertService.showErrorAlert('ERROR_MESSAGE_EMAIL_WORKFLOW');
      }
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
  
    async addEmailAddress(newEmailAddress: string) {
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
  
    private async showKeyboardAlert(): Promise<void> {
      this.hasShownKeyboardAlert = true;
  
      const alert = await this.alertController.create({
        header: this.translate.instant('KEYBOARD_ALERT_TITLE'),
        message: this.translate.instant('KEYBOARD_ALERT_MESSAGE'),
        cssClass: 'keyboard-alert',
        buttons: [
          {
            text: this.translate.instant('KEYBOARD_ALERT_HELP_KEYBOARD'),
            handler: async () => {
              await alert.dismiss();
              await this.openHelpModalToSection('floating-keyboard');
            },
          },
          {
            text: this.translate.instant('KEYBOARD_ALERT_HELP_WEB'),
            handler: async () => {
              await alert.dismiss();
              await this.openHelpModalToSection('web-version');
            },
          },
          {
            text: this.translate.instant('KEYBOARD_ALERT_SHORT_TEXT'),
            handler: async () => {
              await alert.dismiss();
              this.performClear();
            },
          },
        ],
      });
  
      await alert.present();
    }
  
    private async openHelpModalToSection(
      sectionType: 'floating-keyboard' | 'web-version'
    ): Promise<void> {
      const isDesktop = !Capacitor.isNativePlatform();
      const currentLang = this.translate.currentLang || 'en';
      const sectionId = currentLang === 'de' ? `${sectionType}-DE` : sectionType;
  
      const modal = await this.modalController.create({
        component: HelpModalComponent,
        componentProps: {
          maxInputLength: this.maxInputLength,
          scrollToSection: sectionId,
        },
        cssClass: isDesktop
          ? 'manual-instructions-modal desktop'
          : 'manual-instructions-modal',
      });
  
      return await modal.present();
    }
  
    onTextareaInput(): void {
      const currentText = this.qrDataInput?.value || '';
  
      this.deleteQRCodeIfInputChangedAfterGeneration();
      this.showWorkflowStepGenerate(currentText);
  
      // Check for keyboard alert on Galaxy J5 or smaller mobiles
      if (this.isSmallScreen && !this.hasShownKeyboardAlert) {
        if (this.shouldShowKeyboardAlert(currentText)) {
          setTimeout(() => {
            this.showKeyboardAlert();
          }, 500);
        }
      }
    }
  
    private shouldShowKeyboardAlert(text: string): boolean {
      if (!text) return false;
  
      const criteria = {
        characterCount: text.length > 150, // tested on Galaxy J5 without ion-padding
        wordCount: text.trim().split(/\s+/).length > 25, // tested on Galaxy J5
        lineBreaks: text.split('\n').length > 5, // tested on Galaxy J5
        hasLongSentence: text.includes('.') && text.length >= 130,
      };
  
      // returns if any criteria is met
      return Object.values(criteria).some((condition) => condition);
    }
  
    private showWorkflowStepGenerate(text: string): void {
      if (!text) return;
  
      const criteria = {
        characterCount: text.length > 10,
        wordCount: text.trim().split(/\s+/).length > 5,
        lineBreaks: text.split('\n').length > 1 && text.length > 5,
        hasLongSentence: text.includes('.') && text.length >= 5,
      };
  
      if (Object.values(criteria).some((condition) => condition)) {
        this.workflowStep = Workflow.StepGenerate;
      }
    }
  
    ngOnDestroy(): void {
      try {
        // Cleanup subscriptions
        this.langSub?.unsubscribe();
  
        // Clear services
        this.qrService.clearQrFields();
        this.emailService.clearEmailSent();
        this.fileService.clearNowFormatted();
  
        // Remove keyboard listeners if they exist
        if (Capacitor.isNativePlatform()) {
          Keyboard.removeAllListeners();
        }
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }
  }
  