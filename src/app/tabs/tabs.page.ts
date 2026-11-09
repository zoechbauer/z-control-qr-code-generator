import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonLabel,
  IonIcon,
  IonTabButton,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [
    IonTabs,
    IonTabBar,
    IonLabel,
    IonIcon,
    IonTabButton,
    IonRouterOutlet,
    TranslateModule,
  ],
})
export class TabsPage {
  constructor(public translate: TranslateService) {}
}
