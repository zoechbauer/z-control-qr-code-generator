import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { LogoComponent } from '../logo/logo.component';
import { LogoType } from '../logo/logo.component';

@Component({
  selector: 'app-get-source-code',
  templateUrl: './get-source-code.component.html',
  styleUrls: ['./get-source-code.component.scss'],
  standalone: true,
  imports: [IonIcon, LogoComponent],
})
export class GetSourceCodeComponent  {
  LogoType = LogoType;

  constructor() { }

}
