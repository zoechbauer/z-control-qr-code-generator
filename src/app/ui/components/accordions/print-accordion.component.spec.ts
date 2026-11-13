import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { PrintAccordionComponent } from './print-accordion.component';
import { createTranslateServiceMock } from '@testing/translate-service.mock';
import { ToastService } from '@app/services/toast.service';
import { LocalStorageService } from '@app/services/local-storage.service';
import {
  PrintSettings,
  PrintUtilsService,
} from 'src/app/services/print-utils.service';
import { QrCodeGapSize, QrCodesCountPerPage, QrCodeSize } from 'src/app/enums';

describe('PrintAccordionComponent', () => {
  let component: PrintAccordionComponent;
  let fixture: ComponentFixture<PrintAccordionComponent>;
  let printUtilsServiceSpy: jasmine.SpyObj<PrintUtilsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;

  const defaultPrintSettings: PrintSettings = {
    size: QrCodeSize.MEDIUM,
    gap: QrCodeGapSize.SMALL,
    typeOfQrCodesPerPage: QrCodesCountPerPage.FULL_PAGE,
    numberOfQrCodesPerPage: 1,
  };

  beforeEach(async () => {
    printUtilsServiceSpy = jasmine.createSpyObj<PrintUtilsService>(
      'PrintUtilsService',
      [
        'getEffectiveNumberOfQrCodesPerPage',
        'getConvertedPrintSettings',
        'getCalculatedNumberOfQrCodesPerPage',
        'getAvailableQrCodeSizesAndGapSizes',
      ],
    );

    printUtilsServiceSpy.getAvailableQrCodeSizesAndGapSizes.and.returnValue({
      qrCodeSizes: [{ label: 'QrCodeSize.MEDIUM', value: QrCodeSize.MEDIUM }],
      qrCodeGapSizes: [
        { label: 'QrCodeGapSize.SMALL', value: QrCodeGapSize.SMALL },
      ],
    });
    printUtilsServiceSpy.getCalculatedNumberOfQrCodesPerPage.and.returnValue(9);
    printUtilsServiceSpy.getEffectiveNumberOfQrCodesPerPage.and.returnValue(9);
    printUtilsServiceSpy.getConvertedPrintSettings.and.returnValue(
      '[ medium / 1 ]',
    );

    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', [
      'showToast',
    ]);

    localStorageServiceSpy = jasmine.createSpyObj<LocalStorageService>(
      'LocalStorageService',
      ['savePrintSettings'],
      {
        savedPrintSettings$: of(defaultPrintSettings),
      },
    );

    await TestBed.configureTestingModule({
      imports: [PrintAccordionComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: PrintUtilsService, useValue: printUtilsServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load available print settings on ngOnInit', () => {
      const loadAvailablePrintSettingsSpy = spyOn(
        component as any,
        'loadAvailablePrintSettings',
      );

      component.ngOnInit();

      expect(loadAvailablePrintSettingsSpy).toHaveBeenCalled();
      expect(component.qrCodeSizes.length).toBeGreaterThan(0);
      expect(component.qrCodeGapSizes.length).toBeGreaterThan(0);
    });

    it('should apply the saved print settings when the observable emits', () => {
      expect(component.selectedQrCodeSize).toBe(defaultPrintSettings.size);
      expect(component.selectedQrCodeGapSize).toBe(defaultPrintSettings.gap);
      expect(component.selectedTypeOfQrCodesPerPage).toBe(
        defaultPrintSettings.typeOfQrCodesPerPage,
      );
      expect(component.selectedNumberOfQrCodesPerPage).toBe(
        defaultPrintSettings.numberOfQrCodesPerPage,
      );
    });

    it('should call printUtilsService.getConvertedPrintSettings when getPrintSettings is invoked', () => {
      component.getPrintSettings();

      expect(printUtilsServiceSpy.getConvertedPrintSettings).toHaveBeenCalled();
    });

    describe('getter logic', () => {
      beforeEach(() => {
        component.selectedQrCodeSize = QrCodeSize.MEDIUM;
        component.selectedQrCodeGapSize = QrCodeGapSize.SMALL;
        printUtilsServiceSpy.getEffectiveNumberOfQrCodesPerPage.and.returnValue(
          9,
        );
        printUtilsServiceSpy.getCalculatedNumberOfQrCodesPerPage.and.returnValue(
          9,
        );
      });

      it('should call getEffectiveNumberOfQrCodesPerPage when type is CUSTOM_NUMBER', () => {
        component.selectedTypeOfQrCodesPerPage =
          QrCodesCountPerPage.CUSTOM_NUMBER;

        component.calculatedNumberOfQrCodesPerPage;

        expect(
          printUtilsServiceSpy.getEffectiveNumberOfQrCodesPerPage,
        ).toHaveBeenCalled();
      });

      it('should call getCalculatedNumberOfQrCodesPerPage when type is not CUSTOM_NUMBER', () => {
        component.selectedTypeOfQrCodesPerPage = QrCodesCountPerPage.FULL_PAGE;

        component.calculatedNumberOfQrCodesPerPage;

        expect(
          printUtilsServiceSpy.getCalculatedNumberOfQrCodesPerPage,
        ).toHaveBeenCalled();
      });

      it('should call getCalculatedNumberOfQrCodesPerPage for maxCalculatedNumberOfQrCodesPerPage', () => {
        component.maxCalculatedNumberOfQrCodesPerPage;

        expect(
          printUtilsServiceSpy.getCalculatedNumberOfQrCodesPerPage,
        ).toHaveBeenCalled();
      });
    });

    describe('onPrintSettingChange', () => {
      const calculatedMaxQrCodesPerPage = 15;
      beforeEach(() => {
        component.selectedQrCodeSize = QrCodeSize.LARGE;
        component.selectedQrCodeGapSize = QrCodeGapSize.SMALL;
        spyOnProperty(
          component,
          'maxCalculatedNumberOfQrCodesPerPage',
        ).and.returnValue(calculatedMaxQrCodesPerPage);
      });

      it('should save the selected print settings for full page', () => {
        component.selectedTypeOfQrCodesPerPage = QrCodesCountPerPage.FULL_PAGE;
        component.onPrintSettingChange();

        expect(localStorageServiceSpy.savePrintSettings).toHaveBeenCalledWith({
          size: QrCodeSize.LARGE,
          gap: QrCodeGapSize.SMALL,
          typeOfQrCodesPerPage: QrCodesCountPerPage.FULL_PAGE,
          numberOfQrCodesPerPage: -1,
        });
      });

      it('should save the selected print settings for number of QR codes per page less than max', () => {
        component.selectedNumberOfQrCodesPerPage = 12;
        component.selectedTypeOfQrCodesPerPage =
          QrCodesCountPerPage.CUSTOM_NUMBER;

        component.onPrintSettingChange();

        expect(localStorageServiceSpy.savePrintSettings).toHaveBeenCalledWith({
          size: QrCodeSize.LARGE,
          gap: QrCodeGapSize.SMALL,
          typeOfQrCodesPerPage: QrCodesCountPerPage.CUSTOM_NUMBER,
          numberOfQrCodesPerPage: 12,
        });
      });

      it('should save the selected print settings for number of QR codes per page greater than max', () => {
        component.selectedNumberOfQrCodesPerPage = 16;
        component.selectedTypeOfQrCodesPerPage =
          QrCodesCountPerPage.CUSTOM_NUMBER;

        component.onPrintSettingChange();

        expect(localStorageServiceSpy.savePrintSettings).toHaveBeenCalledWith({
          size: QrCodeSize.LARGE,
          gap: QrCodeGapSize.SMALL,
          typeOfQrCodesPerPage: QrCodesCountPerPage.CUSTOM_NUMBER,
          numberOfQrCodesPerPage: calculatedMaxQrCodesPerPage,
        });
      });

      it('should save the selected print settings for number of QR codes per page = -1', () => {
        component.selectedNumberOfQrCodesPerPage = -1;
        component.selectedTypeOfQrCodesPerPage =
          QrCodesCountPerPage.CUSTOM_NUMBER;

        component.onPrintSettingChange();

        expect(localStorageServiceSpy.savePrintSettings).toHaveBeenCalledWith({
          size: QrCodeSize.LARGE,
          gap: QrCodeGapSize.SMALL,
          typeOfQrCodesPerPage: QrCodesCountPerPage.CUSTOM_NUMBER,
          numberOfQrCodesPerPage: calculatedMaxQrCodesPerPage,
        });
      });
    });

    describe('calculatedNumberOfQrCodesPerPage', () => {
      it('should call getEffectiveNumberOfQrCodesPerPage for custom number of QR codes per page', () => {
        component.selectedTypeOfQrCodesPerPage =
          QrCodesCountPerPage.CUSTOM_NUMBER;
        component.calculatedNumberOfQrCodesPerPage;

        expect(
          printUtilsServiceSpy.getEffectiveNumberOfQrCodesPerPage,
        ).toHaveBeenCalled();
      });

      it('should call getCalculatedNumberOfQrCodesPerPage for full page QR codes', () => {
        component.selectedTypeOfQrCodesPerPage = QrCodesCountPerPage.FULL_PAGE;
        component.calculatedNumberOfQrCodesPerPage;

        expect(
          printUtilsServiceSpy.getCalculatedNumberOfQrCodesPerPage,
        ).toHaveBeenCalled();
      });
    });

    describe('onNumberOfQrCodesChange', () => {
      beforeEach(() => {
        printUtilsServiceSpy.getCalculatedNumberOfQrCodesPerPage.and.returnValue(5);

        component.selectedTypeOfQrCodesPerPage = QrCodesCountPerPage.CUSTOM_NUMBER;
        component.selectedNumberOfQrCodesPerPage = 5;
        component.selectedQrCodeSize = 5;
        component.selectedQrCodeGapSize = QrCodeGapSize.SMALL;
      });

      it('should save correct print settings when number of QR codes changes', () => {
        const event = { target: { value: 5 } };
        component.onNumberOfQrCodesChange(event);

        expect(localStorageServiceSpy.savePrintSettings).toHaveBeenCalledWith({
          size: component.selectedQrCodeSize,
          gap: component.selectedQrCodeGapSize,
          typeOfQrCodesPerPage: component.selectedTypeOfQrCodesPerPage,
          numberOfQrCodesPerPage: component.selectedNumberOfQrCodesPerPage,
        });
      });

      it('should not save print settings when value is negative', () => {
        const event = { target: { value: -1 } };
        component.onNumberOfQrCodesChange(event);

        expect(localStorageServiceSpy.savePrintSettings).not.toHaveBeenCalled();
      }); 

      it('should not save print settings when value is greater maxValue', () => {
        const event = { target: { value: 6 } };
        component.onNumberOfQrCodesChange(event);

        expect(localStorageServiceSpy.savePrintSettings).not.toHaveBeenCalled();
      }); 
    });
  });
});
