import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

import { ValidationService } from './validation.service';
import { PrintSettings } from './print-utils.service';
import {
  EmailAddressStatus,
  QrCodeGapSize,
  QrCodesCountPerPage,
  QrCodeSize,
} from '../shared/enums';
import { FileUtilsService } from './file-utils.service';

enum LocalStorage {
  SavedEmailAddresses = 'savedEmailAddresses',
  SavedPrintSettings = 'savedPrintSettings',
  SelectedLanguage = 'selectedLanguage',
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly storage = inject(Storage);
  private readonly validationService = inject(ValidationService);
  private readonly fileService = inject(FileUtilsService);

  savedEmailAddresses: string[] = [];
  savedEmailAddressesSubject = new BehaviorSubject<string[]>([]);
  savedEmailAddresses$ = this.savedEmailAddressesSubject.asObservable();

  savedPrintSettings!: PrintSettings;
  savedPrintSettingsSubject = new BehaviorSubject<PrintSettings>(
    this.defaultPrintSettings,
  );
  savedPrintSettings$ = this.savedPrintSettingsSubject.asObservable();

  selectedLanguageSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage(),
  );
  selectedLanguage$ = this.selectedLanguageSubject.asObservable();

  /**
   * Initializes the storage by creating it if it doesn't exist.
   */
  private async initStorage() {
    await this.storage.create();
  }

  /**
   * Initializes the storage service and loads necessary data.
   * @param translate The TranslateService instance
   */
  async initializeServicesAsync(
    translate: import('@ngx-translate/core').TranslateService,
  ): Promise<void> {
    try {
      await this.initStorage();
      await this.loadSelectedOrDefaultLanguage();
      await this.loadSavedEmailAddresses();
      await this.loadPrintSettings();

      // Non-critical operation - can fail silently
      try {
        await this.fileService.deleteAllQrCodeFilesAfterSpecifiedTime();
      } catch (cleanupError) {
        console.warn('File cleanup failed:', cleanupError);
      }
    } catch (error) {
      console.error('App initialization failed:', error);
      this.initializeWithDefaults(translate);
    }
  }

  /**
   * Fallback: sets default language to 'en' in TranslateService
   */
  private initializeWithDefaults(
    translate: import('@ngx-translate/core').TranslateService,
  ): void {
    try {
      translate.setFallbackLang('en');
      translate.use('en');
    } catch (fallbackError) {
      console.error('Critical: Even defaults failed:', fallbackError);
    }
  }

  /**
   * Gets the mobile device's default language.
   * @returns The default language code (e.g., "de" or "en").
   */
  getMobileDefaultLanguage(): string {
    const lang = navigator.language.split('-')[0]; // e.g. "de-DE" -> "de"
    return /(de|en)/gi.test(lang) ? lang : 'en';
  }

  /**
   * Loads the selected language from storage, or sets and returns the default language if not found.
   * Updates the selectedLanguageSubject accordingly.
   * @returns The selected or default language code
   */
  async loadSelectedOrDefaultLanguage(): Promise<string> {
    const selectedLanguage = await this.storage.get(
      LocalStorage.SelectedLanguage,
    );

    if (selectedLanguage) {
      this.selectedLanguageSubject.next(selectedLanguage);
      return selectedLanguage;
    } else {
      const lang = this.getMobileDefaultLanguage();
      await this.saveSelectedLanguage(lang);
      this.selectedLanguageSubject.next(lang);
      return lang;
    }
  }

  /**
   * Parses JSON safely for stored values that may already be plain strings.
   */
  private parseStoredValue<T>(value: T, fallback: T): T {
    if (value === null || value === undefined) {
      return fallback;
    }

    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value;
    }
  }

  /**
   * Saves the selected language to storage.
   * @param language The language code to save.
   */
  async saveSelectedLanguage(language: string) {
    if (!language) {
      throw new Error('Language must be provided');
    }
    try {
      await this.storage.set(LocalStorage.SelectedLanguage, language);
      this.selectedLanguageSubject.next(language);
    } catch (error) {
      console.error('Error saving selected language:', error);
    }
  }

  /**
   * Loads the saved email addresses from storage.
   */
  async loadSavedEmailAddresses() {
    const emailAddresses = await this.storage.get(
      LocalStorage.SavedEmailAddresses,
    );
    this.savedEmailAddresses = this.parseStoredValue<string[]>(
      emailAddresses,
      [],
    );
    this.savedEmailAddressesSubject.next(this.savedEmailAddresses);
  }

  /**
   * Deletes an email address at the specified index.
   * @param index The index of the email address to delete.
   * @returns The status of the deletion operation.
   */
  async deleteEmailAddress(index: number): Promise<EmailAddressStatus> {
    if (index >= 0 && index < this.savedEmailAddresses.length) {
      this.savedEmailAddresses.splice(index, 1);
      await this.storage.set(
        LocalStorage.SavedEmailAddresses,
        JSON.stringify(this.savedEmailAddresses),
      );
      this.savedEmailAddressesSubject.next(this.savedEmailAddresses);
      return EmailAddressStatus.Removed;
    }
    return EmailAddressStatus.NotFound;
  }

  /**
   * Saves a new email address to storage.
   * @param emailAddress The email address to save.
   * @returns The status of the save operation.
   */
  async saveEmailAddress(emailAddress: string): Promise<EmailAddressStatus> {
    try {
      const sanitizedEmailAddress =
        this.validationService.sanitizeEmail(emailAddress);

      if (
        sanitizedEmailAddress &&
        this.savedEmailAddresses.includes(sanitizedEmailAddress)
      ) {
        return EmailAddressStatus.Duplicate;
      }

      if (
        sanitizedEmailAddress &&
        !this.savedEmailAddresses.includes(sanitizedEmailAddress)
      ) {
        this.savedEmailAddresses.push(sanitizedEmailAddress);
        await this.storage.set(
          LocalStorage.SavedEmailAddresses,
          JSON.stringify(this.savedEmailAddresses),
        );
        this.savedEmailAddressesSubject.next(this.savedEmailAddresses);
        return EmailAddressStatus.Added;
      }
    } catch (error) {
      console.error('Error saving email:', error);
    }
    return EmailAddressStatus.Added;
  }

  /**
   * Loads the saved print settings from storage or defaults to the default print settings.
   */
  async loadPrintSettings() {
    const printSettings = await this.storage.get(
      LocalStorage.SavedPrintSettings,
    );
    if (printSettings !== null && printSettings !== undefined) {
      this.savedPrintSettings = this.parseStoredValue<PrintSettings>(
        printSettings,
        this.defaultPrintSettings,
      );
    } else {
      await this.savePrintSettings(this.defaultPrintSettings);
      this.savedPrintSettings = this.defaultPrintSettings;
    }
    this.savedPrintSettingsSubject.next(this.savedPrintSettings);
  }

  /**
   * Saves the print settings to storage.
   * @param settings The print settings to save.
   */
  async savePrintSettings(settings: PrintSettings) {
    try {
      await this.storage.set(
        LocalStorage.SavedPrintSettings,
        JSON.stringify(settings),
      );
      this.savedPrintSettingsSubject.next(settings);
    } catch (error) {
      console.error('Error saving print settings:', error);
    }
  }

  /**
   * Returns the default print settings.
   */
  private get defaultPrintSettings(): PrintSettings {
    return {
      size: QrCodeSize.MEDIUM,
      gap: QrCodeGapSize.SMALL,
      typeOfQrCodesPerPage: QrCodesCountPerPage.FULL_PAGE,
      numberOfQrCodesPerPage: -1, // indicates full page
    };
  }
}
