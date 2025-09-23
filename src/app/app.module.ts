import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideMarkdown } from 'ngx-markdown';
import { EmailComposer } from 'capacitor-email-composer';
import { addIcons } from 'ionicons';
import {
  calculatorOutline,
  listOutline,
  trashOutline,
  openOutline,
  help,
  informationCircle,
  close,
  settingsOutline,
  qrCodeOutline,
  personOutline,
  mailOutline,
  locationOutline,
} from 'ionicons/icons';

addIcons({
  'calculator-outline': calculatorOutline,
  'list-outline': listOutline,
  'trash-outline': trashOutline,
  'open-outline': openOutline,
  help: help,
  'information-circle': informationCircle,
  close: close,
  'settings-outline': settingsOutline,
  'qr-code-outline': qrCodeOutline,
  'person-outline': personOutline,
  'mail-outline': mailOutline,
  'location-outline': locationOutline,
});

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { EMAIL_COMPOSER } from './services/email-utils.service';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: EMAIL_COMPOSER, useValue: EmailComposer },
    provideHttpClient(withInterceptorsFromDi()),
    provideMarkdown(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
