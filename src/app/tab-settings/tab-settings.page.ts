import {
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { NgIf } from '@angular/common';
import {
  IonAccordionGroup,
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { LocalStorageService } from '../services/local-storage.service';
import { environment } from '@env/environment';
import { UtilsService } from '../services/utils.service';
import { LogoType, Tab } from '../shared/enums';
import { HeaderComponent } from '../ui/components/header/header.component';
import { LanguageAccordionComponent } from '../ui/components/accordions/language-accordion.component';
import { FeedbackAccordionComponent } from '../ui/components/accordions/feedback-accordion.component';
import { ChangeLogAccordionComponent } from '../ui/components/accordions/change-log-accordion.component';
import { GetSourceAccordionComponent } from '../ui/components/accordions/get-source-accordion.component';
import { PrivacyPolicyAccordionComponent } from '../ui/components/accordions/privacy-policy-accordion.component';
import { GetMobileAppAccordionComponent } from '../ui/components/accordions/get-mobile-app-accordion.component';
import { PrintAccordionComponent } from '../ui/components/accordions/print-accordion.component';
import { EmailMaintenanceAccordionComponent } from '../ui/components/accordions/email-maintenance-accordion.component';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';

// Single source of truth for settings accordion IDs.
// Add new accordion IDs here when extending the settings page.
const ACCORDION_VALUES = [
  'language',
  'print',
  'emails',
  'z-control',
  'privacy-policy',
  'change-log',
  'get-mobile-app',
  'get-source',
] as const;

type AccordionValue = (typeof ACCORDION_VALUES)[number];

@Component({
  selector: 'app-tab-settings',
  templateUrl: './tab-settings.page.html',
  imports: [
    IonAccordionGroup,
    IonButton,
    IonContent,
    IonIcon,
    TranslatePipe,
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
    SpinnerComponent,
  ],
})
export class TabSettingsPage implements OnInit, OnDestroy {
  readonly translate = inject(TranslateService);
  readonly localStorage = inject(LocalStorageService);
  readonly utilsService = inject(UtilsService);

  private readonly validAccordionValues = new Set<AccordionValue>(
    ACCORDION_VALUES,
  );
  openAccordion: string | null = null;
  showAllAccordions = true;
  selectedLanguage?: string;
  LogoType = LogoType;
  Tab = Tab;
  isLoading = true;
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
   * Returns whether the app is running in a native environment.
   */
  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  /**
   * Sets up necessary subscriptions and event listeners for the settings page.
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
        this.translate.setFallbackLang(lang);
        this.selectedLanguage = lang;
        this.isLoading = false;
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
    this.openAccordion = null;
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
   * Handles changes to the accordion group.
   * @param event The custom event containing the new accordion value.
   * @param content The IonContent instance for scrolling.
   */
  onAccordionGroupChange(event: CustomEvent, content: IonContent) {
    const value = this.normalizeAccordionValue(event?.detail?.value);

    // Ignore bubbled value-change events from nested controls (e.g. radio groups).
    if (value === undefined) {
      return;
    }

    this.openAccordion = value;
    this.showAllAccordions = this.openAccordion == null;
  }

  /**
   * Normalizes the raw value emitted by an accordion group.
   * @param rawValue The raw value from the accordion event
   * @returns The normalized accordion value, null if closed, or undefined if invalid
   */
  private normalizeAccordionValue(
    rawValue: unknown,
  ): AccordionValue | null | undefined {
    // Header toggle close can emit undefined, null, or empty string.
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return null;
    }

    if (
      typeof rawValue === 'string' &&
      this.validAccordionValues.has(rawValue as AccordionValue)
    ) {
      return rawValue as AccordionValue;
    }

    return undefined;
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
      this.translate.setFallbackLang(lang);
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
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
