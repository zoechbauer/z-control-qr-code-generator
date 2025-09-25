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

  async showDisabledToast(toastMsg: string, anchorId?: string) {
    const translatedMsg = this.translate.instant(toastMsg);

    this.showToastMessage(translatedMsg, anchorId).catch((error) => {
      console.error('Error presenting toast:', error);
    });
  }

  showToast(translatedToastMessage: string, anchorId?: string): void {
    this.showToastMessage(translatedToastMessage, anchorId).catch((error) => {
      console.error('Error presenting toast:', error);
    });
  }

  async showToastMessage(translatedToastMessage: string, anchorId?: string) {
    const toast = await this.toastController.create({
      message: translatedToastMessage,
      duration: 3000,
      icon: 'information-circle',
      color: 'medium',
      position: this.getToastPosition(),
      positionAnchor: this.getToastAnchor(anchorId),
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
    // On mobile devices, display toast at the top to prevent it from being obscured by the navigation bar or keyboard.
    return 'top';
  }

  private getToastAnchor(anchorId?: string): string {
    if (this.utilsService.isDesktop) {
      return '';
    }
    // On mobile devices, display toast below the header prevent it from being obscured by the header bar.
    return anchorId || 'toast-anchor-settings';
  }
}
