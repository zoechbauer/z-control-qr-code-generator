import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

import { HelpModalComponent } from '../help-modal/help-modal.component';
import { Tab } from '../enums';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  logoClickedSub = new BehaviorSubject<void>(undefined);
  logoClicked$ = this.logoClickedSub.asObservable();

  constructor(
    private readonly modalController: ModalController,
    private readonly router: Router
  ) {}

  get isPortrait(): boolean {
    return window.matchMedia('(orientation: portrait)').matches;
  }

  get isSmallScreen(): boolean {
    const isMobileWidth = window.innerWidth <= 768;
    return isMobileWidth && this.isPortrait;
  }

  get isDesktop(): boolean {
    return !Capacitor.isNativePlatform();
  }

  navigateToTab(tab: Tab): void {
    this.router.navigate([`/tabs/tab-${tab}`]);
  }

  navigateToTabWithParams(tab: Tab, params: any): void {
    this.router.navigate([`/tabs/tab-${tab}`], { queryParams: params });
  }

  showOrHideIonTabBar(): void {
    if (this.isSmallScreen) {
      this.showIonTabBar();
    } else {
      this.hideIonTabBar();
    }
  }

  private hideIonTabBar(): void {
    const element = document.querySelector('ion-tab-bar');
    if (!element?.classList.contains('hide-ion-tab-bar')) {
      element?.classList.add('hide-ion-tab-bar');
    }
  }

  private showIonTabBar(): void {
    const element = document.querySelector('ion-tab-bar');
    if (element?.classList.contains('hide-ion-tab-bar')) {
      element?.classList.remove('hide-ion-tab-bar');
    }
  }

  async openHelpModal() {
    const modal = await this.modalController.create({
      component: HelpModalComponent,
      cssClass: this.isDesktop
        ? 'manual-instructions-modal desktop'
        : 'manual-instructions-modal',
    });
    return await modal.present();
  }

    async openChangelog() {
      const modal = await this.modalController.create({
        component: MarkdownViewerComponent,
        componentProps: {
          fullChangeLogPath: 'assets/logs/CHANGELOG.md',
        },
        cssClass: this.isDesktop
          ? 'change-log-modal desktop'
          : 'change-log-modal',
      });
  
      await modal.present();
    }

  /**
   * Scrolls to a specific element by ID
   * @param id - The ID of the target element
   * @param event - The click event to prevent default behavior
   */
  scrollTo(id: string, event: Event) {
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  }

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  scrollToElementUsingTabBar(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      const tabBarHeight = 60;
      const navigationBarHeight = 44;
      const yOffset = -navigationBarHeight - tabBarHeight;

      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      element.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
}
