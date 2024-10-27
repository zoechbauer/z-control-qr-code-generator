import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { QRCodeModule } from 'angularx-qrcode';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { HelpModalComponent } from '../help-modal/help-modal.component';


@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    HomePageRoutingModule,
    QRCodeModule
  ],
  declarations: [HomePage, HelpModalComponent]
})
export class HomePageModule {}
