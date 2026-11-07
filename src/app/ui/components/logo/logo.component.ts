import { NgIf } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { LogoType } from 'src/app/enums';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  standalone: true,
  imports: [NgIf],
})
export class LogoComponent implements OnInit, OnChanges {
  @Input() type?: LogoType;
  leftLogoText: string = '';
  rightLogoText: string = '';
  LogoType = LogoType;

  /**
   * Adds a resize event listener to update the logo text when the window is resized.
   */
  constructor() {
    window.addEventListener('resize', () => {
      this.setLogoText();
    });
  }

  /**
   * Sets the initial logo text based on the component type and screen orientation.
   */
  ngOnInit(): void {
    this.setLogoText();
  }

  /**
   * Responds to changes in the input properties.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['type']) {
      this.setLogoText();
    }
  }

  /**
   * Sets the logo text based on the component type and screen orientation.
   */
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

  /**
   * Returns true if the screen is in portrait orientation.
   */
  private get isPortrait(): boolean {
    return window.matchMedia('(orientation: portrait)').matches;
  }
}
