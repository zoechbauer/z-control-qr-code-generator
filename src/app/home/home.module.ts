import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { QRCodeModule } from 'angularx-qrcode';
import { TranslateModule } from '@ngx-translate/core';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { LanguagePopoverComponent } from './language-popover.component';
import { ManualInstructionsModalComponent } from './manual-instructions-modal.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    HomePageRoutingModule,
    QRCodeModule,
    TranslateModule,
  ],
  declarations: [
    HomePage,
    HelpModalComponent,
    LanguagePopoverComponent,
    ManualInstructionsModalComponent,
  ],
})
export class HomePageModule {}
