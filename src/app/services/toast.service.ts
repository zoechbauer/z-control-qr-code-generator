import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { Toast } from '../enums';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(
    public translate: TranslateService,
    private readonly toastController: ToastController
  ) {}

  async showDisabledToast(toastMsg: string) {
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

  showToast(toastType: Toast): void {
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

  async showToastMessage(translatedToastMessage: string) {
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

  private getToastPosition(): 'top' | 'bottom' {
    // return this.isKeyboardOpen ? 'top' : 'bottom';
    // always on top to avoid covering by navigation bar
    return 'top';
  }
}
