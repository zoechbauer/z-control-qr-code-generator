import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { NgIf, NgTemplateOutlet } from '@angular/common';

import { LogoComponent, LogoType } from '../logo/logo.component';
@Component({
  selector: 'app-get-source-code',
  templateUrl: './get-source-code.component.html',
  styleUrls: ['./get-source-code.component.scss'],
  standalone: true,
  imports: [IonIcon, LogoComponent, NgIf, NgTemplateOutlet],
})
export class GetSourceCodeComponent  {
  @Input() lang: string | undefined = 'en';
  LogoType = LogoType;

  constructor() { }

}
