import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

enum LocalStorage {
  savedEmailAddresses = "savedEmailAddresses",
  selectedLanguage = "selectedLanguage"
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  savedEmailAddresses: string[] = [];
  selectedLanguage: string = "";

  constructor(private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
    await this.loadSavedEmailAddresses();
    await this.loadSelectedOrDefaultLanguage();
  }

  getMobileDefaultLanguage(): string {
    return navigator.language.split('-')[0];  // e.g. "de-DE" -> "de"
  }

  async loadSelectedOrDefaultLanguage() {
    const selectedLanguage = await this.storage.get(LocalStorage.selectedLanguage);

    if (selectedLanguage) {
      this.selectedLanguage = JSON.parse(selectedLanguage);
    } else {
      this.selectedLanguage = this.getMobileDefaultLanguage();
      await this.saveSelectedLanguage(this.selectedLanguage); 
    }
  }

  async saveSelectedLanguage(language: string) {
    this.selectedLanguage = language;
    await this.storage.set(LocalStorage.selectedLanguage, JSON.stringify(language));
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
