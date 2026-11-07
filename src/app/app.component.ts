import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';

import { SafeAreaInsets } from './services/safe-area-insets';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  isNativeApp = Capacitor.isNativePlatform();
  readonly splashScreen = SplashScreen;
  readonly statusBar = StatusBar;

  constructor(
    private readonly renderer: Renderer2,
    private readonly safeAreaInsets: SafeAreaInsets
  ) {}

  ngOnInit(): void {
    void this.initializeApp();
  }

  /**
   * Initializes the app and sets up native-specific configurations.
   */
  async initializeApp() {
    this.isNativeApp = Capacitor.isNativePlatform();

    if (this.isNativeApp) {
      this.renderer.addClass(document.body, 'native-app');

      try {
        await this.splashScreen.hide();
      } catch {
        // SplashScreen is unavailable on web test environments.
      }

      this.safeAreaInsets.setSafeAreaInsetsFix();

      // don't use utilsService.isDarkMode here to avoid broken layout
      const isDarkMode = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;

      const primaryColor = '#3880ff';

      try {
        await this.statusBar.setOverlaysWebView({ overlay: false });

        if (isDarkMode) {
          await this.statusBar.setBackgroundColor({ color: primaryColor });
          await this.statusBar.setStyle({ style: Style.Light });
        } else {
          await this.statusBar.setBackgroundColor({ color: primaryColor });
          await this.statusBar.setStyle({ style: Style.Dark });
        }

        await this.statusBar.show();
      } catch {
        // StatusBar is not implemented on the web platform and can still be
        // simulated in unit tests without failing the app initialization.
      }
    } else {
      this.renderer.addClass(document.body, 'web-app');
    }
  }
}
