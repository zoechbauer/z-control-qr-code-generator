import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';

import { LocalStorageService } from '../services/local-storage.service';
import { environment } from 'src/environments/environment';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { UtilsService } from '../services/utils.service';
import { LogoType } from '../ui/components/logo/logo.component';

@Component({
  selector: 'app-tab-settings',
  templateUrl: './tab-settings.page.html',
  styleUrls: ['./tab-settings.page.scss'],
})
export class TabSettingsPage implements OnDestroy {
  selectedLanguage?: string;
  LogoType = LogoType;
  private readonly langSub?: Subscription;

  constructor(
    public translate: TranslateService,
    private readonly localStorage: LocalStorageService,
    private readonly modalController: ModalController,
    private readonly utilsService: UtilsService,
  ) {
    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
      this.selectedLanguage = lang;
    });
  }

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  onLanguageChange(lang: string) {
    this.localStorage.saveSelectedLanguage(lang);
    this.translate.use(lang);
    this.translate.setDefaultLang(lang);
  }

  async openChangelog() {
    const modal = await this.modalController.create({
      component: MarkdownViewerComponent,
      componentProps: {
        fullChangeLogPath: 'assets/logs/CHANGELOG.md',
      },
    });

    await modal.present();
  }

  get versionInfo() {
    const { major, minor, date } = {
      major: environment.version.major,
      minor: environment.version.minor,
      date: environment.version.date,
    };
    return `App Version ${major}.${minor} (${date})`;
  }

  openHelpModal() {
    this.utilsService.openHelpModal();
  }

  ngOnDestroy(): void {
      this.langSub?.unsubscribe();
  }
}
