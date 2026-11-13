import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { NgSwitch, NgIf, NgSwitchCase } from '@angular/common';
import { IonContent, IonicModule } from '@ionic/angular';

import { LocalStorageService } from '../services/local-storage.service';
import { environment } from '@env/environment';
import { UtilsService } from '../services/utils.service';
import { LogoType, Tab } from '../enums';
import { HeaderComponent } from '../ui/components/header/header.component';
import { LanguageAccordionComponent } from '../ui/components/accordions/language-accordion.component';
import { FeedbackAccordionComponent } from '../ui/components/accordions/feedback-accordion.component';
import { ChangeLogAccordionComponent } from '../ui/components/accordions/change-log-accordion.component';
import { GetSourceAccordionComponent } from '../ui/components/accordions/get-source-accordion.component';
import { PrivacyPolicyAccordionComponent } from '../ui/components/accordions/privacy-policy-accordion.component';
import { GetMobileAppAccordionComponent } from '../ui/components/accordions/get-mobile-app-accordion.component';
import { PrintAccordionComponent } from '../ui/components/accordions/print-accordion.component';
import { EmailMaintenanceAccordionComponent } from '../ui/components/accordions/email-maintenance-accordion.component';

@Component({
  selector: 'app-tab-settings',
  templateUrl: './tab-settings.page.html',
  imports: [
    IonicModule,
    TranslatePipe,
    NgSwitch,
    NgSwitchCase,
    NgIf,
    HeaderComponent,
    LanguageAccordionComponent,
    FeedbackAccordionComponent,
    ChangeLogAccordionComponent,
    GetSourceAccordionComponent,
    PrivacyPolicyAccordionComponent,
    GetMobileAppAccordionComponent,
    PrintAccordionComponent,
    EmailMaintenanceAccordionComponent,
  ],
})
export class TabSettingsPage implements OnInit, OnDestroy {
  translate = inject(TranslateService);
  readonly localStorage = inject(LocalStorageService);
  readonly utilsService = inject(UtilsService);

  openAccordion: string | null = null;
  showAllAccordions = true;
  selectedLanguage?: string;
  LogoType = LogoType;
  Tab = Tab;
  private readonly subscriptions: Subscription[] = [];

  /**
   * Returns the name of the application from the environment configuration.
   */
  get appName(): string {
    return environment.app.name;
  }

  /**
   * Returns the version information of the application in the format "major.minor (date)".
   */
  get versionInfo() {
    const { major, minor, date } = {
      major: environment.version.major,
      minor: environment.version.minor,
      date: environment.version.date,
    };
    return `${major}.${minor} (${date})`;
  }

  /**
   * Initializes the component.
   */
  ngOnInit() {
    this.showAllAccordions = true;
    this.setupSubscriptions();
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
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
      }),
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
