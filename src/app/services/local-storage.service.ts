import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

enum LocalStorage {
  savedEmailAddresses = "savedEmailAddresses"
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  savedEmailAddresses: string[] = [];

  constructor(private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
    await this.loadSavedEmailAddresses();
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
