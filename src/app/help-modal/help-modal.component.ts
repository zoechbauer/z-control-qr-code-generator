import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
})
export class HelpModalComponent {
  @Input() fileName!: string;
  @Input() folderName!: string;

  constructor(private modalController: ModalController) { }

  dismissModal() {
    this.modalController.dismiss();
  }

}
