import { Component, Input } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LogoType, Tab } from '@app/enums';
import { UtilsService } from 'src/app/services/utils.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    NgIf,
    LogoComponent,
  ],
})
export class HeaderComponent {
  @Input() currentTab!: Tab;
  LogoType = LogoType;
  Tab = Tab;

  constructor(
    public translate: TranslateService,
    public readonly utilsService: UtilsService
  ) {}

  /**
   * Returns true if the screen is large.
   */
  get isLargeScreen(): boolean {
    return !this.utilsService.isSmallScreen;
  }

  /**
   * Returns true if the current tab is the QR tab.
   */
  get onQrTab(): boolean {
    return this.currentTab === Tab.Qr;
  }

  /**
   * Returns true if the current tab is the Settings tab.
   */
  get onSettingsTab(): boolean {
    return this.currentTab === Tab.Settings;
  }

  /**
   * Navigates to the Settings tab.
   */
  async goToSettings() {
    await this.utilsService.navigateToTab(Tab.Settings);
  }

  /**
   * Navigates to the QR tab.
   */
  async goToQr() {
    await this.utilsService.navigateToTab(Tab.Qr);
  }

  /**
   * Navigates to the Settings tab and opens the feedback section.
   */
  async goToSettingsAndOpenFeedback() {
    await this.utilsService.navigateToTabWithParams(Tab.Settings, {
      open: 'z-control',
    });
    setTimeout(() => {
      this.utilsService.logoClickedSub.next(true);
    }, 500);
  }

  /**
   * Opens the help modal.
   */
  async openHelpModal() {
    await this.utilsService.openHelpModal();
  }
}
