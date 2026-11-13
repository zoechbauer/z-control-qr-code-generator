import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

import { GetHelpComponent } from '../ui/components/get-help/get-help.component';
import { Tab } from '../enums';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  private readonly modalController = inject(ModalController);
  private readonly router = inject(Router);

  logoClickedSub = new Subject<boolean>();
  logoClicked$ = this.logoClickedSub.asObservable();
  private currentModal: HTMLIonModalElement | null = null;

  constructor() {
    window.addEventListener('orientationchange', () => {
      if (this.currentModal) {
        this.setModalLandscapeClasses(this.currentModal);
      }
    });
  }

  /**
   * Determines if the user prefers dark mode.
   * @returns True if dark mode is preferred, false otherwise.
   */
  get isDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Determines if the device is in portrait orientation.
   * @returns True if the device is in portrait orientation, false otherwise.
   */
  get isPortrait(): boolean {
    return window.matchMedia('(orientation: portrait)').matches;
  }

  /**
   * Determines if the device has a small screen.
   * @returns True if the device has a small screen and is in portrait orientation, false otherwise.
   */
  get isSmallScreen(): boolean {
    const isMobileWidth = window.innerWidth <= 768;
    return isMobileWidth && this.isPortrait;
  }

  /**
   * Determines if the device is a small device based on height.
   * @returns True if the device has a small height and is in portrait orientation, false otherwise.
   */
  get isSmallDevice(): boolean {
    const isMobileHeight = window.innerHeight <= 640;
    return isMobileHeight && this.isPortrait;
  }

  /**
   * Determines if the device is a desktop.
   * @returns True if the device is a desktop, false otherwise.
   */
  get isDesktop(): boolean {
    return !Capacitor.isNativePlatform();
  }

  /**
   * Determines if the device is a native platform.
   * @returns True if the device is a native platform, false otherwise.
   */
  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Navigates to the specified tab.
   * @param tab The tab to navigate to.
   */
  async navigateToTab(tab: Tab): Promise<void> {
    await this.router.navigate([`/${tab}`]);
  }

  /**
   * Navigates to the specified tab with query parameters.
   * @param tab The tab to navigate to.
   * @param params The query parameters to include in the navigation.
   */
  async navigateToTabWithParams(tab: Tab, params: any): Promise<void> {
    await this.router.navigate([`/${tab}`], { queryParams: params });
  }

  /**
   * Shows or hides the Ion tab bar based on the screen size.
   */
  showOrHideIonTabBar(): void {
    if (this.isSmallScreen) {
      this.showIonTabBar();
    } else {
      this.hideIonTabBar();
    }
  }

  /**
   * Hides the Ion tab bar.
   */
  private hideIonTabBar(): void {
    const element = document.querySelector('ion-tab-bar');
    if (!element?.classList.contains('hide-ion-tab-bar')) {
      element?.classList.add('hide-ion-tab-bar');
    }
  }

  /**
   * Shows the Ion tab bar.
   */
  private showIonTabBar(): void {
    const element = document.querySelector('ion-tab-bar');
    if (element?.classList.contains('hide-ion-tab-bar')) {
      element?.classList.remove('hide-ion-tab-bar');
    }
  }

  /**
   * Opens the help modal.
   */
  async openHelpModal() {
    const modal = await this.modalController.create({
      component: GetHelpComponent,
    });
    this.currentModal = modal;
    this.setModalLandscapeClasses(modal);
    return await modal.present();
  }

  /**
   * Opens the changelog modal.
   */
  async openChangelog() {
    const modal = await this.modalController.create({
      component: MarkdownViewerComponent,
      componentProps: {
        fullChangeLogPath: 'assets/logs/CHANGELOG.md',
      },
    });
    this.currentModal = modal;
    this.setModalLandscapeClasses(modal);
    return await modal.present();
  }

  /**
   * Sets the landscape classes for the modal based on the device orientation and type.
   * @param modal The modal element to set classes for.
   */
  setModalLandscapeClasses(modal: HTMLIonModalElement) {
    setTimeout(() => {
      if (modal.classList && typeof modal.classList.remove === 'function') {
        modal.classList.remove(
          'manual-email-instructions',
          'change-log-modal',
          'desktop',
          'landscape',
        );
        switch (modal.component) {
          case GetHelpComponent:
            modal.classList.add('manual-email-instructions');
            break;
          case MarkdownViewerComponent:
            modal.classList.add('change-log-modal');
            break;
          default:
            console.error(
              'Unknown modal component for setting landscape class',
            );
        }
        if (this.isDesktop) {
          modal.classList.add('desktop');
        }
        if (!this.isPortrait) {
          modal.classList.add('landscape');
        }
      }
    }, 10);
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

  /**
   * Scrolls to a specific element by its ID.
   * @param elementId The ID of the target element.
   */
  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  /**
   * Scrolls to a specific element by its ID, taking into account the tab bar and navigation bar heights.
   * @param elementId The ID of the target element.
   */
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
