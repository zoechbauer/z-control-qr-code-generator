import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
})
export class HelpModalComponent {
  @Input() folderName!: string;
  @Input() fileNamePng!: string;
  @Input() fileNamePdf!: string;
  @Input() maxInputLength!: number;
  @Input() selectedLanguage!: string;

  constructor(private modalController: ModalController) { }

  dismissModal() {
    this.modalController.dismiss();
  }

}
