import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, ToastController } from '@ionic/angular';

import { ToastService } from './toast.service';
import { UtilsService } from './utils.service';

describe('ToastService', () => {
  let service: ToastService;
  const toastControllerSpy = jasmine.createSpyObj('ToastController', [
    'create',
  ]);
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
    'instant',
    'get',
  ]);
  translateServiceSpy.onLangChange = of({});
  const utilsService: any = {};
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'dismiss',
    'create',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsService },
        { provide: ToastController, useValue: toastControllerSpy },
      ],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toast positioning based on app type', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      Object.defineProperty(utilsService, 'isDesktop', {
        get: () => false,
        configurable: true,
      });

      toastController = TestBed.inject(
        ToastController
      ) as jasmine.SpyObj<ToastController>;

      // Basic toast mock
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should show toast at bottom on desktop', () => {
      // Arrange
      spyOnProperty(utilsService, 'isDesktop', 'get').and.returnValue(true);
      // Act
      service.showToast('Test Message');
      // Assert - Only test the position
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          position: 'bottom',
        })
      );
    });

    it('should show toast at top on mobile', () => {
      // Arrange
      spyOnProperty(utilsService, 'isDesktop', 'get').and.returnValue(false);
      // Act
      service.showToast('Test Message');
      // Assert - Only test the position
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          position: 'top',
        })
      );
    });
  });
});
