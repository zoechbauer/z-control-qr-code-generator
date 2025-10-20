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

  describe('Calculate Number of QR Codes per A4 page', () => {
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
        const result = service.getCalculatedNumberOfQrCodesPerPage(size, gap);

        // Assert
        expect(result).toBe(
          expected,
          `Failed for size=${size}, gap=${gap}: expected ${expected}, got ${result}`
        );
      });
    });

    it('should return calculated number of QR codes per page as effective number', () => {
      spyOn(service, 'getCalculatedNumberOfQrCodesPerPage').and.returnValue(6);
      service['numberOfQrCodes'] = -1; // user setting

      const effective = service.getEffectiveNumberOfQrCodesPerPage();
      expect(effective).toBe(6);
    });

    it('should return manual entered number of QR codes per page as effective number', () => {
      spyOn(service, 'getCalculatedNumberOfQrCodesPerPage').and.returnValue(6);
      service['numberOfQrCodes'] = 2; // user setting

      const effective = service.getEffectiveNumberOfQrCodesPerPage();
      expect(effective).toBe(2);
    });
  });

  describe('getConvertedPrintSettings method', () => {
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

    it('should return string with empty size if size is undefined', () => {
      // Arrange
      (service as any).size = undefined;
      service['numberOfQrCodes'] = 1;
      // Act
      const str = service.getConvertedPrintSettings();
      // Assert
      expect(str).toEqual('[  / 1 ]');
    });
  });

  describe('getAvailableQrCodeSizesAndGapSizes method', () => {
    it('should return available QR code sizes and gap sizes', () => {
      const result = service.getAvailableQrCodeSizesAndGapSizes();
      expect(result.qrCodeSizes).toBeDefined();
      expect(result.qrCodeGapSizes).toBeDefined();
      expect(Array.isArray(result.qrCodeSizes)).toBeTrue();
      expect(Array.isArray(result.qrCodeGapSizes)).toBeTrue();
    });

    it('should load available QR code sizes', () => {
      // Arrange
      const testData = [
        { label: 'QrCodeSize.SMALL', value: QrCodeSize.SMALL },
        { label: 'QrCodeSize.MEDIUM', value: QrCodeSize.MEDIUM },
        { label: 'QrCodeSize.LARGE', value: QrCodeSize.LARGE },
        { label: 'QrCodeSize.XLARGE', value: QrCodeSize.XLARGE },
      ];
      translateServiceSpy.instant.and.callFake((key: string) => key);
      // Act
      service.loadAvailableQrCodeSizesAndGapSizes();
      // Assert
      expect(service['qrCodeSizes'].length).toBe(4);
      testData.forEach((data) => {
        expect(
          service['qrCodeSizes'].some((s) => s.label === data.label)
        ).toBeTrue();
        expect(
          service['qrCodeSizes'].some((s) => s.value === data.value)
        ).toBeTrue();
      });
    });

    it('should load available gap sizes', () => {
      // Arrange
      const testData = [
        { label: 'QrCodeGapSize.SMALL', value: QrCodeGapSize.SMALL },
        { label: 'QrCodeGapSize.LARGE', value: QrCodeGapSize.LARGE },
      ];
      translateServiceSpy.instant.and.callFake((key: string) => key);
      // Act
      service.loadAvailableQrCodeSizesAndGapSizes();
      // Assert
      expect(service['qrCodeGapSizes'].length).toBe(2);
      testData.forEach((data) => {
        expect(
          service['qrCodeGapSizes'].some((s) => s.label === data.label)
        ).toBeTrue();
        expect(
          service['qrCodeGapSizes'].some((s) => s.value === data.value)
        ).toBeTrue();
      });
    });
  });

  describe('printQRCode method', () => {
    let addImageSpy: jasmine.Spy;
    let outputSpy: jasmine.Spy;
    let fakeBlob: Blob;
    let validPngDataUrl: string;

    beforeEach(() => {
      validPngDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

      addImageSpy = jasmine.createSpy('addImage');
      fakeBlob = new Blob(['PDF'], { type: 'application/pdf' });
      outputSpy = jasmine.createSpy('output').and.callFake((type?: string) => {
        if (type === 'blob') return fakeBlob;
        return undefined;
      });

      spyOn<any>(service, 'createPdf').and.returnValue({
        addImage: addImageSpy,
        output: outputSpy,
      });

      // common service state
      spyOn<any>(service, 'scalingFactor').and.returnValue(1);
      service['size'] = QrCodeSize.MEDIUM;
      service['gap'] = QrCodeGapSize.SMALL;
      service['numberOfQrCodes'] = 2;
      service['cols'] = 2;
      service['rows'] = 1;
    });

    it('createPdf should return a jsPDF instance with required methods', () => {
      // temporarily let the spy call through to the real implementation for coverage
      (service as any).createPdf.and.callThrough();
      // Arrange
      const opts = { orientation: 'portrait', unit: 'mm', format: 'a4' };
      // Act
      const pdfInstance = (service as any).createPdf(opts);
      // Assert
      expect(pdfInstance).toBeDefined();
      expect(typeof pdfInstance.addImage).toBe('function');
      expect(typeof pdfInstance.output).toBe('function');
    });

    it('should generate a PDF with QR codes and return a Blob', () => {
      const result = service.printQRCode(validPngDataUrl);

      expect(addImageSpy).toHaveBeenCalledTimes(2);
      expect(outputSpy).toHaveBeenCalledWith('blob');
      expect(result).toEqual(fakeBlob);

      const firstArgs = addImageSpy.calls.argsFor(0);
      expect(firstArgs[0]).toBe(validPngDataUrl);
      expect(firstArgs[1]).toBe('PNG');
    });

    it('should calculate numberOfQrCodes if set to -1', () => {
      // Arrange
      service['numberOfQrCodes'] = -1;
      spyOn(service, 'getCalculatedNumberOfQrCodesPerPage').and.returnValue(3);
      service['cols'] = 3;
      service['rows'] = 1;
      // Act
      service.printQRCode(validPngDataUrl);
      // Assert
      expect(service.getCalculatedNumberOfQrCodesPerPage).toHaveBeenCalled();
      expect(service['numberOfQrCodes']).toBe(3);
      expect(addImageSpy.calls.count()).toBe(3);
    });

    it('should position QR codes correctly on the page', () => {
      // compute expected positions using same logic as the method
      // Arrange
      service['size'] = QrCodeSize.SMALL;
      service['gap'] = QrCodeGapSize.SMALL;
      service['numberOfQrCodes'] = 2;
      service['cols'] = 2;
      service['rows'] = 1;
      (service as any).scalingFactor = () => 1;

      const qrSize = service['size'] * 10 * 1;
      const gapMm = service['gap'] * 10;
      const totalGridWidth =
        service['cols'] * qrSize + (service['cols'] - 1) * gapMm;
      const totalGridHeight =
        service['rows'] * qrSize + (service['rows'] - 1) * gapMm;
      const marginX = (210 - totalGridWidth) / 2;
      const marginY = (297 - totalGridHeight) / 2;

      // Act
      service.printQRCode(validPngDataUrl);

      // Assert
      // first QR (i=0) should be at marginX, marginY
      const firstArgs = addImageSpy.calls.argsFor(0);
      expect(typeof firstArgs[2]).toBe('number'); // x
      expect(typeof firstArgs[3]).toBe('number'); // y
      expect(firstArgs[2]).toBeCloseTo(marginX, 6);
      expect(firstArgs[3]).toBeCloseTo(marginY, 6);

      // second QR (i=1) should be at marginX + (qrSize + gapMm), marginY
      const secondArgs = addImageSpy.calls.argsFor(1);
      expect(secondArgs[2]).toBeCloseTo(marginX + (qrSize + gapMm), 6);
      expect(secondArgs[3]).toBeCloseTo(marginY, 6);
    });
  });

  describe('interpolateQrSizeFor15cm', () => {
    it('returns the minimum point value for x <= min threshold', () => {
      // points[0].x === 1, points[0].y === 108.5
      const r1 = (service as any).interpolateQrSizeFor15cm(0.5);
      const r2 = (service as any).interpolateQrSizeFor15cm(1);
      expect(r1).toBeCloseTo(108.5, 6);
      expect(r2).toBeCloseTo(108.5, 6);
    });

    it('returns the last point value for x >= max threshold', () => {
      // last point x === 1000, y === 141.4
      const r = (service as any).interpolateQrSizeFor15cm(1200);
      expect(r).toBeCloseTo(141.4, 6);
    });

    it('linearly interpolates between two neighboring points', () => {
      // between x=30 (117.9) and x=50 (121.2) at x=40 expect 119.55
      const interpolated = (service as any).interpolateQrSizeFor15cm(40);
      expect(interpolated).toBeCloseTo(119.55, 5);
    });

    it('produces positive numeric results for a variety of inputs', () => {
      const samples = [10, 75, 300, 700, 900];
      samples.forEach((x) => {
        const r = (service as any).interpolateQrSizeFor15cm(x);
        expect(typeof r).toBe('number');
        expect(r).toBeGreaterThan(0);
      });
    });

    it('produces fallback value for invalid inputs', () => {
      const invalidNumbers = [
        Number.NaN,
        undefined,
        null,
        +Infinity,
        -Infinity,
      ];
      invalidNumbers.forEach((x) => {
        const r = (service as any).interpolateQrSizeFor15cm(x);
        expect(r).toBe(150);
      });
    });

    it('should get scaling factor for 15cm size', () => {
      const interpolateQrSizeFor15cmSpy = spyOn<any>(
        service,
        'interpolateQrSizeFor15cm'
      );
      const testData = [
        { qrDataInputLength: 140, realSize: 150 / 140 },
        { qrDataInputLength: 150, realSize: 150 / 150 },
        { qrDataInputLength: 160, realSize: 150 / 160 },
      ];
      testData.forEach((data) => {
        interpolateQrSizeFor15cmSpy.and.returnValue(data.qrDataInputLength);
        const factor = (service as any).scalingFactor();
        expect(factor).toBe(data.realSize);
      });
    });
  });

  describe('basic functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should unsubscribe on destroy', () => {
      const unsubSpy = spyOn(service['subs'], 'unsubscribe');
      service.ngOnDestroy();
      expect(unsubSpy).toHaveBeenCalled();
    });
  });
});
