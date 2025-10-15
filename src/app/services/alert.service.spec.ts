import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('AlertService', () => {
  let service: AlertService;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;
  let alertSpy: any;

  beforeEach(() => {
    alertSpy = jasmine.createSpyObj('Alert', ['present']);
    alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        AlertService,
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
    });

    service = TestBed.inject(AlertService);
  });

  describe('showErrorAlert', () => {
    it('should create and present an error alert with translated strings', async () => {
      translateServiceSpy.get.and.callFake((key: string) => {
        switch (key) {
          case 'ERROR_ALERT_TITLE_ERROR':
            return of('Error');
          case 'ERROR_ALERT_BUTTON_OK':
            return of('OK');
          default:
            return of('Translated: ' + key);
        }
      });
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showErrorAlert('SOME_ERROR_KEY');

      expect(translateServiceSpy.get).toHaveBeenCalledWith('SOME_ERROR_KEY');
      expect(translateServiceSpy.get).toHaveBeenCalledWith('ERROR_ALERT_TITLE_ERROR');
      expect(translateServiceSpy.get).toHaveBeenCalledWith('ERROR_ALERT_BUTTON_OK');
      expect(alertControllerSpy.create).toHaveBeenCalledWith({
        header: 'Error',
        message: 'Translated: SOME_ERROR_KEY',
        buttons: ['OK'],
      });
      expect(alertSpy.present).toHaveBeenCalled();
    });
  });

  describe('showStoragePermissionError', () => {
    it('should create and present a storage permission error alert with translated strings', async () => {
      translateServiceSpy.get.and.callFake((key: string) => of('Translated: ' + key));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showStoragePermissionError();

      expect(translateServiceSpy.get).toHaveBeenCalledWith('ERROR_MESSAGE_SAVE_QR_HEADER');
      expect(translateServiceSpy.get).toHaveBeenCalledWith('ERROR_MESSAGE_SAVE_QR_SUBHEADER');
      expect(translateServiceSpy.get).toHaveBeenCalledWith('ERROR_MESSAGE_SAVE_QR_MESSAGE');
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
});