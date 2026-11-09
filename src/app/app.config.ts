import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withPreloading,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';


import { routes } from './app-routes';
import { ServicesModule } from './services.module';
import { EmailComposer } from 'capacitor-email-composer';
import { EMAIL_COMPOSER } from './services/email-utils.service';

/**
 * Application configuration for the Ionic Angular app, including routing,
 * HTTP client, and translation.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      // all ionic services are now available for injection
      mode: 'md',
    }),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    { provide: EMAIL_COMPOSER, useValue: EmailComposer },

    importProvidersFrom(ServicesModule),

    provideTranslateService({ fallbackLang: 'de' }),
    ...provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),

  ],
};
