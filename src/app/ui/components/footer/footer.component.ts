import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  locationOutline,
  chevronUpOutline,
  chevronDownOutline,
  listOutline,
  downloadOutline,
} from 'ionicons/icons';
import {
  IonFooter,
  IonToolbar,
  IonIcon,
  IonButton,
  ModalController,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';

import { MarkdownViewerComponent } from '../markdown-viewer/markdown-viewer.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [IonFooter, IonToolbar, IonIcon, IonButton, TranslateModule, NgIf],
})
export class FooterComponent {
  showDetails = false;

  constructor(
    public translate: TranslateService,
    private readonly modalController: ModalController
  ) {
    this.registerIcons();
  }

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  toggleFooterDetails() {
    this.showDetails = !this.showDetails;
  }

  async openChangelog() {
    const modal = await this.modalController.create({
      component: MarkdownViewerComponent,
      componentProps: {
        fullChangeLogPath: 'assets/logs/CHANGELOG.md',
      },
    });

    await modal.present();
  }

  get versionInfo() {
    const { major, minor, date } = {
      major: environment.version.major,
      minor: environment.version.minor,
      date: environment.version.date,
    };
    return `Version ${major}.${minor} (${date})`;
  }

  get mailtoLink() {
    return "mailto:zcontrol.app.qr@gmail.com?subject=z-control%20QR%20Code%20Generator%20App%20Feedback";
  }

  private registerIcons() {
    addIcons({
      'person-outline': personOutline,
      'mail-outline': mailOutline,
      'location-outline': locationOutline,
      'chevron-up-outline': chevronUpOutline,
      'chevron-down-outline': chevronDownOutline,
      'list-outline': listOutline,
      'download-outline': downloadOutline,
    });
  }
}
