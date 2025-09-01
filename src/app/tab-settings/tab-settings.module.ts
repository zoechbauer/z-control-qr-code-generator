import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

import { TabSettingsPageRoutingModule } from './tab-settings-routing.module';
import { TabSettingsPage } from './tab-settings.page';
import { FooterComponent } from "../ui/components/footer/footer.component";
import { EmailMaintenanceComponent } from '../ui/components/email-maintenance/email-maintenance.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabSettingsPageRoutingModule,
    TranslateModule,
    FooterComponent
],
  declarations: [TabSettingsPage, EmailMaintenanceComponent],
  providers: [
    ModalController
  ]
})
export class TabSettingsPageModule {}
