import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  IonicModule,
  ModalController,
  ToastController,
  AlertController,
  PopoverController,
  Platform,
} from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

import { QrUtilsService } from '../services/qr-utils.service';
import { EmailUtilsService } from '../services/email-utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { ValidationService } from '../services/validation.service';
import { FileUtilsService } from '../services/file-utils.service';
import { AlertService } from '../services/alert.service';
import { TabQrPage } from './tab-qr.page';
import { environment } from 'src/environments/environment';
import { LanguagePopoverComponent } from './language-popover.component';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { WindowMockUtil } from 'src/test-utils/window-mock.util';

describe('TabQrPage', () => {
  let component: TabQrPage;
  let fixture: ComponentFixture<TabQrPage>;
  let mockMatchMedia: jasmine.Spy;

  beforeEach(async () => {
  // 1. Setup window mocks first
  mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(true); // Default to portrait

  // 2. Mock all Capacitor functionality COMPLETELY
  const mockCapacitor = {
    isPluginAvailable: jasmine
      .createSpy('isPluginAvailable')
      .and.returnValue(true),
    isNativePlatform: jasmine
      .createSpy('isNativePlatform')
      .and.returnValue(true),
    Plugins: {
      StatusBar: {
        setBackgroundColor: jasmine
          .createSpy('setBackgroundColor')
          .and.returnValue(Promise.resolve()),
        setStyle: jasmine
          .createSpy('setStyle')
          .and.returnValue(Promise.resolve()),
        setOverlaysWebView: jasmine
          .createSpy('setOverlaysWebView')
          .and.returnValue(Promise.resolve()),
        show: jasmine.createSpy('show').and.returnValue(Promise.resolve()),
        hide: jasmine.createSpy('hide').and.returnValue(Promise.resolve()),
      },
      Keyboard: {
        hide: jasmine.createSpy('hide').and.returnValue(Promise.resolve()),
        show: jasmine.createSpy('show').and.returnValue(Promise.resolve()),
        addListener: jasmine.createSpy('addListener').and.returnValue(
          Promise.resolve({ remove: jasmine.createSpy('remove') })
        ),
        removeAllListeners: jasmine
          .createSpy('removeAllListeners')
          .and.returnValue(Promise.resolve()),
      },
      SplashScreen: {
        hide: jasmine.createSpy('hide').and.returnValue(Promise.resolve()),
        show: jasmine.createSpy('show').and.returnValue(Promise.resolve()),
      },
    },
    registerPlugin: jasmine.createSpy('registerPlugin'),
  };

  // Apply the Capacitor mock to window
  (window as any).Capacitor = mockCapacitor;

  // 3. Mock Ionicons and asset path
  (window as any).Ionicons = {
    addIcons: jasmine.createSpy('addIcons'),
    getIcon: jasmine
      .createSpy('getIcon')
      .and.returnValue(Promise.resolve('<svg></svg>')),
  };
  (window as any).assetPath = 'http://localhost:9876/';

  // 4. Also spy on imported Capacitor and Keyboard modules
  spyOn(Capacitor, 'isPluginAvailable').and.returnValue(true);
  spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
  spyOn(Keyboard, 'addListener').and.returnValue(
    Promise.resolve({ remove: jasmine.createSpy('remove') })
  );
  spyOn(Keyboard, 'removeAllListeners').and.returnValue(Promise.resolve());
  spyOn(Keyboard, 'hide').and.returnValue(Promise.resolve());
  spyOn(Keyboard, 'show').and.returnValue(Promise.resolve());

  // 5. Create service spies
  const storageSpy = jasmine.createSpyObj<Partial<Storage>>('Storage', [
    'get',
    'set',
    'remove',
    'create',
  ]);
  const qrUtilsSpy = jasmine.createSpyObj<Partial<QrUtilsService>>(
    'QrUtilsService',
    ['generateQRCode', 'clearQrFields', 'printQRCode'],
    {
      isQrCodeGenerated: false,
      myAngularxQrCode: '',
      qrCodeDownloadLink: '',
    }
  );
  const emailUtilsSpy = jasmine.createSpyObj<Partial<EmailUtilsService>>(
    'EmailUtilsService',
    ['sendEmail', 'clearEmailSent'],
    {
      isEmailSent: false,
    }
  );
  const localStorageSpy = jasmine.createSpyObj<Partial<LocalStorageService>>(
    'LocalStorageService',
    ['loadSelectedOrDefaultLanguage', 'init', 'saveEmail'],
    {
      selectedLanguage$: of('en'),
    }
  );
  const validationSpy = jasmine.createSpyObj<Partial<ValidationService>>(
    'ValidationService',
    ['isValidEmailAddress']
  );
  const fileUtilsSpy = jasmine.createSpyObj<Partial<FileUtilsService>>(
    'FileUtilsService',
    [
      'saveFile',
      'clearNowFormatted',
      'setNowFormatted',
      'downloadQRCode',
      'deleteFilesAfterSpecifiedTime',
      'deleteAllQrCodeFiles',
    ]
  );
  const alertSpy = jasmine.createSpyObj<Partial<AlertService>>(
    'AlertService',
    ['showErrorAlert']
  );
  const modalControllerSpy = jasmine.createSpyObj<Partial<ModalController>>(
    'ModalController',
    ['create']
  );
  const toastControllerSpy = jasmine.createSpyObj<Partial<ToastController>>(
    'ToastController',
    ['create']
  );
  const alertControllerSpy = jasmine.createSpyObj<Partial<AlertController>>(
    'AlertController',
    ['create']
  );
  const popoverControllerSpy = jasmine.createSpyObj<Partial<PopoverController>>(
    'PopoverController',
    ['create']
  );
  const platformSpy = jasmine.createSpyObj<Partial<Platform>>('Platform', [
    'is',
    'ready',
  ]);
  const translateSpy = jasmine.createSpyObj<Partial<TranslateService>>(
    'TranslateService',
    ['instant', 'get']
  );

  // 6. Configure TestBed
  await TestBed.configureTestingModule({
    declarations: [HomePage],
    imports: [
      IonicModule.forRoot({ mode: 'md', animated: false }),
      TranslateModule.forRoot(),
      HttpClientTestingModule,
    ],
    providers: [
      { provide: Storage, useValue: storageSpy },
      { provide: QrUtilsService, useValue: qrUtilsSpy },
      { provide: EmailUtilsService, useValue: emailUtilsSpy },
      { provide: LocalStorageService, useValue: localStorageSpy },
      { provide: ValidationService, useValue: validationSpy },
      { provide: FileUtilsService, useValue: fileUtilsSpy },
      { provide: AlertService, useValue: alertSpy },
      { provide: ModalController, useValue: modalControllerSpy },
      { provide: ToastController, useValue: toastControllerSpy },
      { provide: AlertController, useValue: alertControllerSpy },
      { provide: PopoverController, useValue: popoverControllerSpy },
      { provide: Platform, useValue: platformSpy },
      { provide: TranslateService, useValue: translateSpy },
    ],
  }).compileComponents();

  // 7. Create component and setup
  fixture = TestBed.createComponent(HomePage);
  component = fixture.componentInstance;

  // Make service properties writable
  const emailUtilsService = TestBed.inject(EmailUtilsService) as jasmine.SpyObj<EmailUtilsService>;
  Object.defineProperty(emailUtilsService, 'isEmailSent', {
    writable: true,
    configurable: true,
    value: false,
  });

  const qrUtilsService = TestBed.inject(QrUtilsService) as jasmine.SpyObj<QrUtilsService>;
  Object.defineProperty(qrUtilsService, 'isQrCodeGenerated', {
    writable: true,
    configurable: true,
    value: false,
  });
  Object.defineProperty(qrUtilsService, 'myAngularxQrCode', {
    writable: true,
    configurable: true,
    value: '',
  });

  // Setup default mock returns
  (storageSpy.get as jasmine.Spy).and.returnValue(Promise.resolve(null));
  (storageSpy.set as jasmine.Spy).and.returnValue(Promise.resolve());
  (storageSpy.create as jasmine.Spy).and.returnValue(Promise.resolve({} as Storage));
  (localStorageSpy.init as jasmine.Spy).and.returnValue(Promise.resolve());
  (qrUtilsSpy.clearQrFields as jasmine.Spy).and.returnValue(undefined);
  (emailUtilsSpy.clearEmailSent as jasmine.Spy).and.returnValue(undefined);
  (translateSpy.instant as jasmine.Spy).and.returnValue('Translated Text');
  (translateSpy.get as jasmine.Spy).and.returnValue(of('Translated Text'));
  (platformSpy.is as jasmine.Spy).and.returnValue(false);
  (platformSpy.ready as jasmine.Spy).and.returnValue(Promise.resolve());
});

  afterEach(() => {
    // Clean up all window mocks
    WindowMockUtil.restore();
  });

  describe('basic functionality', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize without errors', () => {
      expect(component).toBeDefined();
    });

    it('should handle component creation', () => {
      expect(component).toBeInstanceOf(HomePage);
    });

    it('should render basic structure', () => {
      expect(fixture.nativeElement).toBeTruthy();
    });

    it('should toggle showAddress property', () => {
      expect(component.showAddress).toBe(false);
      component.toggleShowAddress();
      expect(component.showAddress).toBe(true);
    });
  });

  describe('sanitizeInputAndGenerateQRCode', () => {
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;
    let toastControllerSpy: jasmine.SpyObj<ToastController>;
    let translateSpy: jasmine.SpyObj<TranslateService>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      toastControllerSpy = TestBed.inject(
        ToastController
      ) as jasmine.SpyObj<ToastController>;
      translateSpy = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;

      // Set up the toast mock once for all tests in this describe block
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      toastControllerSpy.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should generate QR code for valid string input', () => {
      // Arrange
      const validInput = 'test';
      component.qrDataInput = { value: validInput } as any;

      // Act
      component.sanitizeInputAndGenerateQRCode(
        component.qrDataInput?.value || 'test'
      );

      // Assert
      expect(qrUtilsService.generateQRCode).toHaveBeenCalledWith(validInput);
      expect(qrUtilsService.generateQRCode).toHaveBeenCalledTimes(1);
    });

    it('should not generate QR code for empty input', () => {
      // Arrange
      if (component.qrDataInput) {
        component.qrDataInput.value = '';
      }

      // Act
      component.sanitizeInputAndGenerateQRCode('');

      // Assert
      expect(qrUtilsService.generateQRCode).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only input', () => {
      // Arrange
      const whitespaceInput = '   \n\t   ';

      // Act
      component.sanitizeInputAndGenerateQRCode(whitespaceInput);

      // Assert
      expect(qrUtilsService.generateQRCode).not.toHaveBeenCalled();
    });

    it('should trim trailing whitespace and call generateQRCode', fakeAsync(() => {
      // Arrange
      const trimTrailingWhitespace = '  TrimTrailingWhitespace   \n\t   ';
      const expectedTrimmed = '  TrimTrailingWhitespace';

      component.qrDataInput = {
        value: trimTrailingWhitespace,
      } as any;

      // Act
      component.sanitizeInputAndGenerateQRCode(trimTrailingWhitespace);

      // Flush all async operations
      tick();

      // Assert
      expect(qrUtilsService.generateQRCode).toHaveBeenCalledWith(
        expectedTrimmed
      );
      expect(translateSpy.instant).toHaveBeenCalledWith(
        'TOAST_TRAILING_BLANKS_REMOVED'
      );
      expect(toastControllerSpy.create).toHaveBeenCalled();
      expect(mockToast.present).toHaveBeenCalled();
      expect(component.qrDataInput.value).toBe(expectedTrimmed);
    }));
  });

  describe('hasInputChangedAfterGeneration', () => {
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;

    beforeEach(() => {
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;

      // Mock qrDataInput for all tests
      component.qrDataInput = { value: '' } as any;

      // Mock isInputFieldEmpty method
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);
    });

    it('should return false when no QR code generated', () => {
      // Arrange - No QR code has been generated
      qrUtilsService.isQrCodeGenerated = false;
      qrUtilsService.myAngularxQrCode = '';
      component.qrDataInput.value = 'some input';

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when input field is empty (whitespace)', () => {
      // Arrange - QR code exists but input is empty/whitespace
      qrUtilsService.isQrCodeGenerated = true;
      qrUtilsService.myAngularxQrCode = 'generated qr code';
      component.qrDataInput.value = '   '; // whitespace

      // Mock isInputFieldEmpty to return true for whitespace
      (component.isInputFieldEmpty as jasmine.Spy).and.returnValue(true);

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when qrDataInput is null/undefined', () => {
      // Arrange
      component.qrDataInput = null as any;
      qrUtilsService.isQrCodeGenerated = true;
      qrUtilsService.myAngularxQrCode = 'generated qr code';

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when input value equals generated QR code', () => {
      // Arrange
      const sameValue = 'identical content';
      qrUtilsService.isQrCodeGenerated = true;
      qrUtilsService.myAngularxQrCode = sameValue;
      component.qrDataInput.value = sameValue;

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when input differs from generated QR code', () => {
      // Arrange
      qrUtilsService.isQrCodeGenerated = true;
      qrUtilsService.myAngularxQrCode = 'original qr content';
      component.qrDataInput.value = 'changed input content';

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when input has different case from generated QR code', () => {
      // Arrange
      qrUtilsService.isQrCodeGenerated = true;
      qrUtilsService.myAngularxQrCode = 'Original Content';
      component.qrDataInput.value = 'original content';

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when input has extra spaces compared to generated QR code', () => {
      // Arrange - Test whitespace differences
      qrUtilsService.isQrCodeGenerated = true;
      qrUtilsService.myAngularxQrCode = 'content';
      component.qrDataInput.value = ' content ';

      (component.isInputFieldEmpty as jasmine.Spy).and.returnValue(false);

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isGenerationButtonDisabled', () => {
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;
    let emailUtilsService: any;

    beforeEach(() => {
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      component.qrDataInput = { value: '' } as any;
    });

    it('should be disabled when input is empty', () => {
      // Arrange
      component.qrDataInput.value = '';
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(false);
      spyOn(component, 'isInputFieldEmpty').and.returnValue(true);

      // Act
      const result = component.isGenerationButtonDisabled;

      // Assert
      expect(result).toBe(true);
    });

    it('should be disabled when email is sent', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(false);
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);

      emailUtilsService.isEmailSent = true;

      // Act
      const result = component.isGenerationButtonDisabled;

      // Assert
      expect(result).toBe(true);
    });

    it('should be disabled when QR code is generated', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(false);
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);

      emailUtilsService.isEmailSent = true;
      qrUtilsService.isQrCodeGenerated = true;

      // Act
      const result = component.isGenerationButtonDisabled;

      // Assert
      expect(result).toBe(true);
    });

    it('should be enabled when input changes after generation', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(true);
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);

      emailUtilsService.isEmailSent = true;
      qrUtilsService.isQrCodeGenerated = true;

      // Act
      const result = component.isGenerationButtonDisabled;

      // Assert
      expect(result).toBe(false);
    });

    it('should be enabled when all conditions are false', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(false);
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);

      emailUtilsService.isEmailSent = false;
      qrUtilsService.isQrCodeGenerated = false;

      // Act
      const result = component.isGenerationButtonDisabled;

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isPortrait getter', () => {
    it('should detect portrait orientation', () => {
      // Arrange
      mockMatchMedia.and.returnValue({ matches: true });

      // Act
      const isPortrait = component.isPortrait;

      // Assert
      expect(mockMatchMedia).toHaveBeenCalledWith('(orientation: portrait)');
      expect(isPortrait).toBe(true);
    });

    it('should detect landscape orientation', () => {
      // Arrange
      mockMatchMedia.and.returnValue({ matches: false });

      // Act
      const isPortrait = component.isPortrait;

      // Assert
      expect(mockMatchMedia).toHaveBeenCalledWith('(orientation: portrait)');
      expect(isPortrait).toBe(false);
    });
  });

  describe('clearInputField', () => {
    it('should clear input field and reset services', () => {
      // Arrange
      component.qrDataInput = { value: 'test input' } as any;
      const qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      const emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;

      // Act
      component.clearInputField();

      // Assert
      expect(component.qrDataInput.value).toBe('');
      expect(qrUtilsService.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).toHaveBeenCalled();
    });
  });

  describe('openHelpModal', () => {
    let modalController: jasmine.SpyObj<ModalController>;
    let mockModal: jasmine.SpyObj<HTMLIonModalElement>;
    let maxInputLength: number;

    beforeEach(() => {
      maxInputLength = environment.maxInputLength;
      modalController = TestBed.inject(
        ModalController
      ) as jasmine.SpyObj<ModalController>;

      mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present']);
      mockModal.present.and.returnValue(Promise.resolve());
      modalController.create.and.returnValue(Promise.resolve(mockModal));
    });

    it('should create and present Help modal with desktop CSS class on desktop', async () => {
      // Arrange - override to desktop/web
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);

      // Act
      await component.openHelpModal();

      // Assert
      expect(modalController.create).toHaveBeenCalledWith({
        component: HelpModalComponent,
        componentProps: {
          maxInputLength: maxInputLength,
        },
        cssClass: 'manual-instructions-modal desktop', // Desktop CSS
      });
      expect(mockModal.present).toHaveBeenCalled();
    });

    it('should create modal with mobile CSS class on mobile devices', async () => {
      // Arrange - Make sure it's actually mobile
      // The default is already mobile (isNativePlatform = true), so no override needed

      // Act
      await component.openHelpModal();

      // Assert
      expect(modalController.create).toHaveBeenCalledWith({
        component: HelpModalComponent,
        componentProps: {
          maxInputLength: maxInputLength,
        },
        cssClass: 'manual-instructions-modal', // Mobile CSS
      });
      expect(mockModal.present).toHaveBeenCalled();
    });
  });

  describe('deleteQRCode', () => {
    it('should delete qr code and show toast if input changed after generation', () => {
      // Arrange
      const qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      const emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      const toastController = TestBed.inject(
        ToastController
      ) as jasmine.SpyObj<ToastController>;
      const translateService = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;

      // Mock dependencies
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(true);
      translateService.instant.and.returnValue('QR Code deleted');

      const mockToast = jasmine.createSpyObj('HTMLIonToastElement', [
        'present',
      ]);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));

      // Act
      component.deleteQRCodeIfInputChangedAfterGeneration();

      // Assert
      expect(qrUtilsService.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).toHaveBeenCalled();

      // Verify toast is shown
      expect(translateService.instant).toHaveBeenCalledWith(
        'TOAST_QR_CODE_DELETED_AFTER_INPUT_CHANGE'
      );
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: 'QR Code deleted',
          duration: 3000,
          color: 'medium',
          icon: 'information-circle',
        })
      );
    });

    it('should not delete qr code if input did not change after generation', () => {
      // Arrange
      const qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      const emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;

      // Mock the condition to be false
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(false);

      // Act
      component.deleteQRCodeIfInputChangedAfterGeneration();

      // Assert
      expect(qrUtilsService.clearQrFields).not.toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).not.toHaveBeenCalled();
    });
  });

  describe('toast positioning based on keyboard state', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      // Only need ToastController for position testing
      toastController = TestBed.inject(
        ToastController
      ) as jasmine.SpyObj<ToastController>;

      // Mock the condition to always be true (so toast is always shown)
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(true);

      // Basic toast mock
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should show toast at bottom when keyboard is closed', () => {
      // Arrange
      component.setKeyboardState(false);

      // Act
      component.deleteQRCodeIfInputChangedAfterGeneration();

      // Assert - Only test the position
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          position: 'bottom',
        })
      );
    });

    it('should show toast at top when keyboard is open', () => {
      // Arrange
      component.setKeyboardState(true);

      // Act
      component.deleteQRCodeIfInputChangedAfterGeneration();

      // Assert - Only test the position
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          position: 'top',
        })
      );
    });
  });

  describe('addEmailAddress', () => {
    it('should call localStorageService', async () => {
      // Arrange
      const localStorageService = TestBed.inject(
        LocalStorageService
      ) as jasmine.SpyObj<LocalStorageService>;
      const email = 'test@example.com';

      // Act
      component.addEmailAddress(email);

      // Assert
      expect(localStorageService?.saveEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('openLanguagePopover', () => {
    it('should create and present language popover', async () => {
      // Arrange
      const popoverController = TestBed.inject(
        PopoverController
      ) as jasmine.SpyObj<PopoverController>;
      const mockPopover = jasmine.createSpyObj('HTMLIonPopoverElement', [
        'present',
      ]);
      mockPopover.present.and.returnValue(Promise.resolve());
      popoverController.create.and.returnValue(Promise.resolve(mockPopover));

      const mockEvent = { target: 'button' } as any;

      // Act
      await component.openLanguagePopover(mockEvent);

      // Assert
      expect(popoverController.create).toHaveBeenCalledWith({
        component: LanguagePopoverComponent,
        event: mockEvent,
        side: 'left',
        translucent: true,
      });
      expect(mockPopover.present).toHaveBeenCalled();
    });
  });

  describe('maxInputLength getter', () => {
    it('should return configured max length from environment', () => {
      // Act
      const maxLength = component.maxInputLength;

      // Assert
      expect(maxLength).toBe(environment.maxInputLength); // Test actual value
      expect(typeof maxLength).toBe('number');
    });
  });

  describe('input validation', () => {
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;

    beforeEach(() => {
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
    });

    it('should handle empty input', () => {
      // Arrange
      component.qrDataInput = { value: '' } as any;
      // Act
      component.sanitizeInputAndGenerateQRCode('');
      // Assert
      expect(component.qrDataInput.value).toBe('');
      expect(qrUtilsService.generateQRCode).not.toHaveBeenCalled();
    });

    it('should handle maximum length input', () => {
      // Arrange
      const maxInput = 'a'.repeat(environment.maxInputLength);
      component.qrDataInput = { value: maxInput } as any;
      // Act
      component.sanitizeInputAndGenerateQRCode(maxInput);
      // Assert
      expect(qrUtilsService.generateQRCode).toHaveBeenCalledWith(maxInput);
    });

    it('should handle special characters', () => {
      // Arrange
      const specialChars = "%$&'()*+,-./:;<=>?@[]^_`{|}~";
      component.qrDataInput = { value: specialChars } as any;
      // Act
      component.sanitizeInputAndGenerateQRCode(specialChars);
      // Assert
      expect(qrUtilsService.generateQRCode).toHaveBeenCalledWith(specialChars);
    });
  });

  describe('workflow integration - storeMailAndDeleteQRCode', () => {
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;
    let emailUtilsService: jasmine.SpyObj<EmailUtilsService>;
    let fileUtilsService: jasmine.SpyObj<FileUtilsService>;

    beforeEach(() => {
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      fileUtilsService = TestBed.inject(
        FileUtilsService
      ) as jasmine.SpyObj<FileUtilsService>;
    });

    it('should handle complete QR-to-email workflow', async () => {
      // Note: Spinner display cannot be tested in this unit test
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock all operations as successful
      fileUtilsService.setNowFormatted = jasmine.createSpy('setNowFormatted');
      fileUtilsService.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.resolve(true));
      fileUtilsService.deleteFilesAfterSpecifiedTime = jasmine.createSpy(
        'deleteFilesAfterSpecifiedTime'
      );
      fileUtilsService.clearNowFormatted =
        jasmine.createSpy('clearNowFormatted');
      qrUtilsService.printQRCode = jasmine
        .createSpy('printQRCode')
        .and.returnValue(Promise.resolve());

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsService, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock email service success
      emailUtilsService.sendEmail = jasmine
        .createSpy('sendEmail')
        .and.returnValue(Promise.resolve());

      // Act
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert - verify all operations were called in correct order
      expect(fileUtilsService.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsService.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link'
      );
      expect(qrUtilsService.printQRCode).toHaveBeenCalled();
      expect(emailUtilsService.sendEmail).toHaveBeenCalled();
      expect(fileUtilsService.deleteFilesAfterSpecifiedTime).toHaveBeenCalled();
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;
    let emailUtilsService: jasmine.SpyObj<EmailUtilsService>;
    let fileUtilsService: jasmine.SpyObj<FileUtilsService>;
    let alertService: jasmine.SpyObj<AlertService>;

    beforeEach(() => {
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      fileUtilsService = TestBed.inject(
        FileUtilsService
      ) as jasmine.SpyObj<FileUtilsService>;
      alertService = TestBed.inject(
        AlertService
      ) as jasmine.SpyObj<AlertService>;
    });

    it('should handle QR generation failures', () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Simulate the service behavior when an error occurs
      qrUtilsService.generateQRCode.and.callFake((data: string) => {
        qrUtilsService.myAngularxQrCode = '';
        qrUtilsService.isQrCodeGenerated = false;
      });

      // Act
      component.sanitizeInputAndGenerateQRCode('test');

      // Assert
      expect(qrUtilsService.generateQRCode).toHaveBeenCalledWith('test');
      expect(qrUtilsService.myAngularxQrCode).toBe('');
      expect(qrUtilsService.isQrCodeGenerated).toBe(false);
      expect(component.qrDataInput.value).toBe('test');
    });

    it('should handle email sending failures gracefully', async () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock successful file and QR operations
      fileUtilsService.setNowFormatted = jasmine.createSpy('setNowFormatted');
      fileUtilsService.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.resolve(true));
      fileUtilsService.clearNowFormatted =
        jasmine.createSpy('clearNowFormatted');
      qrUtilsService.printQRCode = jasmine
        .createSpy('printQRCode')
        .and.returnValue(Promise.resolve());

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsService, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock email service to fail
      emailUtilsService.sendEmail = jasmine
        .createSpy('sendEmail')
        .and.returnValue(Promise.reject(new Error('Email sending failed')));

      // Mock alert service
      alertService.showErrorAlert = jasmine
        .createSpy('showErrorAlert')
        .and.returnValue(Promise.resolve());

      // Spy on console.error
      spyOn(console, 'error');

      // Act - Should resolve gracefully, not reject
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert - Verify error was handled gracefully
      expect(console.error).toHaveBeenCalledWith(
        'Email workflow failed:',
        jasmine.any(Error)
      );
      expect(alertService.showErrorAlert).toHaveBeenCalledWith(
        'ERROR_MESSAGE_EMAIL_WORKFLOW'
      );
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();

      // Verify workflow progression up to email failure
      expect(fileUtilsService.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsService.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link'
      );
      expect(qrUtilsService.printQRCode).toHaveBeenCalled();
      expect(emailUtilsService.sendEmail).toHaveBeenCalled();
    });

    it('should handle file download failures gracefully', async () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock file download failure
      fileUtilsService.setNowFormatted = jasmine.createSpy('setNowFormatted');
      fileUtilsService.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.reject(new Error('File download failed')));
      fileUtilsService.clearNowFormatted =
        jasmine.createSpy('clearNowFormatted');

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsService, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock alert service
      alertService.showErrorAlert = jasmine
        .createSpy('showErrorAlert')
        .and.returnValue(Promise.resolve());
      spyOn(console, 'error');

      // Act - Should resolve gracefully
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert - Verify error handling
      expect(console.error).toHaveBeenCalledWith(
        'Email workflow failed:',
        jasmine.any(Error)
      );
      expect(alertService.showErrorAlert).toHaveBeenCalledWith(
        'ERROR_MESSAGE_EMAIL_WORKFLOW'
      );
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();

      // Verify setup was called
      expect(fileUtilsService.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsService.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link'
      );
    });

    it('should handle QR code printing failures gracefully', async () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock successful file operations, failed QR printing
      fileUtilsService.setNowFormatted = jasmine.createSpy('setNowFormatted');
      fileUtilsService.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.resolve(true));
      fileUtilsService.clearNowFormatted =
        jasmine.createSpy('clearNowFormatted');
      qrUtilsService.printQRCode = jasmine
        .createSpy('printQRCode')
        .and.returnValue(Promise.reject(new Error('Print QR code failed')));

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsService, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock alert service
      alertService.showErrorAlert = jasmine
        .createSpy('showErrorAlert')
        .and.returnValue(Promise.resolve());
      spyOn(console, 'error');

      // Act - Should resolve gracefully
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert - Verify error handling
      expect(console.error).toHaveBeenCalledWith(
        'Email workflow failed:',
        jasmine.any(Error)
      );
      expect(alertService.showErrorAlert).toHaveBeenCalledWith(
        'ERROR_MESSAGE_EMAIL_WORKFLOW'
      );
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();

      // Verify operations were called in order
      expect(fileUtilsService.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsService.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link'
      );
      expect(qrUtilsService.printQRCode).toHaveBeenCalled();
    });
  });

  describe('ngOnInit', () => {
    let localStorageService: jasmine.SpyObj<LocalStorageService>;
    let fileUtilsService: jasmine.SpyObj<FileUtilsService>;

    beforeEach(() => {
      localStorageService = TestBed.inject(
        LocalStorageService
      ) as jasmine.SpyObj<LocalStorageService>;
      fileUtilsService = TestBed.inject(
        FileUtilsService
      ) as jasmine.SpyObj<FileUtilsService>;

      localStorageService.init.and.returnValue(Promise.resolve());
      localStorageService.loadSelectedOrDefaultLanguage.and.returnValue(
        Promise.resolve()
      );
      fileUtilsService.deleteAllQrCodeFiles.and.returnValue(Promise.resolve());
    });

    it('should initialize component without errors', () => {
      // Act & Assert - Should not throw
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should call localStorage initialization', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(localStorageService.init).toHaveBeenCalled();
    });

    it('should set initial screen width', () => {
      // Arrange
      WindowMockUtil.mockInnerWidth(1024);

      // Create fresh component to read mocked value
      const widthTestFixture = TestBed.createComponent(HomePage);
      const widthTestComponent = widthTestFixture.componentInstance;

      // Act
      widthTestComponent.ngOnInit();

      // Assert
      expect(widthTestComponent.screenWidth).toBe(1024);
    });

    it('should set initial number of rows based on orientation', () => {
      // Arrange - Portrait orientation
      mockMatchMedia.and.returnValue({ matches: true });

      const freshFixture = TestBed.createComponent(HomePage);
      const freshComponent = freshFixture.componentInstance;

      // Act
      freshComponent.ngOnInit();

      // Assert
      expect(freshComponent.nbrOfInitialRows).toBe(6); // Portrait = 6 rows
    });

    it('should not add keyboard listeners on web platforms', () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      const keyboardSpy = spyOn(Keyboard, 'addListener');

      // Act
      component.ngOnInit();

      // Assert
      expect(keyboardSpy).not.toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', () => {
      // Arrange
      localStorageService.init.and.returnValue(
        Promise.reject(new Error('Init failed'))
      );
      spyOn(console, 'error');

      // Act & Assert - Should not throw
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;
    let emailUtilsService: jasmine.SpyObj<EmailUtilsService>;
    let fileUtilsService: jasmine.SpyObj<FileUtilsService>;

    beforeEach(() => {
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      fileUtilsService = TestBed.inject(
        FileUtilsService
      ) as jasmine.SpyObj<FileUtilsService>;
    });

    it('should clean up subscriptions and services', () => {
      // Arrange
      const mockSubscription = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      (component as any).langSub = mockSubscription;

      // Act
      component.ngOnDestroy();

      // Assert - Verify cleanup methods were called
      expect(qrUtilsService.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).toHaveBeenCalled();
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should handle cleanup gracefully when subscription is null', () => {
      // Arrange
      (component as any).langSub = null;
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);

      // Act & Assert - Should not throw
      expect(() => component.ngOnDestroy()).not.toThrow();

      // Services should still be cleaned
      expect(qrUtilsService.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).toHaveBeenCalled();
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();
    });

    it('should handle cleanup gracefully when subscription is undefined', () => {
      // Arrange
      (component as any).langSub = undefined;
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);

      // Act & Assert - Should not throw
      expect(() => component.ngOnDestroy()).not.toThrow();

      // Services should still be cleaned
      expect(qrUtilsService.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).toHaveBeenCalled();
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();
    });

    it('should skip keyboard cleanup on web platforms', () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      const mockKeyboard = jasmine.createSpyObj('Keyboard', [
        'removeAllListeners',
      ]);
      (window as any).Capacitor.Plugins.Keyboard = mockKeyboard;

      // Act
      component.ngOnDestroy();

      // Assert - Keyboard cleanup should not be called on web
      expect(mockKeyboard.removeAllListeners).not.toHaveBeenCalled();

      // But service cleanup should still happen
      expect(qrUtilsService.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).toHaveBeenCalled();
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', () => {
      // Arrange
      // Make one of the cleanup methods throw an error
      qrUtilsService.clearQrFields.and.throwError('Service cleanup failed');
      spyOn(console, 'error');

      // Act & Assert - Should not crash the application
      expect(() => component.ngOnDestroy()).not.toThrow();

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Cleanup failed:',
        jasmine.any(Error)
      );
    });
  });
});


