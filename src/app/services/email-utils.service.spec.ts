import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import { of } from 'rxjs';

import { EMAIL_COMPOSER, EmailUtilsService } from './email-utils.service';
import { AlertService } from './alert.service';
import { FILESYSTEM, FilesystemLike } from './filesystem.token';
import { LocalStorageService } from './local-storage.service';
import { QrUtilsService } from './qr-utils.service';
import { FileUtilsService } from './file-utils.service';
import { PrintUtilsService } from './print-utils.service';

describe('EmailUtilsService', () => {
  let service: EmailUtilsService;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let filesystemSpy: jasmine.SpyObj<FilesystemLike>;
  let localStorageSpy: jasmine.SpyObj<LocalStorageService>;
  let printUtilsSpy: jasmine.SpyObj<PrintUtilsService>;
  let alertControllerSpy: any;
  let fileServiceSpy: any;
  let qrServiceSpy: any;
  let translateSpy: any;
  let emailComposerMock: any;
  const qrCodeText = '123456'; // length 6
  const fileNamePng = 'qrcode_20250827_123000.png';
  const fileNamePdf = 'qrcode_20250827_123000.pdf';
  const maxWebLength = 400;

  beforeEach(() => {
    // Storage and LocalStorageService
    const storageSpy = jasmine.createSpyObj<Partial<Storage>>('Storage', [
      'get',
      'set',
      'remove',
      'create',
    ]);
    localStorageSpy = jasmine.createSpyObj<LocalStorageService>(
      'LocalStorageService',
      ['loadSavedEmailAddresses', 'init', 'saveEmailAddress'],
      {
        selectedLanguage$: of('en'),
      }
    );
    localStorageSpy.savedEmailAddresses = ['test@example.com'];
    localStorageSpy.loadSavedEmailAddresses.and.resolveTo();
    localStorageSpy.saveEmailAddress.and.resolveTo();

    // Alert and Filesystem
    alertServiceSpy = jasmine.createSpyObj('AlertService', [
      'showStoragePermissionError',
      'showErrorAlert',
    ]);
    filesystemSpy = jasmine.createSpyObj<FilesystemLike>('Filesystem', [
      'writeFile',
      'getUri',
      'readdir',
      'deleteFile',
      'checkPermissions',
      'requestPermissions',
    ]);
    filesystemSpy.getUri.and.callFake(({ path }) =>
      Promise.resolve({ uri: `/documents/${path}` })
    );

    // Capacitor
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);

    // AlertController
    alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    const alertMock = { present: jasmine.createSpy().and.resolveTo() };
    alertControllerSpy.create.and.resolveTo(alertMock);

    // FileUtilsService
    fileServiceSpy = jasmine.createSpyObj(
      'FileUtilsService',
      ['getDocumentsPath', 'clearNowFormatted'],
      {
        fileNamePng: fileNamePng,
        fileNamePdf: fileNamePdf,
      }
    );
    Object.defineProperty(fileServiceSpy, 'fileNamePng', {
      get: () => fileNamePng,
    });
    Object.defineProperty(fileServiceSpy, 'fileNamePdf', {
      get: () => fileNamePdf,
    });
    fileServiceSpy.getDocumentsPath.and.callFake((isPdf: boolean) =>
      Promise.resolve(
        isPdf ? `/documents/${fileNamePdf}` : `/documents/${fileNamePng}`
      )
    );

    // PrintUtilsService
    printUtilsSpy = jasmine.createSpyObj('PrintUtilsService', [
      'printQRCode',
      'getConvertedPrintSettings',
    ]);
    printUtilsSpy.getConvertedPrintSettings.and.returnValue(
      '[ ~5 cm / small gap / 8 ]'
    );

    // QrUtilsService
    qrServiceSpy = {};
    Object.defineProperty(qrServiceSpy, 'myAngularxQrCode', {
      get: () => qrCodeText, // length will be 6
      configurable: true,
    });

    // TranslateService
    translateSpy = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
    translateSpy.instant.and.callFake((key: string) => key);
    translateSpy.get.and.callFake((key: string) => of(key));

    // EmailComposer
    emailComposerMock = {
      hasAccount: jasmine.createSpy().and.resolveTo({ hasAccount: true }),
      open: jasmine.createSpy().and.resolveTo(),
    };

    // TestBed
    TestBed.configureTestingModule({
      providers: [
        EmailUtilsService,
        { provide: Storage, useValue: storageSpy },
        { provide: LocalStorageService, useValue: localStorageSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: TranslateService, useValue: translateSpy },
        TranslateStore,
        { provide: EMAIL_COMPOSER, useValue: emailComposerMock },
        { provide: FILESYSTEM, useValue: filesystemSpy },
        { provide: FileUtilsService, useValue: fileServiceSpy },
        { provide: QrUtilsService, useValue: qrServiceSpy },
        { provide: PrintUtilsService, useValue: printUtilsSpy },
      ],
    });
    service = TestBed.inject(EmailUtilsService);
  });

  describe('basic functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('send Email', () => {
    it('should load saved email addresses and include them in the "to" field when sending email on native platform', async () => {
      // Arrange
      localStorageSpy.savedEmailAddresses = [
        'test1@example.com',
        'test2@example.com',
      ];

      // Act
      await service.sendEmail();

      // Assert
      expect(localStorageSpy.loadSavedEmailAddresses).toHaveBeenCalled();
      expect(emailComposerMock.hasAccount).toHaveBeenCalled();
      expect(emailComposerMock.open).toHaveBeenCalled();

      // Verify that the saved email addresses are set in the "to" field
      const openArgs = emailComposerMock.open.calls.mostRecent().args[0];
      expect(openArgs.to).toEqual(['test1@example.com,test2@example.com']);

      expect(service.isEmailSent).toBeTrue();
    });

    it('should not send email if no email account is available', async () => {
      spyOn(console, 'error');
      emailComposerMock.hasAccount.and.resolveTo({ hasAccount: false });

      await service.sendEmail();

      expect(emailComposerMock.open).not.toHaveBeenCalled();
      expect(service.isEmailSent).toBeFalse();
      expect(console.error).toHaveBeenCalledWith(
        'Email account is not available'
      );
    });

    it('should handle errors thrown by EmailComposer.open', async () => {
      emailComposerMock.open.and.rejectWith(new Error('fail'));
      spyOn(console, 'error');

      await service.sendEmail();

      expect(emailComposerMock.open).toHaveBeenCalled();
      expect(service.isEmailSent).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    });

    it('should use mailto on web platform', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(service as any, 'navigateTo');
      localStorageSpy.savedEmailAddresses = [
        'test1@example.com',
        'test2@example.com',
      ];

      // Act
      await service.sendEmail();

      // Assert
      expect(localStorageSpy.loadSavedEmailAddresses).toHaveBeenCalled();
      expect((service as any).navigateTo).toHaveBeenCalled();

      const mailToUrl = (service as any).navigateTo.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl);
      expect(decodedMailToUrl).toContain(
        'mailto:test1@example.com,test2@example.com'
      );
      expect(service.isEmailSent).toBeTrue();
    });

    it('should use the correct translated subject in mail on web platform', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(service as any, 'navigateTo');
      const printingInfo = '[ ~5 cm / small gap / 8 ]';

      // Act
      await service.sendEmail();

      // Assert
      expect((service as any).navigateTo).toHaveBeenCalled();

      const mailToUrl = (service as any).navigateTo.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl);
      const subject =
        'EMAIL_SERVICE_MAIL_SUBJECT_PREFIX' +
        qrServiceSpy.myAngularxQrCode.length +
        'EMAIL_SERVICE_MAIL_SUBJECT_SUFFIX ' +
        printingInfo;
      expect(decodedMailToUrl).toContain(subject);
      expect(service.isEmailSent).toBeTrue();
    });

    it('should use the correct translated subject in mail on native platform', async () => {
      // Arrange
      const printingInfo = '[ ~5 cm / small gap / 8 ]';

      // Act
      await service.sendEmail();

      // Assert
      expect(emailComposerMock.hasAccount).toHaveBeenCalled();
      expect(emailComposerMock.open).toHaveBeenCalled();

      const mailToUrl = emailComposerMock.open.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl.subject);
      const subject =
        'EMAIL_SERVICE_MAIL_SUBJECT_PREFIX' +
        qrServiceSpy.myAngularxQrCode.length +
        'EMAIL_SERVICE_MAIL_SUBJECT_SUFFIX ' +
        printingInfo;
      expect(decodedMailToUrl).toContain(subject);
      expect(service.isEmailSent).toBeTrue();
    });

    it('should use the correct translated body in mail on native platform', async () => {
      // Arrange
      const printingInfo = ' [ ~5 cm / small gap / 8 ] ';

      // Act
      await service.sendEmail();

      // Assert
      expect(emailComposerMock.hasAccount).toHaveBeenCalled();
      expect(emailComposerMock.open).toHaveBeenCalled();

      const mailToUrl = emailComposerMock.open.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl.body);
      const lineBreak = '\n';
      const mailBody =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_TEXT' +
        lineBreak +
        lineBreak +
        qrServiceSpy.myAngularxQrCode +
        lineBreak +
        lineBreak +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_1' +
        printingInfo +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_2' +
        lineBreak +
        lineBreak +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_3';

      expect(decodedMailToUrl).toContain(mailBody);
      expect(service.isEmailSent).toBeTrue();
    });

    it('should use the correct translated body in mail on web platform', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(service as any, 'navigateTo');

      // Act
      await service.sendEmail();

      // Assert
      expect((service as any).navigateTo).toHaveBeenCalled();

      const mailToUrl = (service as any).navigateTo.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl);
      const lineBreak = '\n';

      const attachmentLabel =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_ATTACHEMENT_WEB' +
        lineBreak +
        `${fileNamePng}, ${fileNamePdf}`;

      const mailBody =
        attachmentLabel +
        lineBreak +
        lineBreak +
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_TEXT' +
        lineBreak +
        lineBreak +
        qrServiceSpy.myAngularxQrCode +
        lineBreak +
        lineBreak +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_WEBMAIL';
      expect(decodedMailToUrl).toContain(mailBody);

      expect(service.isEmailSent).toBeTrue();
    });

    it('should display shortened qr-text if very long text on web platform', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(service as any, 'navigateTo');
      // QrUtilsService
      const longQrCodeText = 'A'.repeat(500); // length 500
      Object.defineProperty(qrServiceSpy, 'myAngularxQrCode', {
        get: () => longQrCodeText,
        configurable: true,
      });

      // Act
      await service.sendEmail();

      // Assert
      expect((service as any).navigateTo).toHaveBeenCalled();

      const mailToUrl = (service as any).navigateTo.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl);

      // check mailbody
      const lineBreak = '\n';
      const attachmentLabel =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_ATTACHEMENT_WEB' +
        lineBreak +
        `${fileNamePng}, ${fileNamePdf}`;

      const shortendedQrCodeText =
        qrServiceSpy.myAngularxQrCode.substring(0, maxWebLength) + '...';

      const mailBody =
        attachmentLabel +
        lineBreak +
        lineBreak +
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_TEXT_WEB' +
        lineBreak +
        lineBreak +
        shortendedQrCodeText +
        lineBreak +
        lineBreak +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_WEBMAIL';
      expect(decodedMailToUrl).toContain(mailBody);

      expect(service.isEmailSent).toBeTrue();
    });

    it('should attach 2 files to mail on native platform', async () => {
      // Arrange

      // Act
      await service.sendEmail();

      // Assert
      expect(emailComposerMock.hasAccount).toHaveBeenCalled();
      expect(emailComposerMock.open).toHaveBeenCalled();

      const mailToUrl = emailComposerMock.open.calls.mostRecent().args[0];
      const attachments: any[] = mailToUrl.attachments;

      // Collect all attachment paths
      const paths = attachments.map((a) => a.path);

      expect(paths.some((p) => p.endsWith(fileNamePdf))).toBeTrue();
      expect(paths.some((p) => p.endsWith(fileNamePng))).toBeTrue();
      expect(attachments.length).toBe(2);

      expect(service.isEmailSent).toBeTrue();
    });

    it('should add no attachments in mail on web platform and add info about files to attach', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(service as any, 'navigateTo');

      // Act
      await service.sendEmail();

      // Assert
      expect((service as any).navigateTo).toHaveBeenCalled();

      const mailToUrl = (service as any).navigateTo.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl);

      // check mailbody
      const lineBreak = '\n';
      const attachmentLabel =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_ATTACHEMENT_WEB' +
        lineBreak +
        `${fileNamePng}, ${fileNamePdf}`;

      const mailBody =
        attachmentLabel +
        lineBreak +
        lineBreak +
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_TEXT' +
        lineBreak +
        lineBreak +
        qrServiceSpy.myAngularxQrCode +
        lineBreak +
        lineBreak +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_WEBMAIL';
      expect(decodedMailToUrl).toContain(mailBody);

      // Assert no attachments
      expect(decodedMailToUrl).not.toContain('attachments');

      expect(service.isEmailSent).toBeTrue();
    });
  });

  describe('displayEmailAttachmentAlert', () => {
    it('should display alert and call callback on OK', async () => {
      // Arrange
      const callback = jasmine.createSpy('callback');

      // Act
      await service.displayEmailAttachmentAlert(callback);

      // Assert
      expect(alertControllerSpy.create).toHaveBeenCalled();
      // Simulate clicking OK button
      const alertArgs = alertControllerSpy.create.calls.mostRecent().args[0];
      expect(alertArgs.header).toBe(
        'INFO_ALERT_TITLE_MAIL_ATTACHMENT'
      );
      expect(alertArgs.subHeader).toBe(`${fileNamePng}, ${fileNamePdf}`);
      expect(alertArgs.message).toBe(
        'INFO_ALERT_MESSAGE_MAIL_ATTACHMENT'
      );
      expect(alertArgs.buttons[0].text).toBe(
        'ERROR_ALERT_OPEN_EMAIL_BUTTON'
      );
      // Call the handler
      alertArgs.buttons[0].handler();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('clearEmailSent', () => {
    it('should clear emailSent flag', () => {
      (service as any).emailSent = true;
      service.clearEmailSent();
      expect(service.isEmailSent).toBeFalse();
    });
  });
});
