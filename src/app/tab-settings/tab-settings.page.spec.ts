import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { of, Subject } from 'rxjs';

import { createTranslateServiceMock } from '@testing/translate-service.mock';
import * as environmentImport from '@env/environment';
import { TabSettingsPage } from './tab-settings.page';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';

describe('TabSettingsPage', () => {
  let component: TabSettingsPage;
  let fixture: ComponentFixture<TabSettingsPage>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;

  beforeEach(async () => {
    const localStorageServiceSpy = jasmine.createSpyObj(
      'LocalStorageService',
      ['saveSelectedLanguage'],
      {
        selectedLanguage$: of('de'),
      }
    );
    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'dismiss',
      'create',
      'present',
    ]);

    const logoClickedSub = new Subject<boolean>();
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['openChangelog', 'openHelpModal', 'showOrHideIonTabBar'],
      {
        isNative: false,
        logoClickedSub,
        logoClicked$: logoClickedSub.asObservable(),
      }
    );

    await TestBed.configureTestingModule({
      declarations: [TabSettingsPage],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsServiceSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TabSettingsPage);
    component = fixture.componentInstance;
  });

  describe('versionInfo getter', () => {
    const originalVersion = { ...environmentImport.environment.version };

    afterEach(() => {
      environmentImport.environment.version = { ...originalVersion };
    });

    it('should return formatted version string with all fields present', () => {
      environmentImport.environment.version = {
        major: 1,
        minor: 19,
        date: '2025-08-30',
      };
      fixture = TestBed.createComponent(TabSettingsPage);
      component = fixture.componentInstance;

      expect(component.versionInfo).toBe('App Version 1.19 (2025-08-30)');
    });

    it('should handle missing date gracefully', () => {
      environmentImport.environment.version = {
        major: 2,
        minor: 5,
        date: 'YYYY-MM-DD',
      };
      fixture = TestBed.createComponent(TabSettingsPage);
      component = fixture.componentInstance;

      expect(component.versionInfo).toBe('App Version 2.5 (YYYY-MM-DD)');
    });
  });

  describe('openChangelog method', () => {
    it('should call utilsService.openChangelog', async () => {
      const openChangelogSpy = utilsServiceSpy.openChangelog;
      component.openChangelog();
      expect(openChangelogSpy).toHaveBeenCalled();
    });
  });

  describe('openHelpModal method', () => {
    it('should call utilsService.openHelpModal', async () => {
      utilsServiceSpy.openHelpModal.and.returnValue(Promise.resolve());
      component.openHelpModal();
      expect(utilsServiceSpy.openHelpModal).toHaveBeenCalled();
    });
  });

  describe('ngnInit and ngOnDestroy', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call showOrHideIonTabBar and setup subscriptions and event listeners on ngOnInit', () => {
      spyOn(component as any, 'setupEventListeners');
      spyOn(component as any, 'setupSubscriptions');

      component.ngOnInit();

      expect(utilsServiceSpy.showOrHideIonTabBar).toHaveBeenCalled();
      expect((component as any).setupEventListeners).toHaveBeenCalled();
      expect((component as any).setupSubscriptions).toHaveBeenCalled();
      expect(component.showAllAccordions).toBeTrue();
    });

    it('should unsubscribe from all subscriptions on ngOnDestroy', () => {
      const sub1 = { unsubscribe: jasmine.createSpy('unsubscribe') };
      const sub2 = { unsubscribe: jasmine.createSpy('unsubscribe') };
      (component as any).subscriptions.push(sub1 as any, sub2 as any);

      component.ngOnDestroy();

      expect(sub1.unsubscribe).toHaveBeenCalled();
      expect(sub2.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('openAccordion', () => {
    it('should set openAccordion and showAllAccordions on onAccordionGroupChange', () => {
      const event = { detail: { value: 'test' } } as CustomEvent;
      component.showAllAccordions = false;

      component.onAccordionGroupChange(event, {} as any);

      expect(component.openAccordion).toBe('test');
      expect(component.showAllAccordions).toBeFalse();

      // Test with null value
      const eventNull = { detail: { value: null } } as CustomEvent;

      component.onAccordionGroupChange(eventNull, {} as any);

      expect(component.openAccordion).toBeNull();
      expect(component.showAllAccordions).toBeTrue();
    });

    it('should set openAccordion to null and showAllAccordions to true on showAll', () => {
      component.openAccordion = 'something';
      component.showAllAccordions = false;

      component.showAll();

      expect(component.openAccordion).toBeNull();
      expect(component.showAllAccordions).toBeTrue();
    });

    it('should set openAccordion to "z-control" after logoClickedSub emits and timeout', fakeAsync(() => {
      component.ngOnInit();
      utilsServiceSpy.logoClickedSub.next(true);
      tick(600);

      expect(component.openAccordion).toBe('z-control');
    }));
  });

  describe('get isNative', () => {
    it('should return false when utilsService.isNative is false', () => {
      expect(component.isNative).toBeFalse();
    });

    it('should return true when utilsService.isNative is true', () => {
      Object.defineProperty(utilsServiceSpy, 'isNative', {
        get: () => true,
      });
      expect(component.isNative).toBeTrue();
    });
  });

  describe('Language Change', () => {
    let localStorage: LocalStorageService;
    let translate: TranslateService;

    beforeEach(() => {
      localStorage = TestBed.inject(LocalStorageService);
      translate = TestBed.inject(TranslateService);
    });

    it('should handle language change', async () => {
      const event = { detail: { value: 'en' } };

      await component.onLanguageChange(event);

      expect(localStorage.saveSelectedLanguage).toHaveBeenCalledWith('en');
      expect(translate.use).toHaveBeenCalledWith('en');
      expect(translate.setDefaultLang).toHaveBeenCalledWith('en');
    });

    it('should not call anything if language is missing in onLanguageChange', async () => {
      await component.onLanguageChange({ detail: {} });

      expect(localStorage.saveSelectedLanguage).not.toHaveBeenCalled();
      expect(translate.use).not.toHaveBeenCalled();
      expect(translate.setDefaultLang).not.toHaveBeenCalled();
    });
  });

  describe('setupEventListeners', () => {
    it('should add resize event listeners', () => {
      spyOn(window, 'addEventListener');

      (component as any).setupEventListeners();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'resize',
        jasmine.any(Function)
      );
    });

    it('should call showOrHideIonTabBar when window is resized', () => {
      (component as any).setupEventListeners();
      window.dispatchEvent(new Event('resize'));
      expect(utilsServiceSpy.showOrHideIonTabBar).toHaveBeenCalled();
    });
  });
});
