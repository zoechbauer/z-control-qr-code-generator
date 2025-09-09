import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';
import { IonContent } from '@ionic/angular';

import { LocalStorageService } from '../services/local-storage.service';
import { environment } from 'src/environments/environment';
import { UtilsService } from '../services/utils.service';
import { LogoType, Tab } from '../enums';

@Component({
  selector: 'app-tab-settings',
  templateUrl: './tab-settings.page.html',
})
export class TabSettingsPage implements OnInit, OnDestroy {
  openAccordion: string | null = null;
  showAllAccordions = true;
  selectedLanguage?: string;
  LogoType = LogoType;
  Tab = Tab;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    public readonly localStorage: LocalStorageService,
    public readonly utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.showAllAccordions = true;
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe((lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
        this.selectedLanguage = lang;
      })
    );
    this.subscriptions.push(
      this.utilsService.logoClicked$.subscribe(() => {
        this.openFeedbackAccordion();
      })
    );
  }

  private openFeedbackAccordion() {
    this.openAccordion = '';
    this.openAccordion = 'z-control';
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.utilsService.showOrHideIonTabBar();
    });
  }

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  onAccordionGroupChange(event: CustomEvent, content: IonContent) {
    this.openAccordion = event.detail.value;
    this.showAllAccordions = !this.openAccordion ? true : false;
  }

  showAll() {
    this.openAccordion = null;
    this.showAllAccordions = true;
  }

  onLanguageChange(event: any) {
    const lang = event.detail.value;
    this.localStorage.saveSelectedLanguage(lang);
    this.translate.use(lang);
    this.translate.setDefaultLang(lang);
  }

  async openChangelog() {
    this.utilsService.openChangelog();
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
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
