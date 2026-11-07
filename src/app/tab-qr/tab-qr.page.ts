import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import {
  IonTextarea,
  ModalController,
  Platform,
  AlertController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Keyboard } from '@capacitor/keyboard';
import { Subscription } from 'rxjs';

import { EmailUtilsService } from '../services/email-utils.service';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { FileUtilsService } from '../services/file-utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { QrUtilsService } from '../services/qr-utils.service';
import { ValidationService } from '../services/validation.service';
import { ManualInstructionsModalComponent } from './manual-instructions-modal.component';
import { environment } from '@env/environment';
import { AlertService } from '../services/alert.service';
import { UtilsService } from '../services/utils.service';
import { ToastService } from '../services/toast.service';
import { LogoType, Tab, ToastAnchor } from '../enums';
import { PrintUtilsService } from '../services/print-utils.service';

export enum Workflow {
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

  LogoType = LogoType;
  Tab = Tab;
  screenWidth: number = window.innerWidth;
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
    public readonly utilsService: UtilsService,
    private readonly fileService: FileUtilsService,
    private readonly platform: Platform,
    private readonly alertController: AlertController,
    private readonly alertService: AlertService,
    private readonly toastService: ToastService,
    private readonly printUtilsService: PrintUtilsService
  ) {
    this.setNumberOfRows();
    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
    });
  }

  /**
   * Returns the maximum input length for the QR code data.
   */
  get maxInputLength(): number {
    // 2953 = Maximum capacity for QR code version 40 with error correction level L according to Perplexity AI,
    // but scanning no longer works, therefore we are using 1000 - results determined by testing

    return environment.maxInputLength ?? 1000;
  }

  /**
   * Determines if the generation button should be disabled.
   */
  get isGenerationButtonDisabled(): boolean {
    return (
      (this.isInputFieldEmpty() ||
        this.emailService.isEmailSent ||
        this.qrService.isQrCodeGenerated) &&
      !this.hasInputChangedAfterGeneration()
    );
  }

  /**
   * Determines if the app is running in a native environment.
   */
  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  /**
   * Performs necessary setup tasks such as showing or hiding the tab bar,
   * setting up event listeners, and initializing services.
   */
  ngOnInit(): void {
    this.utilsService.showOrHideIonTabBar();
    void this.setupEventListeners();
    void this.initializeServicesAsync();
  }

  /**
   * Sets up event listeners for window resize and keyboard events.
   */
  private async setupEventListeners(): Promise<void> {
    // Single resize listener
    window.addEventListener('resize', () => {
      this.screenWidth = window.innerWidth;
      this.setNumberOfRows();
      this.utilsService.showOrHideIonTabBar();
    });

    // Platform-specific keyboard listeners
    if (this.utilsService.isNative) {
      await Keyboard.addListener('keyboardWillShow', () => {
        this.isKeyboardOpen = true;
      });
      await Keyboard.addListener('keyboardWillHide', () => {
        this.isKeyboardOpen = false;
      });
    }
  }

  /**
   * Sets the number of rows for the input field based on the device orientation.
   */
  private setNumberOfRows(): void {
    this.nbrOfInitialRows = this.utilsService.isPortrait ? 6 : 1;
  }

  /**
   * Initializes services such as local storage and file service.
   */
  private async initializeServicesAsync(): Promise<void> {
    try {
      await this.localStorage.init();
      await this.localStorage.loadSelectedOrDefaultLanguage();

      // Non-critical operation - can fail silently
      try {
        await this.fileService.deleteAllQrCodeFilesAfterSpecifiedTime();
      } catch (cleanupError) {
        console.warn('File cleanup failed:', cleanupError);
      }
    } catch (error) {
      console.error('App initialization failed:', error);
      this.initializeWithDefaults();
    }
  }

  /**
   * Initializes the app with default settings, such as the default language.
   */
  private initializeWithDefaults(): void {
    try {
      this.translate.setDefaultLang('en');
      this.translate.use('en');
    } catch (fallbackError) {
      console.error('Critical: Even defaults failed:', fallbackError);
    }
  }

  /**
   * Clears the input field, showing a confirmation for longer text (100+ characters).
   */
  async clearInputField(): Promise<void> {
    const currentText = this.qrDataInput?.value?.trim() || '';

    if (currentText.length > (environment.clearConfirmationLength ?? 100)) {
      await this.showClearConfirmation();
      return;
    }

    this.performClear();
  }

  /**
   * Shows a confirmation alert before clearing the input field.
   */
  private async showClearConfirmation(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translate.instant('CLEAR_CONFIRMATION_HEADER'),
      message: this.translate.instant('CLEAR_CONFIRMATION_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('CLEAR_CONFIRMATION_BUTTON'),
          handler: () => this.performClear(),
        },
      ],
    });
    await alert.present();
  }

  /**
   * Performs the actual clearing of the input field and resets related states.
   */
  private performClear(): void {
    this.emailService.clearEmailSent();
    this.qrService.clearQrFields();

    if (this.qrDataInput) {
      this.qrDataInput.value = '';
    }

    this.hasShownKeyboardAlert = false;
    this.resetWorkflowStep();
  }

  /**
   * Resets the workflow step to the initial state.
   */
  private resetWorkflowStep(): void {
    this.workflowStep = Workflow.StepEnterText;
  }

  /**
   * Updates the workflow step based on the current step.
   */
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

  /**
   * Handles the click event for the "Send Email" button.
   */
  async handleSendEmailButtonClick() {
    if (!this.qrService.isQrCodeGenerated) {
      this.toastService
        .showDisabledToast('TOOLTIP_EMAIL_NO_QR_GENERATED', ToastAnchor.QR_PAGE)
        .catch((error) => {
          console.error('Error presenting toast:', error);
        });
    } else {
      // Valid input, send email
      await this.storeMailAndDeleteQRCode();
      this.showWorkflowStep(this.workflowStep);
    }
  }

  /**
   * Handles the click event for the "Generate QR Code" button.
   * Validates the input and generates a QR code if conditions are met,
   * otherwise shows appropriate toast messages.
   */
  async handleGenerateButtonClick() {
    // show toast if disabled or generate qr code
    if (this.isInputFieldEmpty()) {
      await this.toastService
        .showDisabledToast(
          'TOOLTIP_GENERATION_ENTER_TEXT_FIRST',
          ToastAnchor.QR_PAGE
        )
        .catch((error) => {
          console.error('Error presenting toast:', error);
        });
    } else if (this.emailService.isEmailSent) {
      await this.toastService
        .showDisabledToast(
          'TOOLTIP_GENERATION_EMAIL_ALREADY_SENT',
          ToastAnchor.QR_PAGE
        )
        .catch((error) => {
          console.error('Error presenting toast:', error);
        });
    } else if (this.qrService.isQrCodeGenerated) {
      await this.toastService
        .showDisabledToast(
          'TOOLTIP_GENERATION_QR_ALREADY_GENERATED',
          ToastAnchor.QR_PAGE
        )
        .catch((error) => {
          console.error('Error presenting toast:', error);
        });
    } else {
      // Valid input, generate QR code
      this.sanitizeInputAndGenerateQRCode(this.qrDataInput.value);
      this.showWorkflowStep(Workflow.StepGenerate);
      this.generateMarginForButtonsIfNeeded();
    }
  }

  /**
   * Adds extra bottom margin to the generation buttons container if needed,
   * based on device size and platform.
   */
  private generateMarginForButtonsIfNeeded(): void {
    const isSmallDevice = this.utilsService.isSmallDevice;
    if (isSmallDevice || !this.isNative) return;

    const element = document.querySelector('.no-generation-buttons');
    if (!element?.classList.contains('extra-margin-bottom')) {
      element?.classList.add('extra-margin-bottom');
    }
  }

  /**
   * Sanitizes the input data and generates a QR code.
   * Trims trailing whitespace from the input data before generating the QR code.
   * After generating the QR code, scrolls to the container with no generation buttons.
   */
  sanitizeInputAndGenerateQRCode(data: string | undefined | null) {
    if (typeof data === 'string' && data.trim() !== '') {
      this.showSpinner = true;
      const sanitizedData = this.trimTrailingWhitespace(data);
      this.qrService.generateQRCode(sanitizedData);

      this.scrollToNoGenerationButtons();
      this.showSpinner = false;
    }
  }

  /**
   * Scrolls to the container with no generation buttons.
   */
  private scrollToNoGenerationButtons(): void {
    setTimeout(() => {
      const element = document.querySelector('.no-generation-buttons');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  }

  /**
   * Trims trailing whitespace from the input data.
   * If any trailing whitespace is removed, updates the input field and shows a toast message.
   */
  private trimTrailingWhitespace(data: string): string {
    const trimmedData = data.trimEnd();

    if (data.length !== trimmedData.length) {
      this.qrDataInput.value = trimmedData;
      this.toastService.showToast(
        this.translate.instant('TOAST_TRAILING_BLANKS_REMOVED'),
        ToastAnchor.QR_PAGE
      );
    }
    return trimmedData;
  }

  /**
   * Checks if the input has changed after the QR code was generated.
   * Returns true if the input has changed, false otherwise.
   */
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

  /**
   * Deletes the QR code if the input has changed after generation.
   * Clears email sent status and QR code fields, and shows a toast message.
   */
  deleteQRCodeIfInputChangedAfterGeneration(): void {
    if (this.hasInputChangedAfterGeneration()) {
      this.emailService.clearEmailSent();
      this.qrService.clearQrFields();
      this.toastService.showToast(
        this.translate.instant('TOAST_QR_CODE_DELETED_AFTER_INPUT_CHANGE'),
        ToastAnchor.QR_PAGE
      );
    }
  }

  /**
   * Checks if the input field is empty.
   * Returns true if the input field is empty, false otherwise.
   */
  isInputFieldEmpty(): boolean {
    return this.qrDataInput ? this.qrDataInput.value?.trim() === '' : true;
  }

  /**
   * Handles the change of the QR code download URL.
   * Updates the download link in the QR service.
   */
  onChangeURL(url: SafeUrl) {
    this.qrService.setDownloadLink(url);
  }

  /**
   * Stores the email and deletes the QR code.
   * Handles the download, printing, and email workflow.
   * Shows a spinner during the process and handles errors.
   */
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

      this.showSpinner = false;
    } catch (error) {
      console.error('Email workflow failed:', error);
      this.fileService.clearNowFormatted();
      this.showSpinner = false;
      await this.alertService.showErrorAlert('ERROR_MESSAGE_EMAIL_WORKFLOW');
    }
  }

  /**
   * Handles the email workflow based on the platform.
   * For native apps, sends the email directly.
   * For desktop browsers, shows an attachment alert before sending.
   * For mobile web browsers, shows alternative email options.
   */
  private async handleEmailBasedOnPlatform() {
    if (this.utilsService.isNative) {
      // Native app - full email client integration works
      await this.emailService.sendEmail();
    } else if (this.platform.is('desktop')) {
      // Desktop browser - mailto usually works, but show alert for attachments
      await this.emailService.displayEmailAttachmentAlert(async () => {
        await this.emailService.sendEmail();
      });
    } else {
      // Mobile web browser - show alternative options
      await this.showMobileWebEmailOptions();
    }
  }

  /**
   * Shows alternative email options for mobile web browsers.
   */
  private async showMobileWebEmailOptions() {
    const alert = await this.alertController.create({
      header: this.translate.instant('MOBILE_WEB_EMAIL_TITLE'),
      message: this.translate.instant('MOBILE_WEB_EMAIL_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('MOBILE_WEB_TRY_EMAIL'),
          handler: async () => {
            await this.emailService.sendEmail();
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

  /**
   * Copies the QR text to the clipboard.
   * Shows a success alert if the copy operation succeeds.
   * Shows an error alert if the copy operation fails.
   */
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
        textArea.remove();
        await this.showCopySuccessAlert(qrText);
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      await this.alertService.showErrorAlert('MOBILE_WEB_COPY_ERROR');
    }
  }

  /**
   * Shows the manual instructions modal.
   */
  private async showManualInstructions() {
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

  /**
   * Shows a success alert after copying text to the clipboard.
   * Displays a preview of the copied text.
   */
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

  /**
   * Shows an alert about the keyboard.
   * Provides options to get help or dismiss the alert.
   */
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

  /**
   * Opens the help modal and scrolls to the specified section.
   * @param sectionType The section to scroll to ('floating-keyboard' or 'web-version').
   */
  private async openHelpModalToSection(
    sectionType: 'floating-keyboard' | 'web-version'
  ): Promise<void> {
    const isDesktop = !this.utilsService.isNative;
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

  /**
   * Handles input events on the textarea.
   * Checks if the keyboard alert should be shown for small devices.
   */
  onTextareaInput(): void {
    const currentText = this.qrDataInput?.value || '';

    this.deleteQRCodeIfInputChangedAfterGeneration();
    this.showWorkflowStepGenerate(currentText);

    // Check for keyboard alert on Galaxy J5 or smaller mobiles
    if (this.utilsService.isSmallDevice && !this.hasShownKeyboardAlert) {
      if (this.shouldShowKeyboardAlert(currentText)) {
        setTimeout(async () => {
          await this.showKeyboardAlert();
        }, 500);
      }
    }
  }

  /**
   * Handles blur events on the QR data input.
   * Trims trailing whitespace and updates the QR data input subscription.
   */
  onQrDataInputBlur(): void {
    const value = this.qrDataInput?.value || '1';
    const trimmedData = value.trimEnd();
    this.printUtilsService.qrDataInputSub.next(trimmedData.length);
  }

  /**
   * Determines if the keyboard alert should be shown based on the input text.
   * @param text The input text to evaluate.
   * @returns True if the alert should be shown, false otherwise.
   */
  private shouldShowKeyboardAlert(text: string): boolean {
    if (!text) return false;

    const criteria = {
      characterCount: text.length > 150, // tested on Galaxy J5 without ion-padding
      wordCount: text.trim().split(/\s+/).length > 25, // tested on Galaxy J5
      lineBreaks: text.split('\n').length > 5, // tested on Galaxy J5
      hasLongSentence: text.includes('.') && text.length >= 130,
    };

    // returns if any criteria is met
    return Object.values(criteria).some(Boolean);
  }

  /**
   * Updates the workflow step to 'Generate' if the input text meets certain criteria.
   * @param text The input text to evaluate.
   */
  private showWorkflowStepGenerate(text: string): void {
    if (!text) return;

    const criteria = {
      characterCount: text.length > 10,
      wordCount: text.trim().split(/\s+/).length > 5,
      lineBreaks: text.split('\n').length > 1 && text.length > 5,
      hasLongSentence: text.includes('.') && text.length >= 5,
    };

    if (Object.values(criteria).some(Boolean)) {
      this.workflowStep = Workflow.StepGenerate;
    }
  }

  /**
   * Cleans up resources and subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    try {
      // Cleanup subscriptions
      this.langSub?.unsubscribe();

      // Clear services
      this.qrService.clearQrFields();
      this.emailService.clearEmailSent();
      this.fileService.clearNowFormatted();

      // Remove keyboard listeners if they exist
      if (this.utilsService.isNative) {
        void Keyboard.removeAllListeners();
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}
