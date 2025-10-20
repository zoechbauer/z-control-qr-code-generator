import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { LocalStorageService } from './local-storage.service';
import { take } from 'rxjs';
import { PrintSettings } from './print-utils.service';
import {
  EmailAddressStatus,
  QrCodeGapSize,
  QrCodesCountPerPage,
  QrCodeSize,
} from '../enums';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let storageSpy: jasmine.SpyObj<Storage>;

  beforeEach(async () => {
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
      ],
    }).compileComponents();

    service = TestBed.inject(LocalStorageService);
  });

  describe('basic functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize storage', async () => {
      // Act
      await service.init();

      // Assert
      expect(storageSpy.create).toHaveBeenCalled();
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

  describe('language management', () => {
    it('should save language preference', async () => {
      // Arrange
      const language = 'en';
      await service.init();

      // Spy on the observable to verify it gets updated
      spyOn(service['selectedLanguageSubject'], 'next');

      // Act
      await service.saveSelectedLanguage(language);

      // Assert
      expect(storageSpy.set).toHaveBeenCalledWith(
        'selectedLanguage',
        JSON.stringify(language)
      ); // or LocalStorage.SelectedLanguage
      expect(service['selectedLanguageSubject'].next).toHaveBeenCalledWith(
        language
      );
    });

    it('should load selected language and update observable', async () => {
      // Arrange
      const expectedLanguage = 'de';
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(expectedLanguage))
      );
      await service.init();
      // Spy on the observable to verify it gets updated
      spyOn(service['selectedLanguageSubject'], 'next');

      // Act
      await service.loadSelectedOrDefaultLanguage();

      // Assert
      expect(storageSpy.get).toHaveBeenCalledWith('selectedLanguage'); // or LocalStorage.SelectedLanguage
      expect(service['selectedLanguageSubject'].next).toHaveBeenCalledWith(
        expectedLanguage
      );
    });

    it('should use default language when no language is stored', async () => {
      // Arrange
      storageSpy.get.and.returnValue(Promise.resolve(null));
      await service.init();
      // Mock the getMobileDefaultLanguage method
      spyOn(service, 'getMobileDefaultLanguage').and.returnValue('en');
      spyOn(service, 'saveSelectedLanguage').and.returnValue(Promise.resolve());
      spyOn(service['selectedLanguageSubject'], 'next');

      // Act
      await service.loadSelectedOrDefaultLanguage();

      // Assert
      expect(service.getMobileDefaultLanguage).toHaveBeenCalled();
      expect(service.saveSelectedLanguage).toHaveBeenCalledWith('en');
      expect(service['selectedLanguageSubject'].next).toHaveBeenCalledWith(
        'en'
      );
    });

    it('should expose selected language via observable', async () => {
      // Arrange
      const expectedLanguage = 'fr';
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(expectedLanguage))
      );
      await service.init();

      // Act
      const languagePromise = service.selectedLanguage$
        .pipe(take(1))
        .toPromise();
      await service.loadSelectedOrDefaultLanguage();

      // Assert
      const emittedLanguage = await languagePromise;
      expect(emittedLanguage).toBe(expectedLanguage);
    });

    it('logs an error when saving the selected language fails', async () => {
      // Arrange
      const language = 'en';
      await service.init();
      storageSpy.set.and.returnValue(Promise.reject('Error'));
      spyOn(console, 'error');

      // Act
      await service.saveSelectedLanguage(language);

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Error saving selected language:',
        'Error'
      );
    });
  });

  describe('email management', () => {
    it('should save email address', async () => {
      // Arrange
      const email = 'test@example.com';
      await service.init();

      // Act
      const result = await service.saveEmailAddress(email);

      // Assert
      expect(storageSpy.set).toHaveBeenCalledWith(
        'savedEmailAddresses',
        JSON.stringify([email])
      );
      expect(result).toBe(EmailAddressStatus.Added);
    });

    it('should not save email address for duplicate', async () => {
      // Arrange
      const savedEmailAddresses = ['test1@example.com', 'test2@example.com'];
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(savedEmailAddresses))
      );
      await service.init();

      // Act
      const result = await service.saveEmailAddress('test1@example.com');

      // Assert
      expect(storageSpy.set).not.toHaveBeenCalled();
      expect(result).toBe(EmailAddressStatus.Duplicate);
    });

    it('logs error if save email fails', async () => {
      // Arrange
      storageSpy.set.and.returnValue(
        Promise.reject('Error')
      );
      spyOn(console, 'error');
      await service.init();

      // Act
      const result = await service.saveEmailAddress('test1@example.com');

      // Assert
      expect(storageSpy.set).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error saving email:',
        'Error'
      );
      expect(result).toBe(EmailAddressStatus.Added);
    });

    it('should load saved email addresses into member variable', async () => {
      // Arrange
      const expectedEmails = ['user1@test.com', 'user2@test.com'];
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(expectedEmails))
      );
      await service.init();

      // Act
      await service.loadSavedEmailAddresses();

      // Assert
      expect(storageSpy.get).toHaveBeenCalledWith('savedEmailAddresses');
      expect(service.savedEmailAddresses).toEqual(expectedEmails);
    });

    it('should initialize empty email list when no emails stored', async () => {
      // Arrange
      storageSpy.get.and.returnValue(Promise.resolve(null));
      await service.init();

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
        Promise.resolve(JSON.stringify(savedEmailAddresses))
      );
      const savedEmailAddressesAfterDeletion = [
        'test1@example.com',
        'test3@example.com',
      ];
      await service.init();

      // Act
      const result = await service.deleteEmailAddress(1);

      // Assert
      expect(storageSpy.set).toHaveBeenCalledWith(
        'savedEmailAddresses',
        JSON.stringify(savedEmailAddressesAfterDeletion)
      );
      expect(result).toBe(EmailAddressStatus.Removed);
    });

    it('should not delete email address for invalid index', async () => {
      // Arrange
      const savedEmailAddresses = ['test1@example.com', 'test2@example.com'];
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(savedEmailAddresses))
      );
      await service.init();

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
      await service.init();

      // Act
      await service.savePrintSettings(settings);

      // Assert
      expect(storageSpy.set).toHaveBeenCalledWith(
        'savedPrintSettings',
        JSON.stringify(settings)
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
      await service.init();
      storageSpy.set.and.returnValue(Promise.reject('Error'));
      spyOn(console, 'error');

      // Act
      await service.savePrintSettings(settings);

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Error saving print settings:',
        'Error'
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
        Promise.resolve(JSON.stringify(expectedSettings))
      );
      await service.init();

      // Act
      await service.loadPrintSettings();
      
      // Assert
      expect(storageSpy.get).toHaveBeenCalledWith('savedPrintSettings');
      expect(service.savedPrintSettings).toEqual(expectedSettings);
    });
  });
});
