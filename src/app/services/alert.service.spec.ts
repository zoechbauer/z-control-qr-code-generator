import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { createTranslateServiceMock } from '@testing/translate-service.mock';

describe('AlertService', () => {
  let service: AlertService;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let alertSpy: any;
  let translateServiceMock: any;

  beforeEach(() => {
    alertSpy = jasmine.createSpyObj('Alert', ['present']);
    alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    translateServiceMock = createTranslateServiceMock();

    TestBed.configureTestingModule({
      providers: [
        AlertService,
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: TranslateService, useValue: translateServiceMock },
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
      expect(translateServiceMock.get).toHaveBeenCalledWith('ERROR_ALERT_TITLE_ERROR');
      expect(translateServiceMock.get).toHaveBeenCalledWith('ERROR_ALERT_BUTTON_OK');
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
      translateServiceMock.get.and.callFake((key: string) => of('Translated: ' + key));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showStoragePermissionError();

      expect(translateServiceMock.get).toHaveBeenCalledWith('ERROR_MESSAGE_SAVE_QR_HEADER');
      expect(translateServiceMock.get).toHaveBeenCalledWith('ERROR_MESSAGE_SAVE_QR_SUBHEADER');
      expect(translateServiceMock.get).toHaveBeenCalledWith('ERROR_MESSAGE_SAVE_QR_MESSAGE');
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