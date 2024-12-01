import { TestBed } from '@angular/core/testing';

import { QrUtilsService } from './qr-utils.service';

describe('QrUtilsService', () => {
  let service: QrUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QrUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
