import { TestBed } from '@angular/core/testing';
import { PrintUtilsService } from './print-utils.service';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { of } from 'rxjs';

describe('PrintUtilsService', () => {
  let service: PrintUtilsService;
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
    'instant',
    'get',
  ]);
  translateServiceSpy.onLangChange = of({});
  const localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['init']);
  localStorageServiceSpy.savedPrintSettings$ = of({
    size: 1,
    gap: 1,
    numberOfQrCodesPerPage: 1,
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
});