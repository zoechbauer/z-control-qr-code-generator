import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { IonButton } from '@ionic/angular/standalone';

import { LogoComponent } from '../logo/logo.component';
import { LogoType } from '../logo/logo.component';

@Component({
  selector: 'app-get-mobile-app',
  templateUrl: './get-mobile-app.component.html',
  styleUrls: ['./get-mobile-app.component.scss'],
  standalone: true,
  imports: [IonIcon, LogoComponent, IonButton],
})
export class GetMobileAppComponent {
  LogoType = LogoType;
  constructor() {}
}
