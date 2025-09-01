import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { TranslateModule } from '@ngx-translate/core';

import { HelpModalComponent } from '../help-modal/help-modal.component';
import { LanguagePopoverComponent } from './language-popover.component';
import { ManualInstructionsModalComponent } from './manual-instructions-modal.component';
import { FooterComponent } from '../ui/components/footer/footer.component';
import { TabQrPageRoutingModule } from './tab-qr-routing.module';
import { TabQrPage } from './tab-qr.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabQrPageRoutingModule,
    QRCodeModule,
    TranslateModule,
    FooterComponent
  ],
  declarations: [
    TabQrPage,
    HelpModalComponent,
    LanguagePopoverComponent,
    ManualInstructionsModalComponent,
  ],
  providers: [
    ModalController
  ]
})
export class TabQrPageModule {}

