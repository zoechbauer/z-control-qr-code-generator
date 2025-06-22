import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

enum LocalStorage {
  savedEmailAddresses = "savedEmailAddresses",
  selectedLanguage = "selectedLanguage"
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  savedEmailAddresses: string[] = [];
  selectedLanguageSubj = new BehaviorSubject<string>(this.getMobileDefaultLanguage());
  selectedLanguage$ = this.selectedLanguageSubj.asObservable();

  constructor(private readonly storage: Storage) {}

  async init() {
    await this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
    await this.loadSavedEmailAddresses();
    await this.loadSelectedOrDefaultLanguage();
  }

  getMobileDefaultLanguage(): string {
    const lang = navigator.language.split('-')[0];  // e.g. "de-DE" -> "de"
    return /(de|en)/gi.test(lang) ? lang : "en";
  }

  async loadSelectedOrDefaultLanguage() {
    const selectedLanguage = await this.storage.get(LocalStorage.selectedLanguage);

    if (selectedLanguage) {
      this.selectedLanguageSubj.next(JSON.parse(selectedLanguage));
    } else {
      const lang = this.getMobileDefaultLanguage()
      await this.saveSelectedLanguage(lang); 
      this.selectedLanguageSubj.next(lang);
    }
  }

  async saveSelectedLanguage(language: string) {
    await this.storage.set(LocalStorage.selectedLanguage, JSON.stringify(language));
    this.selectedLanguageSubj.next(language);
  }

  async loadSavedEmailAddresses() {
    const emailAddresses = await this.storage.get(LocalStorage.savedEmailAddresses);
    if (emailAddresses) {
      this.savedEmailAddresses = JSON.parse(emailAddresses);
    }
  }

  async deleteMailAddress(index: number) {
    this.savedEmailAddresses.splice(index, 1);
    await this.storage.set(LocalStorage.savedEmailAddresses, JSON.stringify(this.savedEmailAddresses));
  }

  async saveEmail(email: string) {
    if (email && !this.savedEmailAddresses.includes(email)) {
      this.savedEmailAddresses.push(email);
      await this.storage.set('savedEmailAddresses', JSON.stringify(this.savedEmailAddresses));
    }
  }
}
