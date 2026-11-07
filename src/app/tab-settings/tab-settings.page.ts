import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { IonContent } from '@ionic/angular';

import { LocalStorageService } from '../services/local-storage.service';
import { environment } from '@env/environment';
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

  /**
   * Initializes the component.
   */
  ngOnInit() {
    this.showAllAccordions = true;
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
    this.setupSubscriptions();
  }

  /**
   * Sets up subscriptions for language changes and logo clicks.
   */
  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe((lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
        this.selectedLanguage = lang;
      }),
      this.utilsService.logoClicked$.subscribe(() => {
        this.openFeedbackAccordion();
      })
    );
  }

  /**
   * Opens the feedback accordion.
   */
  private openFeedbackAccordion() {
    this.openAccordion = '';
    this.openAccordion = 'z-control';
  }

  /**
   * Sets up event listeners for window resize events.
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.utilsService.showOrHideIonTabBar();
    });
  }

  /**
   * Returns whether the app is running in a native environment.
   */
  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  /**
   * Handles changes to the accordion group.
   * @param event The custom event containing the new accordion value.
   * @param content The IonContent instance for scrolling.
   */
  onAccordionGroupChange(event: CustomEvent, content: IonContent) {
    this.openAccordion = event.detail.value;
    this.showAllAccordions = this.openAccordion == null;
  }

  /**
   * Handles changes to the selected language.
   * @param event The event containing the new language value.
   */
  async onLanguageChange(event: any) {
    const lang = event.detail?.value;
    if (lang) {
      await this.localStorage.saveSelectedLanguage(lang);
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
    }
  }

  /**
   * Shows all accordions by resetting the open accordion state.
   */
  showAll() {
    this.openAccordion = null;
    this.showAllAccordions = true;
  }

  /**
   * Opens the changelog modal.
   */
  async openChangelog() {
    await this.utilsService.openChangelog();
  }

  /**
   * Returns the app version information in format "App Version major.minor (date)".
   */
  get versionInfo() {
    const { major, minor, date } = {
      major: environment.version.major,
      minor: environment.version.minor,
      date: environment.version.date,
    };
    return `App Version ${major}.${minor} (${date})`;
  }

  /**
   * Opens the help modal.
   */
  async openHelpModal() {
    await this.utilsService.openHelpModal();
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
