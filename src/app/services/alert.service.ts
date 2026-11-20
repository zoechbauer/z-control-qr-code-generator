import { inject, Injectable } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';

import { environment } from 'src/environments/environment.prod';
import { UtilsService } from './utils.service';
import { GetHelpComponent } from '../ui/components/get-help/get-help.component';
import { MobileWebEmailOptions } from '../shared/enums';
import { ManualEmailInstructionsComponent } from '../ui/components/manual-email-instructions/manual-email-instructions.component';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  // important: you cannot use html tags e.g. <br> in the alert messages, because it will not be rendered correctly
  // use '\n' for line breaks instead, which will be rendered correctly in the alert for mobile but not for web

  private readonly alertController = inject(AlertController);
  private readonly translate = inject(TranslateService);
  private readonly modalController = inject(ModalController);
  private readonly utilsService = inject(UtilsService);

  /**
   * Shows an error alert with a translated title and message.
   * @param errorKey The translation key for the error message.
   */
  async showErrorAlert(errorKey: string) {
    const errorMessage = await lastValueFrom(this.translate.get(errorKey));
    const errorTitle = await lastValueFrom(
      this.translate.get('ERROR_ALERT_TITLE_ERROR'),
    );
    const OKButton = await lastValueFrom(
      this.translate.get('ERROR_ALERT_BUTTON_OK'),
    );
    const alert = await this.alertController.create({
      header: errorTitle,
      message: errorMessage,
      buttons: [OKButton],
    });
    await alert.present();
  }

  /**
   * Shows a storage permission error alert with translated title, subheader, and message.
   */
  async showStoragePermissionError(): Promise<void> {
    const alert = await this.alertController.create({
      header: await lastValueFrom(
        this.translate.get('ERROR_MESSAGE_SAVE_QR_HEADER'),
      ),
      subHeader: await lastValueFrom(
        this.translate.get('ERROR_MESSAGE_SAVE_QR_SUBHEADER'),
      ),
      message: await lastValueFrom(
        this.translate.get('ERROR_MESSAGE_SAVE_QR_MESSAGE'),
      ),
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  /**
   * Shows a confirmation alert before clearing the input field.
   * @returns true if the user confirmed clearing the input, false otherwise.
   */
  async showClearConfirmation(): Promise<boolean> {
    const alert = await this.alertController.create({
      header: this.translate.instant('CLEAR_CONFIRMATION_HEADER'),
      message: this.translate.instant('CLEAR_CONFIRMATION_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('CLEAR_CONFIRMATION_BUTTON'),
          role: 'destructive',
        },
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
        },
      ],
    });
    await alert.present();

    const { role } = await alert.onDidDismiss();
    return role === 'destructive';
  }

  /**
   * Shows a success alert after copying text to the clipboard.
   * Displays a preview of the copied text.
   * @param copiedText The text that was copied to the clipboard.
   */
  async showCopySuccessAlert(copiedText: string): Promise<void> {
    const maxPreviewLength = environment.app.maxPreviewLengthOfCopiedText ?? 50;
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
   * @returns A promise that resolves when the alert is presented.
   */
  async showKeyboardAlert(): Promise<void> {
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
          role: 'cancel',
          handler: async () => {
            await alert.dismiss();
          },
        },
      ],
    });

    return await alert.present();
  }

  /**
   * Opens the help modal and scrolls to the specified section.
   * @param sectionType The section to scroll to ('floating-keyboard' or 'web-version').
   * @param maxInputLength The maximum input length for the help modal.
   * @returns A promise that resolves when the modal is presented.
   */
  private async openHelpModalToSection(
    sectionType: 'floating-keyboard' | 'web-version',
  ): Promise<void> {
    const isDesktop = !this.utilsService.isNative;
    const currentLang = this.translate.getCurrentLang() || 'en';
    const sectionId = currentLang === 'de' ? `${sectionType}-DE` : sectionType;

    const modal = await this.modalController.create({
      component: GetHelpComponent,
      componentProps: {
        scrollToSection: sectionId,
      },
      cssClass: isDesktop
        ? 'manual-email-instructions desktop'
        : 'manual-email-instructions',
    });

    return await modal.present();
  }

  /**
   * Shows alternative email options for mobile web browsers.
   * @returns The option chosen by the user.
   */
  async showMobileWebEmailOptions(): Promise<MobileWebEmailOptions> {
    let option: MobileWebEmailOptions;

    const alert = await this.alertController.create({
      header: this.translate.instant('MOBILE_WEB_EMAIL_TITLE'),
      message: this.translate.instant('MOBILE_WEB_EMAIL_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('MOBILE_WEB_TRY_EMAIL'),
          role: MobileWebEmailOptions.SEND_EMAIL,
        },
        {
          text: this.translate.instant('MOBILE_WEB_COPY_TEXT'),
          role: MobileWebEmailOptions.COPY_QR_CODE_TEXT,
        },
        {
          text: this.translate.instant('MOBILE_WEB_INSTRUCTIONS'),
          role: MobileWebEmailOptions.SHOW_MANUAL_INSTRUCTIONS,
        },
        {
          text: this.translate.instant('CANCEL'),
          role: MobileWebEmailOptions.CANCEL,
        },
      ],
      cssClass: 'show-mobile-web-email-options',
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    option = role as MobileWebEmailOptions;
    return option;
  }

  /**
   * Determines if the user chose to copy the QR text after viewing the manual email instructions.
   * @param qrText The QR text displayed in the manual email instructions.
   * @returns true if the user chose to copy the QR text, false otherwise.
   */

  async shouldCopyTextAfterManualEmailInstructions(
    qrText: string,
  ): Promise<boolean> {
    const baseMessage = this.translate.instant('MOBILE_WEB_MANUAL_MESSAGE');

    const modal = await this.modalController.create({
      component: ManualEmailInstructionsComponent,
      componentProps: {
        title: this.translate.instant('MOBILE_WEB_MANUAL_TITLE'),
        instructions: baseMessage,
        qrText: qrText,
        qrTextLabel: this.translate.instant('MOBILE_WEB_QR_TEXT'),
        copyButtonLabel: this.translate.instant('MOBILE_WEB_COPY_TEXT'),
        // copyCallback: () => this.copyQRTextToClipboard(),
      },
      cssClass: 'manual-email-instructions',
    });

    await modal.present();

    const { role } = await modal.onDidDismiss();
    return role === 'destructive';
  }
}
