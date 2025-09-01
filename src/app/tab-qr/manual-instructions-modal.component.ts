import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-manual-instructions-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="instructions-text">{{ instructions }}</div>

      <div class="qr-section">
        <h4>{{ qrTextLabel }}:</h4>
        <div class="qr-text">{{ qrText }}</div>
      </div>

      <div class="button-section">
        <ion-button expand="full" color="primary" (click)="copyAndDismiss()">
          {{ copyButtonLabel }}
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [
    `
      /* Reduce bottom padding of ion-content */
      ion-content {
        --padding-bottom: 10px;
      }

      .instructions-text {
        white-space: pre-line;
        line-height: 1.4;
        margin-bottom: 20px;
        text-align: left;
      }

      .qr-section {
        margin: 20px 0;
        padding: 15px;
        background-color: var(--ion-color-light);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .qr-text {
        font-family: monospace;
        font-size: 14px;
        word-break: break-all;
        white-space: pre-wrap;
        background-color: #404040;
        color: #ffffff;
        padding: 12px;
        border-radius: 6px;
        margin-top: 10px;
        border: 1px solid #606060;
        /* Show 10 lines in modal without scrollbar */
        height: calc(1.4em * 10 + 29px);
        overflow-y: auto;
        overflow-x: hidden;
        line-height: 1.4em;
        scrollbar-width: thin;
        scrollbar-color: #606060 #404040;
      }

      .qr-text::-webkit-scrollbar {
        width: 6px;
      }

      .qr-text::-webkit-scrollbar-track {
        background: #404040;
        border-radius: 3px;
      }

      .qr-text::-webkit-scrollbar-thumb {
        background: #606060;
        border-radius: 3px;
      }

      .qr-text::-webkit-scrollbar-thumb:hover {
        background: #707070;
      }

      .button-section {
        margin: 15px 0 0 0; /* Reduced top margin from 20px to 15px */
        padding-bottom: 0;
        flex-shrink: 0;
      }

      h4 {
        margin: 0 0 10px 0;
        color: var(--ion-color-primary);
        flex-shrink: 0;
      }
    `,
  ],
})
export class ManualInstructionsModalComponent {
  @Input() title!: string;
  @Input() instructions!: string;
  @Input() qrText!: string;
  @Input() qrTextLabel!: string;
  @Input() copyButtonLabel!: string;
  @Input() copyCallback!: () => Promise<void>;

  constructor(private readonly modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  async copyAndDismiss() {
    if (this.copyCallback) {
      await this.copyCallback();
    }
    this.dismiss();
  }
}
