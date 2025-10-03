import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

import { ValidationService } from './validation.service';
import { PrintSettings } from './print-utils.service';
import { EmailAddressStatus, QrCodeGapSize, QrCodesCountPerPage, QrCodeSize } from '../enums';

enum LocalStorage {
  SavedEmailAddresses = 'savedEmailAddresses',
  SavedPrintSettings = 'savedPrintSettings',
  SelectedLanguage = 'selectedLanguage',
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  savedEmailAddresses: string[] = [];
  savedEmailAddressesSubject = new BehaviorSubject<string[]>([]);
  savedEmailAddresses$ = this.savedEmailAddressesSubject.asObservable();

  savedPrintSettings!: PrintSettings;
  savedPrintSettingsSubject = new BehaviorSubject<PrintSettings>(
    this.defaultPrintSettings
  );
  savedPrintSettings$ = this.savedPrintSettingsSubject.asObservable();

  selectedLanguageSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage()
  );
  selectedLanguage$ = this.selectedLanguageSubject.asObservable();

  constructor(
    private readonly storage: Storage,
    private readonly validationService: ValidationService
  ) {}

  async init() {
    await this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
    await this.loadSavedEmailAddresses();
    await this.loadPrintSettings();
    await this.loadSelectedOrDefaultLanguage();
  }

  getMobileDefaultLanguage(): string {
    const lang = navigator.language.split('-')[0]; // e.g. "de-DE" -> "de"
    return /(de|en)/gi.test(lang) ? lang : 'en';
  }

  async loadSelectedOrDefaultLanguage() {
    const selectedLanguage = await this.storage.get(
      LocalStorage.SelectedLanguage
    );

    if (selectedLanguage) {
      this.selectedLanguageSubject.next(JSON.parse(selectedLanguage));
    } else {
      const lang = this.getMobileDefaultLanguage();
      await this.saveSelectedLanguage(lang);
      this.selectedLanguageSubject.next(lang);
    }
  }

  async saveSelectedLanguage(language: string) {
    try {
      await this.storage.set(
        LocalStorage.SelectedLanguage,
        JSON.stringify(language)
      );
      this.selectedLanguageSubject.next(language);
    } catch (error) {
      console.error('Error saving selected language:', error);
    }
  }

  async loadSavedEmailAddresses() {
    const emailAddresses = await this.storage.get(
      LocalStorage.SavedEmailAddresses
    );
    if (emailAddresses) {
      this.savedEmailAddresses = JSON.parse(emailAddresses);
    } else {
      this.savedEmailAddresses = [];
    }
    this.savedEmailAddressesSubject.next(this.savedEmailAddresses);
  }

  async deleteEmailAddress(index: number): Promise<EmailAddressStatus> {
    if (index >= 0 && index < this.savedEmailAddresses.length) {
      this.savedEmailAddresses.splice(index, 1);
      await this.storage.set(
        LocalStorage.SavedEmailAddresses,
        JSON.stringify(this.savedEmailAddresses)
      );
      this.savedEmailAddressesSubject.next(this.savedEmailAddresses);
      return EmailAddressStatus.Removed;
    }
    return EmailAddressStatus.NotFound;
  }

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
          JSON.stringify(this.savedEmailAddresses)
        );
        this.savedEmailAddressesSubject.next(this.savedEmailAddresses);
        return EmailAddressStatus.Added;
      }
    } catch (error) {
      console.error('Error saving email:', error);
    }
    return EmailAddressStatus.Added;
  }

  async loadPrintSettings() {
    const printSettings = await this.storage.get(
      LocalStorage.SavedPrintSettings
    );
    if (printSettings) {
      this.savedPrintSettings = JSON.parse(printSettings);
    } else {
      this.savePrintSettings(this.defaultPrintSettings);
      this.savedPrintSettings = this.defaultPrintSettings;
    }
    this.savedPrintSettingsSubject.next(this.savedPrintSettings);
  }

  async savePrintSettings(settings: PrintSettings) {
    try {
      await this.storage.set(
        LocalStorage.SavedPrintSettings,
        JSON.stringify(settings)
      );
      this.savedPrintSettingsSubject.next(settings);
    } catch (error) {
      console.error('Error saving print settings:', error);
    }
  }

  private get defaultPrintSettings(): PrintSettings {
    return {
      size: QrCodeSize.MEDIUM,
      gap: QrCodeGapSize.SMALL,
      typeOfQrCodesPerPage: QrCodesCountPerPage.FULL_PAGE,
      numberOfQrCodesPerPage: -1, // indicates full page
    };
  }
}
