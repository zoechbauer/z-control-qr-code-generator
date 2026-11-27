import { Injectable, inject } from '@angular/core';
import { SPLASH_SCREEN, STATUS_BAR } from './capacitor-tokens';

@Injectable({ providedIn: 'root' })
export class CapacitorPlatformService {
  private readonly splashScreen = inject(SPLASH_SCREEN);
  private readonly statusBar = inject(STATUS_BAR);

  /**
   * Hides the splash screen.
   */
  async hideSplashScreen() {
    await this.splashScreen.hide();
  }

  /**
   * Sets the status bar overlay.
   * @param overlay Whether the status bar should overlay the web view.
   */
  async setStatusBarOverlay(overlay: boolean) {
    await this.statusBar.setOverlaysWebView({ overlay });
  }
  
  /**
   * Shows the status bar.
   */
  async showStatusBar() {
    await this.statusBar.show();
  }
}