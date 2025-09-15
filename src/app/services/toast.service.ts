import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(
    public translate: TranslateService,
    private readonly toastController: ToastController,
    private readonly utilsService: UtilsService
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

  showToast(translatedToastMessage: string): void {
    this.showToastMessage(translatedToastMessage).catch((error) => {
      console.error('Error presenting toast:', error);
    });
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
    if (this.utilsService.isDesktop) {
      return 'bottom';
    }
    // On mobile devices, display toast at the top to prevent it from being obscured by the navigation bar.
    return 'top';
  }
}
