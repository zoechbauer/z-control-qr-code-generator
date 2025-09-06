import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonAccordionGroup, IonAccordion  } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { TranslateModule } from '@ngx-translate/core';

import { HelpModalComponent } from '../help-modal/help-modal.component';
import { LanguagePopoverComponent } from './language-popover.component';
import { ManualInstructionsModalComponent } from './manual-instructions-modal.component';
import { FooterComponent } from '../ui/components/footer/footer.component';
import { TabQrPageRoutingModule } from './tab-qr-routing.module';
import { TabQrPage } from './tab-qr.page';
import { LogoComponent } from '../ui/components/logo/logo.component';
import { HeaderComponent } from '../ui/components/header/header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabQrPageRoutingModule,
    QRCodeModule,
    TranslateModule,
    FooterComponent,
    LogoComponent,
    HeaderComponent
  ],
  declarations: [
    TabQrPage,
    HelpModalComponent,
    LanguagePopoverComponent,
    ManualInstructionsModalComponent,
  ],
})
export class TabQrPageModule {}

