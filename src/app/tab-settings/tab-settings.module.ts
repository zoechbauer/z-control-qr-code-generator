import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { TabSettingsPageRoutingModule } from './tab-settings-routing.module';
import { TabSettingsPage } from './tab-settings.page';
import { FooterComponent } from '../ui/components/footer/footer.component';
import { LogoComponent } from '../ui/components/logo/logo.component';
import { PrivacyPolicyComponent } from '../ui/components/privacy-policy/privacy-policy.component';
import { GetSourceCodeComponent } from '../ui/components/get-source-code/get-source-code.component';
import { GetMobileAppComponent } from '../ui/components/get-mobile-app/get-mobile-app.component';
import { HeaderComponent } from '../ui/components/header/header.component';
import { LanguageAccordionComponent } from "../ui/components/accordions/language-accordion.component";
import { FeedbackAccordionComponent } from '../ui/components/accordions/feedback-accordion.component';
import { PrivacyPolicyAccordionComponent } from '../ui/components/accordions/privacy-policy-accordion.component';
import { ChangeLogAccordionComponent } from "../ui/components/accordions/change-log-accordion.component";
import { GetSourceAccordionComponent } from '../ui/components/accordions/get-source-accordion.component';
import { GetMobileAppAccordionComponent } from "../ui/components/accordions/get-mobile-app-accordion.component";
import { EmailMaintenanceAccordionComponent } from '../ui/components/accordions/email-maintenance-accordion.component';

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
    LanguageAccordionComponent,
    FeedbackAccordionComponent,
    PrivacyPolicyAccordionComponent,
    ChangeLogAccordionComponent,
    GetSourceAccordionComponent,
    GetMobileAppAccordionComponent,
    EmailMaintenanceAccordionComponent,
],
  declarations: [TabSettingsPage],
})
export class TabSettingsPageModule {}
