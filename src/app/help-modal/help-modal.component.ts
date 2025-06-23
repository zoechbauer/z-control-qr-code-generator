import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { LocalStorageService } from '../services/local-storage.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
})
export class HelpModalComponent implements OnInit, OnDestroy{
  @Input() maxInputLength!: number;

  scrollToTopObj = {
    id: 'toc-DE',
    text: 'zurück zu Inhaltsverzeichnis',
  };
  selectedLanguage: string = 'de'; 
  private langSub?: Subscription;

  constructor(private readonly modalController: ModalController,
              private readonly localStorage: LocalStorageService
  ) {}

  ngOnInit() {
    this.langSub = this.localStorage.selectedLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
      this.setScrollToTopObj();
    }); 
  }

  private setScrollToTopObj() {
    if (this.selectedLanguage === 'de') {
      this.scrollToTopObj.id = 'toc-DE';
      this.scrollToTopObj.text = 'zurück zu Inhaltsverzeichnis';
    } else if (this.selectedLanguage === 'en') {
      this.scrollToTopObj.id = 'toc';
      this.scrollToTopObj.text = 'back to table of contents';
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }

  scrollTo(id: string, event: Event) {
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToTop() {
    const id = this.scrollToTopObj.id;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnDestroy() {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
  }
}
