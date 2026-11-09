import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
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
  callOutline,
  qrCodeOutline,
  personOutline,
  mailOutline,
  locationOutline,
  rocketOutline,
  cloudDownload,
  checkmarkOutline,
  lockClosedOutline,
  logoGooglePlaystore,
} from 'ionicons/icons';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

addIcons({
  'calculator-outline': calculatorOutline,
  'call-outline': callOutline,
  'checkmark-outline': checkmarkOutline,
  close: close,
  'cloud-download': cloudDownload,
  help: help,
  'information-circle': informationCircle,
  'list-outline': listOutline,
  'location-outline': locationOutline,
  'lock-closed-outline': lockClosedOutline,
  'logo-google-playstore': logoGooglePlaystore,
  'mail-outline': mailOutline,
  'open-outline': openOutline,
  'person-outline': personOutline,
  'qr-code-outline': qrCodeOutline,
  'rocket-outline': rocketOutline,
  'settings-outline': settingsOutline,
  'trash-outline': trashOutline,
});

// Register German locale data for number/date pipes
registerLocaleData(localeDe);

void bootstrapApplication(AppComponent, appConfig);
