import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import {
  IonToolbar,
  IonTitle,
  IonHeader,
  IonIcon,
  IonButton,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

import { LocalStorageService } from '@app/services/local-storage.service';
import { UtilsService } from '@app/services/utils.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
    imports: [
    IonButtons,
    IonContent,
    IonButton,
    IonIcon,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
  ],
})
export class HelpModalComponent implements OnInit, OnDestroy {
  @Input() scrollToSection?: string; // Optional: ID of the section to scroll to when the modal opens 
  // (e.g., 'floating-keyboard' or 'web-version')

  readonly scrollToTopObj = {
    id: 'toc-DE',
    text: this.translate.instant('SCROLL_TO_TOP_DE'),
  };
  selectedLanguage: string = 'de';
  isPortrait = this.utilsService.isPortrait;
  maxInputLength: number = environment.maxInputLength ?? 1000;

  private langSub?: Subscription;

  constructor(
    public readonly utilsService: UtilsService,
    private readonly modalController: ModalController,
    private readonly translate: TranslateService,
    private readonly localStorage: LocalStorageService
  ) {}

  /**
   * Returns true if the app is running in a native environment, false otherwise.
   */
  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  /**
   * Returns the help text for the email subject, 
   * depending on whether the app is running natively or on the web.
   */
  get emailSubjectHelpText(): string {
    const key = this.isNative ? 'HELP_EMAIL_SUBJECT' : 'HELP_EMAIL_SUBJECT_WEB';
    return this.translate.instant(key);
  }

  /**
   * Returns the help text for the language change button, 
   * depending on whether the app is running natively or on the web.
   */
  get languageChangeButtonHelpText(): string {
    const key = this.isNative
      ? 'HELP_LANGUAGE_CHANGE_BUTTON'
      : 'HELP_LANGUAGE_CHANGE_WEB_BUTTON';
    return this.translate.instant(key);
  }

  /**
   * Returns the help text for the device information, 
   * depending on whether the app is running natively or on the web.
   */
  get deviceText(): string {
    const key = this.isNative ? 'HELP_DEVICE_TEXT' : 'HELP_DEVICE_TEXT_WEB';
    return this.translate.instant(key);
  }

  /**
   * Returns the help text for the floating keyboard section,
   * depending on whether the app is running natively or on the web.
   */
  private readonly orientationListener = () => {
    this.isPortrait = this.utilsService.isPortrait;
  };

  /**
   * Listens for orientation changes and updates the isPortrait property accordingly.
   */
  ngOnInit() {
    // Scroll to specific section if provided
    if (this.scrollToSection) {
      setTimeout(() => {
        this.utilsService.scrollToElement(this.scrollToSection!);
      }, 500); // Delay to ensure modal is fully rendered
    }

    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.selectedLanguage = lang;
      this.setScrollToTopObj();
    });

    window.addEventListener('resize', this.orientationListener);
    window.addEventListener('orientationchange', this.orientationListener);
    this.orientationListener();
  }

  /**
   * Sets the scrollToTopObj based on the selected language.
   */
  private setScrollToTopObj() {
    if (this.selectedLanguage === 'de') {
      this.scrollToTopObj.id = 'toc-DE';
      this.scrollToTopObj.text = this.translate.instant('SCROLL_TO_TOP_DE');
    } else if (this.selectedLanguage === 'en') {
      this.scrollToTopObj.id = 'toc';
      this.scrollToTopObj.text = this.translate.instant('SCROLL_TO_TOP_EN');
    }
  }

  /**
   * Dismisses the help modal.
   */
  async dismissModal() {
    await this.modalController.dismiss();
  }

  /**
   * Scrolls to the top of the help modal based on the scrollToTopObj.
   */
  scrollToTop() {
    this.utilsService.scrollToElement(this.scrollToTopObj.id);
  }

  /**
   * Cleans up subscriptions and event listeners when the component is destroyed.
   */
  ngOnDestroy() {
    this.langSub?.unsubscribe();
    window.removeEventListener('resize', this.orientationListener);
    window.removeEventListener('orientationchange', this.orientationListener);
  }
}
