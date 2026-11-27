import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';

import { environment } from '../environments/environment';
import { LocalStorageService } from './services/local-storage.service';
import { SystemBarsService } from './services/system-bars.service';
import { SafeAreaInsetsService } from './services/safe-area-insets.service';
import { CapacitorPlatformService } from './services/capacitor-platform.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly renderer = inject(Renderer2);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly safeAreaInsets = inject(SafeAreaInsetsService);
  private readonly systemBars = inject(SystemBarsService);
  private readonly capacitorPlatformService = inject(CapacitorPlatformService);

  isNativeApp = Capacitor.isNativePlatform();
  showTabsBar = environment.app.showTabsBar;

  /**
   * Initializes the application and sets up platform-specific configurations.
   */
  ngOnInit() {
    void this.initializeApp();
  }

  /**
   * Initialize the application by setting up platform-specific configurations,
   * initializing services, starting network monitoring, and managing the splash screen and status bar.
   * This method is called during the component's initialization phase (ngOnInit).
   */
  async initializeApp() {
    if (this.isNativeApp) {
      this.renderer.addClass(document.body, 'native-app');

      await this.capacitorPlatformService.hideSplashScreen();
      await this.capacitorPlatformService.setStatusBarOverlay(false);
      this.safeAreaInsets.setSafeAreaInsetsFix();

      const isDarkMode = this.systemBars.getCurrentIsDarkMode();
      await this.systemBars.setBars(isDarkMode);

      await this.capacitorPlatformService.showStatusBar();
    } else {
      this.renderer.addClass(document.body, 'web-app');
    }

    await this.localStorageService.initializeServicesAsync(this.translate);
  }
}
