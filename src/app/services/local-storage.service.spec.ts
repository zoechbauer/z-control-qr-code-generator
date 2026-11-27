import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { LocalStorageService } from './local-storage.service';
import { PrintSettings } from './print-utils.service';
import {
  EmailAddressStatus,
  QrCodeGapSize,
  QrCodesCountPerPage,
  QrCodeSize,
} from '../shared/enums';
import { FileUtilsService } from './file-utils.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let storageSpy: jasmine.SpyObj<Storage>;
  let fileUtilsServiceSpy: jasmine.SpyObj<FileUtilsService>;

  const createTranslateServiceSpy = () =>
    jasmine.createSpyObj('TranslateService', ['get', 'setFallbackLang', 'use']);
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'dismiss',
    'create',
  ]);

  beforeEach(async () => {
    fileUtilsServiceSpy = jasmine.createSpyObj('FileUtilsService', [
      'deleteAllQrCodeFilesAfterSpecifiedTime',
    ]);

    storageSpy = jasmine.createSpyObj('Storage', [
      'create',
      'get',
      'set',
      'remove',
      'clear',
      'length',
      'keys',
    ]);

    // Mock Storage.create to return the spy itself
    storageSpy.create.and.returnValue(Promise.resolve(storageSpy));
    storageSpy.get.and.returnValue(Promise.resolve(null));
    storageSpy.set.and.returnValue(Promise.resolve());
    storageSpy.remove.and.returnValue(Promise.resolve());
    storageSpy.clear.and.returnValue(Promise.resolve());
    storageSpy.length.and.returnValue(Promise.resolve(0));
    storageSpy.keys.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      providers: [
        LocalStorageService,
        { provide: Storage, useValue: storageSpy },
        { provide: TranslateService, useValue: createTranslateServiceSpy() },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: FileUtilsService, useValue: fileUtilsServiceSpy },
      ],
    }).compileComponents();

    service = TestBed.inject(LocalStorageService);
  });

  describe('basic functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('initialize services', () => {
    it('should initialize the storage', async () => {
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);
      expect(storageSpy.create).toHaveBeenCalled();
    });

    it('should load selected or default language', async () => {
      const loadSelectedOrDefaultLanguageSpy = spyOn(
        service,
        'loadSelectedOrDefaultLanguage',
      ).and.returnValue(Promise.resolve('en'));
      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);
      expect(loadSelectedOrDefaultLanguageSpy).toHaveBeenCalled();
    });

    it('should set default language in translate service when initialization fails', async () => {
      storageSpy.create.and.returnValue(
        Promise.reject(new Error('init failed')),
      );
      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(translateServiceSpy.setFallbackLang).toHaveBeenCalledWith('en');
      expect(translateServiceSpy.use).toHaveBeenCalledWith('en');
    });

    it('should run remaining initialization steps on success', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en'),
      );
      const translateServiceSpy = createTranslateServiceSpy();
      const loadSavedEmailAddressesSpy = spyOn(
        service,
        'loadSavedEmailAddresses',
      ).and.stub();
      const loadPrintSettingsSpy = spyOn(
        service,
        'loadPrintSettings',
      ).and.stub();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(loadSavedEmailAddressesSpy).toHaveBeenCalled();
      expect(loadPrintSettingsSpy).toHaveBeenCalled();
    });

    it('should not call fallback translate methods when initialization succeeds', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en'),
      );
      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(translateServiceSpy.setFallbackLang).not.toHaveBeenCalled();
      expect(translateServiceSpy.use).not.toHaveBeenCalled();
    });

    it('should log and fallback if a later initialization step fails', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en'),
      );
      spyOn(service, 'loadSavedEmailAddresses').and.returnValue(
        Promise.reject(new Error('load saved email addresses failed')),
      );
      const consoleErrorSpy = spyOn(console, 'error');
      const translateServiceSpy = createTranslateServiceSpy();
      const initializeWithDefaultsSpy = spyOn(
        service as any,
        'initializeWithDefaults',
      ).and.callThrough();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'App initialization failed:',
        new Error('load saved email addresses failed'),
      );
      expect(translateServiceSpy.setFallbackLang).toHaveBeenCalledWith('en');
      expect(translateServiceSpy.use).toHaveBeenCalledWith('en');
      expect(initializeWithDefaultsSpy).toHaveBeenCalledWith(
        translateServiceSpy,
      );
    });

    it('should log delete qr code file errors', async () => {
      // Arrange
      fileUtilsServiceSpy.deleteAllQrCodeFilesAfterSpecifiedTime.and.returnValue(
        Promise.reject('Delete failed'),
      );
      spyOn(console, 'warn');

      // Act
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);
      // wait for all pending microtasks/macrotasks created by ngOnInit
      await Promise.resolve();

      // Assert
      expect(() => service.initializeServicesAsync(translateServiceSpy)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(
        'File cleanup failed:',
        'Delete failed',
      );
    });

    it('should not log if delete qr code file succeeds', async () => {
      // Arrange
      fileUtilsServiceSpy.deleteAllQrCodeFilesAfterSpecifiedTime.and.returnValue(
        Promise.resolve(),
      );
      spyOn(console, 'warn');

      // Act
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);
      // wait for all pending microtasks/macrotasks created by ngOnInit
      await Promise.resolve();

      // Assert
      expect(() => service.initializeServicesAsync(translateServiceSpy)).not.toThrow();
      expect(console.warn).not.toHaveBeenCalled();
    });

  });

  describe('getMobileDefaultLanguage', () => {
    it('should return "de" if browser language is German', () => {
      spyOnProperty(navigator, 'language', 'get').and.returnValue('de-DE');
      expect(service.getMobileDefaultLanguage()).toBe('de');
    });

    it('should return "en" if browser language is English', () => {
      spyOnProperty(navigator, 'language', 'get').and.returnValue('en-US');
      expect(service.getMobileDefaultLanguage()).toBe('en');
    });

    it('should return "en" for unsupported languages', () => {
      spyOnProperty(navigator, 'language', 'get').and.returnValue('fr-FR');
      expect(service.getMobileDefaultLanguage()).toBe('en');
    });

    it('should handle language codes without region', () => {
      spyOnProperty(navigator, 'language', 'get').and.returnValue('de');
      expect(service.getMobileDefaultLanguage()).toBe('de');
    });
  });

  describe('get selected or default language', () => {
    it('should return default language if no language is saved', async () => {
      const defaultLanguage = service['getMobileDefaultLanguage']();
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe(defaultLanguage);
    });

    it('should save default language if no language is saved', async () => {
      const defaultLanguage = service['getMobileDefaultLanguage']();
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe(defaultLanguage);
      expect(storageSpy.set).toHaveBeenCalledWith('selectedLanguage', language);
    });

    it('should return saved language if it exists', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('fr'));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe('fr');
    });
  });

  describe('save selected language', () => {
    it('should save the selected language', async () => {
      await service.saveSelectedLanguage('nl');
      expect(storageSpy.set).toHaveBeenCalledWith('selectedLanguage', 'nl');
    });

    it('should update the selected language subject', async () => {
      await service.saveSelectedLanguage('nl');
      expect(service.selectedLanguageSubject.value).toBe('nl');
    });

    it('logs an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));

      await service.saveSelectedLanguage('nl');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving selected language:',
        error,
      );
    });

    it('throws an error if language is not provided', async () => {
      await expectAsync(service.saveSelectedLanguage('')).toBeRejectedWithError(
        Error,
        'Language must be provided',
      );
    });
  });

  describe('email management', () => {
    it('should save email address', async () => {
      // Arrange
      const email = 'test@example.com';
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      const result = await service.saveEmailAddress(email);

      // Assert
      expect(storageSpy.set).toHaveBeenCalledWith(
        'savedEmailAddresses',
        JSON.stringify([email]),
      );
      expect(result).toBe(EmailAddressStatus.Added);
    });

    it('should not save email address for duplicate', async () => {
      // Arrange
      const savedEmailAddresses = ['test1@example.com', 'test2@example.com'];
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(savedEmailAddresses)),
      );
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      const result = await service.saveEmailAddress('test1@example.com');

      // Assert
      expect(storageSpy.set).not.toHaveBeenCalled();
      expect(result).toBe(EmailAddressStatus.Duplicate);
    });

    it('logs error if save email fails', async () => {
      // Arrange
      storageSpy.set.and.returnValue(Promise.reject('Error'));
      spyOn(console, 'error');
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      const result = await service.saveEmailAddress('test1@example.com');

      // Assert
      expect(storageSpy.set).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error saving email:',
        'Error',
      );
      expect(result).toBe(EmailAddressStatus.Added);
    });

    it('should load saved email addresses into member variable', async () => {
      // Arrange
      const expectedEmails = ['user1@test.com', 'user2@test.com'];
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(expectedEmails)),
      );
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      await service.loadSavedEmailAddresses();

      // Assert
      expect(storageSpy.get).toHaveBeenCalledWith('savedEmailAddresses');
      expect(service.savedEmailAddresses).toEqual(expectedEmails);
    });

    it('should initialize empty email list when no emails stored', async () => {
      // Arrange
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      await service.loadSavedEmailAddresses();

      // Assert
      expect(service.savedEmailAddresses).toEqual([]);
    });

    it('should delete email address', async () => {
      // Arrange
      const savedEmailAddresses = [
        'test1@example.com',
        'test2@example.com',
        'test3@example.com',
      ];
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(savedEmailAddresses)),
      );
      const savedEmailAddressesAfterDeletion = [
        'test1@example.com',
        'test3@example.com',
      ];
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      const result = await service.deleteEmailAddress(1);

      // Assert
      expect(storageSpy.set).toHaveBeenCalledWith(
        'savedEmailAddresses',
        JSON.stringify(savedEmailAddressesAfterDeletion),
      );
      expect(result).toBe(EmailAddressStatus.Removed);
    });

    it('should not delete email address for invalid index', async () => {
      // Arrange
      const savedEmailAddresses = ['test1@example.com', 'test2@example.com'];
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(savedEmailAddresses)),
      );
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      const result = await service.deleteEmailAddress(5);

      // Assert
      expect(storageSpy.set).not.toHaveBeenCalled();
      expect(result).toBe(EmailAddressStatus.NotFound);
    });
  });

  describe('print settings management', () => {
    it('should save print settings', async () => {
      // Arrange
      const settings: PrintSettings = {
        size: QrCodeSize.MEDIUM,
        gap: QrCodeGapSize.SMALL,
        typeOfQrCodesPerPage: QrCodesCountPerPage.FULL_PAGE,
        numberOfQrCodesPerPage: -1,
      };
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      await service.savePrintSettings(settings);

      // Assert
      expect(storageSpy.set).toHaveBeenCalledWith(
        'savedPrintSettings',
        JSON.stringify(settings),
      );
    });

    it('logs error if saving print settings fails', async () => {
      // Arrange
      const settings: PrintSettings = {
        size: QrCodeSize.MEDIUM,
        gap: QrCodeGapSize.SMALL,
        typeOfQrCodesPerPage: QrCodesCountPerPage.FULL_PAGE,
        numberOfQrCodesPerPage: -1,
      };
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      storageSpy.set.and.returnValue(Promise.reject('Error'));
      spyOn(console, 'error');

      // Act
      await service.savePrintSettings(settings);

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Error saving print settings:',
        'Error',
      );
    });

    it('should load print settings', async () => {
      // Arrange
      const expectedSettings: PrintSettings = {
        size: QrCodeSize.MEDIUM,
        gap: QrCodeGapSize.SMALL,
        typeOfQrCodesPerPage: QrCodesCountPerPage.FULL_PAGE,
        numberOfQrCodesPerPage: -1,
      };
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(expectedSettings)),
      );
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);

      // Act
      await service.loadPrintSettings();

      // Assert
      expect(storageSpy.get).toHaveBeenCalledWith('savedPrintSettings');
      expect(service.savedPrintSettings).toEqual(expectedSettings);
    });
  });

  describe('parseStoredValue', () => {
    it('should parse valid JSON string', () => {
      const validJsonString = JSON.stringify({ key: 'value' });
      const result = (service as any).parseStoredValue(validJsonString);
      expect(result).toEqual({ key: 'value' });
    });

    it('should return the original string for invalid JSON string', () => {
      const invalidJsonString = '{ key: value }';
      const result = (service as any).parseStoredValue(invalidJsonString);
      expect(result).toEqual(invalidJsonString);
    });

    it('should return plain string for non-JSON string', () => {
      const plainString = 'plain string';
      const result = (service as any).parseStoredValue(plainString);
      expect(result).toEqual(plainString);
    });

    it('should return non-string values', () => {
      const nonStringValue = 123;
      const result = (service as any).parseStoredValue(nonStringValue);
      expect(result).toEqual(nonStringValue);
    });
  });
});
