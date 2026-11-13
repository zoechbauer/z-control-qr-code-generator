import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { LanguageAccordionComponent } from './language-accordion.component';
import { createTranslateServiceMock } from '@testing/translate-service.mock';

describe('LanguageAccordionComponent', () => {
  let component: LanguageAccordionComponent;
  let fixture: ComponentFixture<LanguageAccordionComponent>;

  function getNormalizedText(): string {
    return (fixture.nativeElement.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageAccordionComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('template rendering', () => {
    it('should render german template when lang is de', () => {
      component.lang = 'de';
      fixture.detectChanges();

      const text = getNormalizedText();

      expect(text).toContain('Hinweis');
      expect(text).toContain(
        'Wurde eine andere Sprache als Deutsch oder Englisch eingestellt, wird die App in Englisch angezeigt.',
      );
      expect(text).not.toContain('Note');
    });

    it('should render english template when lang is en', () => {
      component.lang = 'en';
      fixture.detectChanges();

      const text = getNormalizedText();

      expect(text).toContain('Note');
      expect(text).toContain(
        'If a language other than German or English is set, the app will be displayed in English',
      );
      expect(text).not.toContain('Hinweis');
    });

    it('should fallback to english template when lang is not de', () => {
      component.lang = 'fr';
      fixture.detectChanges();

      const text = getNormalizedText();

      expect(text).toContain('Note');
      expect(text).not.toContain('Hinweis');
    });

    it('should render language select options for en and de', () => {
      fixture.detectChanges();

      const enOption = fixture.nativeElement.querySelector(
        'ion-select-option[value="en"]',
      );
      const deOption = fixture.nativeElement.querySelector(
        'ion-select-option[value="de"]',
      );

      expect(enOption).toBeTruthy();
      expect(deOption).toBeTruthy();
    });
  });
});
