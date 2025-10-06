import { Component, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonItem,
  IonList,
  IonCard,
} from '@ionic/angular/standalone';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ToastService } from 'src/app/services/toast.service';
import { ValidationService } from 'src/app/services/validation.service';
import { EmailAddressStatus } from 'src/app/enums';

@Component({
  selector: 'app-email-maintenance',
  templateUrl: './email-maintenance.component.html',
  styleUrls: ['./email-maintenance.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    AsyncPipe,
    TranslateModule,
    IonCard,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonItem,
    IonList,
  ],
})
export class EmailMaintenanceComponent implements OnInit {
  newEmailAddressValue: string = '';

  constructor(
    public translate: TranslateService,
    public readonly validationService: ValidationService,
    public localStorage: LocalStorageService,
    public toastService: ToastService
  ) {}

  ngOnInit() {
    this.localStorage.init();
  }

  handleAddEmailAddressButtonClick() {
    if (
      !this.newEmailAddressValue ||
      !this.validationService.isValidEmailAddress(this.newEmailAddressValue)
    ) {
      this.toastService
        .showDisabledToast('TOOLTIP_EMAIL_INVALID_ADDRESS')
        .catch((error) => {
          console.error('Error presenting toast:', error);
        });
      return;
    }

    // Add email and clear input
    this.addEmailAddress(this.newEmailAddressValue).then(() => {
      this.newEmailAddressValue = '';
    });
  }

  async addEmailAddress(newEmailAddress: string) {
    if (typeof newEmailAddress === 'string') {
      const result: EmailAddressStatus =
        await this.localStorage.saveEmailAddress(newEmailAddress);
      if (result === EmailAddressStatus.Added) {
        this.toastService.showToast(
          this.translate.instant('TOAST_EMAIL_ADDRESS_ADDED')
        );
      } else {
        this.toastService.showToast(
          this.translate.instant('TOAST_EMAIL_ADDRESS_EXIST')
        );
      }
    }
  }

  async deleteEmailAddress(index: number) {
    if (typeof index === 'number') {
      const result: EmailAddressStatus =
        await this.localStorage.deleteEmailAddress(index);
      if (result === EmailAddressStatus.Removed) {
        this.toastService.showToast(
          this.translate.instant('TOAST_EMAIL_ADDRESS_REMOVED')
        );
      } else {
        console.error('Error removing email address: Not found');
      }
    }
  }
}
