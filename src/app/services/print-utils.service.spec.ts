import { TestBed } from '@angular/core/testing';

import { PrintUtilsService } from './print-utils.service';

describe('PrintUtilsService', () => {
  let service: PrintUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrintUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
