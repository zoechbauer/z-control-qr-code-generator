import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorAlertService {

  constructor(
    private alertController: AlertController,
    private translate: TranslateService) { }

  async showErrorAlert(errorKey: string) {
    const errorMessage = await this.translate.get(errorKey).toPromise();
    const errorTitle = await this.translate.get('ERROR_ALERT_TITLE_ERROR').toPromise();
    const OKButton = await this.translate.get('ERROR_ALERT_BUTTON_OK').toPromise();
    const alert = await this.alertController.create({
      header: errorTitle,
      message: errorMessage,
      buttons: [OKButton]
    });
    await alert.present();
  }
}
