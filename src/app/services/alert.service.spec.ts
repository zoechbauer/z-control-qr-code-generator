import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';
import { AlertButton, AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { createTranslateServiceMock } from '@testing/translate-service.mock';
import { environment } from 'src/environments/environment';
import { MobileWebEmailOptions } from '../shared/enums';
import { UtilsService } from './utils.service';

function isButtonObj(
  btn: any,
): btn is { text?: string; handler?: any; role?: string } {
  return typeof btn === 'object' && btn !== null;
}

describe('AlertService', () => {
  let service: AlertService;
  let translateServiceMock: any;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;
  let alertSpy: any;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;

  beforeEach(() => {
    translateServiceMock = createTranslateServiceMock();
    alertSpy = jasmine.createSpyObj('Alert', ['present', 'onDidDismiss']);
    alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    modalControllerSpy = jasmine.createSpyObj('ModalController', ['create']);
    utilsServiceSpy = jasmine.createSpyObj('UtilsService', [], {
      isNative: true,
    });

    TestBed.configureTestingModule({
      providers: [
        AlertService,
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsServiceSpy },
      ],
    });

    service = TestBed.inject(AlertService);
  });

  describe('showErrorAlert', () => {
    it('should create and present an error alert with translated strings', async () => {
      translateServiceMock.get.and.callFake((key: string) => {
        switch (key) {
          case 'ERROR_ALERT_TITLE_ERROR':
            return of('Error');
          case 'ERROR_ALERT_BUTTON_OK':
            return of('OK');
          default:
            return of(key);
        }
      });
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showErrorAlert('SOME_ERROR_KEY');

      expect(translateServiceMock.get).toHaveBeenCalledWith('SOME_ERROR_KEY');
      expect(translateServiceMock.get).toHaveBeenCalledWith(
        'ERROR_ALERT_TITLE_ERROR',
      );
      expect(translateServiceMock.get).toHaveBeenCalledWith(
        'ERROR_ALERT_BUTTON_OK',
      );
      expect(alertControllerSpy.create).toHaveBeenCalledWith({
        header: 'Error',
        message: 'SOME_ERROR_KEY',
        buttons: ['OK'],
      });
      expect(alertSpy.present).toHaveBeenCalled();
    });
  });

  describe('showStoragePermissionError', () => {
    it('should create and present a storage permission error alert with translated strings', async () => {
      translateServiceMock.get.and.callFake((key: string) =>
        of('Translated: ' + key),
      );
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showStoragePermissionError();

      expect(translateServiceMock.get).toHaveBeenCalledWith(
        'ERROR_MESSAGE_SAVE_QR_HEADER',
      );
      expect(translateServiceMock.get).toHaveBeenCalledWith(
        'ERROR_MESSAGE_SAVE_QR_SUBHEADER',
      );
      expect(translateServiceMock.get).toHaveBeenCalledWith(
        'ERROR_MESSAGE_SAVE_QR_MESSAGE',
      );
      expect(alertControllerSpy.create).toHaveBeenCalledWith({
        header: 'Translated: ERROR_MESSAGE_SAVE_QR_HEADER',
        subHeader: 'Translated: ERROR_MESSAGE_SAVE_QR_SUBHEADER',
        message: 'Translated: ERROR_MESSAGE_SAVE_QR_MESSAGE',
        buttons: [
          {
            text: 'OK',
            role: 'cancel',
          },
        ],
      });
      expect(alertSpy.present).toHaveBeenCalled();
    });
  });

  describe('showClearConfirmation', () => {
    let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;

    beforeEach(() => {
      mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', [
        'present',
        'onDidDismiss',
      ]);
      mockAlert.onDidDismiss.and.resolveTo({ role: 'cancel' });

      alertControllerSpy.create.and.returnValue(Promise.resolve(mockAlert));
    });

    it('should present an alert in showClearConfirmation', async () => {
      await service.showClearConfirmation();

      // Assert
      expect(alertControllerSpy.create).toHaveBeenCalled();
      expect(mockAlert.present).toHaveBeenCalled();
      expect(mockAlert.onDidDismiss).toHaveBeenCalled();
    });

    it('should return true when clear confirmation handler is triggered with destructive role', async () => {
      mockAlert.onDidDismiss.and.resolveTo({ role: 'destructive' });
      const result = await service.showClearConfirmation();

      // Extract the config passed to alertController.create and find the clear button
      const config = alertControllerSpy.create.calls.mostRecent().args[0];
      const clearButton = config?.buttons?.find(
        (btn: any) => btn.role === 'destructive',
      ) as AlertButton;

      expect(clearButton).toBeDefined();
      expect(result).toBe(true);
    });

    it('should return false when clear confirmation handler is triggered with cancel role', async () => {
      mockAlert.onDidDismiss.and.resolveTo({ role: 'cancel' });
      const result = await service.showClearConfirmation();

      // Extract the config passed to alertController.create and find the clear button
      const config = alertControllerSpy.create.calls.mostRecent().args[0];
      const cancelButton = config?.buttons?.find(
        (btn: any) => btn.role === 'cancel',
      ) as AlertButton;

      expect(cancelButton).toBeDefined();
      expect(result).toBe(false);
    });
  });

  describe('showCopySuccessAlert', () => {
    let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;

    beforeEach(() => {
      mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', [
        'present',
        'onDidDismiss',
      ]);
      mockAlert.onDidDismiss.and.resolveTo({ role: 'cancel' });

      alertControllerSpy.create.and.returnValue(Promise.resolve(mockAlert));
    });

    it('should present an alert with correct options and show short text', async () => {
      const copiedText = 'short text';
      await service.showCopySuccessAlert(copiedText);

      expect(alertControllerSpy.create).toHaveBeenCalled();
      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};

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
      const maxPreviewLength =
        environment.app.maxPreviewLengthOfCopiedText ?? 50;
      const longText = 'a'.repeat(maxPreviewLength + 10);

      await service.showCopySuccessAlert(longText);

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      expect(config.message).toContain('MOBILE_WEB_COPIED_TEXT_PREVIEW');
      expect(config.message).toContain('"');
      expect(config.message).toContain('...');
      expect(config.message).not.toContain(longText);
      const truncated = 'a'.repeat(maxPreviewLength);
      expect(config.message).toContain(truncated);
      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should handle empty copiedText gracefully', async () => {
      await service.showCopySuccessAlert('');

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      expect(config.message).toContain('""');
      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should use default maxPreviewLength if environment variable is invalid', async () => {
      const originalValue = environment.app.maxPreviewLengthOfCopiedText;
      (environment as any).app.maxPreviewLengthOfCopiedText = undefined;
      const longText = 'a'.repeat(999);
      await service.showCopySuccessAlert(longText);

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      expect(config.message).toContain('MOBILE_WEB_COPIED_TEXT_PREVIEW');
      expect(config.message).toContain('"');
      expect(config.message).toContain('...');
      expect(config.message).not.toContain(longText);
      const truncated = 'a'.repeat(50);
      expect(config.message).toContain(truncated);
      expect(mockAlert.present).toHaveBeenCalled();

      (environment as any).app.maxPreviewLengthOfCopiedText = originalValue;
    });
  });

  describe('shouldCopyTextAfterManualEmailInstructions', () => {
    let mockModalAlert: jasmine.SpyObj<HTMLIonModalElement>;

    beforeEach(() => {
      mockModalAlert = jasmine.createSpyObj('HTMLIonModalElement', [
        'present',
        'onDidDismiss',
      ]);
      mockModalAlert.onDidDismiss.and.resolveTo({ role: 'destructive' });

      modalControllerSpy.create.and.returnValue(
        Promise.resolve(mockModalAlert),
      );
    });

    it('should create and present the manual email instructions modal with correct props', async () => {
      await service.shouldCopyTextAfterManualEmailInstructions('some text');

      expect(modalControllerSpy.create).toHaveBeenCalled();
      const config = modalControllerSpy.create.calls.mostRecent().args[0];

      expect(config.component).toBeDefined();
      expect(config.componentProps).toBeDefined();

      const { title, instructions, qrText, qrTextLabel, copyButtonLabel } =
        config.componentProps!;

      expect(title).toBe('MOBILE_WEB_MANUAL_TITLE');
      expect(instructions).toBe('MOBILE_WEB_MANUAL_MESSAGE');
      expect(qrText).toBe('some text');
      expect(qrTextLabel).toBe('MOBILE_WEB_QR_TEXT');
      expect(copyButtonLabel).toBe('MOBILE_WEB_COPY_TEXT');
      expect(config.cssClass).toBe('manual-email-instructions');
    });

    it('should return true when copy confirmation handler is triggered with true data', async () => {
      mockModalAlert.onDidDismiss.and.resolveTo({ role: 'destructive' });
      const result =
        await service.shouldCopyTextAfterManualEmailInstructions('some data');

      const config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config).toBeDefined();
      expect(result).toBe(true);
    });

    it('should return false when copy confirmation handler is triggered with false data', async () => {
      mockModalAlert.onDidDismiss.and.resolveTo({ role: 'cancel' });
      const result =
        await service.shouldCopyTextAfterManualEmailInstructions('some data');

      const config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config).toBeDefined();
      expect(result).toBe(false);
    });
  });

  describe('showMobileWebEmailOptions', () => {
    let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;

    beforeEach(() => {
      mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', [
        'present',
        'onDidDismiss',
      ]);
      alertControllerSpy.create.and.returnValue(Promise.resolve(mockAlert));
    });

    it('should present an alert with correct options', async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: MobileWebEmailOptions.CANCEL,
      });
      await service.showMobileWebEmailOptions();

      expect(alertControllerSpy.create).toHaveBeenCalled();
      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};

      expect(config.header).toBe('MOBILE_WEB_EMAIL_TITLE');
      expect(config.message).toBe('MOBILE_WEB_EMAIL_MESSAGE');
      expect(config.cssClass).toBe('show-mobile-web-email-options');
      expect(Array.isArray(config.buttons)).toBeTrue();
      expect(config.buttons?.length).toBe(4);

      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should return SEND_EMAIL action when "try email" button is pressed', async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: MobileWebEmailOptions.SEND_EMAIL,
      });
      const selectedAction = await service.showMobileWebEmailOptions();

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      const tryEmailBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'MOBILE_WEB_TRY_EMAIL',
      );
      expect(tryEmailBtn).toBeDefined();
      expect(selectedAction).toBe(MobileWebEmailOptions.SEND_EMAIL);
    });

    it('should return COPY_QR_CODE_TEXT action when "copy text" button is pressed', async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: MobileWebEmailOptions.COPY_QR_CODE_TEXT,
      });
      const selectedAction = await service.showMobileWebEmailOptions();

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      const copyBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'MOBILE_WEB_COPY_TEXT',
      );
      expect(copyBtn).toBeDefined();
      expect(selectedAction).toBe(MobileWebEmailOptions.COPY_QR_CODE_TEXT);
    });

    it('should return SHOW_MANUAL_INSTRUCTIONS action when "instructions" button is pressed', async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: MobileWebEmailOptions.SHOW_MANUAL_INSTRUCTIONS,
      });
      const selectedAction = await service.showMobileWebEmailOptions();

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      const instructionsBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'MOBILE_WEB_INSTRUCTIONS',
      );
      expect(instructionsBtn).toBeDefined();
      expect(selectedAction).toBe(
        MobileWebEmailOptions.SHOW_MANUAL_INSTRUCTIONS,
      );
    });

    it('should return CANCEL action when "cancel" button is pressed', async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: MobileWebEmailOptions.CANCEL,
      });
      const selectedAction = await service.showMobileWebEmailOptions();
      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      const cancelBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'CANCEL',
      );
      expect(cancelBtn).toBeDefined();
      expect(selectedAction).toBe(MobileWebEmailOptions.CANCEL);
    });
  });

  describe('shouldClearInputAfterKeyboardAlert', () => {
    let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;
    let openHelpModalSpy: jasmine.Spy;

    beforeEach(() => {
      mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', [
        'present',
        'onDidDismiss',
        'dismiss',
      ]);
      alertControllerSpy.create.and.returnValue(Promise.resolve(mockAlert));

      openHelpModalSpy = spyOn<any>(
        service,
        'openHelpModalToSection',
      ).and.returnValue(Promise.resolve());
    });

    it('should present an alert with correct options', async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: 'cancel',
      });
      await service.shouldClearInputAfterKeyboardAlert(1000);

      expect(alertControllerSpy.create).toHaveBeenCalled();
      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};

      expect(config.header).toBe('KEYBOARD_ALERT_TITLE');
      expect(config.message).toBe('KEYBOARD_ALERT_MESSAGE');
      expect(config.cssClass).toBe('keyboard-alert');
      expect(Array.isArray(config.buttons)).toBeTrue();
      expect(config.buttons?.length).toBe(3);

      expect(mockAlert.present).toHaveBeenCalled();
    });

    it('should return true when "clear and use short text" button is pressed', async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: 'destructive',
      });
      const shouldClearText =
        await service.shouldClearInputAfterKeyboardAlert(1000);

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      const clearBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'KEYBOARD_ALERT_SHORT_TEXT',
      );
      expect(clearBtn).toBeDefined();
      expect(mockAlert.onDidDismiss).toHaveBeenCalled();
      expect(shouldClearText).toBeTrue();
    });

    it('should call openModalToSection with web-version when "show help web version" button is pressed', async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: 'cancel',
      });
      mockAlert.dismiss.and.resolveTo();
      await service.shouldClearInputAfterKeyboardAlert(1000);

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      const openHelpBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'KEYBOARD_ALERT_HELP_WEB',
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

    const TEST_NAME =
      'should call openModalToSection with floating-keyboard when ' +
      '"show help floating keyboard" button is pressed';
    it(TEST_NAME, async () => {
      mockAlert.onDidDismiss.and.resolveTo({
        role: 'cancel',
      });
      mockAlert.dismiss.and.resolveTo();
      await service.shouldClearInputAfterKeyboardAlert(1000);

      const config = alertControllerSpy.create.calls.mostRecent().args[0] || {};
      const openHelpBtn = config.buttons?.find?.(
        (b: any) => isButtonObj(b) && b.text === 'KEYBOARD_ALERT_HELP_KEYBOARD',
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
  });

  describe('openHelpModalToSection', () => {
    let mockModal: jasmine.SpyObj<HTMLIonModalElement>;

    beforeEach(() => {
      mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present']);
      modalControllerSpy.create.and.returnValue(Promise.resolve(mockModal));
      (translateServiceMock as any).getCurrentLang.and.returnValue('en');
    });

    it('should create and present the help instructions modal with correct props for native apps', async () => {
      await (service as any).openHelpModalToSection('floating-keyboard');
      const config = modalControllerSpy.create.calls.mostRecent().args[0];

      expect(config.component).toBeDefined();
      expect(config.componentProps).toBeDefined();

      const { scrollToSection } = config.componentProps!;

      expect(scrollToSection).toBe('floating-keyboard');
      expect(config.cssClass).toBe('manual-email-instructions');
      expect(mockModal.present).toHaveBeenCalled();
    });

    it('should create and present the help instructions modal with correct props for desktop apps', async () => {
      Object.defineProperty(utilsServiceSpy, 'isNative', {
        configurable: true,
        get: () => false,
      });

      await (service as any).openHelpModalToSection('web-version');

      const config = modalControllerSpy.create.calls.mostRecent().args[0];

      expect(config.component).toBeDefined();
      expect(config.componentProps).toBeDefined();

      const { scrollToSection } = config.componentProps!;

      expect(scrollToSection).toBe('web-version');
      expect(config.cssClass).toBe('manual-email-instructions desktop');
      expect(mockModal.present).toHaveBeenCalled();
    });

    it('should set the correct scrollToSection for English', async () => {
      (translateServiceMock as any).getCurrentLang.and.returnValue('en');

      await (service as any).openHelpModalToSection('web-version');
      let config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe('web-version');

      await (service as any).openHelpModalToSection('floating-keyboard');
      config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe(
        'floating-keyboard',
      );
    });

    it('should set the correct scrollToSection for German', async () => {
      (translateServiceMock as any).getCurrentLang.and.returnValue('de');

      await (service as any).openHelpModalToSection('web-version');
      let config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe('web-version-DE');

      await (service as any).openHelpModalToSection('floating-keyboard');
      config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe(
        'floating-keyboard-DE',
      );
    });

    it('should set the correct scrollToSection for other languages', async () => {
      (translateServiceMock as any).getCurrentLang.and.returnValue('fr');

      await (service as any).openHelpModalToSection('web-version');
      let config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe('web-version');

      await (service as any).openHelpModalToSection('floating-keyboard');
      config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe(
        'floating-keyboard',
      );
    });

    it('should set the correct scrollToSection for undefined languages', async () => {
      (translateServiceMock as any).getCurrentLang.and.returnValue('');

      await (service as any).openHelpModalToSection('web-version');
      let config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe('web-version');

      await (service as any).openHelpModalToSection('floating-keyboard');
      config = modalControllerSpy.create.calls.mostRecent().args[0];
      expect(config.componentProps!['scrollToSection']).toBe(
        'floating-keyboard',
      );
    });
  });
});
