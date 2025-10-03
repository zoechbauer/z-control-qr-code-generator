import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { EmailMaintenanceComponent } from './email-maintenance.component';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ToastService } from 'src/app/services/toast.service';
import { EmailAddressStatus } from 'src/app/enums';

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
  let mockLocalStorageService: jasmine.SpyObj<LocalStorageService>;

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
      localStorageServiceSpy.saveEmailAddress.calls.reset();
    });

    it('should display toast added message if email address is added successfully', async () => {
      // Arrange
      const emailAddress = 'test-toast@example.com';
      localStorageServiceSpy.saveEmailAddress.and.returnValue(
        Promise.resolve(EmailAddressStatus.Added)
      );
      // Act
      await component.addEmailAddress(emailAddress);
      // Assert
      expect(localStorageServiceSpy.saveEmailAddress).toHaveBeenCalledWith(
        emailAddress
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_EMAIL_ADDRESS_ADDED'
      );
    });

    it('should display toast already exists message if email address is already added', async () => {
      // Arrange
      const emailAddress = 'test-toast@example.com';
      localStorageServiceSpy.saveEmailAddress.and.returnValue(
        Promise.resolve(EmailAddressStatus.Duplicate)
      );
      // Act
      await component.addEmailAddress(emailAddress);
      // Assert
      expect(localStorageServiceSpy.saveEmailAddress).toHaveBeenCalledWith(
        emailAddress
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_EMAIL_ADDRESS_EXIST'
      );
    });
  });

  describe('delete email address', () => {
    beforeEach(() => {
      toastServiceSpy.showToast.calls.reset();
      localStorageServiceSpy.deleteEmailAddress?.calls.reset?.();
    });

    it('should display toast deleted message if email address is deleted successfully', async () => {
      // Arrange
      const index = 0;
      localStorageServiceSpy.deleteEmailAddress.and.returnValue(
        Promise.resolve(EmailAddressStatus.Removed)
      );
      // Act
      await component.deleteEmailAddress(index);
      // Assert
      expect(localStorageServiceSpy.deleteEmailAddress).toHaveBeenCalledWith(
        index
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'TOAST_EMAIL_ADDRESS_REMOVED'
      );
    });

    it('should log error and not show toast if email address is not found', async () => {
      // Arrange
      const index = 0;
      spyOn(console, 'error');
      localStorageServiceSpy.deleteEmailAddress.and.returnValue(
        Promise.resolve(EmailAddressStatus.NotFound)
      );
      // Act
      await component.deleteEmailAddress(index);
      // Assert
      expect(localStorageServiceSpy.deleteEmailAddress).toHaveBeenCalledWith(
        index
      );
      expect(toastServiceSpy.showToast).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error removing email address: Not found');
    });
  });
});
