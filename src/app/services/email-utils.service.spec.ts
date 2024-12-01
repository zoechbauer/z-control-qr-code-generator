import { TestBed } from '@angular/core/testing';

import { EmailUtilsService } from './email-utils.service';

describe('EmailUtilsService', () => {
  let service: EmailUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
