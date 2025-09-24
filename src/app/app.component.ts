import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Component, Renderer2 } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';

import { SafeAreaInsets } from './services/safe-area-insets';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  isNativeApp = Capacitor.isNativePlatform();

  constructor(
    private readonly renderer: Renderer2,
    private readonly safeAreaInsets: SafeAreaInsets
  ) {
    this.initializeApp();
  }

  initializeApp() {
    if (this.isNativeApp) {
      this.renderer.addClass(document.body, 'native-app');

      SplashScreen.hide();

      this.safeAreaInsets.setSafeAreaInsetsFix();

      StatusBar.setOverlaysWebView({ overlay: false });

      const isDarkMode = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;

      const primaryColor = '#3880ff';

      if (isDarkMode) {
        StatusBar.setBackgroundColor({ color: primaryColor });
        StatusBar.setStyle({ style: Style.Light });
      } else {
        StatusBar.setBackgroundColor({ color: primaryColor });
        StatusBar.setStyle({ style: Style.Dark });
      }

      StatusBar.show();
    } else {
      this.renderer.addClass(document.body, 'web-app');
    }
  }
}
