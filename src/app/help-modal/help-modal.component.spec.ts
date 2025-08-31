import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { HelpModalComponent } from './help-modal.component';
import { LocalStorageService } from '../services/local-storage.service';

describe('HelpModalComponent', () => {
  let component: HelpModalComponent;
  let fixture: ComponentFixture<HelpModalComponent>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockLocalStorageService: jasmine.SpyObj<LocalStorageService>;

  beforeEach(async () => {
    const modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss', 'create']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    const localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', [], {
      selectedLanguage$: of('de')
    });

    await TestBed.configureTestingModule({
      declarations: [HelpModalComponent],
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpModalComponent);
    component = fixture.componentInstance;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    mockLocalStorageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;

    mockTranslateService.instant.and.returnValue('Translated Text');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to selectedLanguage$ and set up event listeners', () => {
      spyOn(window, 'addEventListener');
      spyOn(component as any, 'orientationListener');

      component.ngOnInit();

      expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('orientationchange', jasmine.any(Function));
      expect((component as any).orientationListener).toHaveBeenCalled();
    });

    it('should call setScrollToTopObj when language changes', () => {
      spyOn(component as any, 'setScrollToTopObj');
      mockLocalStorageService.selectedLanguage$ = of('en');

      component.ngOnInit();

      expect((component as any).setScrollToTopObj).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe and remove event listeners', () => {
      spyOn(window, 'removeEventListener');
      component.ngOnInit(); // Set up subscription first

      component.ngOnDestroy();

      expect(window.removeEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('orientationchange', jasmine.any(Function));
    });
  });

  describe('setScrollToTopObj', () => {
    it('should set German scroll object when language is de', () => {
      component.selectedLanguage = 'de';
      mockTranslateService.instant.and.returnValue('Nach oben scrollen');

      (component as any).setScrollToTopObj();

      expect(component.scrollToTopObj.id).toBe('toc-DE');
      expect(mockTranslateService.instant).toHaveBeenCalledWith('SCROLL_TO_TOP_DE');
    });

    it('should set English scroll object when language is en', () => {
      component.selectedLanguage = 'en';
      mockTranslateService.instant.and.returnValue('Scroll to top');

      (component as any).setScrollToTopObj();

      expect(component.scrollToTopObj.id).toBe('toc');
      expect(mockTranslateService.instant).toHaveBeenCalledWith('SCROLL_TO_TOP_EN');
    });
  });

  describe('dismissModal', () => {
    it('should call modalController.dismiss', () => {
      component.dismissModal();

      expect(mockModalController.dismiss).toHaveBeenCalled();
    });
  });

  describe('scrollTo', () => {
    let mockEvent: jasmine.SpyObj<Event>;
    let mockElement: jasmine.SpyObj<HTMLElement>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);
      mockElement = jasmine.createSpyObj('HTMLElement', ['scrollIntoView']);
    });

    it('should scroll to element when it exists', () => {
      spyOn(document, 'getElementById').and.returnValue(mockElement);

      component.scrollTo('test-id', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(document.getElementById).toHaveBeenCalledWith('test-id');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should log warning when element does not exist', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      spyOn(console, 'warn');

      component.scrollTo('non-existent-id', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith("Element with id 'non-existent-id' not found");
    });
  });

  describe('scrollToTop', () => {
    let mockElement: jasmine.SpyObj<HTMLElement>;

    beforeEach(() => {
      mockElement = jasmine.createSpyObj('HTMLElement', ['scrollIntoView']);
    });

    it('should scroll to top element', () => {
      component.scrollToTopObj.id = 'toc-DE';
      spyOn(document, 'getElementById').and.returnValue(mockElement);

      component.scrollToTop();

      expect(document.getElementById).toHaveBeenCalledWith('toc-DE');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should handle when top element does not exist', () => {
      spyOn(document, 'getElementById').and.returnValue(null);

      expect(() => component.scrollToTop()).not.toThrow();
    });
  });

  describe('orientationListener', () => {
    it('should update isPortrait based on media query', () => {
      const mockMediaQuery = jasmine.createSpyObj('MediaQueryList', [], { matches: true });
      spyOn(window, 'matchMedia').and.returnValue(mockMediaQuery);

      (component as any).orientationListener();

      expect(window.matchMedia).toHaveBeenCalledWith('(orientation: portrait)');
      expect(component.isPortrait).toBe(true);
    });
  });

  describe('initialization', () => {
    it('should initialize isPortrait based on current orientation', () => {
      const mockMediaQuery = jasmine.createSpyObj('MediaQueryList', [], { matches: false });
      spyOn(window, 'matchMedia').and.returnValue(mockMediaQuery);

      const newComponent = new HelpModalComponent(
        mockModalController,
        mockTranslateService,
        mockLocalStorageService
      );

      expect(newComponent.isPortrait).toBe(false);
    });
  });
});