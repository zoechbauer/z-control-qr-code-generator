import { Component } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-language-popover',
  template: `
    <ion-list>
      <ion-item button (click)="changeLanguage('de')">{{'LANGUAGE_DE' | translate}}</ion-item>
      <ion-item button (click)="changeLanguage('en')">{{'LANGUAGE_EN' | translate}}</ion-item>
    </ion-list>
  `,
})
export class LanguagePopoverComponent {
  constructor(
    private translate: TranslateService,
    private popoverController: PopoverController,
    private localStorage: LocalStorageService
  ) {}

  changeLanguage(language: string) {
    this.translate.use(language);
    this.localStorage.saveSelectedLanguage(language);
    this.popoverController.dismiss();
  }
}
