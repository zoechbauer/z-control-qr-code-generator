import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';

import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from './../services/utils.service';

@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
})
export class HelpModalComponent implements OnInit, OnDestroy {
  @Input() maxInputLength!: number;
  @Input() scrollToSection?: string; // for direct section navigation

  readonly scrollToTopObj = {
    id: 'toc-DE',
    text: this.translate.instant('SCROLL_TO_TOP_DE'),
  };
  selectedLanguage: string = 'de';
  isPortrait = window.matchMedia('(orientation: portrait)').matches;

  private langSub?: Subscription;

  private readonly orientationListener = () => {
    this.isPortrait = window.matchMedia('(orientation: portrait)').matches;
  };

  constructor(
    public readonly utilsService: UtilsService,
    private readonly modalController: ModalController,
    private readonly translate: TranslateService,
    private readonly localStorage: LocalStorageService,
  ) {}

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  ngOnInit() {
    // Scroll to specific section if provided
    if (this.scrollToSection) {
      setTimeout(() => {
        this.utilsService.scrollToElement(this.scrollToSection!);
      }, 500); // Delay to ensure modal is fully rendered
    }

    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.selectedLanguage = lang;
      this.setScrollToTopObj();
    });

    window.addEventListener('resize', this.orientationListener);
    window.addEventListener('orientationchange', this.orientationListener);
    this.orientationListener();
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

  scrollToTop() {
    const id = this.scrollToTopObj.id;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
    window.removeEventListener('resize', this.orientationListener);
    window.removeEventListener('orientationchange', this.orientationListener);
  }
}
