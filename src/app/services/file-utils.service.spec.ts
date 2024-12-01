import { TestBed } from '@angular/core/testing';

import { FileUtilsService } from './file-utils.service';

describe('FileUtilsService', () => {
  let service: FileUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
