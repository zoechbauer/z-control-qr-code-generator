import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { EmailMaintenanceComponent } from './email-maintenance.component';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ToastService } from 'src/app/services/toast.service';
import { EmailAddressStatus } from 'src/app/enums';
import { ValidationService } from 'src/app/services/validation.service';

describe('EmailMaintenanceComponent', () => {
  let component: EmailMaintenanceComponent;
  let fixture: ComponentFixture<EmailMaintenanceComponent>;
  const localStorageServiceSpy = jasmine.createSpyObj(
    'LocalStorageService',
    ['init', 'getEmailAddresses', 'saveEmailAddress', 'deleteEmailAddress'],
    {
      selectedLanguage$: of('de'),
    }
  );
  localStorageServiceSpy.getEmailAddresses.and.returnValue([
    'test@example.com',
    'test2@example.com',
  ]);
  const validationServiceSpy = jasmine.createSpyObj('ValidationService', [
    'isValidEmailAddress',
  ]);
  validationServiceSpy.isValidEmailAddress.and.callFake((email: string) => {
    return email.includes('@');
  });
  const toastServiceSpy = jasmine.createSpyObj('ToastService', [
    'showToast',
    'showDisabledToast',
  ]);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        EmailMaintenanceComponent,
      ],
      providers: [
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ValidationService, useValue: validationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailMaintenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('add email address', () => {
    beforeEach(() => {
      toastServiceSpy.showToast.calls.reset();
      toastServiceSpy.showDisabledToast.calls.reset();
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.resolve());
      localStorageServiceSpy.saveEmailAddress.calls.reset();
    });

    it('should display toast added message if email address is added successfully', async () => {
      const emailAddress = 'test-toast@example.com';
      localStorageServiceSpy.saveEmailAddress.and.returnValue(
        Promise.resolve(EmailAddressStatus.Added)
      );
      
      await component.addEmailAddress(emailAddress);
      
      expect(localStorageServiceSpy.saveEmailAddress).toHaveBeenCalledWith(
        emailAddress
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_EMAIL_ADDRESS_ADDED'
      );
    });

    it('should display toast already exists message if email address is already added', async () => {
      const emailAddress = 'test-toast@example.com';
      localStorageServiceSpy.saveEmailAddress.and.returnValue(
        Promise.resolve(EmailAddressStatus.Duplicate)
      );
      
      await component.addEmailAddress(emailAddress);
      
      expect(localStorageServiceSpy.saveEmailAddress).toHaveBeenCalledWith(
        emailAddress
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_EMAIL_ADDRESS_EXIST'
      );
    });

    it('should display toast invalid email message if no email address is provided', () => {
      component.newEmailAddressValue = '';
      component.handleAddEmailAddressButtonClick();
      expect(toastServiceSpy.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_EMAIL_INVALID_ADDRESS'
      );
    });

    it('should add email and clear input if email address is valid', async () => {
      component.newEmailAddressValue = 'test@example.com';
      component.handleAddEmailAddressButtonClick();
      expect(
        await localStorageServiceSpy.saveEmailAddress
      ).toHaveBeenCalledWith(component.newEmailAddressValue);
    });

    it('should log an error if showDisabledToast throws in handleAddEmailAddressButtonClick', fakeAsync(() => {
      // Arrange
      const error = new Error('Toast failed');
      toastServiceSpy.showDisabledToast.and.returnValue(Promise.reject(error));
      spyOn(console, 'error');
      component.newEmailAddressValue = ''; // invalid email triggers the toast

      // Act
      component.handleAddEmailAddressButtonClick();
      tick();

      // Assert
      expect(component.toastService.showDisabledToast).toHaveBeenCalledWith(
        'TOOLTIP_EMAIL_INVALID_ADDRESS'
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error presenting toast:',
        error
      );
    }));
  });

  describe('delete email address', () => {
    beforeEach(() => {
      toastServiceSpy.showToast.calls.reset();
      localStorageServiceSpy.deleteEmailAddress?.calls.reset?.();
    });

    it('should display toast deleted message if email address is deleted successfully', async () => {
      const index = 0;
      localStorageServiceSpy.deleteEmailAddress.and.returnValue(
        Promise.resolve(EmailAddressStatus.Removed)
      );
      
      await component.deleteEmailAddress(index);
      
      expect(localStorageServiceSpy.deleteEmailAddress).toHaveBeenCalledWith(
        index
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_EMAIL_ADDRESS_REMOVED'
      );
    });

    it('should log error and not show toast if email address is not found', async () => {
      const index = 0;
      spyOn(console, 'error');
      localStorageServiceSpy.deleteEmailAddress.and.returnValue(
        Promise.resolve(EmailAddressStatus.NotFound)
      );
      
      await component.deleteEmailAddress(index);
      
      expect(localStorageServiceSpy.deleteEmailAddress).toHaveBeenCalledWith(
        index
      );
      expect(toastServiceSpy.showToast).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error removing email address: Not found'
      );
    });
  });
});
