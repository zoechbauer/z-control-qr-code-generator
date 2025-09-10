import { Component, Input } from '@angular/core';
import {
  IonAccordion,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AsyncPipe, CommonModule } from '@angular/common';

import { EmailMaintenanceComponent } from '../email-maintenance/email-maintenance.component';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-email-maintenance-accordion',
  templateUrl: './email-maintenance-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    TranslateModule,
    AsyncPipe,
    EmailMaintenanceComponent,
    CommonModule
  ],
})
export class EmailMaintenanceAccordionComponent {
  @Input() lang: string = 'en';

  constructor(public translate: TranslateService, public localStorage: LocalStorageService) {}
}
