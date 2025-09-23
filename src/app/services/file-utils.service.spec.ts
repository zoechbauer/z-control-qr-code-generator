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
  });

  describe('fileName and path generation', () => {
    it('should generate a file name with timestamp', () => {
      // arrange
      service.setNowFormatted();

      // act
      const generatedNamePdf = service.fileNamePdf;
      const generatedNamePng = service.fileNamePng;

      // assert
      expect(generatedNamePdf).toMatch(/^qrcode_\d{8}_\d{6}\.pdf$/);
      expect(generatedNamePng).toMatch(/^qrcode_\d{8}_\d{6}\.png$/);
    });

    it('should generate a file name with a specific timestamp when date is mocked', () => {
      // arrange
      const fakeDate = new Date(2025, 6, 23, 15, 42, 11); // July 23, 2025, 15:42:11
      spyOn(Date, 'now').and.returnValue(fakeDate.getTime());

      service.setNowFormatted();

      // act
      const generatedNamePdf = service.fileNamePdf;
      const generatedNamePng = service.fileNamePng;

      // assert
      expect(generatedNamePdf).toBe('qrcode_20250723_154211.pdf');
      expect(generatedNamePng).toBe('qrcode_20250723_154211.png');
    });

    it('should generate the correct document paths', async () => {
      // arrange
      service.setNowFormatted();

      // act
      const docPathPdf = await service.getDocumentsPath(true);
      const docPathPng = await service.getDocumentsPath(false);

      // assert
      expect(docPathPdf).toMatch(/^\/documents\/qrcode_\d{8}_\d{6}\.pdf$/i);
      expect(docPathPng).toMatch(/^\/documents\/qrcode_\d{8}_\d{6}\.png$/i);
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
      // arrange
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

      // act
      await service.deleteAllQrCodeFilesAfterSpecifiedTime();

      // assert
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
      // arrange
      spyOn(console, 'error');
      spyOn(console, 'log');
      filesystemSpy.readdir.and.returnValue(
        Promise.resolve({ files: [{ name: oldFileNamePdf }] })
      );
      filesystemSpy.checkPermissions.and.returnValue(
        Promise.resolve({ publicStorage: 'denied' })
      );

      // act
      await service.deleteAllQrCodeFilesAfterSpecifiedTime();

      // assert
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
      // arrange
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      spyOn(console, 'error');
      spyOn(console, 'log');
      filesystemSpy.readdir.and.returnValue(
        Promise.resolve({ files: [{ name: oldFileNamePdf }] })
      );

      // act
      await service.deleteAllQrCodeFilesAfterSpecifiedTime();

      // assert
      expect(filesystemSpy.deleteFile).not.toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: oldFileNamePdf,
      });
      expect(alertServiceSpy.showStoragePermissionError).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });
  });
});
