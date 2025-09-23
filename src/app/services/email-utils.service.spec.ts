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

describe('EmailUtilsService', () => {
  let service: EmailUtilsService;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let filesystemSpy: jasmine.SpyObj<FilesystemLike>;
  let localStorageSpy: jasmine.SpyObj<LocalStorageService>;
  let alertControllerSpy: any;
  let fileServiceSpy: any;
  let qrServiceSpy: any;
  let translateSpy: any;
  let emailComposerMock: any;

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
      ['getDocumentsPath'],
      {
        fileNamePng: 'qrcode_20250827_123000.png',
        fileNamePdf: 'qrcode_20250827_123000.pdf',
      }
    );
    Object.defineProperty(fileServiceSpy, 'fileNamePng', {
      get: () => 'qrcode_20250827_123000.png',
    });
    Object.defineProperty(fileServiceSpy, 'fileNamePdf', {
      get: () => 'qrcode_20250827_123000.pdf',
    });
    fileServiceSpy.getDocumentsPath.and.callFake((isPdf: boolean) =>
      Promise.resolve(
        isPdf
          ? '/documents/qrcode_20250827_123000.pdf'
          : '/documents/qrcode_20250827_123000.png'
      )
    );

    // QrUtilsService
    qrServiceSpy = {};
    Object.defineProperty(qrServiceSpy, 'myAngularxQrCode', {
      get: () => '123456', // length will be 6
      configurable: true,
    });

    // TranslateService
    translateSpy = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
    translateSpy.instant.and.callFake((key: string) => key + '_translated');
    translateSpy.get.and.callFake((key: string) => of(key + '_translated'));

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
      ],
    });
    service = TestBed.inject(EmailUtilsService);
  });

  describe('basic functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('sendEmail', () => {
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
      emailComposerMock.hasAccount.and.resolveTo({ hasAccount: false });

      await service.sendEmail();

      expect(emailComposerMock.open).not.toHaveBeenCalled();
      expect(service.isEmailSent).toBeFalse();
    });

    it('should handle errors thrown by EmailComposer.open', async () => {
      emailComposerMock.open.and.rejectWith(new Error('fail'));

      await service.sendEmail();

      expect(emailComposerMock.open).toHaveBeenCalled();
      expect(service.isEmailSent).toBeFalse();
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

    it('should use the correct subject in mail on web platform', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(service as any, 'navigateTo');

      // Act
      await service.sendEmail();

      // Assert
      expect((service as any).navigateTo).toHaveBeenCalled();

      const mailToUrl = (service as any).navigateTo.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl);
      const subject =
        'EMAIL_SERVICE_MAIL_SUBJECT_PREFIX_translated' +
        qrServiceSpy.myAngularxQrCode.length +
        'EMAIL_SERVICE_MAIL_SUBJECT_SUFFIX_translated';
      expect(decodedMailToUrl).toContain(subject);
      expect(service.isEmailSent).toBeTrue();
    });

    it('should use the correct translated subject in mail on native platform', async () => {
      // Arrange

      // Act
      await service.sendEmail();

      // Assert
      expect(emailComposerMock.hasAccount).toHaveBeenCalled();
      expect(emailComposerMock.open).toHaveBeenCalled();

      const mailToUrl = emailComposerMock.open.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl.subject);
      const subject =
        'EMAIL_SERVICE_MAIL_SUBJECT_PREFIX_translated' +
        qrServiceSpy.myAngularxQrCode.length +
        'EMAIL_SERVICE_MAIL_SUBJECT_SUFFIX_translated';
      expect(decodedMailToUrl).toContain(subject);
      expect(service.isEmailSent).toBeTrue();
    });

    it('should use the correct translated body in mail on native platform', async () => {
      // Arrange

      // Act
      await service.sendEmail();

      // Assert
      expect(emailComposerMock.hasAccount).toHaveBeenCalled();
      expect(emailComposerMock.open).toHaveBeenCalled();

      const mailToUrl = emailComposerMock.open.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl.body);
      const lineBreak = '\n';
      const mailBody =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_translated' +
        lineBreak +
        lineBreak +
        qrServiceSpy.myAngularxQrCode +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_translated';
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
      const mailBody =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_translated' +
        lineBreak +
        lineBreak +
        qrServiceSpy.myAngularxQrCode +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_translated';
      expect(decodedMailToUrl).toContain(mailBody);
      expect(service.isEmailSent).toBeTrue();
    });

    it('should add info to the body if qr code contains leading spaces in mail on web platform', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(service as any, 'navigateTo');
      // Set leading spaces in the QR code value
      Object.defineProperty(qrServiceSpy, 'myAngularxQrCode', {
        get: () => '   123456', // 3 leading spaces
        configurable: true,
      });

      // Act
      await service.sendEmail();

      // Assert
      expect((service as any).navigateTo).toHaveBeenCalled();

      const mailToUrl = (service as any).navigateTo.calls.mostRecent().args[0];
      const decodedMailToUrl = decodeURIComponent(mailToUrl);
      const lineBreak = '\n';
      const mailBody =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_translated' +
        lineBreak +
        lineBreak +
        qrServiceSpy.myAngularxQrCode +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_translated';
      const mailBodyWeb =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_WEB_translated' +
        lineBreak +
        lineBreak +
        mailBody;
      expect(decodedMailToUrl).toContain(mailBodyWeb);
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

      expect(paths.some(p => p.endsWith('qrcode_20250827_123000.png'))).toBeTrue();
      expect(paths.some(p => p.endsWith('qrcode_20250827_123000.pdf'))).toBeTrue();
      expect(attachments.length).toBe(2);

      expect(service.isEmailSent).toBeTrue();
    });

    it('should add no attachments in mail on web platform', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(service as any, 'navigateTo');

      // Act
      await service.sendEmail();

      // Assert
      expect((service as any).navigateTo).toHaveBeenCalled();

      const mailToUrl = (service as any).navigateTo.calls.mostRecent().args[0];
      console.table('table', mailToUrl);
      console.dir('dir', mailToUrl);
      const decodedMailToUrl = decodeURIComponent(mailToUrl);

      // check mailbody
      const lineBreak = '\n';
      const mailBody =
        'EMAIL_SERVICE_MAIL_BODY_PREFIX_translated' +
        lineBreak +
        lineBreak +
        qrServiceSpy.myAngularxQrCode +
        'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_translated';
      expect(decodedMailToUrl).toContain(mailBody);

      // Assert no attachments
      expect(decodedMailToUrl).not.toContain('qrcode_20250827_123000.png');
      expect(decodedMailToUrl).not.toContain('qrcode_20250827_123000.pdf');
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
        'INFO_ALERT_TITLE_MAIL_ATTACHMENT_translated'
      );
      expect(alertArgs.subHeader).toBe(
        'qrcode_20250827_123000.png, qrcode_20250827_123000.pdf'
      );
      expect(alertArgs.message).toBe(
        'INFO_ALERT_MESSAGE_MAIL_ATTACHMENT_translated'
      );
      expect(alertArgs.buttons[0].text).toBe(
        'ERROR_ALERT_BUTTON_OK_translated'
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
