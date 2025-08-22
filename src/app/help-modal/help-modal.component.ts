import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { LocalStorageService } from '../services/local-storage.service';
import { environment } from 'src/environments/environment';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';

@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
})
export class HelpModalComponent implements OnInit, OnDestroy {
  @Input() maxInputLength!: number;
  @Input() scrollToSection?: string;  // for direct section navigation

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
    private readonly modalController: ModalController,
    private readonly translate: TranslateService,
    private readonly localStorage: LocalStorageService
  ) {}

  ngOnInit() {
    // Scroll to specific section if provided
    if (this.scrollToSection) {
      setTimeout(() => {
        this.scrollToElement(this.scrollToSection!);
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

    private scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
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

  get versionInfo() {
    const { major, minor, date } = {
      major: environment.version.major,
      minor: environment.version.minor,
      date: environment.version.date,
    };

    let formattedDate = date;
    if (this.selectedLanguage === 'de') {
      // Convert 'yyyy-mm-dd' to 'dd.mm.yyyy'
      const [year, month, day] = date.split('-');
      formattedDate = `${day}.${month}.${year}`;
    }

    return `Version ${major}.${minor} (${formattedDate})`;
  }

  async openChangelog() {
    const modal = await this.modalController.create({
      component: MarkdownViewerComponent,
      componentProps: {
        fullChangeLogPath: 'assets/logs/CHANGELOG.md',
      },
    });

    await modal.present();
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
    window.removeEventListener('resize', this.orientationListener);
    window.removeEventListener('orientationchange', this.orientationListener);
  }
}
