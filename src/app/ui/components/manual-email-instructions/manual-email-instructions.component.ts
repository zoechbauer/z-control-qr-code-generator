import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  IonToolbar,
  IonTitle,
  IonHeader,
  IonIcon,
  IonButton,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manual-email-instructions',
  templateUrl: './manual-email-instructions.component.html',
  styleUrls: ['./manual-email-instructions.component.scss'],
  imports: [
    IonButtons,
    IonContent,
    IonButton,
    IonIcon,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
  ],
})
export class ManualEmailInstructionsComponent {
  @Input() title!: string;
  @Input() instructions!: string;
  @Input() qrText!: string;
  @Input() qrTextLabel!: string;
  @Input() copyButtonLabel!: string;
  @Input() copyCallback!: () => Promise<void>;

  constructor(private readonly modalController: ModalController) {}

  /**
   * Returns a truncated version of the QR text if it exceeds 400 characters, appending an ellipsis.
   */
  get displayedQrText() {
    return this.qrText.length > 400
      ? this.qrText.slice(0, 400) + ' ...'
      : this.qrText;
  }

  /**
   * Dismisses the modal.
   */
  async dismiss() {
    await this.modalController.dismiss();
  }

  /**
   * Copies the QR text and dismisses the modal.
   */
  async copyAndDismiss() {
    if (this.copyCallback) {
      await this.copyCallback();
    }
    await this.dismiss();
  }
}
