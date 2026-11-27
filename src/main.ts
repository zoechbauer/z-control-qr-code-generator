import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { addIcons } from 'ionicons';
import {
  calculatorOutline,
  listOutline,
  trashOutline,
  openOutline,
  helpOutline,
  informationCircleOutline,
  closeOutline,
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
  arrowBackOutline,
  arrowUpOutline,
  albumsOutline,
} from 'ionicons/icons';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

addIcons({
  'albums-outline': albumsOutline,
  'arrow-back-outline': arrowBackOutline,
  'arrow-up-outline': arrowUpOutline,
  'calculator-outline': calculatorOutline,
  'call-outline': callOutline,
  'checkmark-outline': checkmarkOutline,
  'close-outline': closeOutline,
  'cloud-download': cloudDownload,
  'help-outline': helpOutline,
  'information-circle-outline': informationCircleOutline,
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
