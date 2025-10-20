import { TestBed } from '@angular/core/testing';
import { QrUtilsService } from './qr-utils.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FileUtilsService } from './file-utils.service';
import { AlertService } from './alert.service';
import { PrintUtilsService } from './print-utils.service';
import { SecurityContext } from '@angular/core';

describe('QrUtilsService', () => {
  let service: QrUtilsService;
  let sanitizerSpy: jasmine.SpyObj<DomSanitizer>;
  let fileUtilsServiceSpy: jasmine.SpyObj<FileUtilsService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let printUtilsServiceSpy: jasmine.SpyObj<PrintUtilsService>;

  beforeEach(() => {
    sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['sanitize']);
    fileUtilsServiceSpy = jasmine.createSpyObj('FileUtilsService', [
      'blobToBase64',
      'saveFile'
    ], { fileNamePdf: 'test.pdf' });
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['showStoragePermissionError']);
    printUtilsServiceSpy = jasmine.createSpyObj('PrintUtilsService', ['printQRCode']);

    TestBed.configureTestingModule({
      providers: [
        { provide: DomSanitizer, useValue: sanitizerSpy },
        { provide: FileUtilsService, useValue: fileUtilsServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: PrintUtilsService, useValue: printUtilsServiceSpy },
      ],
    });

    service = TestBed.inject(QrUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateQRCode', () => {
    it('should set myAngularxQrCode and isQrCodeGenerated to true for valid data', () => {
      service.generateQRCode('test');
      expect(service.myAngularxQrCode).toBe('test');
      expect(service.isQrCodeGenerated).toBeTrue();
    });

    it('should set myAngularxQrCode to empty string if data is null or undefined', () => {
      service.generateQRCode(null);
      expect(service.myAngularxQrCode).toBe('');
      expect(service.isQrCodeGenerated).toBeTrue();

      service.generateQRCode(undefined);
      expect(service.myAngularxQrCode).toBe('');
      expect(service.isQrCodeGenerated).toBeTrue();
    });

    it('should handle errors and reset fields', () => {
      // Arrange
      spyOn(console, 'error');

      // save original descriptor/value so we can restore later
      const originalDesc = Object.getOwnPropertyDescriptor(service, 'myAngularxQrCode');
      const originalValue = service.myAngularxQrCode;

      // create a setter that throws on first assignment, then accepts subsequent assignments
      let thrown = false;
      let internal = originalValue;
      Object.defineProperty(service, 'myAngularxQrCode', {
        configurable: true,
        get: () => internal,
        set: (v: any) => {
          if (!thrown) {
            thrown = true;
            throw new Error('forced test error');
          }
          internal = v;
        },
      });

      // Act
      service.generateQRCode('force-error');

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(service.myAngularxQrCode).toBe('');
      expect(service.isQrCodeGenerated).toBeFalse();

      // restore original property
      if (originalDesc) {
        Object.defineProperty(service, 'myAngularxQrCode', originalDesc);
      } else {
        delete (service as any).myAngularxQrCode;
        service.myAngularxQrCode = originalValue;
      }
    });
  });

  describe('setDownloadLink', () => {
    it('should sanitize and set qrCodeDownloadLink', () => {
      sanitizerSpy.sanitize.and.returnValue('safe-url');
      service.setDownloadLink('test-url' as any);
      expect(sanitizerSpy.sanitize).toHaveBeenCalledWith(SecurityContext.URL, 'test-url');
      expect(service.qrCodeDownloadLink).toBe('safe-url');
    });

    it('should set qrCodeDownloadLink to empty string if sanitize returns null', () => {
      sanitizerSpy.sanitize.and.returnValue(null);
      service.setDownloadLink('test-url' as any);
      expect(service.qrCodeDownloadLink).toBe('');
    });
  });

  describe('clearQrFields', () => {
    it('should reset all QR fields and remove extra-margin-bottom class if present', () => {
      // Arrange
      service.isQrCodeGenerated = true;
      service.qrCodeDownloadLink = 'link';
      service.myAngularxQrCode = 'qr';
      // Mock DOM
      const element = document.createElement('div');
      element.classList.add('no-generation-buttons', 'extra-margin-bottom');
      document.body.appendChild(element);
      // Act
      service.clearQrFields();
      // Assert
      expect(service.isQrCodeGenerated).toBeFalse();
      expect(service.qrCodeDownloadLink).toBe('');
      expect(service.myAngularxQrCode).toBe('');
      expect(element.classList.contains('extra-margin-bottom')).toBeFalse();
      document.body.removeChild(element);
    });

    it('should not throw if element or class does not exist', () => {
      expect(() => service.clearQrFields()).not.toThrow();
    });
  });

  describe('printQRCode', () => {
    let originalGetElementById: typeof document.getElementById;

    beforeEach(() => {
      originalGetElementById = document.getElementById;
    });

    afterEach(() => {
      document.getElementById = originalGetElementById;
    });

    it('should print QR code and save file', async () => {
      // Arrange
      const canvas = document.createElement('canvas');
      spyOn(canvas, 'toDataURL').and.returnValue('data:image/png;base64,abc');
      const div = document.createElement('div');
      div.id = 'qrcode';
      div.appendChild(canvas);
      document.body.appendChild(div);

      printUtilsServiceSpy.printQRCode.and.returnValue(new Blob(['pdf']));
      fileUtilsServiceSpy.blobToBase64.and.returnValue(Promise.resolve('base64data'));
      fileUtilsServiceSpy.saveFile.and.returnValue(Promise.resolve());

      // Act
      await service.printQRCode();

      // Assert
      expect(printUtilsServiceSpy.printQRCode).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.blobToBase64).toHaveBeenCalled();
      expect(fileUtilsServiceSpy.saveFile).toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should call alertService.showStoragePermissionError on saveFile error', async () => {
      // Arrange
      const canvas = document.createElement('canvas');
      spyOn(canvas, 'toDataURL').and.returnValue('data:image/png;base64,abc');
      const div = document.createElement('div');
      div.id = 'qrcode';
      div.appendChild(canvas);
      document.body.appendChild(div);

      printUtilsServiceSpy.printQRCode.and.returnValue(new Blob(['pdf']));
      fileUtilsServiceSpy.blobToBase64.and.returnValue(Promise.resolve('base64data'));
      fileUtilsServiceSpy.saveFile.and.returnValue(Promise.reject('error'));

      // Act
      await service.printQRCode();

      // Assert
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should throw error if canvas is not found', async () => {
      // Arrange
      const div = document.createElement('div');
      div.id = 'qrcode';
      document.body.appendChild(div);
      
      // Act & Assert
      await expectAsync(service.printQRCode()).toBeRejectedWithError('Canvas not found');

      document.body.removeChild(div);
    });

    it('should throw error if qrcode element is not found', async () => {
      await expectAsync(service.printQRCode()).toBeRejectedWithError('Print content not found');
    });
  });
});