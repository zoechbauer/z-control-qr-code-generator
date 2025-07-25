import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Component } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  isNativeApp = Capacitor.isNativePlatform();

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    // Hide splash screen immediately when app starts
    if (this.isNativeApp) {
      SplashScreen.hide();

      StatusBar.show();
      StatusBar.setStyle({ style: Style.Default });
    }
  }
}