import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
})
export class HelpModalComponent implements OnInit, OnDestroy {
  @Input() maxInputLength!: number;

  readonly scrollToTopObj = {
    id: 'toc-DE',
    text: this.translate.instant('SCROLL_TO_TOP_DE'),
  };
  selectedLanguage: string = 'de';
  private langSub?: Subscription;

  constructor(
    private readonly modalController: ModalController,
    private readonly translate: TranslateService,
    private readonly localStorage: LocalStorageService
  ) {}

  ngOnInit() {
    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.selectedLanguage = lang;
      this.setScrollToTopObj();
    });
  }

  private setScrollToTopObj() {
    if (this.selectedLanguage === 'de') {
      this.scrollToTopObj.id = 'toc-DE';
      this.scrollToTopObj.text = this.translate.instant('SCROLL_TO_TOP_DE');
    } else if (this.selectedLanguage === 'en') {
      this.scrollToTopObj.id = 'toc';
      this.scrollToTopObj.text = this.translate.instant('SCROLL_TO_TOP_EN');
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }

  /**
   * Scrolls to a specific element by ID
   * @param id - The ID of the target element
   * @param event - The click event to prevent default behavior
   */
  scrollTo(id: string, event: Event) {
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn(`Element with id '${id}' not found`);
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
    this.langSub?.unsubscribe();
  }
}
