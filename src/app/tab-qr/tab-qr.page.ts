import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { Platform } from '@ionic/angular';
import {
  IonTextarea,
  IonItem,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonContent,
  IonLabel,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { QRCodeComponent } from 'angularx-qrcode';

import { EmailUtilsService } from '../services/email-utils.service';
import { FileUtilsService } from '../services/file-utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { QrUtilsService } from '../services/qr-utils.service';
import { ValidationService } from '../services/validation.service';
import { environment } from '@env/environment';
import { AlertService } from '../services/alert.service';
import { UtilsService } from '../services/utils.service';
import { ToastService } from '../services/toast.service';
import {
  LogoType,
  MobileWebEmailOptions,
  Tab,
  ToastAnchor,
} from '../shared/enums';
import { PrintUtilsService } from '../services/print-utils.service';
import { HeaderComponent } from '../ui/components/header/header.component';

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
  imports: [
    IonLabel,
    IonContent,
    IonSpinner,
    IonButton,
    IonItem,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonTextarea,
    CommonModule,
    FormsModule,
    TranslatePipe,
    HeaderComponent,
    QRCodeComponent,
  ],
})
export class TabQrPage implements OnInit, OnDestroy {
  public qrService = inject(QrUtilsService);
  public localStorage = inject(LocalStorageService);
  public emailService = inject(EmailUtilsService);
  public readonly validationService = inject(ValidationService);
  public translate = inject(TranslateService);
  public readonly utilsService = inject(UtilsService);
  private readonly fileService = inject(FileUtilsService);
  private readonly platform = inject(Platform);
  private readonly alertService = inject(AlertService);
  private readonly toastService = inject(ToastService);
  private readonly printUtilsService = inject(PrintUtilsService);

  @ViewChild('qrDataInput') qrDataInput!: IonTextarea;

  LogoType = LogoType;
  Tab = Tab;
  screenWidth: number = window.innerWidth;
  nbrOfUsedRows: number = 2;
  showSpinner: boolean = false;
  workflowStep: Workflow = Workflow.StepEnterText;

  private langSub?: Subscription;
  private hasShownKeyboardAlert = false;

  /**
   * Returns the name of the application from the environment configuration.
   */
  get appName(): string {
    return environment.app.name;
  }

