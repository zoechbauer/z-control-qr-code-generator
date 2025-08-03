import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  IonicModule,
  ModalController,
  ToastController,
  AlertController,
  PopoverController,
  Platform,
} from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HomePage } from './home.page';
import { QrUtilsService } from '../services/qr-utils.service';
import { EmailUtilsService } from '../services/email-utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { ValidationService } from '../services/validation.service';
import { FileUtilsService } from '../services/file-utils.service';
import { AlertService } from '../services/alert.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    const storageSpy = jasmine.createSpyObj('Storage', [
      'get',
      'set',
      'remove',
      'create',
    ]);
    const qrUtilsSpy = jasmine.createSpyObj('QrUtilsService', [
      'generateQRCode',
      'clearCanvas',
      'clearQrFields',
    ]);
    const emailUtilsSpy = jasmine.createSpyObj('EmailUtilsService', [
      'sendEmail',
      'clearEmailSent',
    ]);
    const localStorageSpy = jasmine.createSpyObj(
      'LocalStorageService',
      ['setSelectedLanguage', 'init'],
      {
        selectedLanguage$: of('en'),
      }
    );
    const validationSpy = jasmine.createSpyObj('ValidationService', [
      'validateInput',
    ]);
    const fileUtilsSpy = jasmine.createSpyObj('FileUtilsService', [
      'saveFile',
      'clearNowFormatted',
    ]);
    const alertSpy = jasmine.createSpyObj('AlertService', ['showAlert']);
    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'create',
    ]);
    const toastControllerSpy = jasmine.createSpyObj('ToastController', [
      'create',
    ]);
    const alertControllerSpy = jasmine.createSpyObj('AlertController', [
      'create',
    ]);
    const popoverControllerSpy = jasmine.createSpyObj('PopoverController', [
      'create',
    ]);
    const platformSpy = jasmine.createSpyObj('Platform', ['is', 'ready']);
    const translateSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
      'get',
    ]);

    await TestBed.configureTestingModule({
      declarations: [HomePage],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      providers: [
        { provide: Storage, useValue: storageSpy },
        { provide: QrUtilsService, useValue: qrUtilsSpy },
        { provide: EmailUtilsService, useValue: emailUtilsSpy },
        { provide: LocalStorageService, useValue: localStorageSpy },
        { provide: ValidationService, useValue: validationSpy },
        { provide: FileUtilsService, useValue: fileUtilsSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: ToastController, useValue: toastControllerSpy },
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: PopoverController, useValue: popoverControllerSpy },
        { provide: Platform, useValue: platformSpy },
        { provide: TranslateService, useValue: translateSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;

    // Setup default mock returns
    storageSpy.get.and.returnValue(Promise.resolve(null));
    storageSpy.set.and.returnValue(Promise.resolve());
    storageSpy.create.and.returnValue(Promise.resolve({} as Storage));
    localStorageSpy.init.and.returnValue(Promise.resolve());
    qrUtilsSpy.clearQrFields.and.returnValue(undefined);
    emailUtilsSpy.clearEmailSent.and.returnValue(undefined);
    translateSpy.instant.and.returnValue('Translated Text');
    translateSpy.get.and.returnValue(of('Translated Text'));
    platformSpy.is.and.returnValue(false);
    platformSpy.ready.and.returnValue(Promise.resolve());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('basic functionality', () => {
    it('should initialize without errors', () => {
      expect(component).toBeDefined();
    });

    it('should handle component creation', () => {
      expect(component).toBeInstanceOf(HomePage);
    });
  });

  describe('template rendering', () => {
    it('should render basic structure', () => {
      expect(fixture.nativeElement).toBeTruthy();
    });
  });
});
