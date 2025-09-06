import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { NgIf, NgTemplateOutlet } from '@angular/common';

import { LogoComponent } from '../logo/logo.component';
import { LogoType } from 'src/app/enums';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  standalone: true,
  imports: [IonIcon, NgIf, NgTemplateOutlet, LogoComponent],
})
export class PrivacyPolicyComponent {
  @Input() lang: string | undefined = 'en';
  LogoType = LogoType;

  constructor() {}
}
