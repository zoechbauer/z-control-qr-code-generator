import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';

import { HelpModalComponent } from '../help-modal/help-modal.component';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(private readonly modalController: ModalController) { }

  async openHelpModal() {
        const isDesktop = !Capacitor.isNativePlatform();
    
        const modal = await this.modalController.create({
          component: HelpModalComponent,
          cssClass: isDesktop
            ? 'manual-instructions-modal desktop'
            : 'manual-instructions-modal',
        });
        return await modal.present();
      }
}
