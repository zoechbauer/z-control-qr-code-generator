import { Component, Input } from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { NgIf, NgTemplateOutlet } from '@angular/common';

import { LogoComponent, LogoType } from '../logo/logo.component';
@Component({
  selector: 'app-get-mobile-app',
  templateUrl: './get-mobile-app.component.html',
  styleUrls: ['./get-mobile-app.component.scss'],
  standalone: true,
  imports: [IonIcon, LogoComponent, IonButton, NgIf, NgTemplateOutlet],
})
export class GetMobileAppComponent {
  @Input() lang: string | undefined = 'en';
  LogoType = LogoType;

  constructor() {}
}
