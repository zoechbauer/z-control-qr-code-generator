import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

export enum LogoType {
  Copyright = 'copyright',
  Company = 'company',
}

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  standalone: true,
  imports: [NgIf],
})
export class LogoComponent {
  @Input() type?: LogoType;
  leftLogoText: string = '';
  rightLogoText: string = '';
  LogoType = LogoType;

  constructor() {
    window.addEventListener('resize', () => {
      this.setLogoText();
    });
  }

  private setLogoText(): void {
    this.leftLogoText = '';
    this.rightLogoText = '';

    if (this.type === LogoType.Copyright) {
      this.leftLogoText = '© 2025';
      this.rightLogoText = 'z-control';
    } else {
      // show company only on landscape mode
      this.rightLogoText = this.isPortrait ? '' : 'z-control';
    }
  }

  private get isPortrait(): boolean {
    return window.matchMedia('(orientation: portrait)').matches;
  }
}
