import { TestBed } from '@angular/core/testing';
import { FILESYSTEM } from './filesystem.token';
import { Filesystem as CapacitorFilesystem } from '@capacitor/filesystem';

describe('FILESYSTEM injection token', () => {
  it('should be injectable and provide the filesystem object with expected methods', () => {
    const fs = TestBed.inject(FILESYSTEM) as any;
    expect(fs).toBeDefined();

    const expectedMethods = [
      'writeFile',
      'getUri',
      'readdir',
      'deleteFile',
      'checkPermissions',
      'requestPermissions',
    ];

    expectedMethods.forEach((m) => {
      expect(typeof fs[m]).toBe('function');
    });
  });

  it('should use the Capacitor Filesystem instance by default', () => {
    const fs = TestBed.inject(FILESYSTEM) as any;
    expect(fs).toBe(CapacitorFilesystem);
  });
});