  /**
   * Returns the maximum input length for the QR code data.
   */
  get maxInputLength(): number {
    // 2953 = Maximum capacity for QR code version 40 with error correction level L according to Perplexity AI,
    // but scanning no longer works, therefore we are using 1000 - results determined by testing

    return environment.app.maxInputLength ?? 1000;
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

  get cardTitle() {
    return this.workflowStep === Workflow.StepEnterText
      ? this.translate.instant('CREATE_QR_CODE')
      : this.translate.instant('MAIL_QR_CODE');
  }

  /**
   * Performs necessary setup tasks such as showing or hiding the tab bar,
   * setting up event listeners, and initializing services.
   */
  ngOnInit(): void {
    this.createSubscription();
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
    void this.initializeServicesAsync();
    this.setNumberOfRows();
  }

  /**
   * Creates a subscription to the selected language observable from local storage.
   * Updates the translation service with the selected language.
   */
  private createSubscription(): void {
    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.translate.use(lang);
      this.translate.setFallbackLang(lang);
    });
  }

  /**
   * Sets up event listeners for window resize and keyboard events.
   */
  private setupEventListeners(): void {
    // Single resize listener
    window.addEventListener('resize', () => {
      this.screenWidth = window.innerWidth;
      this.setNumberOfRows();
      this.utilsService.showOrHideIonTabBar();
    });
  }

  /**
   * Sets the number of rows for the input field based on the device orientation and QR code content.
   */
  private setNumberOfRows(): void {
    if (this.workflowStep === Workflow.StepEnterText) {
      // fix size for the input field on start
      this.nbrOfUsedRows = this.utilsService.isPortrait ? 6 : 2;
    } else {
      // dynamic size of the input field based on QR code content
      const CHARS_PER_ROW = 30;
      this.nbrOfUsedRows = Math.ceil(
        this.qrService.myAngularxQrCode.length / CHARS_PER_ROW,
      );
    }
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
      this.translate.setFallbackLang('en');
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

    if (currentText.length > (environment.app.clearConfirmationLength ?? 100)) {
      if (!(await this.alertService.showClearConfirmation())) {
        return;
      }
    }

    this.performClear();
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
          ToastAnchor.QR_PAGE,
        )
        .catch((error) => {
          console.error('Error presenting toast:', error);
        });
    } else if (this.emailService.isEmailSent) {
      await this.toastService
        .showDisabledToast(
          'TOOLTIP_GENERATION_EMAIL_ALREADY_SENT',
          ToastAnchor.QR_PAGE,
        )
        .catch((error) => {
          console.error('Error presenting toast:', error);
        });
    } else if (this.qrService.isQrCodeGenerated) {
      await this.toastService
        .showDisabledToast(
          'TOOLTIP_GENERATION_QR_ALREADY_GENERATED',
          ToastAnchor.QR_PAGE,
        )
        .catch((error) => {
          console.error('Error presenting toast:', error);
        });
    } else {
      // Valid input, generate QR code
      this.sanitizeInputAndGenerateQRCode(this.qrDataInput.value);
      this.showWorkflowStep(Workflow.StepGenerate);
      this.setNumberOfRows();
    }
  }

  /**
   * Sanitizes the input data and generates a QR code.
   * Trims trailing whitespace from the input data before generating the QR code.
   * After generating the QR code, scrolls to the bottom of the page if running on a native device.
   */
  sanitizeInputAndGenerateQRCode(data: string | undefined | null) {
    if (typeof data === 'string' && data.trim() !== '') {
      this.showSpinner = true;
      const sanitizedData = this.trimTrailingWhitespace(data);
      this.qrService.generateQRCode(sanitizedData);
      this.showSpinner = false;
    }
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
        ToastAnchor.QR_PAGE,
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
        ToastAnchor.QR_PAGE,
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
          this.qrService.qrCodeDownloadLink,
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
      await this.handleMobileWebEmailOptions();
    }
  }

  /**
   * Handles the mobile web email options.
   * Shows an alert with options for sending email, copying QR code text,
   * or showing manual instructions.
   */
  private async handleMobileWebEmailOptions(): Promise<void> {
    const option: MobileWebEmailOptions =
      await this.alertService.showMobileWebEmailOptions();

    switch (option) {
      case MobileWebEmailOptions.SEND_EMAIL:
        await this.emailService.sendEmail();
        break;
      case MobileWebEmailOptions.COPY_QR_CODE_TEXT:
        await this.copyQRTextToClipboard();
        break;
      case MobileWebEmailOptions.SHOW_MANUAL_INSTRUCTIONS:
        await this.shouldCopyTextAfterManualEmailInstructions();
        break;
      case MobileWebEmailOptions.CANCEL:
        break;
    }
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
        await this.alertService.showCopySuccessAlert(qrText);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = qrText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy'); // Legacy fallback
        textArea.remove();
        await this.alertService.showCopySuccessAlert(qrText);
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      await this.alertService.showErrorAlert('MOBILE_WEB_COPY_ERROR');
    }
  }

  /**
   * Handles the user's choice after viewing the manual email instructions.
   * If the user chose to copy the QR text, it copies it to the clipboard.
   */
  private async shouldCopyTextAfterManualEmailInstructions(): Promise<void> {
    const qrText = this.qrService.myAngularxQrCode;
    const shouldCopy =
      await this.alertService.shouldCopyTextAfterManualEmailInstructions(
        qrText,
      );
    if (shouldCopy) {
      await this.copyQRTextToClipboard();
    }
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
          this.hasShownKeyboardAlert = true;
          await this.alertService.showKeyboardAlert();
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
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}
