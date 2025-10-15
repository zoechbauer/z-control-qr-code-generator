import { TestBed } from '@angular/core/testing';
import { PrintUtilsService } from './print-utils.service';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { of } from 'rxjs';
import { QrCodeGapSize, QrCodeSize } from '../enums';

describe('PrintUtilsService', () => {
  let service: PrintUtilsService;
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
    'instant',
    'get',
  ]);
  translateServiceSpy.onLangChange = of({});
  const localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', [
    'init',
  ]);
  localStorageServiceSpy.savedPrintSettings$ = of({
    size: QrCodeSize.MEDIUM,
    gap: QrCodeGapSize.SMALL,
    numberOfQrCodesPerPage: 4,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
      ],
    });
    service = TestBed.inject(PrintUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate number of QR codes per page', () => {
    spyOn<any>(service, 'scalingFactor').and.returnValue(1);
    // create test data
    const testData = [
      { size: QrCodeSize.SMALL, gap: QrCodeGapSize.SMALL },
      { size: QrCodeSize.SMALL, gap: QrCodeGapSize.LARGE },
      { size: QrCodeSize.MEDIUM, gap: QrCodeGapSize.SMALL },
      { size: QrCodeSize.MEDIUM, gap: QrCodeGapSize.LARGE },
      { size: QrCodeSize.LARGE, gap: QrCodeGapSize.SMALL },
      { size: QrCodeSize.LARGE, gap: QrCodeGapSize.LARGE },
      { size: QrCodeSize.XLARGE, gap: QrCodeGapSize.SMALL },
      { size: QrCodeSize.XLARGE, gap: QrCodeGapSize.LARGE },
    ];
    testData.forEach((data) => {
      // Arrange
      const size = data.size;
      const gap = data.gap;

      // Calculate expected value
      const qrSize = size * 10 * 1;
      const gapMm = gap * 10;
      const cols = Math.max(Math.floor((210 + gapMm) / (qrSize + gapMm)), 1);
      const rows = Math.max(Math.floor((297 + gapMm) / (qrSize + gapMm)), 1);
      const expected = cols * rows;

      // Act
      // @ts-ignore: access private method for test
      const result = service.getCalculatedNumberOfQrCodesPerPage(size, gap);

      // Assert
      expect(result).toBe(expected, `Failed for size=${size}, gap=${gap}: expected ${expected}, got ${result}`);
    });
  });

  it('should return converted print settings string for 1 qr code', () => {
    // Arrange
    translateServiceSpy.instant.and.callFake((key: string) => key);
    service.loadAvailableQrCodeSizesAndGapSizes();
    service.qrDataInputSub.next(QrCodeSize.MEDIUM);
    service['numberOfQrCodes'] = 1;
    // Act
    const str = service.getConvertedPrintSettings();
    // Assert
    expect(str).toEqual('[ QrCodeSize.MEDIUM / 1 ]');
  });

  it('should return converted print settings string for several qr codes', () => {
    // Arrange
    translateServiceSpy.instant.and.callFake((key: string) => key);
    service.loadAvailableQrCodeSizesAndGapSizes();
    service.qrDataInputSub.next(QrCodeSize.MEDIUM);
    service['numberOfQrCodes'] = 3;
    service['gap'] = QrCodeGapSize.LARGE;
    // Act
    const str = service.getConvertedPrintSettings();
    // Assert
    expect(str).toEqual('[ QrCodeSize.MEDIUM / QrCodeGapSize.LARGE / 3 ]');
  });

  it('should return effective number of QR codes per page', () => {
    // numberOfQrCodes is set via subscription in constructor
    const effective = service.getEffectiveNumberOfQrCodesPerPage();
    expect(typeof effective).toBe('number');
    expect(effective).toBeGreaterThan(0);
  });

  it('should return available QR code sizes and gap sizes', () => {
    const result = service.getAvailableQrCodeSizesAndGapSizes();
    expect(result.qrCodeSizes).toBeDefined();
    expect(result.qrCodeGapSizes).toBeDefined();
    expect(Array.isArray(result.qrCodeSizes)).toBeTrue();
    expect(Array.isArray(result.qrCodeGapSizes)).toBeTrue();
  });

  it('should unsubscribe on destroy', () => {
    const unsubSpy = spyOn(service['subs'], 'unsubscribe');
    service.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });

  it('should interpolate QR size for 15cm', () => {
    // @ts-ignore: access private method for test
    const result = service['interpolateQrSizeFor15cm'](10);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('should load available QR code sizes and gap sizes', () => {
    translateServiceSpy.instant.and.callFake((key: string) => key);
    const result = service.getAvailableQrCodeSizesAndGapSizes();
    expect(result.qrCodeSizes.length).toBeGreaterThan(0);
    expect(result.qrCodeGapSizes.length).toBeGreaterThan(0);
  });
});
