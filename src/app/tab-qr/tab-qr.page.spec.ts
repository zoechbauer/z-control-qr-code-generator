import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IonicModule, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

import { createTranslateServiceMock } from '@testing/translate-service.mock';
import { QrUtilsService } from '../services/qr-utils.service';
import { EmailUtilsService } from '../services/email-utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { FileUtilsService } from '../services/file-utils.service';
import { AlertService } from '../services/alert.service';
import { TabQrPage, Workflow } from './tab-qr.page';
import { environment } from '@env/environment';
import { WindowMockUtil } from '@testing/window-mock.util';
import { PrintUtilsService } from '../services/print-utils.service';
import { HeaderComponent } from '../ui/components/header/header.component';
import { UtilsService } from '../services/utils.service';
import { ToastService } from '../services/toast.service';
import { MobileWebEmailOptions } from '../shared/enums';

describe('TabQrPage', () => {
  let component: TabQrPage;
  let fixture: ComponentFixture<TabQrPage>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let emailUtilsServiceSpy: jasmine.SpyObj<EmailUtilsService>;
  let fileUtilsServiceSpy: jasmine.SpyObj<FileUtilsService>;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;
  let keyboardSpy: jasmine.Spy;
  let mockMatchMedia: jasmine.Spy;
  let printUtilsServiceSpy: jasmine.SpyObj<PrintUtilsService>;
  let qrUtilsServiceSpy: jasmine.SpyObj<QrUtilsService>;
  let storageSpy: jasmine.SpyObj<Storage>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;

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
              Promise.resolve({ remove: jasmine.createSpy('remove') }),
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
    keyboardSpy = spyOn(Keyboard, 'addListener').and.returnValue(
      Promise.resolve({ remove: jasmine.createSpy('remove') }),
    );
    spyOn(Keyboard, 'removeAllListeners').and.returnValue(Promise.resolve());
    spyOn(Keyboard, 'hide').and.returnValue(Promise.resolve());
    spyOn(Keyboard, 'show').and.returnValue(Promise.resolve());

    // 5. Create service spies
    storageSpy = jasmine.createSpyObj<Storage>('Storage', [
      'get',
      'set',
      'remove',
      'create',
    ]);
    qrUtilsServiceSpy = jasmine.createSpyObj<QrUtilsService>(
      'QrUtilsService',
      ['generateQRCode', 'clearQrFields', 'printQRCode', 'setDownloadLink'],
      {
        isQrCodeGenerated: false,
        myAngularxQrCode: '',
        qrCodeDownloadLink: '',
      },
    );
    emailUtilsServiceSpy = jasmine.createSpyObj<EmailUtilsService>(
      'EmailUtilsService',
      ['sendEmail', 'clearEmailSent', 'displayEmailAttachmentAlert'],
      {
        isEmailSent: false,
      },
    );
    localStorageServiceSpy = jasmine.createSpyObj<LocalStorageService>(
      'LocalStorageService',
      ['loadSelectedOrDefaultLanguage', 'init', 'saveEmailAddress'],
      {
        selectedLanguage$: of('en'),
      },
    );
    fileUtilsServiceSpy = jasmine.createSpyObj<FileUtilsService>(
      'FileUtilsService',
      [
        'saveFile',
        'clearNowFormatted',
        'setNowFormatted',
        'downloadQRCode',
        'deleteAllQrCodeFilesAfterSpecifiedTime',
      ],
    );
    printUtilsServiceSpy = jasmine.createSpyObj('PrintUtilsService', [
      'printQRCode',
      'getConvertedPrintSettings',
    ]);
    printUtilsServiceSpy.getConvertedPrintSettings.and.returnValue(
      '[ ~5 cm / small gap / 8 ]',
    );
    toastServiceSpy = jasmine.createSpyObj('ToastService', [
      'showToast',
      'showDisabledToast',
    ]);
    alertServiceSpy = jasmine.createSpyObj('AlertService', [
      'showErrorAlert',
      'showStoragePermissionError',
      'showClearConfirmation',
      'showCopySuccessAlert',
      'showKeyboardAlert',
      'openHelpModalToSection',
      'showMobileWebEmailOptions',
      'shouldCopyTextAfterManualEmailInstructions',
    ]);
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['showOrHideIonTabBar'],
      {
        isNative: true,
      },
    );

    // 6. Configure TestBed
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot({ mode: 'md', animated: false }),
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        HeaderComponent,
        TabQrPage,
      ],
      providers: [
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: EmailUtilsService, useValue: emailUtilsServiceSpy },
        { provide: FileUtilsService, useValue: fileUtilsServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: PrintUtilsService, useValue: printUtilsServiceSpy },
        { provide: QrUtilsService, useValue: qrUtilsServiceSpy },
        { provide: Storage, useValue: storageSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: UtilsService, useValue: utilsServiceSpy },
      ],
    }).compileComponents();

    // 7. Create component and setup
    fixture = TestBed.createComponent(TabQrPage);
    component = fixture.componentInstance;

    // Make service properties writeable
    Object.defineProperty(emailUtilsServiceSpy, 'isEmailSent', {
      configurable: true,
      get: () => false,
    });

    Object.defineProperty(qrUtilsServiceSpy, 'isQrCodeGenerated', {
      writable: true,
      configurable: true,
      value: false,
    });
    Object.defineProperty(qrUtilsServiceSpy, 'myAngularxQrCode', {
      writable: true,
      configurable: true,
      value: '',
    });

    // Setup default mock returns
    (storageSpy.get as jasmine.Spy).and.returnValue(Promise.resolve(null));
    (storageSpy.set as jasmine.Spy).and.returnValue(Promise.resolve());
    (storageSpy.create as jasmine.Spy).and.returnValue(
      Promise.resolve({} as Storage),
    );
    localStorageServiceSpy.init.and.returnValue(Promise.resolve());
    localStorageServiceSpy.loadSelectedOrDefaultLanguage.and.returnValue(
      Promise.resolve(),
    );
    (qrUtilsServiceSpy.clearQrFields as jasmine.Spy).and.returnValue(undefined);
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
    it('should generate QR code for valid string input', () => {
      // Arrange
      const validInput = 'test';
      component.qrDataInput = { value: validInput } as any;

      // Act
      component.sanitizeInputAndGenerateQRCode(
        component.qrDataInput?.value || 'test',
      );

      // Assert
      expect(qrUtilsServiceSpy.generateQRCode).toHaveBeenCalledWith(validInput);
      expect(qrUtilsServiceSpy.generateQRCode).toHaveBeenCalledTimes(1);
    });

    it('should not generate QR code for empty input', () => {
      if (component.qrDataInput) {
        component.qrDataInput.value = '';
      }

      component.sanitizeInputAndGenerateQRCode('');

      expect(qrUtilsServiceSpy.generateQRCode).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only input', () => {
      const whitespaceInput = '   \n\t   ';

      component.sanitizeInputAndGenerateQRCode(whitespaceInput);

      expect(qrUtilsServiceSpy.generateQRCode).not.toHaveBeenCalled();
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
      expect(qrUtilsServiceSpy.generateQRCode).toHaveBeenCalledWith(
        expectedTrimmed,
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_TRAILING_BLANKS_REMOVED',
        jasmine.anything(),
      );
      expect(component.qrDataInput.value).toBe(expectedTrimmed);
    }));
  });

  describe('hasInputChangedAfterGeneration method', () => {
    beforeEach(() => {
      component.qrDataInput = { value: '' } as any;
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);
    });

    it('should return false when no QR code generated', () => {
      // Arrange - No QR code has been generated
      qrUtilsServiceSpy.isQrCodeGenerated = false;
      qrUtilsServiceSpy.myAngularxQrCode = '';
      component.qrDataInput.value = 'some input';

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when input field is empty (whitespace)', () => {
      // Arrange - QR code exists but input is empty/whitespace
      qrUtilsServiceSpy.isQrCodeGenerated = true;
      qrUtilsServiceSpy.myAngularxQrCode = 'generated qr code';
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
      qrUtilsServiceSpy.isQrCodeGenerated = true;
      qrUtilsServiceSpy.myAngularxQrCode = 'generated qr code';

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when input value equals generated QR code', () => {
      // Arrange
      const sameValue = 'identical content';
      qrUtilsServiceSpy.isQrCodeGenerated = true;
      qrUtilsServiceSpy.myAngularxQrCode = sameValue;
      component.qrDataInput.value = sameValue;

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when input differs from generated QR code', () => {
      // Arrange
      qrUtilsServiceSpy.isQrCodeGenerated = true;
      qrUtilsServiceSpy.myAngularxQrCode = 'original qr content';
      component.qrDataInput.value = 'changed input content';

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when input has different case from generated QR code', () => {
      // Arrange
      qrUtilsServiceSpy.isQrCodeGenerated = true;
      qrUtilsServiceSpy.myAngularxQrCode = 'Original Content';
      component.qrDataInput.value = 'original content';

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when input has extra spaces compared to generated QR code', () => {
      // Arrange
      qrUtilsServiceSpy.isQrCodeGenerated = true;
      qrUtilsServiceSpy.myAngularxQrCode = 'content';
      component.qrDataInput.value = ' content ';

      (component.isInputFieldEmpty as jasmine.Spy).and.returnValue(false);

      // Act
      const result = component.hasInputChangedAfterGeneration();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isGenerationButtonDisabled method', () => {
    beforeEach(() => {
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
      Object.defineProperty(emailUtilsServiceSpy, 'isEmailSent', {
        get: () => true,
      });

      // Act
      const result = component.isGenerationButtonDisabled;

      // Assert
      expect(result).toBe(true);
    });

    it('should be disabled when QR code is generated', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(false);
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);
      Object.defineProperty(emailUtilsServiceSpy, 'isEmailSent', {
        get: () => true,
      });
      qrUtilsServiceSpy.isQrCodeGenerated = true;

      // Act
      const result = component.isGenerationButtonDisabled;

      // Assert
      expect(result).toBe(true);
    });

    it('should be enabled when input changes after generation', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(true);
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);
      Object.defineProperty(emailUtilsServiceSpy, 'isEmailSent', {
        get: () => true,
      });
      qrUtilsServiceSpy.isQrCodeGenerated = true;

      // Act
      const result = component.isGenerationButtonDisabled;

      // Assert
      expect(result).toBe(false);
    });

    it('should be enabled when all conditions are false', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(false);
      spyOn(component, 'isInputFieldEmpty').and.returnValue(false);
      Object.defineProperty(emailUtilsServiceSpy, 'isEmailSent', {
        get: () => false,
      });
      qrUtilsServiceSpy.isQrCodeGenerated = false;

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

      // Act
      component.clearInputField();

      // Assert
      expect(component.qrDataInput.value).toBe('');
      expect(qrUtilsServiceSpy.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.clearEmailSent).toHaveBeenCalled();
    });

    it('should call showClearConfirmation for long input', () => {
      component.qrDataInput = { value: 'x'.repeat(101) } as any;

      // Act
      component.clearInputField();

      // Assert
      expect(alertServiceSpy.showClearConfirmation).toHaveBeenCalled();
    });

    it('should use 100 chars for showClearConfirmation if environment setting is missing', () => {
      // Arrange - temporarily set environment value to undefined
      const originalMaxLength = environment.app.maxInputLength;
      (environment as any).maxInputLength = undefined;
      component.qrDataInput = { value: 'x'.repeat(101) } as any;

      // Act
      component.clearInputField();

      // Assert
      expect(alertServiceSpy.showClearConfirmation).toHaveBeenCalled();
      (environment as any).maxInputLength = originalMaxLength; // Restore original value
    });

    it('should not clear input field and reset services for long input', () => {
      // Arrange
      component.qrDataInput = { value: 'x'.repeat(101) } as any;

      // Act
      component.clearInputField();

      // Assert
      expect(component.qrDataInput.value).toBe('x'.repeat(101));
      expect(qrUtilsServiceSpy.clearQrFields).not.toHaveBeenCalled();
      expect(emailUtilsServiceSpy.clearEmailSent).not.toHaveBeenCalled();
    });
  });

  describe('deleteQRCodeIfInputChangedAfterGeneration method', () => {
    it('should delete qr code and show toast if input changed after generation', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(true);

      // Act
      component.deleteQRCodeIfInputChangedAfterGeneration();

      // Assert
      expect(qrUtilsServiceSpy.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.clearEmailSent).toHaveBeenCalled();

      // Verify toast is shown
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_QR_CODE_DELETED_AFTER_INPUT_CHANGE',
        jasmine.anything(),
      );
    });

    it('should not delete qr code if input did not change after generation', () => {
      // Arrange
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(false);

      // Act
      component.deleteQRCodeIfInputChangedAfterGeneration();

      // Assert
      expect(qrUtilsServiceSpy.clearQrFields).not.toHaveBeenCalled();
      expect(emailUtilsServiceSpy.clearEmailSent).not.toHaveBeenCalled();
    });
  });

  describe('show toast', () => {
    beforeEach(() => {
      toastServiceSpy.showToast.calls.reset();
      toastServiceSpy.showDisabledToast.calls.reset();
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.resolve());
    });

    it('should show toast if input changed after qr code generation', () => {
      spyOn(component, 'hasInputChangedAfterGeneration').and.returnValue(true);

      component.deleteQRCodeIfInputChangedAfterGeneration();

      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_QR_CODE_DELETED_AFTER_INPUT_CHANGE',
        jasmine.anything(),
      );
    });

    it('should show toast if input has trailing white space', () => {
      component.qrDataInput = {
        value: 'content with trailing spaces ',
      } as any;

      component.handleGenerateButtonClick();

      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_TRAILING_BLANKS_REMOVED',
        jasmine.anything(),
      );
    });

    it('should show toast if button is disabled', () => {
      spyOnProperty(
        component,
        'isGenerationButtonDisabled',
        'get',
      ).and.returnValue(true);

      component.handleGenerateButtonClick();

      expect(toastServiceSpy.showDisabledToast).toHaveBeenCalled();
    });
  });

  describe('getter', () => {
    it('should return configured max length from environment', () => {
      // Act
      const maxLength = component.maxInputLength;

      // Assert
      expect(maxLength).toBe(environment.app.maxInputLength); // Test actual value
      expect(typeof maxLength).toBe('number');
    });

    it('should return 1000 chars if max length from environment is missing', () => {
      // Arrange - temporarily set environment value to undefined
      const originalMaxLength = environment.app.maxInputLength;
      (environment as any).app.maxInputLength = undefined;

      // Act
      const maxLength = component.maxInputLength;

      // Assert
      expect(maxLength).toBe(1000); // Default value
      expect(typeof maxLength).toBe('number');

      // Restore original value
      (environment as any).app.maxInputLength = originalMaxLength;
    });

    it('should return isNative from utilsService', () => {
      expect(component.isNative).toBe(true);
    });

    it('should return app name from environment', () => {
      expect(component.appName).toBe(environment.app.name);
    });

    it('should return the correct title based on workflow step', () => {
      component.workflowStep = Workflow.StepEnterText;
      expect(component.cardTitle)
        .withContext('Create QR Code')
        .toBe('CREATE_QR_CODE');

      component.workflowStep = Workflow.StepMail;
      expect(component.cardTitle)
        .withContext('Mail QR Code')
        .toBe('MAIL_QR_CODE');
    });
  });

  describe('input validation', () => {
    it('should handle empty input', () => {
      component.qrDataInput = { value: '' } as any;

      component.sanitizeInputAndGenerateQRCode('');

      expect(component.qrDataInput.value).toBe('');
      expect(qrUtilsServiceSpy.generateQRCode).not.toHaveBeenCalled();
    });

    it('should handle maximum length input', () => {
      const maxInput = 'a'.repeat(environment.app.maxInputLength);
      component.qrDataInput = { value: maxInput } as any;

      component.sanitizeInputAndGenerateQRCode(maxInput);

      expect(qrUtilsServiceSpy.generateQRCode).toHaveBeenCalledWith(maxInput);
    });

    it('should handle special characters', () => {
      const specialChars = "%$&'()*+,-./:;<=>?@[]^_`{|}~";
      component.qrDataInput = { value: specialChars } as any;

      component.sanitizeInputAndGenerateQRCode(specialChars);

      expect(qrUtilsServiceSpy.generateQRCode).toHaveBeenCalledWith(
        specialChars,
      );
    });
  });

  describe('workflow integration - storeMailAndDeleteQRCode', () => {
    it('should handle complete QR-to-email workflow', async () => {
      // Note: Spinner display cannot be tested in this unit test
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock all operations as successful
      fileUtilsServiceSpy.setNowFormatted =
        jasmine.createSpy('setNowFormatted');
      fileUtilsServiceSpy.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.resolve(true));
      qrUtilsServiceSpy.printQRCode = jasmine
        .createSpy('printQRCode')
        .and.returnValue(Promise.resolve());

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsServiceSpy, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock email service success
      emailUtilsServiceSpy.sendEmail = jasmine
        .createSpy('sendEmail')
        .and.returnValue(Promise.resolve());

      // Act
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert - verify all operations were called in correct order
      expect(fileUtilsServiceSpy.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link',
      );
      expect(qrUtilsServiceSpy.printQRCode).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.sendEmail).toHaveBeenCalled();
    });

    it('should not print and send QR Code if downloadQRCode does not exist', async () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock all operations as successful
      fileUtilsServiceSpy.setNowFormatted =
        jasmine.createSpy('setNowFormatted');
      fileUtilsServiceSpy.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.resolve(false));
      qrUtilsServiceSpy.printQRCode = jasmine
        .createSpy('printQRCode')
        .and.returnValue(Promise.resolve());

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsServiceSpy, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock email service success
      emailUtilsServiceSpy.sendEmail = jasmine
        .createSpy('sendEmail')
        .and.returnValue(Promise.resolve());

      // Act
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert
      expect(fileUtilsServiceSpy.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link',
      );
      expect(qrUtilsServiceSpy.printQRCode).not.toHaveBeenCalled();
      expect(emailUtilsServiceSpy.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle QR generation failures', () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Simulate the service behavior when an error occurs
      const generateQrCodeSpy = qrUtilsServiceSpy.generateQRCode as jasmine.Spy;
      generateQrCodeSpy.and.callFake((_data: string | null | undefined) => {
        qrUtilsServiceSpy.myAngularxQrCode = '';
        qrUtilsServiceSpy.isQrCodeGenerated = false;
      });

      // Act
      component.sanitizeInputAndGenerateQRCode('test');

      // Assert
      expect(qrUtilsServiceSpy.generateQRCode).toHaveBeenCalledWith('test');
      expect(qrUtilsServiceSpy.myAngularxQrCode).toBe('');
      expect(qrUtilsServiceSpy.isQrCodeGenerated).toBe(false);
      expect(component.qrDataInput.value).toBe('test');
    });

    it('should handle email sending failures gracefully', async () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock successful file and QR operations
      fileUtilsServiceSpy.setNowFormatted =
        jasmine.createSpy('setNowFormatted');
      fileUtilsServiceSpy.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.resolve(true));
      fileUtilsServiceSpy.clearNowFormatted =
        jasmine.createSpy('clearNowFormatted');
      qrUtilsServiceSpy.printQRCode = jasmine
        .createSpy('printQRCode')
        .and.returnValue(Promise.resolve());

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsServiceSpy, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock email service to fail
      emailUtilsServiceSpy.sendEmail = jasmine
        .createSpy('sendEmail')
        .and.returnValue(Promise.reject(new Error('Email sending failed')));

      // Mock alert service
      alertServiceSpy.showErrorAlert.and.returnValue(Promise.resolve());

      // Spy on console.error
      spyOn(console, 'error');

      // Act
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert - Verify error was handled gracefully
      expect(console.error).toHaveBeenCalledWith(
        'Email workflow failed:',
        jasmine.any(Error),
      );
      expect(alertServiceSpy.showErrorAlert).toHaveBeenCalledWith(
        'ERROR_MESSAGE_EMAIL_WORKFLOW',
      );
      expect(fileUtilsServiceSpy.clearNowFormatted).toHaveBeenCalled();

      // Verify workflow progression up to email failure
      expect(fileUtilsServiceSpy.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link',
      );
      expect(qrUtilsServiceSpy.printQRCode).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.sendEmail).toHaveBeenCalled();
    });

    it('should handle file download failures gracefully', async () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock file download failure
      fileUtilsServiceSpy.setNowFormatted =
        jasmine.createSpy('setNowFormatted');
      fileUtilsServiceSpy.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.reject(new Error('File download failed')));
      fileUtilsServiceSpy.clearNowFormatted =
        jasmine.createSpy('clearNowFormatted');

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsServiceSpy, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock alert service
      alertServiceSpy.showErrorAlert.and.returnValue(Promise.resolve());
      spyOn(console, 'error');

      // Act
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Email workflow failed:',
        jasmine.any(Error),
      );
      expect(alertServiceSpy.showErrorAlert).toHaveBeenCalledWith(
        'ERROR_MESSAGE_EMAIL_WORKFLOW',
      );
      expect(fileUtilsServiceSpy.clearNowFormatted).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link',
      );
    });

    it('should handle QR code printing failures gracefully', async () => {
      // Arrange
      component.qrDataInput = { value: 'test' } as any;

      // Mock successful file operations, failed QR printing
      fileUtilsServiceSpy.setNowFormatted =
        jasmine.createSpy('setNowFormatted');
      fileUtilsServiceSpy.downloadQRCode = jasmine
        .createSpy('downloadQRCode')
        .and.returnValue(Promise.resolve(true));
      fileUtilsServiceSpy.clearNowFormatted =
        jasmine.createSpy('clearNowFormatted');
      qrUtilsServiceSpy.printQRCode = jasmine
        .createSpy('printQRCode')
        .and.returnValue(Promise.reject(new Error('Print QR code failed')));

      // set the qrCodeDownloadLink property
      Object.defineProperty(qrUtilsServiceSpy, 'qrCodeDownloadLink', {
        writable: true,
        configurable: true,
        value: 'mock-download-link',
      });

      // Mock alert service
      alertServiceSpy.showErrorAlert.and.returnValue(Promise.resolve());
      spyOn(console, 'error');

      // Act
      await expectAsync(component.storeMailAndDeleteQRCode()).toBeResolved();

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Email workflow failed:',
        jasmine.any(Error),
      );
      expect(alertServiceSpy.showErrorAlert).toHaveBeenCalledWith(
        'ERROR_MESSAGE_EMAIL_WORKFLOW',
      );
      expect(fileUtilsServiceSpy.clearNowFormatted).toHaveBeenCalled();

      // Verify operations were called in order
      expect(fileUtilsServiceSpy.setNowFormatted).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.downloadQRCode).toHaveBeenCalledWith(
        'mock-download-link',
      );
      expect(qrUtilsServiceSpy.printQRCode).toHaveBeenCalled();
    });
  });

  describe('ngOnInit method', () => {
    beforeEach(() => {
      localStorageServiceSpy.init.and.returnValue(Promise.resolve());
      localStorageServiceSpy.loadSelectedOrDefaultLanguage.and.returnValue(
        Promise.resolve(),
      );
      fileUtilsServiceSpy.deleteAllQrCodeFilesAfterSpecifiedTime.and.returnValue(
        Promise.resolve(),
      );
    });

    it('should initialize component without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should call localStorage initialization', () => {
      component.ngOnInit();

      expect(localStorageServiceSpy.init).toHaveBeenCalled();
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
      Object.defineProperty(utilsServiceSpy, 'isPortrait', { get: () => true });
      mockMatchMedia.and.returnValue({ matches: true });
      const freshFixture = TestBed.createComponent(TabQrPage);
      const freshComponent = freshFixture.componentInstance;

      // Act
      freshComponent.ngOnInit();

      // Assert
      expect(freshComponent.nbrOfUsedRows).toBe(6); // Portrait = 6 rows
    });

    it('should set initial number of rows for landscape orientation', () => {
      // Arrange
      Object.defineProperty(utilsServiceSpy, 'isPortrait', {
        get: () => false,
      });
      mockMatchMedia.and.returnValue({ matches: false });

      // Act
      component.ngOnInit();

      // Assert
      expect(component.nbrOfUsedRows).toBe(2); // Landscape = 2 rows
    });

    it('should not add keyboard listeners on web platforms', async () => {
      Object.defineProperty(utilsServiceSpy, 'isNative', {
        value: false,
        writable: true,
        configurable: true,
      });
      keyboardSpy.calls.reset();

      component.ngOnInit();
      await fixture.whenStable();

      expect(keyboardSpy).not.toHaveBeenCalled();
    });

    // This test does not work!!!
    // it('should add keyboard listeners on native platforms', async () => {
    //   Object.defineProperty(utilsServiceSpy, 'isNative', {
    //     value: true,
    //     writable: true,
    //     configurable: true,
    //   });
    //   Object.defineProperty(utilsServiceSpy, 'isPortrait', {
    //     get: () => true,
    //     configurable: true,
    //   });
    //   keyboardSpy.calls.reset();

    //   component.ngOnInit();
    //   await fixture.whenStable();

    //   expect(keyboardSpy).toHaveBeenCalled();
    // });

    it('should log initialization errors', async () => {
      // Arrange
      localStorageServiceSpy.init.and.returnValue(
        Promise.reject('Init failed'),
      );
      spyOn(console, 'error');

      // Act
      component.ngOnInit();
      await Promise.resolve();

      //Assert
      expect(() => component.ngOnInit()).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'App initialization failed:',
        'Init failed',
      );
    });

    it('should log delete qr code file errors', async () => {
      // Arrange
      fileUtilsServiceSpy.deleteAllQrCodeFilesAfterSpecifiedTime.and.returnValue(
        Promise.reject('Delete failed'),
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
        'Delete failed',
      );
    });
  });

  describe('ngOnDestroy method', () => {
    it('should clean up subscriptions and services', () => {
      // Arrange
      const mockSubscription = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      (component as any).langSub = mockSubscription;

      // Act
      component.ngOnDestroy();

      // Assert - Verify cleanup methods were called
      expect(qrUtilsServiceSpy.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.clearEmailSent).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.clearNowFormatted).toHaveBeenCalled();
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should handle cleanup gracefully when subscription is null', () => {
      // Arrange
      (component as any).langSub = null;
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);

      // Act & Assert - Should not throw
      expect(() => component.ngOnDestroy()).not.toThrow();

      // Services should still be cleaned
      expect(qrUtilsServiceSpy.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.clearEmailSent).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.clearNowFormatted).toHaveBeenCalled();
    });

    it('should handle cleanup gracefully when subscription is undefined', () => {
      // Arrange
      (component as any).langSub = undefined;
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);

      // Act & Assert - Should not throw
      expect(() => component.ngOnDestroy()).not.toThrow();

      // Services should still be cleaned
      expect(qrUtilsServiceSpy.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.clearEmailSent).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.clearNowFormatted).toHaveBeenCalled();
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
      expect(qrUtilsServiceSpy.clearQrFields).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.clearEmailSent).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.clearNowFormatted).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', () => {
      // Arrange
      // Make one of the cleanup methods throw an error
      qrUtilsServiceSpy.clearQrFields.and.throwError('Service cleanup failed');
      spyOn(console, 'error');

      // Act & Assert - Should not crash the application
      expect(() => component.ngOnDestroy()).not.toThrow();

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Cleanup failed:',
        jasmine.any(Error),
      );
    });
  });

  describe('handleEmailBasedOnPlatform method', () => {
    let platform: jasmine.SpyObj<Platform>;

    beforeEach(() => {
      platform = TestBed.inject(Platform) as jasmine.SpyObj<Platform>;
    });

    it('should call sendEmail for native platforms', async () => {
      Object.defineProperty(utilsServiceSpy, 'isNative', { get: () => true });
      platform.is = jasmine.createSpy().and.returnValue(false);

      await (component as any).handleEmailBasedOnPlatform();

      expect(emailUtilsServiceSpy.sendEmail).toHaveBeenCalled();
      expect(
        emailUtilsServiceSpy.displayEmailAttachmentAlert,
      ).not.toHaveBeenCalled();
    });

    it('should call displayEmailAttachmentAlert for desktop platforms', async () => {
      // Arrange
      Object.defineProperty(utilsServiceSpy, 'isNative', { get: () => false });

      platform.is = jasmine
        .createSpy()
        .and.callFake((type: string) => type === 'desktop');
      emailUtilsServiceSpy.displayEmailAttachmentAlert.and.callFake(
        (cb: Function) => cb(),
      );

      // Act
      await (component as any).handleEmailBasedOnPlatform();

      // Assert
      expect(
        emailUtilsServiceSpy.displayEmailAttachmentAlert,
      ).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.sendEmail).toHaveBeenCalled();
    });

    it('should call handleMobileWebEmailOptions for other platforms', async () => {
      // Arrange
      Object.defineProperty(utilsServiceSpy, 'isNative', { get: () => false });
      platform.is = jasmine.createSpy().and.returnValue(false);
      const handleMobileWebEmailOptionsSpy = spyOn<any>(
        component,
        'handleMobileWebEmailOptions',
      ).and.returnValue(Promise.resolve());

      // Act
      await (component as any).handleEmailBasedOnPlatform();

      // Assert
      expect(handleMobileWebEmailOptionsSpy).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.sendEmail).not.toHaveBeenCalled();
      expect(
        emailUtilsServiceSpy.displayEmailAttachmentAlert,
      ).not.toHaveBeenCalled();
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

  describe('onTextareaInput', () => {
    beforeEach(() => {
      spyOn(component as any, 'deleteQRCodeIfInputChangedAfterGeneration');
      spyOn(component as any, 'showWorkflowStepGenerate');
      (component as any).hasShownKeyboardAlert = false;
      spyOn(component as any, 'shouldShowKeyboardAlert').and.returnValue(true);
      spyOn(component as any, 'performClear').and.stub();
      Object.defineProperty(utilsServiceSpy, 'isSmallDevice', {
        get: () => true,
      });
      // Provide a mock qrDataInput for the component
      component.qrDataInput = { value: '' } as any;
    });

    it('should call deleteQRCodeIfInputChangedAfterGeneration and showWorkflowStepGenerate on textarea input', () => {
      component.qrDataInput.value = 'test';

      component.onTextareaInput();

      expect(
        (component as any).deleteQRCodeIfInputChangedAfterGeneration,
      ).toHaveBeenCalled();
      expect((component as any).showWorkflowStepGenerate).toHaveBeenCalledWith(
        'test',
      );
    });

    it('should show keyboard alert if criteria met and not shown before', fakeAsync(() => {
      component.qrDataInput.value = 'trigger';

      component.onTextareaInput();
      tick(600);

      expect((component as any).shouldShowKeyboardAlert).toHaveBeenCalled();
    }));

    it('should not show keyboard alert if already shown', () => {
      (component as any).hasShownKeyboardAlert = true;
      component.qrDataInput.value = 'trigger';

      component.onTextareaInput();

      expect((component as any).shouldShowKeyboardAlert).not.toHaveBeenCalled();
    });

    it('should use default value if qrDataInput is not set', () => {
      component.qrDataInput.value = undefined;
      component.onTextareaInput();
      expect(
        (component as any).deleteQRCodeIfInputChangedAfterGeneration,
      ).toHaveBeenCalled();
      expect((component as any).showWorkflowStepGenerate).toHaveBeenCalledWith(
        '',
      );
    });
  });

  describe('onQrDataInputBlur', () => {
    beforeEach(() => {
      (component as any).printUtilsService.qrDataInputSub = {
        next: jasmine.createSpy('next'),
      };
      // Provide a mock qrDataInput for the component
      component.qrDataInput = { value: '' } as any;
    });

    it('should call printUtilsService.qrDataInputSub.next with trimmed length on blur', () => {
      component.qrDataInput.value = 'abc   ';
      component.onQrDataInputBlur();
      expect(
        (component as any).printUtilsService.qrDataInputSub.next,
      ).toHaveBeenCalledWith(3);
    });

    it('should use default value if qrDataInput is empty on blur', () => {
      component.qrDataInput.value = '';
      component.onQrDataInputBlur();
      expect(
        (component as any).printUtilsService.qrDataInputSub.next,
      ).toHaveBeenCalledWith(1);
    });
  });

  it('onChangeURL event', () => {
    const url = 'some url';
    qrUtilsServiceSpy.setDownloadLink.and.stub();

    component.onChangeURL(url);

    expect(qrUtilsServiceSpy.setDownloadLink).toHaveBeenCalledWith(url);
  });

  describe('handleGenerateButtonClick method', () => {
    beforeEach(() => {
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.resolve());
      qrUtilsServiceSpy.isQrCodeGenerated = false;
      Object.defineProperty(emailUtilsServiceSpy, 'isEmailSent', {
        get: () => false,
      });
      (component as any).setNumberOfRows = jasmine.createSpy('setNumberOfRows');
      toastServiceSpy.showToast.calls.reset();
      toastServiceSpy.showDisabledToast.calls.reset();
      (component as any).setNumberOfRows.calls.reset();
    });

    it('should generate QR Code if valid input', async () => {
      component.qrDataInput = { value: 'some value' } as any;
      spyOn(component, 'sanitizeInputAndGenerateQRCode');
      spyOn(component as any, 'showWorkflowStep');

      await component.handleGenerateButtonClick();

      expect(component.sanitizeInputAndGenerateQRCode).toHaveBeenCalled();
      expect((component as any).showWorkflowStep).toHaveBeenCalled();
      expect((component as any).setNumberOfRows).toHaveBeenCalled();
    });

    it('should show toast if qrDataInput is empty', async () => {
      component.qrDataInput = { value: '' } as any;

      await component.handleGenerateButtonClick();

      expect(toastServiceSpy.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_GENERATION_ENTER_TEXT_FIRST',
        jasmine.anything(),
      );
      expect(toastServiceSpy.showToast).not.toHaveBeenCalled();
    });

    it('should show toast if qr code is already generated', async () => {
      component.qrDataInput = { value: 'some value' } as any;
      qrUtilsServiceSpy.isQrCodeGenerated = true;

      await component.handleGenerateButtonClick();

      expect(toastServiceSpy.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_GENERATION_QR_ALREADY_GENERATED',
        jasmine.anything(),
      );
      expect(toastServiceSpy.showToast).not.toHaveBeenCalled();
    });

    it('should show toast if email is sent', async () => {
      component.qrDataInput = { value: 'some value' } as any;
      Object.defineProperty(emailUtilsServiceSpy, 'isEmailSent', {
        get: () => true,
      });
      await component.handleGenerateButtonClick();

      expect(toastServiceSpy.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_GENERATION_EMAIL_ALREADY_SENT',
        jasmine.anything(),
      );
      expect(toastServiceSpy.showToast).not.toHaveBeenCalled();
    });

    it('should handle error in toastService if qr code is empty', async () => {
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'error');
      component.qrDataInput = { value: '' } as any;

      await component.handleGenerateButtonClick();

      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        'fail',
      );
    });

    it('should handle error in toastService if qr code is already generated', async () => {
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'error');
      component.qrDataInput = { value: 'some value' } as any;
      qrUtilsServiceSpy.isQrCodeGenerated = true;

      await component.handleGenerateButtonClick();

      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        'fail',
      );
    });

    it('should handle error in toastService if email is sent', async () => {
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'error');
      component.qrDataInput = { value: 'some value' } as any;
      Object.defineProperty(emailUtilsServiceSpy, 'isEmailSent', {
        get: () => true,
      });

      await component.handleGenerateButtonClick();

      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        'fail',
      );
    });
  });

  describe('handleSendEmailButtonClick method', () => {
    it('should send email if QR code is generated', async () => {
      const storeMailSpy = spyOn(
        component,
        'storeMailAndDeleteQRCode',
      ).and.resolveTo();
      const wfSpy = spyOn<any>(component, 'showWorkflowStep');
      component.qrService.isQrCodeGenerated = true;

      await component.handleSendEmailButtonClick();

      expect(storeMailSpy).toHaveBeenCalled();
      expect(wfSpy).toHaveBeenCalled();
    });

    it('should show toast if QR Code is not generated', async () => {
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.resolve());
      component.qrService.isQrCodeGenerated = false;

      await component.handleSendEmailButtonClick();

      expect(toastServiceSpy.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_EMAIL_NO_QR_GENERATED',
        jasmine.anything(),
      );
      expect(toastServiceSpy.showToast).not.toHaveBeenCalled();
    });

    it('should handle error in toastService if qr code is already generated', async () => {
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'error');
      component.qrService.isQrCodeGenerated = false;

      await component.handleSendEmailButtonClick();

      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        'fail',
      );
    });
  });

  describe('copyQRTextToClipboard', () => {
    beforeEach(() => {
      qrUtilsServiceSpy.myAngularxQrCode = 'copied QR text';
      alertServiceSpy.showCopySuccessAlert.and.returnValue(Promise.resolve());
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
      expect(alertServiceSpy.showCopySuccessAlert).toHaveBeenCalledWith(
        'copied QR text',
      );
    });

    it('should use fallback method if navigator.clipboard is not available and show success alert', async () => {
      // Arrange
      spyOnProperty<any>(navigator, 'clipboard', 'get').and.returnValue(
        undefined,
      );
      const appendChildSpy = spyOn(
        document.body,
        'appendChild',
      ).and.callThrough();
      const textAreaRemoveSpy = spyOn(
        HTMLElement.prototype,
        'remove',
      ).and.callThrough();
      const execCommandSpy = spyOn(document, 'execCommand').and.returnValue(
        true,
      );

      // Act
      await (component as any).copyQRTextToClipboard();

      // Assert
      expect(appendChildSpy).toHaveBeenCalled();
      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(textAreaRemoveSpy).toHaveBeenCalled();
      expect(alertServiceSpy.showCopySuccessAlert).toHaveBeenCalledWith(
        'copied QR text',
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
      alertServiceSpy.showErrorAlert = jasmine
        .createSpy('showErrorAlert')
        .and.returnValue(Promise.resolve());

      // Act
      await (component as any).copyQRTextToClipboard();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(alertServiceSpy.showErrorAlert).toHaveBeenCalledWith(
        'MOBILE_WEB_COPY_ERROR',
      );
    });
  });

  describe('handleMobileWebEmailOptions', () => {
    beforeEach(() => {
      spyOn(component as any, 'copyQRTextToClipboard');
      spyOn(component as any, 'shouldCopyTextAfterManualEmailInstructions');
    });

    it('should call sendEmail if selected', async () => {
      alertServiceSpy.showMobileWebEmailOptions.and.returnValue(
        Promise.resolve(MobileWebEmailOptions.SEND_EMAIL),
      );

      await (component as any).handleMobileWebEmailOptions();

      expect(emailUtilsServiceSpy.sendEmail).toHaveBeenCalled();
      expect((component as any).copyQRTextToClipboard).not.toHaveBeenCalled();
      expect(
        (component as any).shouldCopyTextAfterManualEmailInstructions,
      ).not.toHaveBeenCalled();
    });

    it('should call copyQRTextToClipboard if selected', async () => {
      alertServiceSpy.showMobileWebEmailOptions.and.returnValue(
        Promise.resolve(MobileWebEmailOptions.COPY_QR_CODE_TEXT),
      );

      await (component as any).handleMobileWebEmailOptions();

      expect((component as any).copyQRTextToClipboard).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.sendEmail).not.toHaveBeenCalled();
      expect(
        (component as any).shouldCopyTextAfterManualEmailInstructions,
      ).not.toHaveBeenCalled();
    });

    it('should call shouldCopyTextAfterManualEmailInstructions if selected', async () => {
      alertServiceSpy.showMobileWebEmailOptions.and.returnValue(
        Promise.resolve(MobileWebEmailOptions.SHOW_MANUAL_INSTRUCTIONS),
      );

      await (component as any).handleMobileWebEmailOptions();

      expect(
        (component as any).shouldCopyTextAfterManualEmailInstructions,
      ).toHaveBeenCalled();
      expect(emailUtilsServiceSpy.sendEmail).not.toHaveBeenCalled();
      expect((component as any).copyQRTextToClipboard).not.toHaveBeenCalled();
    });

    it('should not call any function if cancelled', async () => {
      alertServiceSpy.showMobileWebEmailOptions.and.returnValue(
        Promise.resolve(MobileWebEmailOptions.CANCEL),
      );

      await (component as any).handleMobileWebEmailOptions();

      expect(emailUtilsServiceSpy.sendEmail).not.toHaveBeenCalled();
      expect((component as any).copyQRTextToClipboard).not.toHaveBeenCalled();
      expect(
        (component as any).shouldCopyTextAfterManualEmailInstructions,
      ).not.toHaveBeenCalled();
    });
  });

  describe('shouldCopyTextAfterManualEmailInstructions', () => {
    beforeEach(() => {
      qrUtilsServiceSpy.myAngularxQrCode = 'some text';
      spyOn(component as any, 'copyQRTextToClipboard').and.stub();
    });

    it('should copy text to clipboard if selected in alert form', async () => {
      alertServiceSpy.shouldCopyTextAfterManualEmailInstructions.and.returnValue(
        Promise.resolve(true),
      );
      await (component as any).shouldCopyTextAfterManualEmailInstructions();

      expect(
        alertServiceSpy.shouldCopyTextAfterManualEmailInstructions,
      ).toHaveBeenCalledWith('some text');
      expect((component as any).copyQRTextToClipboard).toHaveBeenCalled();
    });

    it('should not copy text to clipboard if not selected in alert form', async () => {
      alertServiceSpy.shouldCopyTextAfterManualEmailInstructions.and.returnValue(
        Promise.resolve(false),
      );
      await (component as any).shouldCopyTextAfterManualEmailInstructions();

      expect(
        alertServiceSpy.shouldCopyTextAfterManualEmailInstructions,
      ).toHaveBeenCalledWith('some text');
      expect((component as any).copyQRTextToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('setNumberOfRows', () => {
    it('should set nbrOfUsedRows based on orientation if wfStep is StepEnterText', () => {
      component.workflowStep = Workflow.StepEnterText;

      (component as any).utilsService.isPortrait = true;
      (component as any).setNumberOfRows();
      expect((component as any).nbrOfUsedRows).toBe(6);

      (component as any).utilsService.isPortrait = false;
      (component as any).setNumberOfRows();
      expect((component as any).nbrOfUsedRows).toBe(2);
    });

    it('should set nbrOfUsedRows based on entered text length if qr code is generated', () => {
      component.workflowStep = Workflow.StepMail;
      const CHARS_PER_ROW = 30;
      const testData = [
        {
          enteredText: '1',
          expectedRows: 1,
        },
        {
          enteredText: '1'.repeat(40),
          expectedRows: 2,
        },
        {
          enteredText: '1'.repeat(400),
          expectedRows: Math.ceil(400 / CHARS_PER_ROW),
        },
        {
          enteredText: '1'.repeat(999),
          expectedRows: Math.ceil(999 / CHARS_PER_ROW),
        },
      ];

      for (const test of testData) {
        qrUtilsServiceSpy.myAngularxQrCode = test.enteredText;
        (component as any).setNumberOfRows();

        expect((component as any).nbrOfUsedRows).toBe(test.expectedRows);
      }
    });
  });
});
