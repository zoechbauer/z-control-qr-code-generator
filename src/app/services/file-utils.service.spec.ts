import { TestBed } from '@angular/core/testing';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';
import { Directory } from '@capacitor/filesystem';

import { FILESYSTEM, FilesystemLike } from './filesystem.token';
import { FileUtilsService } from './file-utils.service';
import { AlertService } from './alert.service';

describe('FileUtilsService', () => {
  let service: FileUtilsService;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let filesystemSpy: jasmine.SpyObj<FilesystemLike>;

  beforeEach(() => {
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
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    filesystemSpy.getUri.and.callFake(({ path }) =>
      Promise.resolve({ uri: `/documents/${path}` })
    );

    TestBed.configureTestingModule({
      providers: [
        FileUtilsService,
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: TranslateService, useValue: {} },
        TranslateStore,
        { provide: FILESYSTEM, useValue: filesystemSpy },
      ],
    });
    service = TestBed.inject(FileUtilsService);
  });

  describe('basic functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should clear and set nowFormatted', () => {
      expect((service as any).nowFormatted).toBe('');

      service.setNowFormatted();
      expect((service as any).nowFormatted).toMatch(/\d{8}_\d{6}/);

      service.clearNowFormatted();
      expect((service as any).nowFormatted).toBe('');
    });
  });

  describe('fileName and path generation', () => {
    it('should generate a file name with timestamp', () => {
      // Arrange
      service.setNowFormatted();

      // Act
      const generatedNamePdf = service.fileNamePdf;
      const generatedNamePng = service.fileNamePng;

      // Assert
      expect(generatedNamePdf).toMatch(/^qrcode_\d{8}_\d{6}\.pdf$/);
      expect(generatedNamePng).toMatch(/^qrcode_\d{8}_\d{6}\.png$/);
    });

    it('should generate a file name with a specific timestamp when date is mocked', () => {
      // Arrange
      const fakeDate = new Date(2025, 6, 23, 15, 42, 11); // July 23, 2025, 15:42:11
      spyOn(Date, 'now').and.returnValue(fakeDate.getTime());
      service.setNowFormatted();

      // Act
      const generatedNamePdf = service.fileNamePdf;
      const generatedNamePng = service.fileNamePng;

      // Assert
      expect(generatedNamePdf).toBe('qrcode_20250723_154211.pdf');
      expect(generatedNamePng).toBe('qrcode_20250723_154211.png');
    });

    it('should generate the correct document paths', async () => {
      // Arrange
      service.setNowFormatted();

      // Act
      const docPathPdf = await service.getDocumentsPath(true);
      const docPathPng = await service.getDocumentsPath(false);

      // Assert
      expect(docPathPdf).toMatch(/^\/documents\/qrcode_\d{8}_\d{6}\.pdf$/i);
      expect(docPathPng).toMatch(/^\/documents\/qrcode_\d{8}_\d{6}\.png$/i);
    });

    it('should remove "file://" prefix from the documents path if present', async () => {
      // Arrange
      service.setNowFormatted();
      filesystemSpy.getUri.and.returnValue(
        Promise.resolve({ uri: 'file:///documents/qrcode_20250723_154211.pdf' })
      );

      // Act
      const path = await service.getDocumentsPath(true);

      // Assert
      expect(path).toBe('/documents/qrcode_20250723_154211.pdf');
    });
  });

  describe('saveFile', () => {
    const fileName = 'testfile.txt';
    const data = 'testdata';

    it('should use Filesystem.writeFile on native platforms', async () => {
      await service.saveFile(fileName, data);

      expect(filesystemSpy.writeFile).toHaveBeenCalledWith({
        path: fileName,
        data: data,
        directory: Directory.Documents,
      });
      expect(alertServiceSpy.showStoragePermissionError).not.toHaveBeenCalled();
    });

    it('should call alertService.showStoragePermissionError on writeFile error', async () => {
      filesystemSpy.writeFile.and.returnValue(Promise.reject('error'));
      spyOn(console, 'error');

      await service.saveFile(fileName, data);

      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error saving file:', 'error');
    });

    it('should create a download link and trigger click on desktop', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      const createObjectURLSpy = spyOn(
        window.URL,
        'createObjectURL'
      ).and.callFake(() => 'blob:url');
      const revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');
      spyOn(service as any, 'base64ToBlob').and.returnValue(
        new Blob(['testdata'], { type: 'text/plain' })
      );

      const clickSpy = jasmine.createSpy('click');
      const originalCreateElement = document.createElement;
      const createElementSpy = spyOn(document, 'createElement').and.callFake(
        (tag: string) => {
          const el = originalCreateElement.call(document, tag);
          if (tag === 'a') {
            el.click = clickSpy;
          }
          return el;
        }
      );

      // Act
      await service.saveFile(fileName, data);

      // Assert
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url');
    });
  });

  describe('deleteQRCodeFiles', () => {
    const oldFileNamePng = 'qrcode_20250922_090000.png'; // 3+ hours old
    const recentFileNamePng = 'qrcode_20250922_125000.png'; // less than 3 hours old
    const veryOldFileNamePng = 'qrcode_20250902_080000.png'; // some days hours old
    const oldFileNamePdf = 'qrcode_20250922_090000.pdf'; // 3+ hours old
    const recentFileNamePdf = 'qrcode_20250922_125000.pdf'; // less than 3 hours old
    const veryOldFileNamePdf = 'qrcode_20250902_080000.pdf'; // some days hours old

    it('should delete only QR code files older than 3 hours on native platforms', async () => {
      // Arrange
      spyOn(console, 'error');
      // Mock Date.now to 2025-09-22 14:00:00
      const now = new Date(2025, 8, 22, 14, 0, 0).getTime();
      spyOn(Date, 'now').and.returnValue(now);

      filesystemSpy.readdir.and.returnValue(
        Promise.resolve({
          files: [
            { name: oldFileNamePng },
            { name: oldFileNamePdf },
            { name: recentFileNamePng },
            { name: recentFileNamePdf },
            { name: veryOldFileNamePdf },
            { name: veryOldFileNamePng },
          ],
        })
      );

      // Act
      await service.deleteAllQrCodeFilesAfterSpecifiedTime();

      // Assert
      expect(filesystemSpy.deleteFile).toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: oldFileNamePng,
      });
      expect(filesystemSpy.deleteFile).toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: oldFileNamePdf,
      });
      expect(filesystemSpy.deleteFile).toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: veryOldFileNamePng,
      });
      expect(filesystemSpy.deleteFile).toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: veryOldFileNamePdf,
      });
      expect(filesystemSpy.deleteFile).not.toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: recentFileNamePng,
      });
      expect(filesystemSpy.deleteFile).not.toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: recentFileNamePdf,
      });
      expect(alertServiceSpy.showStoragePermissionError).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should not delete QR code files on native platforms if not permitted', async () => {
      // Arrange
      spyOn(console, 'error');
      spyOn(console, 'log');
      filesystemSpy.readdir.and.returnValue(
        Promise.resolve({ files: [{ name: oldFileNamePdf }] })
      );
      filesystemSpy.checkPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'denied' })
      );

      // Act
      await service.deleteAllQrCodeFilesAfterSpecifiedTime();

      // Assert
      expect(filesystemSpy.deleteFile).not.toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: oldFileNamePdf,
      });
      expect(alertServiceSpy.showStoragePermissionError).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledOnceWith(
        'Storage permission not granted, skipping file deletion'
      );
    });

    it('should not delete QR code files on web platforms', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(console, 'error');
      spyOn(console, 'log');
      filesystemSpy.readdir.and.returnValue(
        Promise.resolve({ files: [{ name: oldFileNamePdf }] })
      );

      // Act
      await service.deleteAllQrCodeFilesAfterSpecifiedTime();

      // Assert
      expect(filesystemSpy.deleteFile).not.toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: oldFileNamePdf,
      });
      expect(alertServiceSpy.showStoragePermissionError).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should log errors during file deletion', async () => {
      // Arrange
      spyOn(console, 'error');
      filesystemSpy.readdir.and.returnValue(
        Promise.resolve({ files: [{ name: oldFileNamePdf }] })
      );
      filesystemSpy.deleteFile.and.returnValue(
        Promise.reject(new Error('Deletion failed'))
      );
      // Act
      await service.deleteAllQrCodeFilesAfterSpecifiedTime();
      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting QR code files:',
        jasmine.any(Error)
      );
    });
  });

  describe('checkFilesystemPermission method', () => {
    it('should return true immediately on web platforms', async () => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      const result = await (service as any).checkFilesystemPermission();
      expect(result).toBeTrue();
    });

    it('should return true on native platforms if permission is granted', async () => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(true);
      filesystemSpy.checkPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'granted' })
      );

      const result = await (service as any).checkFilesystemPermission();
      expect(result).toBeTrue();
    });

    it('should return false on native platforms if permission is denied', async () => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(true);
      filesystemSpy.checkPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'denied' })
      );

      const result = await (service as any).checkFilesystemPermission();
      expect(result).toBeFalse();
    });
  });

  describe('checkAndRequestFilesystemPermission method', () => {
    it('should return true immediately on web platforms', async () => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      const result = await (
        service as any
      ).checkAndRequestFilesystemPermission();
      expect(result).toBeTrue();
    });

    it('should return true on native platforms if permission is granted', async () => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(true);
      filesystemSpy.checkPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'granted' })
      );

      const result = await (
        service as any
      ).checkAndRequestFilesystemPermission();
      expect(result).toBeTrue();
    });

    it('should return false and show storage permission error on native platforms if permission is denied', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(true);
      filesystemSpy.checkPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'denied' })
      );
      filesystemSpy.requestPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'denied' })
      );
      spyOn(console, 'error');
      alertServiceSpy.showStoragePermissionError.calls.reset();
      // Act
      const result = await (
        service as any
      ).checkAndRequestFilesystemPermission();
      // Assert
      expect(result).toBeFalse();
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Storage permission denied by user'
      );
    });

    it('should return true on native platforms if requestPermissions is granted', async () => {
      // Arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(true);
      filesystemSpy.checkPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'denied' })
      );
      filesystemSpy.requestPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'granted' })
      );
      spyOn(console, 'error');
      alertServiceSpy.showStoragePermissionError.calls.reset();
      // Act
      const result = await (
        service as any
      ).checkAndRequestFilesystemPermission();
      // Assert
      expect(result).toBeTrue();
      expect(alertServiceSpy.showStoragePermissionError).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('downloadQRCode method', () => {
    let qrCodeUrl: string;

    beforeEach(() => {
      qrCodeUrl = '/documents/qrcode_20250723_154211.pdf';
      alertServiceSpy.showStoragePermissionError.calls.reset();
      alertServiceSpy.showErrorAlert.calls.reset();
      spyOn(console, 'error').and.callThrough();
      (console.error as jasmine.Spy).calls.reset();
    });

    it('should download the QR code file', async () => {
      // Arrange
      filesystemSpy.writeFile.and.returnValue(Promise.resolve());
      spyOn(service, 'blobToBase64').and.returnValue(
        Promise.resolve('data:application/octet-stream;base64,Tk9UIEZPVU5E')
      );
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          blob: () =>
            Promise.resolve(
              new Blob(['NOT FOUND'], { type: 'application/octet-stream' })
            ),
        }) as any
      );

      // Act
      await service.downloadQRCode(qrCodeUrl);

      // Assert
      expect(filesystemSpy.writeFile).toHaveBeenCalledWith({
        path: service.fileNamePng,
        data: 'data:application/octet-stream;base64,Tk9UIEZPVU5E',
        directory: Directory.Documents,
      });
    });

    it('should return false, log error and show alert if qrCodeDownloadLink is empty', async () => {
      // Arrange
      filesystemSpy.writeFile.and.returnValue(Promise.resolve());
      spyOn(service, 'blobToBase64').and.returnValue(
        Promise.resolve('data:application/octet-stream;base64,Tk9UIEZPVU5E')
      );
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          blob: () =>
            Promise.resolve(
              new Blob(['NOT FOUND'], { type: 'application/octet-stream' })
            ),
        }) as any
      );
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission'
      ).and.returnValue(Promise.resolve(true));
      qrCodeUrl = '   ';

      // Act
      const result = await service.downloadQRCode(qrCodeUrl);

      // Assert
      expect(filesystemSpy.writeFile).not.toHaveBeenCalled();
      expect(result).toBeFalse();
      expect(console.error).toHaveBeenCalledWith(
        'QR Code URL is not available'
      );
      expect(alertServiceSpy.showErrorAlert).toHaveBeenCalledWith(
        'ERROR_MESSAGE_MISSING_QR_URL'
      );
    });

    it('should return false on missing permissions', async () => {
      // Arrange
      filesystemSpy.writeFile.and.returnValue(Promise.resolve());
      spyOn(service, 'blobToBase64').and.returnValue(
        Promise.resolve('data:application/octet-stream;base64,Tk9UIEZPVU5E')
      );
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          blob: () =>
            Promise.resolve(
              new Blob(['NOT FOUND'], { type: 'application/octet-stream' })
            ),
        }) as any
      );
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission'
      ).and.returnValue(Promise.resolve(false));

      // Act
      const result = await service.downloadQRCode(qrCodeUrl);

      // Assert
      expect(filesystemSpy.writeFile).not.toHaveBeenCalled();
      expect(result).toBeFalse();
    });

    it('should handle errors in saveFile when downloading the QR code file', async () => {
      // Arrange
      filesystemSpy.writeFile.and.returnValue(
        Promise.reject(new Error('Download failed'))
      );
      spyOn(service, 'blobToBase64').and.returnValue(
        Promise.resolve('data:application/octet-stream;base64,Tk9UIEZPVU5E')
      );
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          blob: () =>
            Promise.resolve(
              new Blob(['NOT FOUND'], { type: 'application/octet-stream' })
            ),
        }) as any
      );

      // Act
      await service.downloadQRCode(qrCodeUrl);

      // Assert
      expect(filesystemSpy.writeFile).toHaveBeenCalledWith({
        path: service.fileNamePng,
        data: 'data:application/octet-stream;base64,Tk9UIEZPVU5E',
        directory: Directory.Documents,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error saving file:',
        jasmine.any(Error)
      );
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
    });

    it('should handle errors in fetch when downloading the QR code file', async () => {
      // Arrange
      filesystemSpy.writeFile.and.returnValue(
        Promise.reject(new Error('Download failed'))
      );
      spyOn(service, 'blobToBase64').and.returnValue(
        Promise.reject('error in blobToBase64')
      );
      spyOn(window, 'fetch').and.returnValue(Promise.reject('Fetch failed'));

      // Act
      await service.downloadQRCode(qrCodeUrl);

      // Assert
      expect(filesystemSpy.writeFile).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error saving file in downloadQRCode:',
        'Fetch failed'
      );
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
    });

    it('should handle errors in blobToBase64 when downloading the QR code file', async () => {
      // Arrange
      filesystemSpy.writeFile.and.returnValue(
        Promise.reject(new Error('Download failed'))
      );
      spyOn(service, 'blobToBase64').and.returnValue(
        Promise.reject('Error in blobToBase64')
      );
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          blob: () =>
            Promise.resolve(
              new Blob(['NOT FOUND'], { type: 'application/octet-stream' })
            ),
        }) as any
      );

      // Act
      await service.downloadQRCode(qrCodeUrl);

      // Assert
      expect(filesystemSpy.writeFile).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error saving file in downloadQRCode:',
        'Error in blobToBase64'
      );
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
    });
  });

  describe('base64 and blob conversion', () => {
    it('blobToBase64 should convert a Blob to a data URL (base64)', async () => {
      // Arrange
      const text = 'hello world';
      const blob = new Blob([text], { type: 'text/plain' });
      // Act
      const dataUrl = await service.blobToBase64(blob);
      // Assert
      expect(typeof dataUrl).toBe('string');
      expect(dataUrl.startsWith('data:text/plain;base64,')).toBeTrue();

      const base64Part = dataUrl.split(',')[1];
      const decoded = atob(base64Part);
      expect(decoded).toBe(text);
    });

    it('base64ToBlob should convert a data URL to a Blob with correct content and type', async () => {
      // Arrange
      const text = 'hello base64';
      const base64 = btoa(text);
      const dataUrl = `data:text/plain;base64,${base64}`;
      // Act
      const blob = (service as any).base64ToBlob(dataUrl) as Blob;
      // Assert
      expect(blob).toBeDefined();
      expect(blob instanceof Blob).toBeTrue();
      expect(blob.type).toBe('application/octet-stream');

      // read blob content
      const blobText = await blob.text();
      expect(blobText).toBe(text);
    });
  });
});
