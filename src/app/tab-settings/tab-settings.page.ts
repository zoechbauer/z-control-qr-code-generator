import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-tab-settings',
  templateUrl: './tab-settings.page.html',
  styleUrls: ['./tab-settings.page.scss'],
})
export class TabSettingsPage {
  private readonly langSub?: Subscription;

  constructor(
    public translate: TranslateService,
    private readonly localStorage: LocalStorageService
  ) {
    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
    });
  }


  selectedLanguage = this.localStorage.getMobileDefaultLanguage(); // or however you store it

  onLanguageChange(lang: string) {
    this.localStorage.saveSelectedLanguage(lang);
  }

  //   toggleShowAddress() {
  //   this.showAddress = !this.showAddress;
  //   this.performClear();
  // }
}
