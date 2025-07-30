import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

import { ValidationService } from './validation.service';

enum LocalStorage {
  SavedEmailAddresses = 'savedEmailAddresses',
  SelectedLanguage = 'selectedLanguage',
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  savedEmailAddresses: string[] = [];
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
    }
  }

  async deleteMailAddress(index: number) {
    if (index >= 0 && index < this.savedEmailAddresses.length) {
      this.savedEmailAddresses.splice(index, 1);
      await this.storage.set(
        LocalStorage.SavedEmailAddresses,
        JSON.stringify(this.savedEmailAddresses)
      );
    }
  }

  async saveEmail(email: string) {
    try {
      const sanitizedEmail = this.validationService.sanitizeEmail(email);

      if (
        sanitizedEmail &&
        !this.savedEmailAddresses.includes(sanitizedEmail)
      ) {
        this.savedEmailAddresses.push(sanitizedEmail);
        await this.storage.set(
          LocalStorage.SavedEmailAddresses,
          JSON.stringify(this.savedEmailAddresses)
        );
      }
    } catch (error) {
      console.error('Error saving email:', error);
    }
  }
}
