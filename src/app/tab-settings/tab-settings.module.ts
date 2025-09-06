import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { TabSettingsPageRoutingModule } from './tab-settings-routing.module';
import { TabSettingsPage } from './tab-settings.page';
import { FooterComponent } from '../ui/components/footer/footer.component';
import { EmailMaintenanceComponent } from '../ui/components/email-maintenance/email-maintenance.component';
import { LogoComponent } from '../ui/components/logo/logo.component';
import { PrivacyPolicyComponent } from '../ui/components/privacy-policy/privacy-policy.component';
import { GetSourceCodeComponent } from '../ui/components/get-source-code/get-source-code.component';
import { GetMobileAppComponent } from '../ui/components/get-mobile-app/get-mobile-app.component';
import { HeaderComponent } from '../ui/components/header/header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabSettingsPageRoutingModule,
    TranslateModule,
    FooterComponent,
    LogoComponent,
    PrivacyPolicyComponent,
    GetSourceCodeComponent,
    GetMobileAppComponent,
    HeaderComponent,
  ],
  declarations: [TabSettingsPage, EmailMaintenanceComponent],
})
export class TabSettingsPageModule {}
