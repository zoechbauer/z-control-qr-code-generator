import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  // important: you cannot use html tags e.g. <br> in the alert messages, because it will not be rendered correctly
  // use '\n' for line breaks instead, which will be rendered correctly in the alert for mobile but not for web

  constructor(
    private readonly alertController: AlertController,
    private readonly translate: TranslateService) { }

  async showErrorAlert(errorKey: string) {
    const errorMessage = await lastValueFrom(this.translate.get(errorKey));
    const errorTitle = await lastValueFrom(this.translate.get('ERROR_ALERT_TITLE_ERROR'));
    const OKButton = await lastValueFrom(this.translate.get('ERROR_ALERT_BUTTON_OK'));
    const alert = await this.alertController.create({
      header: errorTitle,
      message: errorMessage,
      buttons: [OKButton]
    });
    await alert.present();
  }

  async showInfoAlert(headerKey: string, subheaderInfo: string, messageKey: string) {
    const infoTitle = await lastValueFrom(this.translate.get(headerKey));
    const infoMessage = await lastValueFrom(this.translate.get(messageKey));
    const OKButton = await lastValueFrom(this.translate.get('ERROR_ALERT_BUTTON_OK'));
    const alert = await this.alertController.create({
      header: infoTitle,
      subHeader: subheaderInfo,
      message: infoMessage,
      buttons: [OKButton]
    });
    await alert.present();
  }
}
