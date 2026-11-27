import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { EmailMaintenanceAccordionComponent } from './email-maintenance-accordion.component';
import { createTranslateServiceMock } from '@testing/translate-service.mock';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ToastService } from 'src/app/services/toast.service';

describe('EmailMaintenanceAccordionComponent', () => {
  let component: EmailMaintenanceAccordionComponent;
  let fixture: ComponentFixture<EmailMaintenanceAccordionComponent>;

  beforeEach(async () => {
    const localStorageServiceSpy = jasmine.createSpyObj(
      'LocalStorageService',
      ['init', 'getEmailAddresses', 'saveEmailAddress', 'deleteEmailAddress'],
      {
        selectedLanguage$: of('de'),
      },
    );
    const toastServiceSpy = jasmine.createSpyObj('ToastService', [
      'showToast',
      'showDisabledToast',
    ]);

    await TestBed.configureTestingModule({
      imports: [EmailMaintenanceAccordionComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailMaintenanceAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
