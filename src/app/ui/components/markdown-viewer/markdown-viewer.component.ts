import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrls: ['./markdown-viewer.component.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    MarkdownComponent,
    IonSpinner,
    NgIf,
  ],
  providers: [ModalController],
})
export class MarkdownViewerComponent implements OnInit {
  @Input() fullChangeLogPath!: string;
  markdown: string = '';
  showSpinner: boolean = true;

  constructor(
    private readonly http: HttpClient,
    private readonly modalController: ModalController
  ) {
    this.registerIcons();
  }

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  ngOnInit() {
    this.loadMarkdownChangelog();
  }

  closeModal() {
    this.modalController.dismiss();
  }

  private registerIcons() {
    addIcons({
      'close-outline': closeOutline,
    });
  }

  private loadMarkdownChangelog() {
    this.http.get(this.fullChangeLogPath, { responseType: 'text' }).subscribe({
      next: (data) => {
        this.markdown = data;
        this.showSpinner = false;
      },
      error: (error) => {
        console.error('Error loading changelog:', error);
        this.showSpinner = false;
      },
    });
  }
}
