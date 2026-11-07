import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { UtilsService } from './utils.service';
import { ToastAnchor } from '../enums';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(
    public translate: TranslateService,
    private readonly toastController: ToastController,
    private readonly utilsService: UtilsService
  ) {}

  /**
   * Shows a disabled toast message with the given translation key and optional anchor ID.
   * @param toastMsg The translation key for the toast message.
   * @param anchorId The optional anchor ID for positioning the toast.
   */
  async showDisabledToast(toastMsg: string, anchorId?: ToastAnchor) {
    const translatedMsg = this.translate.instant(toastMsg);

    await this.showToastMessage(translatedMsg, anchorId).catch((error) => {
      console.error('Error presenting toast:', error);
    });
  }

  /**
   * Shows a toast message with the given translated message and optional anchor ID.
   * @param translatedToastMessage The translated message to display in the toast.
   * @param anchorId The optional anchor ID for positioning the toast.
   */
  showToast(translatedToastMessage: string, anchorId?: ToastAnchor): void {
    this.showToastMessage(translatedToastMessage, anchorId).catch((error) => {
      console.error('Error presenting toast:', error);
    });
  }

  /**
   * Shows a toast message with the given translated message and optional anchor ID.
   * @param translatedToastMessage The translated message to display in the toast.
   * @param anchorId The optional anchor ID for positioning the toast.
   */
  async showToastMessage(
    translatedToastMessage: string,
    anchorId?: ToastAnchor
  ) {
    const toastOptions: any = {
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
    };

    const anchor = this.getToastAnchor(anchorId);
    if (anchor) {
      toastOptions.positionAnchor = anchor;
    }

    const toast = await this.toastController.create(toastOptions);
    await toast.present();
  }

  /**
   * Determines the position of the toast based on the device type.
   * @returns 'top' for mobile devices and 'bottom' for desktop devices.
   */
  private getToastPosition(): 'top' | 'bottom' {
    if (this.utilsService.isDesktop) {
      return 'bottom';
    }
    // On mobile devices, display toast at the top to prevent it from being obscured by the navigation bar or keyboard.
    return 'top';
  }

  /**
   * Determines the anchor element for the toast based on the device type and optional anchor ID.
   * @param anchorId The optional anchor ID for positioning the toast.
   * @returns The anchor element ID or undefined if no anchor should be set.
   */
  private getToastAnchor(anchorId?: ToastAnchor): string | undefined {
    if (this.utilsService.isDesktop) {
      return undefined; // Do not set anchor on desktop
    }
    // On mobile devices, display toast below the header prevent it from being obscured by the header bar.
    return anchorId || ToastAnchor.SETTINGS_PAGE;
  }
}
