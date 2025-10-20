import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AlertButton,
  AlertController,
  IonicModule,
  ModalController,
  Platform,
  ToastController,
} from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

import { QrUtilsService } from '../services/qr-utils.service';
import { EmailUtilsService } from '../services/email-utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { FileUtilsService } from '../services/file-utils.service';
import { AlertService } from '../services/alert.service';
import { TabQrPage, Workflow } from './tab-qr.page';
import { environment } from 'src/environments/environment';
import { WindowMockUtil } from 'src/test-utils/window-mock.util';
import { PrintUtilsService } from '../services/print-utils.service';
import { HeaderComponent } from '../ui/components/header/header.component';
import { UtilsService } from '../services/utils.service';
import { ToastService } from '../services/toast.service';

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
          addListener: jasmine
            .createSpy('addListener')
            .and.returnValue(
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
      ['generateQRCode', 'clearQrFields', 'printQRCode', 'setDownloadLink'],
      {
        isQrCodeGenerated: false,
        myAngularxQrCode: '',
        qrCodeDownloadLink: '',
      }
    );
    const emailUtilsSpy = jasmine.createSpyObj<EmailUtilsService>(
      'EmailUtilsService',
      ['sendEmail', 'clearEmailSent', 'displayEmailAttachmentAlert'],
      {
        isEmailSent: false,
      }
    );
    const localStorageSpy = jasmine.createSpyObj<LocalStorageService>(
      'LocalStorageService',
      ['loadSelectedOrDefaultLanguage', 'init', 'saveEmailAddress'],
      {
        selectedLanguage$: of('en'),
      }
    );
    const fileUtilsSpy = jasmine.createSpyObj<Partial<FileUtilsService>>(
      'FileUtilsService',
      [
        'saveFile',
        'clearNowFormatted',
        'setNowFormatted',
        'downloadQRCode',
        'deleteAllQrCodeFilesAfterSpecifiedTime',
      ]
    );
    const printUtilsSpy = jasmine.createSpyObj('PrintUtilsService', [
      'printQRCode',
      'getConvertedPrintSettings',
    ]);
    printUtilsSpy.getConvertedPrintSettings.and.returnValue(
      '[ ~5 cm / small gap / 8 ]'
    );
    const toastServiceSpy = jasmine.createSpyObj('ToastService', [
      'showToast',
      'showDisabledToast',
    ]);
    const translateSpy = jasmine.createSpyObj<TranslateService>(
      'TranslateService',
      ['setDefaultLang', 'use', 'instant', 'get']
    );
    const alertControllerSpy = jasmine.createSpyObj('AlertController', [
      'create',
    ]);
    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'create',
    ]);

    // 6. Configure TestBed
    await TestBed.configureTestingModule({
      declarations: [TabQrPage],
      imports: [
        IonicModule.forRoot({ mode: 'md', animated: false }),
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        HeaderComponent,
      ],
      providers: [
        { provide: Storage, useValue: storageSpy },
        { provide: QrUtilsService, useValue: qrUtilsSpy },
        { provide: EmailUtilsService, useValue: emailUtilsSpy },
        { provide: LocalStorageService, useValue: localStorageSpy },
        { provide: FileUtilsService, useValue: fileUtilsSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: PrintUtilsService, useValue: printUtilsSpy },
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: ModalController, useValue: modalControllerSpy },
      ],
    }).compileComponents();

    // 7. Create component and setup
    fixture = TestBed.createComponent(TabQrPage);
    component = fixture.componentInstance;

    // Make service properties writable
    const emailUtilsService = TestBed.inject(
      EmailUtilsService
    ) as jasmine.SpyObj<EmailUtilsService>;
    Object.defineProperty(emailUtilsService, 'isEmailSent', {
      writable: true,
      configurable: true,
      value: false,
    });

    const qrUtilsService = TestBed.inject(
      QrUtilsService
    ) as jasmine.SpyObj<QrUtilsService>;
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
    (storageSpy.create as jasmine.Spy).and.returnValue(
      Promise.resolve({} as Storage)
    );
    localStorageSpy.init.and.returnValue(Promise.resolve());
    localStorageSpy.loadSelectedOrDefaultLanguage.and.returnValue(
      Promise.resolve()
    );
    (qrUtilsSpy.clearQrFields as jasmine.Spy).and.returnValue(undefined);
    translateSpy.instant.and.callFake((key: string) => key);
    translateSpy.get.and.callFake((key: string) => of(key));
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
      expect(component).toBeInstanceOf(TabQrPage);
    });

    it('should render basic structure', () => {
      expect(fixture.nativeElement).toBeTruthy();
    });
  });

  describe('sanitizeInputAndGenerateQRCode method', () => {
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;
    let toastService: jasmine.SpyObj<ToastService>;

    beforeEach(() => {
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      toastService = TestBed.inject(
        ToastService
      ) as jasmine.SpyObj<ToastService>;
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
      if (component.qrDataInput) {
        component.qrDataInput.value = '';
      }

      component.sanitizeInputAndGenerateQRCode('');

      expect(qrUtilsService.generateQRCode).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only input', () => {
      const whitespaceInput = '   \n\t   ';

      component.sanitizeInputAndGenerateQRCode(whitespaceInput);

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
      expect(toastService.showToast).toHaveBeenCalledWith(
        'TOAST_TRAILING_BLANKS_REMOVED',
        jasmine.anything()
      );
      expect(component.qrDataInput.value).toBe(expectedTrimmed);
    }));
  });

  describe('hasInputChangedAfterGeneration method', () => {
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
      // Arrange
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

  describe('isGenerationButtonDisabled method', () => {
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

  describe('clearInputField method', () => {
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

    it('should call showClearConfirmation for long input', () => {
      component.qrDataInput = { value: 'x'.repeat(101) } as any;
      const showClearConfirmationSpy = spyOn<any>(
        component,
        'showClearConfirmation'
      ).and.returnValue(Promise.resolve());

      // Act
      component.clearInputField();

      // Assert
      expect(showClearConfirmationSpy).toHaveBeenCalled();
    });

    it('should use 100 chars for showClearConfirmation if environment setting is missing', () => {
      // Arrange - temporarily set environment value to undefined
      const originalMaxLength = environment.maxInputLength;
      (environment as any).maxInputLength = undefined;

      component.qrDataInput = { value: 'x'.repeat(101) } as any;
      const showClearConfirmationSpy = spyOn<any>(
        component,
        'showClearConfirmation'
      ).and.returnValue(Promise.resolve());

      // Act
      component.clearInputField();

      // Assert
      expect(showClearConfirmationSpy).toHaveBeenCalled();
      (environment as any).maxInputLength = originalMaxLength; // Restore original value
    });

    it('should not clear input field and reset services for long input', () => {
      // Arrange
      component.qrDataInput = { value: 'x'.repeat(101) } as any;
      const qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      const emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;

      // Act
      component.clearInputField();

      // Assert
      expect(component.qrDataInput.value).toBe('x'.repeat(101));
      expect(qrUtilsService.clearQrFields).not.toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).not.toHaveBeenCalled();
    });

    it('should present an alert in showClearConfirmation', async () => {
      // Arrange
      const alertController = TestBed.inject(
        AlertController
      ) as jasmine.SpyObj<AlertController>;
      const mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', [
        'present',
      ]);
      alertController.create.and.returnValue(Promise.resolve(mockAlert));

      // Act
      await (component as any).showClearConfirmation();

      // Assert
      expect(alertController.create).toHaveBeenCalled();
      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should call performClear when clear confirmation handler is triggered', async () => {
      // Arrange
      const alertController = TestBed.inject(
        AlertController
      ) as jasmine.SpyObj<AlertController>;
      const mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', [
        'present',
      ]);
      alertController.create.and.returnValue(Promise.resolve(mockAlert));
      const performClearSpy = spyOn<any>(component, 'performClear');

      // Act
      await (component as any).showClearConfirmation();

      // Extract the config passed to alertController.create and find the clear button
      const config = alertController.create.calls.mostRecent().args[0];
      const clearButton = config?.buttons?.find(
        (btn: any) => !!btn.handler
      ) as AlertButton;

      // Call the handler safely with a mock argument
      if (clearButton && typeof clearButton.handler === 'function') {
        clearButton.handler({});
      }

      // Assert
      expect(performClearSpy).toHaveBeenCalled();
    });
  });

  describe('deleteQRCodeIfInputChangedAfterGeneration method', () => {
    it('should delete qr code and show toast if input changed after generation', () => {
      // Arrange
      const qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      const toastService = TestBed.inject(
        ToastService
      ) as jasmine.SpyObj<ToastService>;
      const emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      const translate = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;

      // Mock dependencies
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(true);
      translate.instant.and.callFake((key: string) => key);

      // Act
      component.deleteQRCodeIfInputChangedAfterGeneration();

      // Assert
      expect(qrUtilsService.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsService.clearEmailSent).toHaveBeenCalled();

      // Verify toast is shown
      expect(toastService.showToast).toHaveBeenCalledWith(
        'TOAST_QR_CODE_DELETED_AFTER_INPUT_CHANGE',
        jasmine.anything()
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

  describe('show toast', () => {
    let toastService: jasmine.SpyObj<ToastService>;
    let translate: jasmine.SpyObj<TranslateService>;

    beforeEach(() => {
      toastService = TestBed.inject(
        ToastService
      ) as jasmine.SpyObj<ToastService>;
      translate = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;
      toastService.showToast.calls.reset();
      toastService.showDisabledToast.calls.reset();
      toastService.showDisabledToast.and.returnValue(Promise.resolve());
      // Always return the key for instant to make assertions predictable
      translate.instant.and.callFake((key: string) => key);
    });

    it('should show toast if input changed after qr code generation', () => {
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(true);

      component.deleteQRCodeIfInputChangedAfterGeneration();

      expect(toastService.showToast).toHaveBeenCalledWith(
        'TOAST_QR_CODE_DELETED_AFTER_INPUT_CHANGE',
        jasmine.anything()
      );
    });

    it('should show toast if input has trailing white space', () => {
      component.qrDataInput = {
        value: 'content with trailing spaces ',
      } as any;

      component.handleGenerateButtonClick();

      expect(toastService.showToast).toHaveBeenCalledWith(
        'TOAST_TRAILING_BLANKS_REMOVED',
        jasmine.anything()
      );
    });

    it('should show toast if button is disabled', () => {
      spyOnProperty(
        component,
        'isGenerationButtonDisabled',
        'get'
      ).and.returnValue(true);

      component.handleGenerateButtonClick();

      expect(toastService.showDisabledToast).toHaveBeenCalled();
    });
  });

  describe('getter', () => {
    it('should return configured max length from environment', () => {
      // Act
      const maxLength = component.maxInputLength;

      // Assert
      expect(maxLength).toBe(environment.maxInputLength); // Test actual value
      expect(typeof maxLength).toBe('number');
    });

    it('should return 1000 chars if max length from environment is missing', () => {
      // Arrange - temporarily set environment value to undefined
      const originalMaxLength = environment.maxInputLength;
      (environment as any).maxInputLength = undefined;

      // Act
      const maxLength = component.maxInputLength;

      // Assert
      expect(maxLength).toBe(1000); // Default value
      expect(typeof maxLength).toBe('number');

      // Restore original value
      (environment as any).maxInputLength = originalMaxLength;
    });

    it('should return isNative from utilsService', () => {
      expect(component.isNative).toBe(true);
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
      component.qrDataInput = { value: '' } as any;
      
      component.sanitizeInputAndGenerateQRCode('');
      
      expect(component.qrDataInput.value).toBe('');
      expect(qrUtilsService.generateQRCode).not.toHaveBeenCalled();
    });

    it('should handle maximum length input', () => {
      const maxInput = 'a'.repeat(environment.maxInputLength);
      component.qrDataInput = { value: maxInput } as any;
      
      component.sanitizeInputAndGenerateQRCode(maxInput);
      
      expect(qrUtilsService.generateQRCode).toHaveBeenCalledWith(maxInput);
    });

    it('should handle special characters', () => {
      const specialChars = "%$&'()*+,-./:;<=>?@[]^_`{|}~";
      component.qrDataInput = { value: specialChars } as any;
      
      component.sanitizeInputAndGenerateQRCode(specialChars);
      
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
    });

    it('should not print and send QR Code if downloadQRCode does not exist', async () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock all operations as successful
      fileUtilsService.setNowFormatted = jasmine.createSpy('setNowFormatted');
      fileUtilsService.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.resolve(false));
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

      // Assert
      expect(fileUtilsService.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsService.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link'
      );
      expect(qrUtilsService.printQRCode).not.toHaveBeenCalled();
      expect(emailUtilsService.sendEmail).not.toHaveBeenCalled();
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

      // Act
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

      // Act
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Email workflow failed:',
        jasmine.any(Error)
      );
      expect(alertService.showErrorAlert).toHaveBeenCalledWith(
        'ERROR_MESSAGE_EMAIL_WORKFLOW'
      );
      expect(fileUtilsService.clearNowFormatted).toHaveBeenCalled();
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

      // Act
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert
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

  describe('ngOnInit method', () => {
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
      fileUtilsService.deleteAllQrCodeFilesAfterSpecifiedTime.and.returnValue(
        Promise.resolve()
      );
    });

    it('should initialize component without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should call localStorage initialization', () => {
      component.ngOnInit();

      expect(localStorageService.init).toHaveBeenCalled();
    });

    it('should set initial screen width', () => {
      // Arrange
      WindowMockUtil.mockInnerWidth(1024);

      // Create fresh component to read mocked value
      const widthTestFixture = TestBed.createComponent(TabQrPage);
      const widthTestComponent = widthTestFixture.componentInstance;

      // Act
      widthTestComponent.ngOnInit();

      // Assert
      expect(widthTestComponent.screenWidth).toBe(1024);
    });

    it('should set initial number of rows for portrait orientation', () => {
      // Arrange
      mockMatchMedia.and.returnValue({ matches: true });

      const freshFixture = TestBed.createComponent(TabQrPage);
      const freshComponent = freshFixture.componentInstance;

      // Act
      freshComponent.ngOnInit();

      // Assert
      expect(freshComponent.nbrOfInitialRows).toBe(6); // Portrait = 6 rows
    });

    it('should set initial number of rows for landscape orientation', () => {
      // Arrange
      mockMatchMedia.and.returnValue({ matches: false });
      const freshFixture = TestBed.createComponent(TabQrPage);
      const freshComponent = freshFixture.componentInstance;

      // Act
      freshComponent.ngOnInit();

      // Assert
      expect(freshComponent.nbrOfInitialRows).toBe(1); // Landscape = 1 row
    });

    it('should not add keyboard listeners on web platforms', () => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      const keyboardSpy = spyOn(Keyboard, 'addListener');

      component.ngOnInit();

      expect(keyboardSpy).not.toHaveBeenCalled();
    });

    it('should log initialization errors', async () => {
      // Arrange
      localStorageService.init.and.returnValue(Promise.reject('Init failed'));
      spyOn(console, 'error');

      // Act
      component.ngOnInit();
      await Promise.resolve();

      //Assert
      expect(() => component.ngOnInit()).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'App initialization failed:',
        'Init failed'
      );
    });

    it('should log delete qr code file errors', async () => {
      // Arrange
      fileUtilsService.deleteAllQrCodeFilesAfterSpecifiedTime.and.returnValue(
        Promise.reject('Delete failed')
      );
      spyOn(console, 'warn');

      // Act
      component.ngOnInit();
      // wait for all pending microtasks/macrotasks created by ngOnInit
      await fixture.whenStable();

      // Assert
      expect(() => component.ngOnInit()).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(
        'File cleanup failed:',
        'Delete failed'
      );
    });
  });

  describe('ngOnDestroy method', () => {
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

  describe('handleEmailBasedOnPlatform method', () => {
    let utilsService: jasmine.SpyObj<UtilsService>;
    let emailService: jasmine.SpyObj<EmailUtilsService>;
    let platform: jasmine.SpyObj<Platform>;

    beforeEach(() => {
      utilsService = TestBed.inject(
        UtilsService
      ) as jasmine.SpyObj<UtilsService>;
      emailService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      platform = TestBed.inject(Platform) as jasmine.SpyObj<Platform>;
    });

    it('should call sendEmail for native platforms', async () => {
      spyOnProperty(utilsService, 'isNative', 'get').and.returnValue(true);
      platform.is = jasmine.createSpy().and.returnValue(false);

      await (component as any).handleEmailBasedOnPlatform();

      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(emailService.displayEmailAttachmentAlert).not.toHaveBeenCalled();
    });

    it('should call displayEmailAttachmentAlert for desktop platforms', async () => {
      // Arrange
      spyOnProperty(utilsService, 'isNative', 'get').and.returnValue(false);

      platform.is = jasmine
        .createSpy()
        .and.callFake((type: string) => type === 'desktop');
      emailService.displayEmailAttachmentAlert.and.callFake((cb: Function) =>
        cb()
      );

      // Act
      await (component as any).handleEmailBasedOnPlatform();

      // Assert
      expect(emailService.displayEmailAttachmentAlert).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should call showMobileWebEmailOptions for other platforms', async () => {
      // Arrange
      spyOnProperty(utilsService, 'isNative', 'get').and.returnValue(false);
      platform.is = jasmine.createSpy().and.returnValue(false);
      const showMobileWebEmailOptionsSpy = spyOn<any>(
        component,
        'showMobileWebEmailOptions'
      ).and.returnValue(Promise.resolve());

      // Act
      await (component as any).handleEmailBasedOnPlatform();

      // Assert
      expect(showMobileWebEmailOptionsSpy).toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
      expect(emailService.displayEmailAttachmentAlert).not.toHaveBeenCalled();
    });
  });

  describe('showWorkflowStep method', () => {
    it('should show step generate if current step is enter text', () => {
      component.workflowStep = Workflow.StepEnterText;
      (component as any).showWorkflowStep(component.workflowStep);
      expect(component.workflowStep).toBe(Workflow.StepGenerate);
    });

    it('should show step mail if current step is step generate', () => {
      component.workflowStep = Workflow.StepGenerate;
      (component as any).showWorkflowStep(component.workflowStep);
      expect(component.workflowStep).toBe(Workflow.StepMail);
    });

    it('should show step mail again if current step is mail', () => {
      component.workflowStep = Workflow.StepMail;
      (component as any).showWorkflowStep(component.workflowStep);
      expect(component.workflowStep).toBe(Workflow.StepMailAgain);
    });

    it('should not change step in other cases', () => {
      component.workflowStep = Workflow.StepMail;
      (component as any).showWorkflowStep('invalid step');
      expect(component.workflowStep).toBe(Workflow.StepMail);
    });
  });

  describe('showWorkflowStepGenerate method', () => {
    beforeEach(() => {
      component.workflowStep = Workflow.StepEnterText;
    });

    it('should not show workflow step if no text entered', async () => {
      const text = '';
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).not.toBe(Workflow.StepGenerate);
    });

    it('should show workflow step if character count > 10', () => {
      let text = 'a'.repeat(11);
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).toBe(Workflow.StepGenerate);

      component.workflowStep = Workflow.StepEnterText;
      text = 'a'.repeat(10);
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).not.toBe(Workflow.StepGenerate);
    });

    it('should show workflow step if more than 5 chars and more than 1 line', () => {
      let text = '123456\n1';
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).toBe(Workflow.StepGenerate);

      component.workflowStep = Workflow.StepEnterText;
      text = '12345';
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).not.toBe(Workflow.StepGenerate);
    });

    it('should show workflow step if more than 5 words', () => {
      let text = 'a '.repeat(6);
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).toBe(Workflow.StepGenerate);

      component.workflowStep = Workflow.StepEnterText;
      text = 'a '.repeat(5);
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).not.toBe(Workflow.StepGenerate);
    });

    it('should show workflow step if at least 4 chars and a point', () => {
      let text = 'a'.repeat(4) + '.';
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).toBe(Workflow.StepGenerate);

      component.workflowStep = Workflow.StepEnterText;
      text = 'a'.repeat(3) + '.';
      (component as any).showWorkflowStepGenerate(text);
      expect(component.workflowStep).not.toBe(Workflow.StepGenerate);
    });
  });

  describe('shouldShowKeyboardAlert method', () => {
    it('should not show keyboard alert if no text entered', async () => {
      const text = '';
      expect((component as any).shouldShowKeyboardAlert(text)).toBeFalse();
    });

    it('should show keyboard alert if character count > 150', () => {
      let text = 'a'.repeat(151);
      expect((component as any).shouldShowKeyboardAlert(text)).toBeTrue();

      text = 'a'.repeat(150);
      expect((component as any).shouldShowKeyboardAlert(text)).toBeFalse();
    });

    it('should show keyboard alert if more than 5 lines', () => {
      let text = 'abc\n1'.repeat(5);
      expect((component as any).shouldShowKeyboardAlert(text)).toBeTrue();

      text = 'abc\n1'.repeat(4);
      expect((component as any).shouldShowKeyboardAlert(text)).toBeFalse();
    });

    it('should show keyboard alert if more than 25 words', () => {
      let text = 'a '.repeat(26);
      expect((component as any).shouldShowKeyboardAlert(text)).toBeTrue();

      text = 'a '.repeat(25);
      expect((component as any).shouldShowKeyboardAlert(text)).toBeFalse();
    });

    it('should show keyboard alert if long sentence', () => {
      let text = 'a'.repeat(129) + '.';
      expect((component as any).shouldShowKeyboardAlert(text)).toBeTrue();

      text = 'a'.repeat(128) + '.';
      expect((component as any).shouldShowKeyboardAlert(text)).toBeFalse();
    });
  });

  describe('onTextareaInput and onQrDataInputBlur', () => {
    beforeEach(() => {
      // Provide a mock qrDataInput for the component
      component.qrDataInput = { value: '' } as any;
      spyOn(component as any, 'deleteQRCodeIfInputChangedAfterGeneration');
      spyOn(component as any, 'showWorkflowStepGenerate');
      spyOn(component as any, 'showKeyboardAlert');
      spyOnProperty(
        (component as any).utilsService,
        'isSmallDevice',
        'get'
      ).and.returnValue(true);
      (component as any).hasShownKeyboardAlert = false;
      spyOn(component as any, 'shouldShowKeyboardAlert').and.returnValue(true);
      // For onQrDataInputBlur
      (component as any).printUtilsService.qrDataInputSub = {
        next: jasmine.createSpy('next'),
      };
    });

    it('should call deleteQRCodeIfInputChangedAfterGeneration and showWorkflowStepGenerate on textarea input', () => {
      component.qrDataInput.value = 'test';

      component.onTextareaInput();

      expect(
        (component as any).deleteQRCodeIfInputChangedAfterGeneration
      ).toHaveBeenCalled();
      expect((component as any).showWorkflowStepGenerate).toHaveBeenCalledWith(
        'test'
      );
    });

    it('should show keyboard alert if criteria met and not shown before', fakeAsync(() => {
      component.qrDataInput.value = 'trigger';

      component.onTextareaInput();
      tick(600);

      expect((component as any).showKeyboardAlert).toHaveBeenCalled();
    }));

    it('should not show keyboard alert if already shown', () => {
      (component as any).hasShownKeyboardAlert = true;
      component.qrDataInput.value = 'trigger';

      component.onTextareaInput();

      expect((component as any).showKeyboardAlert).not.toHaveBeenCalled();
    });

    it('should call printUtilsService.qrDataInputSub.next with trimmed length on blur', () => {
      component.qrDataInput.value = 'abc   ';
      component.onQrDataInputBlur();
      expect(
        (component as any).printUtilsService.qrDataInputSub.next
      ).toHaveBeenCalledWith(3);
    });

    it('should use default value if qrDataInput is empty on blur', () => {
      component.qrDataInput.value = '';
      component.onQrDataInputBlur();
      expect(
        (component as any).printUtilsService.qrDataInputSub.next
      ).toHaveBeenCalledWith(1);
    });
  });

  it('onChangeURL event', () => {
    const url = 'some url';
    const qrUtilsService = TestBed.inject(
      QrUtilsService
    ) as jasmine.SpyObj<QrUtilsService>;
    qrUtilsService.setDownloadLink.and.stub();

    component.onChangeURL(url);

    expect(qrUtilsService.setDownloadLink).toHaveBeenCalledWith(url);
  });

  function isButtonObj(
    btn: any
  ): btn is { text?: string; handler?: any; role?: string } {
    return typeof btn === 'object' && btn !== null;
  }

  describe('showMobileWebEmailOptions', () => {
    let alertController: jasmine.SpyObj<AlertController>;
    let emailService: jasmine.SpyObj<EmailUtilsService>;
    let translate: jasmine.SpyObj<TranslateService>;
    let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;

    beforeEach(() => {
      alertController = TestBed.inject(
        AlertController
      ) as jasmine.SpyObj<AlertController>;
      emailService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      translate = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;

      mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
      alertController.create.and.returnValue(Promise.resolve(mockAlert));
      translate.instant.and.callFake((key: string) => key);
    });

    it('should present an alert with correct options', async () => {
      await (component as any).showMobileWebEmailOptions();

      expect(alertController.create).toHaveBeenCalled();
      const config = alertController.create.calls.mostRecent().args[0] || {};

      expect(config.header).toBe('MOBILE_WEB_EMAIL_TITLE');
      expect(config.message).toBe('MOBILE_WEB_EMAIL_MESSAGE');
      expect(config.cssClass).toBe('show-mobile-web-email-options');
      expect(Array.isArray(config.buttons)).toBeTrue();
      expect(config.buttons?.length).toBe(4);

      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should call emailService.sendEmail when "try email" button is pressed', async () => {
      await (component as any).showMobileWebEmailOptions();
      const config = alertController.create.calls.mostRecent().args[0] || {};
      const tryEmailBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'MOBILE_WEB_TRY_EMAIL'
      );
      expect(tryEmailBtn).toBeDefined();

      if (
        isButtonObj(tryEmailBtn) &&
        typeof tryEmailBtn.handler === 'function'
      ) {
        tryEmailBtn.handler({});
      }
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should call copyQRTextToClipboard when "copy text" button is pressed', async () => {
      const copySpy = spyOn<any>(
        component,
        'copyQRTextToClipboard'
      ).and.returnValue(Promise.resolve());
      await (component as any).showMobileWebEmailOptions();
      const config = alertController.create.calls.mostRecent().args[0] || {};
      const copyBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'MOBILE_WEB_COPY_TEXT'
      );
      expect(copyBtn).toBeDefined();

      if (isButtonObj(copyBtn) && typeof copyBtn.handler === 'function') {
        await copyBtn.handler({});
      }
      expect(copySpy).toHaveBeenCalled();
    });

    it('should call showManualInstructions when "instructions" button is pressed', async () => {
      const instructionsSpy = spyOn<any>(
        component,
        'showManualInstructions'
      ).and.returnValue(Promise.resolve());
      await (component as any).showMobileWebEmailOptions();
      const config = alertController.create.calls.mostRecent().args[0] || {};
      const instructionsBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'MOBILE_WEB_INSTRUCTIONS'
      );
      expect(instructionsBtn).toBeDefined();

      if (
        isButtonObj(instructionsBtn) &&
        typeof instructionsBtn.handler === 'function'
      ) {
        await instructionsBtn.handler({});
      }
      expect(instructionsSpy).toHaveBeenCalled();
    });

    it('should have a cancel button', async () => {
      await (component as any).showMobileWebEmailOptions();
      const config = alertController.create.calls.mostRecent().args[0] || {};
      const cancelBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'CANCEL'
      );
      expect(cancelBtn).toBeDefined();
      expect(isButtonObj(cancelBtn) && cancelBtn.role).toBe('cancel');
    });
  });

  describe('handleGenerateButtonClick method', () => {
    let toastService: jasmine.SpyObj<ToastService>;
    let emailUtilsService: any;

    beforeEach(() => {
      toastService = TestBed.inject(
        ToastService
      ) as jasmine.SpyObj<ToastService>;
      toastService.showDisabledToast.and.returnValue(Promise.resolve());
      emailUtilsService = TestBed.inject(
        EmailUtilsService
      ) as jasmine.SpyObj<EmailUtilsService>;
      component.qrService.isQrCodeGenerated = false;
      emailUtilsService.isEmailSent = false;
    });

    it('should generate QR Code if valid input', () => {
      component.qrDataInput = { value: 'some value' } as any;
      spyOn(component, 'sanitizeInputAndGenerateQRCode');
      spyOn(component as any, 'showWorkflowStep');
      spyOn(component as any, 'generateMarginForButtonsIfNeeded');

      component.handleGenerateButtonClick();

      expect(component.sanitizeInputAndGenerateQRCode).toHaveBeenCalled();
      expect((component as any).showWorkflowStep).toHaveBeenCalled();
      expect(
        (component as any).generateMarginForButtonsIfNeeded
      ).toHaveBeenCalled();
    });

    it('should show toast if qrDataInput is empty', () => {
      component.qrDataInput = { value: '' } as any;

      component.handleGenerateButtonClick();

      expect(toastService.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_GENERATION_ENTER_TEXT_FIRST',
        jasmine.anything()
      );
      expect(toastService.showToast).not.toHaveBeenCalled();
    });

    it('should show toast if qr code is already generated', () => {
      component.qrDataInput = { value: 'some value' } as any;
      component.qrService.isQrCodeGenerated = true;

      component.handleGenerateButtonClick();

      expect(toastService.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_GENERATION_QR_ALREADY_GENERATED',
        jasmine.anything()
      );
      expect(toastService.showToast).not.toHaveBeenCalled();
    });

    it('should show toast if email is sent', () => {
      component.qrDataInput = { value: 'some value' } as any;
      emailUtilsService.isEmailSent = true;
      component.handleGenerateButtonClick();

      expect(toastService.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_GENERATION_EMAIL_ALREADY_SENT',
        jasmine.anything()
      );
      expect(toastService.showToast).not.toHaveBeenCalled();
    });

    it('should handle error in toastService if qr code is empty', fakeAsync(() => {
      toastService.showDisabledToast.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'error');
      component.qrDataInput = { value: '' } as any;

      component.handleGenerateButtonClick();
      tick();

      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        'fail'
      );
    }));

    it('should handle error in toastService if qr code is already generated', fakeAsync(() => {
      toastService.showDisabledToast.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'error');
      component.qrDataInput = { value: 'some value' } as any;
      component.qrService.isQrCodeGenerated = true;

      component.handleGenerateButtonClick();
      tick();

      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        'fail'
      );
    }));

    it('should handle error in toastService if email is sent', fakeAsync(() => {
      toastService.showDisabledToast.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'error');
      component.qrDataInput = { value: 'some value' } as any;
      emailUtilsService.isEmailSent = true;

      component.handleGenerateButtonClick();
      tick();

      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        'fail'
      );
    }));
  });

  describe('handleSendEmailButtonClick method', () => {
    let toastService: jasmine.SpyObj<ToastService>;

    beforeEach(() => {
      toastService = TestBed.inject(
        ToastService
      ) as jasmine.SpyObj<ToastService>;
    });

    it('should send email if QR code is generated', async () => {
      spyOn(component, 'storeMailAndDeleteQRCode').and.returnValue(
        Promise.resolve()
      );
      spyOn<any>(component, 'showWorkflowStep');
      component.qrService.isQrCodeGenerated = true;

      component.handleSendEmailButtonClick();

      expect(component.storeMailAndDeleteQRCode).toHaveBeenCalled();
      expect((component as any).showWorkflowStep).toHaveBeenCalled();
    });

    it('should show toast if QR Code is not generated', () => {
      toastService.showDisabledToast.and.returnValue(Promise.resolve());
      component.qrService.isQrCodeGenerated = false;

      component.handleSendEmailButtonClick();

      expect(toastService.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_EMAIL_NO_QR_GENERATED',
        jasmine.anything()
      );
      expect(toastService.showToast).not.toHaveBeenCalled();
    });

    it('should handle error in toastService if qr code is already generated', async () => {
      toastService.showDisabledToast.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'error');
      component.qrService.isQrCodeGenerated = false;

      component.handleSendEmailButtonClick();
      await Promise.resolve();

      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        'fail'
      );
    });
  });

  describe('showManualInstructions', () => {
    let modalController: jasmine.SpyObj<ModalController>;
    let translate: jasmine.SpyObj<TranslateService>;
    let qrService: jasmine.SpyObj<QrUtilsService>;
    let mockModal: jasmine.SpyObj<HTMLIonModalElement>;

    beforeEach(() => {
      modalController = TestBed.inject(
        ModalController
      ) as jasmine.SpyObj<ModalController>;
      translate = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;
      qrService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present']);
      modalController.create.and.returnValue(Promise.resolve(mockModal));
      translate.instant.and.callFake((key: string) => key);
      qrService.myAngularxQrCode = 'test-qr-text';
    });

    it('should create and present the manual instructions modal with correct props', async () => {
      await (component as any).showManualInstructions();

      expect(modalController.create).toHaveBeenCalled();
      const config = modalController.create.calls.mostRecent().args[0];

      expect(config.component).toBeDefined();
      expect(config.componentProps).toBeDefined();

      const {
        title,
        instructions,
        qrText,
        qrTextLabel,
        copyButtonLabel,
        copyCallback,
      } = config.componentProps!;

      expect(title).toBe('MOBILE_WEB_MANUAL_TITLE');
      expect(instructions).toBe('MOBILE_WEB_MANUAL_MESSAGE');
      expect(qrText).toBe('test-qr-text');
      expect(qrTextLabel).toBe('MOBILE_WEB_QR_TEXT');
      expect(copyButtonLabel).toBe('MOBILE_WEB_COPY_TEXT');
      expect(typeof copyCallback).toBe('function');
      expect(config.cssClass).toBe('manual-instructions-modal');
      expect(mockModal.present).toHaveBeenCalled();
    });

    it('should call copyQRTextToClipboard when copyCallback is invoked', async () => {
      let called = false;
      (component as any).copyQRTextToClipboard = () => {
        called = true;
        return Promise.resolve();
      };

      await (component as any).showManualInstructions();

      const config = modalController.create.calls.mostRecent().args[0];
      const copyCallback =
        config.componentProps && config.componentProps['copyCallback'];
      if (copyCallback) {
        await copyCallback();
      }
      expect(called).toBeTrue();
    });
  });

  describe('openHelpModalToSection', () => {
    let modalController: jasmine.SpyObj<ModalController>;
    let translate: jasmine.SpyObj<TranslateService>;
    let mockModal: jasmine.SpyObj<HTMLIonModalElement>;
    let utilsService: jasmine.SpyObj<UtilsService>;

    beforeEach(() => {
      modalController = TestBed.inject(
        ModalController
      ) as jasmine.SpyObj<ModalController>;
      translate = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;
      Object.defineProperty(translate, 'currentLang', {
        configurable: true,
        get: () => 'en',
      });
      mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present']);
      modalController.create.and.returnValue(Promise.resolve(mockModal));
      translate.instant.and.callFake((key: string) => key);
      utilsService = TestBed.inject(
        UtilsService
      ) as jasmine.SpyObj<UtilsService>;
    });

    it('should create and present the help instructions modal with correct props for native apps', async () => {
      spyOnProperty(component, 'maxInputLength', 'get').and.returnValue(123);

      await (component as any).openHelpModalToSection('floating-keyboard');
      const config = modalController.create.calls.mostRecent().args[0];

      expect(config.component).toBeDefined();
      expect(config.componentProps).toBeDefined();

      const { maxInputLength, scrollToSection } = config.componentProps!;

      expect(maxInputLength).toBe(123);
      expect(scrollToSection).toBe('floating-keyboard');
      expect(config.cssClass).toBe('manual-instructions-modal');
      expect(mockModal.present).toHaveBeenCalled();
    });

    it('should create and present the help instructions modal with correct props for desktop apps', async () => {
      spyOnProperty(component, 'maxInputLength', 'get').and.returnValue(123);
      spyOnProperty(utilsService, 'isNative', 'get').and.returnValue(false);

      await (component as any).openHelpModalToSection('web-version');

      const config = modalController.create.calls.mostRecent().args[0];

      expect(config.component).toBeDefined();
      expect(config.componentProps).toBeDefined();

      const { maxInputLength, scrollToSection } = config.componentProps!;

      expect(maxInputLength).toBe(123);
      expect(scrollToSection).toBe('web-version');
      expect(config.cssClass).toBe('manual-instructions-modal desktop');
      expect(mockModal.present).toHaveBeenCalled();
    });

    it('should set the correct scrollToSection for English', async () => {
      await (component as any).openHelpModalToSection('web-version');
      let config = modalController.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe('web-version');

      await (component as any).openHelpModalToSection('floating-keyboard');
      config = modalController.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe(
        'floating-keyboard'
      );
    });

    it('should set the correct scrollToSection for German', async () => {
      spyOnProperty(translate, 'currentLang', 'get').and.returnValue('de');

      await (component as any).openHelpModalToSection('web-version');
      let config = modalController.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe('web-version-DE');

      await (component as any).openHelpModalToSection('floating-keyboard');
      config = modalController.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe(
        'floating-keyboard-DE'
      );
    });

    it('should set the correct scrollToSection for other languages', async () => {
      spyOnProperty(translate, 'currentLang', 'get').and.returnValue('fr');

      await (component as any).openHelpModalToSection('web-version');
      let config = modalController.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe('web-version');

      await (component as any).openHelpModalToSection('floating-keyboard');
      config = modalController.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe(
        'floating-keyboard'
      );
    });

    it('should set the correct scrollToSection for undefined languages', async () => {
      spyOnProperty(translate, 'currentLang', 'get').and.returnValue('');

      await (component as any).openHelpModalToSection('web-version');
      let config = modalController.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe('web-version');

      await (component as any).openHelpModalToSection('floating-keyboard');
      config = modalController.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe(
        'floating-keyboard'
      );
    });
  });

  describe('showKeyboardAlert', () => {
    let alertController: jasmine.SpyObj<AlertController>;
    let translate: jasmine.SpyObj<TranslateService>;
    let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;

    beforeEach(async () => {
      alertController = TestBed.inject(
        AlertController
      ) as jasmine.SpyObj<AlertController>;
      translate = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;

      mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', [
        'present',
        'dismiss',
      ]);
      alertController.create.and.returnValue(Promise.resolve(mockAlert));
      mockAlert.dismiss.and.returnValue(Promise.resolve(true));
      translate.instant.and.callFake((key: string) => key);
    });

    it('should present an alert with correct options', async () => {
      await (component as any).showKeyboardAlert();

      expect(alertController.create).toHaveBeenCalled();
      const config = alertController.create.calls.mostRecent().args[0] || {};

      expect(config.header).toBe('KEYBOARD_ALERT_TITLE');
      expect(config.message).toBe('KEYBOARD_ALERT_MESSAGE');
      expect(config.cssClass).toBe('keyboard-alert');
      expect(Array.isArray(config.buttons)).toBeTrue();
      expect(config.buttons?.length).toBe(3);

      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should call performClear when "clear and use short text" button is pressed', async () => {
      let called = false;
      (component as any).performClear = async () => {
        called = true;
        return Promise.resolve();
      };

      await (component as any).showKeyboardAlert();

      const config = alertController.create.calls.mostRecent().args[0] || {};
      const clearBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'KEYBOARD_ALERT_SHORT_TEXT'
      );
      expect(clearBtn).toBeDefined();

      if (isButtonObj(clearBtn) && typeof clearBtn.handler === 'function') {
        await clearBtn.handler({});
      }
      expect(mockAlert.dismiss).toHaveBeenCalled();
      expect(called).toBeTrue();
    });

    it('should call openModalToSection with web-version when "show help web version" button is pressed', async () => {
      const openHelpModalSpy = spyOn<any>(
        component,
        'openHelpModalToSection'
      ).and.returnValue(Promise.resolve());

      await (component as any).showKeyboardAlert();

      const config = alertController.create.calls.mostRecent().args[0] || {};
      const openHelpBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'KEYBOARD_ALERT_HELP_WEB'
      );
      expect(openHelpBtn).toBeDefined();

      if (
        isButtonObj(openHelpBtn) &&
        typeof openHelpBtn.handler === 'function'
      ) {
        await openHelpBtn.handler({});
      }
      expect(mockAlert.dismiss).toHaveBeenCalled();
      expect(openHelpModalSpy).toHaveBeenCalledWith('web-version');
    });

    it('should call openModalToSection with floating-keyboard when "show help floating keyboard" button is pressed', async () => {
      const openHelpModalSpy = spyOn<any>(
        component,
        'openHelpModalToSection'
      ).and.returnValue(Promise.resolve());

      await (component as any).showKeyboardAlert();

      const config = alertController.create.calls.mostRecent().args[0] || {};
      const openHelpBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'KEYBOARD_ALERT_HELP_KEYBOARD'
      );
      expect(openHelpBtn).toBeDefined();

      if (
        isButtonObj(openHelpBtn) &&
        typeof openHelpBtn.handler === 'function'
      ) {
        await openHelpBtn.handler({});
      }
      expect(mockAlert.dismiss).toHaveBeenCalled();
      expect(openHelpModalSpy).toHaveBeenCalledWith('floating-keyboard');
    });

    it('should set hasShownKeyboardAlert to true', async () => {
      (component as any).hasShownKeyboardAlert = false;
      await (component as any).showKeyboardAlert();
      expect((component as any).hasShownKeyboardAlert).toBeTrue();
    });
  });

  describe('showCopySuccessAlert', () => {
    let alertController: jasmine.SpyObj<AlertController>;
    let translate: jasmine.SpyObj<TranslateService>;
    let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;

    beforeEach(() => {
      alertController = TestBed.inject(
        AlertController
      ) as jasmine.SpyObj<AlertController>;
      translate = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;
      mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
      alertController.create.and.returnValue(Promise.resolve(mockAlert));
      translate.instant.and.callFake((key: string) => key);
    });

    it('should present an alert with correct options and show short text', async () => {
      const copiedText = 'short text';
      await (component as any).showCopySuccessAlert(copiedText);

      expect(alertController.create).toHaveBeenCalled();
      const config = alertController.create.calls.mostRecent().args[0] || {};

      expect(config.header).toBe('MOBILE_WEB_COPY_SUCCESS_TITLE');
      expect(config.subHeader).toBe('MOBILE_WEB_COPY_SUCCESS');
      expect(config.cssClass).toBe('copy-success-alert');
      expect(Array.isArray(config.buttons)).toBeTrue();
      expect(config.buttons?.length).toBe(1);
      expect(config.buttons![0]).toBe('OK');
      expect(config.message).toContain('MOBILE_WEB_COPIED_TEXT_PREVIEW');
      expect(config.message).toContain('"short text"');
      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should present an alert with truncated text if copiedText is long', async () => {
      const maxPreviewLength = environment.maxPreviewLengthOfCopiedText ?? 50;
      const longText = 'a'.repeat(maxPreviewLength + 10);

      await (component as any).showCopySuccessAlert(longText);

      const config = alertController.create.calls.mostRecent().args[0] || {};
      expect(config.message).toContain('MOBILE_WEB_COPIED_TEXT_PREVIEW');
      expect(config.message).toContain('"');
      expect(config.message).toContain('...');
      expect(config.message).not.toContain(longText);
      const truncated = 'a'.repeat(maxPreviewLength);
      expect(config.message).toContain(truncated);
      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should handle empty copiedText gracefully', async () => {
      await (component as any).showCopySuccessAlert('');
      
      const config = alertController.create.calls.mostRecent().args[0] || {};
      expect(config.message).toContain('""');
      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should use default maxPreviewLength if environment variable is invalid', async () => {
      const originalValue = environment.maxPreviewLengthOfCopiedText;
      (environment as any).maxPreviewLengthOfCopiedText = undefined;
      const longText = 'a'.repeat(999);
      await (component as any).showCopySuccessAlert(longText);

      const config = alertController.create.calls.mostRecent().args[0] || {};
      expect(config.message).toContain('MOBILE_WEB_COPIED_TEXT_PREVIEW');
      expect(config.message).toContain('"');
      expect(config.message).toContain('...');
      expect(config.message).not.toContain(longText);
      const truncated = 'a'.repeat(50);
      expect(config.message).toContain(truncated);
      expect(mockAlert.present).toHaveBeenCalled();

      (environment as any).maxPreviewLengthOfCopiedText = originalValue;
    });
  });

  describe('copyQRTextToClipboard', () => {
    let alertService: jasmine.SpyObj<AlertService>;
    let qrUtilsService: jasmine.SpyObj<QrUtilsService>;

    beforeEach(() => {
      alertService = TestBed.inject(
        AlertService
      ) as jasmine.SpyObj<AlertService>;
      qrUtilsService = TestBed.inject(
        QrUtilsService
      ) as jasmine.SpyObj<QrUtilsService>;
      qrUtilsService.myAngularxQrCode = 'copied QR text';
      spyOn(component as any, 'showCopySuccessAlert').and.returnValue(
        Promise.resolve()
      );
    });

    it('should use navigator.clipboard.writeText if available and show success alert', async () => {
      // Arrange
      if (!navigator.clipboard) {
        (navigator as any).clipboard = {};
      }
      spyOnProperty<any>(navigator, 'clipboard', 'get').and.returnValue({
        writeText: jasmine.createSpy().and.returnValue(Promise.resolve()),
      });
      const writeTextSpy = navigator.clipboard.writeText as jasmine.Spy;

      // Act
      await (component as any).copyQRTextToClipboard();

      // Assert
      expect(writeTextSpy).toHaveBeenCalledWith('copied QR text');
      expect((component as any).showCopySuccessAlert).toHaveBeenCalledWith(
        'copied QR text'
      );
    });

    it('should use fallback method if navigator.clipboard is not available and show success alert', async () => {
      // Arrange
      spyOnProperty<any>(navigator, 'clipboard', 'get').and.returnValue(
        undefined
      );
      const appendChildSpy = spyOn(
        document.body,
        'appendChild'
      ).and.callThrough();
      const removeChildSpy = spyOn(
        document.body,
        'removeChild'
      ).and.callThrough();
      const execCommandSpy = spyOn(document, 'execCommand').and.returnValue(
        true
      );

      // Act
      await (component as any).copyQRTextToClipboard();

      // Assert
      expect(appendChildSpy).toHaveBeenCalled();
      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(removeChildSpy).toHaveBeenCalled();
      expect((component as any).showCopySuccessAlert).toHaveBeenCalledWith(
        'copied QR text'
      );
    });

    it('should handle errors and show error alert', async () => {
      // Arrange
      if (!('clipboard' in navigator)) {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          get: () => undefined,
        });
      }
      spyOnProperty<any>(navigator, 'clipboard', 'get').and.returnValue({
        writeText: () => Promise.reject(new Error('copy failed')),
      });
      spyOn(console, 'error');
      alertService.showErrorAlert = jasmine
        .createSpy('showErrorAlert')
        .and.returnValue(Promise.resolve());

      // Act
      await (component as any).copyQRTextToClipboard();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(alertService.showErrorAlert).toHaveBeenCalledWith(
        'MOBILE_WEB_COPY_ERROR'
      );
    });
  });
});
