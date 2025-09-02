import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  locationOutline,
} from 'ionicons/icons';
import {
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [ IonIcon, TranslateModule],
})
export class FooterComponent {
  showDetails = false;

  constructor(
    public translate: TranslateService,
  ) {
    this.registerIcons();
  }

  get mailtoLink() {
    return "mailto:zcontrol.app.qr@gmail.com?subject=z-control%20QR%20Code%20Generator%20App%20Feedback";
  }

  private registerIcons() {
    addIcons({
      'person-outline': personOutline,
      'mail-outline': mailOutline,
      'location-outline': locationOutline,
    });
  }
}
