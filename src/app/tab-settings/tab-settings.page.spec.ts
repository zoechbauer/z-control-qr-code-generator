import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { of, EMPTY, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { createTranslateServiceMock } from '@testing/translate-service.mock';
import { environment } from '@env/environment';
import { TabSettingsPage } from './tab-settings.page';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { PrintUtilsService } from '../services/print-utils.service';
import { LanguageAccordionComponent } from '../ui/components/accordions/language-accordion.component';
import { PrintAccordionComponent } from '../ui/components/accordions/print-accordion.component';
import { FeedbackAccordionComponent } from '../ui/components/accordions/feedback-accordion.component';
import { PrivacyPolicyAccordionComponent } from '../ui/components/accordions/privacy-policy-accordion.component';
import { ChangeLogAccordionComponent } from '../ui/components/accordions/change-log-accordion.component';
import { GetMobileAppAccordionComponent } from '../ui/components/accordions/get-mobile-app-accordion.component';
import { GetSourceAccordionComponent } from '../ui/components/accordions/get-source-accordion.component';
import { EmailMaintenanceAccordionComponent } from '../ui/components/accordions/email-maintenance-accordion.component';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';

@Component({
  selector: 'app-language-accordion',
  template: '',
  standalone: true,
})
class MockLanguageAccordionComponent {
  @Input() lang!: string;
  @Output() ionChange = new EventEmitter<any>();
}

@Component({
  selector: 'app-print-accordion',
  template: '',
  standalone: true,
})
class MockPrintAccordionComponent {
  @Input() lang!: string;
}

@Component({
  selector: 'app-email-maintenance-accordion',
  template: '',
  standalone: true,
})
class MockEmailMaintenanceAccordionComponent {
}

@Component({
  selector: 'app-feedback-accordion',
  template: '',
  standalone: true,
})
class MockFeedbackAccordionComponent {
  @Input() lang!: string;
}

@Component({
  selector: 'app-privacy-policy-accordion',
  template: '',
  standalone: true,
})
class MockPrivacyPolicyAccordionComponent {
  @Input() lang!: string;
}

@Component({
  selector: 'app-change-log-accordion',
  template: '',
  standalone: true,
})
class MockChangeLogAccordionComponent {
  @Input() lang!: string;
  @Input() versionInfo!: string;
  @Output() ionChange = new EventEmitter<void>();
}

@Component({
  selector: 'app-get-mobile-app-accordion',
  template: '',
  standalone: true,
})
class MockGetMobileAppAccordionComponent {
  @Input() lang!: string;
}

@Component({
  selector: 'app-get-source-accordion',
  template: '',
  standalone: true,
})
class MockGetSourceAccordionComponent {
  @Input() lang!: string;
}

@Component({
  selector: 'app-spinner',
  template: '',
  standalone: true,
})
class MockSpinnerComponent {}

describe('TabSettingsPage', () => {
  let component: TabSettingsPage;
  let fixture: ComponentFixture<TabSettingsPage>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;
  let printUtilsServiceSpy: jasmine.SpyObj<PrintUtilsService>;

  beforeEach(async () => {
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['getDeviceInfo', 'showOrHideIonTabBar', 'openChangelog'],
      {
        isNative: false,
        logoClicked$: EMPTY,
      },
    );

    printUtilsServiceSpy = jasmine.createSpyObj(
      'PrintUtilsService',
      ['print'],
    );

    localStorageServiceSpy = jasmine.createSpyObj(
      'LocalStorageService',
      ['saveSelectedLanguage', 'loadSelectedOrDefaultLanguage'],
      {
        selectedLanguage$: of('de'),
      },
    );

    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'create',
    ]);
    modalControllerSpy.create.and.resolveTo({
      present: jasmine.createSpy('present').and.resolveTo(),
      onDidDismiss: jasmine
        .createSpy('onDidDismiss')
        .and.resolveTo({ data: null }),
    });

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TabSettingsPage],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: LocalStorageService,
          useValue: localStorageServiceSpy,
        },
        {
          provide: UtilsService,
          useValue: utilsServiceSpy,
        },
        {
          provide: PrintUtilsService,
          useValue: printUtilsServiceSpy,
        },
        {
          provide: ModalController,
          useValue: modalControllerSpy,
        },
      ],
    })
      .overrideComponent(TabSettingsPage, {
        remove: {
          imports: [
            LanguageAccordionComponent,
            PrintAccordionComponent,
            EmailMaintenanceAccordionComponent,
            FeedbackAccordionComponent,
            PrivacyPolicyAccordionComponent,
            ChangeLogAccordionComponent,
            GetMobileAppAccordionComponent,
            GetSourceAccordionComponent,
            SpinnerComponent,
          ],
        },
        add: {
          imports: [
            MockLanguageAccordionComponent,
            MockPrintAccordionComponent,
            MockEmailMaintenanceAccordionComponent,
            MockFeedbackAccordionComponent,
            MockPrivacyPolicyAccordionComponent,
            MockChangeLogAccordionComponent,
            MockGetMobileAppAccordionComponent,
            MockGetSourceAccordionComponent,
            MockSpinnerComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TabSettingsPage);
    component = fixture.componentInstance;
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show version info', () => {
      (environment as any).version = {
        major: 1,
        minor: 0,
        date: '2026-04-01',
      };

      const versionInfo = component.versionInfo;

      expect(versionInfo).toBeDefined();
      expect(typeof versionInfo).toBe('string');
      expect(versionInfo).toContain('1.0 (2026-04-01)');
    });

    it('should open changelog', () => {
      const openChangelogSpy = utilsServiceSpy.openChangelog;
      component.openChangelog();
      expect(openChangelogSpy).toHaveBeenCalled();
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

    describe('accordion behavior', () => {
      it('should set openAccordion to null and showAllAccordions to true when showAll is called', () => {
        component.openAccordion = 'language';
        component.showAllAccordions = false;

        component.showAll();

        expect(component.openAccordion).toBeNull();
        expect(component.showAllAccordions).toBeTrue();
      });

      it('should set openAccordion to the selected value and showAllAccordions to false on accordion change', () => {
        const event = {
          detail: { value: 'language' },
        } as CustomEvent;
        const content = {} as any;

        component.onAccordionGroupChange(event, content);

        expect(component.openAccordion).toBe('language');
        expect(component.showAllAccordions).toBeFalse();
      });

      it('should ignore undefined values on accordion change', () => {
        const event = {
          detail: { value: undefined },
        } as CustomEvent;
        const content = {} as any;

        component.onAccordionGroupChange(event, content);

        expect(component.openAccordion).toBeNull();
        expect(component.showAllAccordions).toBeTrue();
      });

      it('should not change values on accordion change when normalized value is undefined', () => {
        component.openAccordion = 'language';
        component.showAllAccordions = false;
        const event = {
          detail: { value: undefined },
        } as CustomEvent;
        const content = {} as any;
        spyOn(component as any, 'normalizeAccordionValue').and.returnValue(
          undefined,
        );

        component.onAccordionGroupChange(event, content);

        expect(component.openAccordion).toBe('language');
        expect(component.showAllAccordions).toBeFalse();
      });

      it('should normalize accordion values correctly', () => {
        expect((component as any).normalizeAccordionValue('language')).toBe(
          'language',
        );
        expect((component as any).normalizeAccordionValue('z-control')).toBe(
          'z-control',
        );
        expect(
          (component as any).normalizeAccordionValue(undefined),
        ).toBeNull();
        expect(
          (component as any).normalizeAccordionValue('invalid'),
        ).toBeUndefined();
      });

      it('should open feedback accordion when logo is clicked', () => {
        (component as any).openFeedbackAccordion();
        expect(component.openAccordion).toBe('z-control');
      });
    });

    describe('onLanguageChange', () => {
      it('should save selected language', () => {
        const saveSelectedLanguageSpy =
          localStorageServiceSpy.saveSelectedLanguage as jasmine.Spy;
        const event = {
          detail: { value: 'en' },
        } as CustomEvent;

        component.onLanguageChange(event);

        expect(saveSelectedLanguageSpy).toHaveBeenCalledWith('en');
      });

      it('should do nothing if no language is selected', () => {
        const saveSelectedLanguageSpy =
          localStorageServiceSpy.saveSelectedLanguage as jasmine.Spy;
        const event = {
          detail: { value: null },
        } as CustomEvent;

        component.onLanguageChange(event);

        expect(saveSelectedLanguageSpy).not.toHaveBeenCalled();
      });
    });

    describe('ngOnInit', () => {
      it('should call setupSubscriptions, showOrHideIonTabBar, and setupEventListeners', () => {
        const setupSubscriptionsSpy = spyOn(
          component as any,
          'setupSubscriptions',
        ).and.callThrough();
        const showOrHideIonTabBarSpy = utilsServiceSpy.showOrHideIonTabBar;
        const setupEventListenersSpy = spyOn(
          component as any,
          'setupEventListeners',
        ).and.callThrough();
        (component as any).showAllAccordions = false;

        component.ngOnInit();

        expect(setupSubscriptionsSpy).toHaveBeenCalled();
        expect(showOrHideIonTabBarSpy).toHaveBeenCalled();
        expect(setupEventListenersSpy).toHaveBeenCalled();
        (component as any).showAllAccordions = true;
      });
    });

    describe('setupEventListeners', () => {
      it('should add resize event listeners', () => {
        spyOn(window, 'addEventListener');

        (component as any).setupEventListeners();

        expect(window.addEventListener).toHaveBeenCalledWith(
          'resize',
          jasmine.any(Function),
        );
      });

      it('should call showOrHideIonTabBar when window is resized', () => {
        const showOrHideIonTabBarSpy = utilsServiceSpy.showOrHideIonTabBar;
        (component as any).setupEventListeners();
        // Reset the spy call count to ignore the initial call during setup
        showOrHideIonTabBarSpy.calls.reset();

        window.dispatchEvent(new Event('resize'));

        expect(showOrHideIonTabBarSpy).toHaveBeenCalled();
      });
    });

    describe('subscriptions and cleanup', () => {
      it('should unsubscribe from all subscriptions on destroy', () => {
        const subscription1 = jasmine.createSpyObj('Subscription', [
          'unsubscribe',
        ]);
        const subscription2 = jasmine.createSpyObj('Subscription', [
          'unsubscribe',
        ]);
        (component as any).subscriptions = [subscription1, subscription2];

        (component as any).ngOnDestroy();

        expect(subscription1.unsubscribe).toHaveBeenCalled();
        expect(subscription2.unsubscribe).toHaveBeenCalled();
      });

      it('should handle empty subscriptions array on destroy', () => {
        (component as any).subscriptions = [];
        (component as any).ngOnDestroy();
        expect((component as any).subscriptions).toHaveSize(0);
        // No errors should occur, and the test will pass if it reaches this point without throwing
      });

      it('should subscribe to selectedLanguage$ and update selectedLanguage', () => {
        Object.defineProperty(localStorageServiceSpy, 'selectedLanguage$', {
          get: () => of('en'),
        });

        (component as any).setupSubscriptions();

        expect(component.selectedLanguage).toBe('en');
      });

      it('should subscribe to logoClicked$ and open feedback accordion', () => {
        const logoClicked$ = new EventEmitter<void>();
        Object.defineProperty(utilsServiceSpy, 'logoClicked$', {
          get: () => logoClicked$.asObservable(),
        });

        const openFeedbackAccordionSpy = spyOn(
          component as any,
          'openFeedbackAccordion',
        );

        (component as any).setupSubscriptions();

        logoClicked$.emit();

        expect(openFeedbackAccordionSpy).toHaveBeenCalled();
      });
    });
  });

  describe('template rendering', () => {
    it('should render mocked child accordion hosts (shallow render smoke test)', () => {
      // Guard test: verifies overrideComponent uses mock accordions, avoiding deep child DI dependencies.
      component.isLoading = false;
      component.selectedLanguage = 'de';
      component.showAllAccordions = true;
      component.openAccordion = null;
      fixture.detectChanges();

      const language = fixture.nativeElement.querySelector(
        'app-language-accordion',
      ) as HTMLElement;
      const feedback = fixture.nativeElement.querySelector(
        'app-feedback-accordion',
      ) as HTMLElement;
      const print = fixture.nativeElement.querySelector(
        'app-print-accordion',
      ) as HTMLElement;

      expect(language).toBeTruthy();
      expect(feedback).toBeTruthy();
      expect(print).toBeTruthy();

      // Mock components have empty templates.
      expect(language.innerHTML.trim()).toBe('');
      expect(feedback.innerHTML.trim()).toBe('');
      expect(print.innerHTML.trim()).toBe('');

      // Real child templates would render these markers.
      expect(fixture.nativeElement.querySelector('.notes')).toBeNull();
    });

    describe('loading spinner', () => {
      it('should show spinner during localStorage.selectedLanguage$ subscription in ngOnInit', async () => {
        const selectedLanguageSubject = new Subject<string>();
        Object.defineProperty(localStorageServiceSpy, 'selectedLanguage$', {
          get: () => selectedLanguageSubject.asObservable(),
        });

        const loadSelectedOrDefaultLanguageSpy =
          localStorageServiceSpy.loadSelectedOrDefaultLanguage as jasmine.Spy;
        loadSelectedOrDefaultLanguageSpy.and.returnValue(Promise.resolve());

        component.ngOnInit();
        fixture.detectChanges();

        // Spinner should be visible while loading (before we emit)
        let spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(spinner)
          .withContext('Spinner should be visible while loading')
          .toBeTruthy();
        expect(component.isLoading).toBeTrue();

        // Now emit the language value
        selectedLanguageSubject.next('en');
        fixture.detectChanges();
        await fixture.whenStable();

        // Spinner should be hidden after loading
        expect(component.isLoading).toBeFalse();
        spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(spinner)
          .withContext('Spinner should be hidden after loading')
          .toBeNull();
      });
    });

    describe('accordion visibility flow', () => {
      let languageAccordion: HTMLElement;
      let printAccordion: HTMLElement;
      let emailMaintenanceAccordion: HTMLElement;
      let feedbackAccordion: HTMLElement;
      let privacyAccordion: HTMLElement;
      let changeLogAccordion: HTMLElement;
      let mobileAppAccordion: HTMLElement;
      let sourceAccordion: HTMLElement;
      let closeButtonArea: HTMLElement;

      function queryAccordionsAndCloseButton() {
        languageAccordion = fixture.nativeElement.querySelector(
          'app-language-accordion',
        );
        printAccordion = fixture.nativeElement.querySelector(
          'app-print-accordion',
        );
        emailMaintenanceAccordion = fixture.nativeElement.querySelector(
          'app-email-maintenance-accordion',
        );
        feedbackAccordion = fixture.nativeElement.querySelector(
          'app-feedback-accordion',
        );
        privacyAccordion = fixture.nativeElement.querySelector(
          'app-privacy-policy-accordion',
        );
        changeLogAccordion = fixture.nativeElement.querySelector(
          'app-change-log-accordion',
        );
        mobileAppAccordion = fixture.nativeElement.querySelector(
          'app-get-mobile-app-accordion',
        );
        sourceAccordion = fixture.nativeElement.querySelector(
          'app-get-source-accordion',
        );
        closeButtonArea = fixture.nativeElement.querySelector(
          '.accordion-close-button',
        );
      }

      beforeEach(() => {
        component.isLoading = false;
        component.selectedLanguage = 'de';
        component.showAllAccordions = true;
        component.openAccordion = null;

        fixture.detectChanges();
      });

      it('should render all accordion components when no accordion is open', () => {
        queryAccordionsAndCloseButton();

        expect(languageAccordion).toBeTruthy();
        expect(printAccordion).toBeTruthy();
        expect(emailMaintenanceAccordion).toBeTruthy();
        expect(feedbackAccordion).toBeTruthy();
        expect(privacyAccordion).toBeTruthy();
        expect(changeLogAccordion).toBeTruthy();
        expect(mobileAppAccordion).toBeTruthy();
        expect(sourceAccordion).toBeTruthy();

        expect(closeButtonArea).toBeNull();
      });

      it('should render only selected accordion and close button in single-accordion mode', () => {
        component.openAccordion = 'language';
        component.showAllAccordions = false;
        fixture.detectChanges();

        queryAccordionsAndCloseButton();

        expect(languageAccordion).toBeTruthy();
        expect(closeButtonArea).toBeTruthy();

        expect(printAccordion).toBeNull();
        expect(emailMaintenanceAccordion).toBeNull();
        expect(feedbackAccordion).toBeNull();
        expect(privacyAccordion).toBeNull();
        expect(changeLogAccordion).toBeNull();
        expect(mobileAppAccordion).toBeNull();
        expect(sourceAccordion).toBeNull();
      });

      it('should switch to single-accordion mode when ionValueChange emits selected accordion value', () => {
        const group = fixture.nativeElement.querySelector(
          'ion-accordion-group',
        ) as HTMLElement;
        expect(group).toBeTruthy();

        group.dispatchEvent(
          new CustomEvent('ionValueChange', {
            detail: { value: 'language' },
            bubbles: true,
          }),
        );
        fixture.detectChanges();

        expect(component.openAccordion).toBe('language');
        expect(component.showAllAccordions).toBeFalse();

        const closeButtonArea = fixture.nativeElement.querySelector(
          '.accordion-close-button',
        );
        expect(closeButtonArea).toBeTruthy();
      });

      it('should show all accordions again when close button is clicked', () => {
        // Arrange: language accordion is open and single-accordion mode is active
        component.openAccordion = 'language';
        component.showAllAccordions = false;
        fixture.detectChanges();

        const closeButton = fixture.nativeElement.querySelector(
          '.accordion-close-button ion-button',
        ) as HTMLElement;
        expect(closeButton).toBeTruthy();

        // Act: click the close button to exit single-accordion mode
        closeButton.dispatchEvent(new Event('click'));
        fixture.detectChanges();

        queryAccordionsAndCloseButton();

        // Assert: all accordions are shown as closed and close button is not visible
        expect(component.showAllAccordions).toBeTrue();
        expect(component.openAccordion).toBeNull();

        expect(printAccordion).toBeTruthy();
        expect(emailMaintenanceAccordion).toBeTruthy();
        expect(feedbackAccordion).toBeTruthy();
        expect(privacyAccordion).toBeTruthy();
        expect(changeLogAccordion).toBeTruthy();
        expect(mobileAppAccordion).toBeTruthy();
        expect(sourceAccordion).toBeTruthy();

        expect(closeButtonArea).toBeNull();
      });
    });
  });
});
