import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ToastService } from 'src/app/services/toast.service';

import { ValidationService } from 'src/app/services/validation.service';

@Component({
  selector: 'app-email-maintenance',
  templateUrl: './email-maintenance.component.html',
  styleUrls: ['./email-maintenance.component.scss'],
})
export class EmailMaintenanceComponent {
  showAddress: boolean = false;
  newEmailAddressValue: string = '';

  constructor(
    public readonly validationService: ValidationService,
    public localStorage: LocalStorageService,
    public toastService: ToastService
  ) {}

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
    this.addEmailAddress(this.newEmailAddressValue);
    this.newEmailAddressValue = ''; // ✅ Easy to clear!
  }

  async addEmailAddress(newEmailAddress: string) {
    if (typeof newEmailAddress === 'string') {
      await this.localStorage.saveEmail(newEmailAddress);
    }
  }
}
