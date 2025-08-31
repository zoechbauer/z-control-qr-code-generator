import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';

import { FooterComponent } from './footer.component';
import { MarkdownViewerComponent } from '../markdown-viewer/markdown-viewer.component';
import { TranslateService } from '@ngx-translate/core';
import * as environmentImport from 'src/environments/environment';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'dismiss',
      'create',
    ]);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
    ]);

    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    mockModalController = TestBed.inject(
      ModalController
    ) as jasmine.SpyObj<ModalController>;

    // Manually replace the modalController
    (component as any).modalController = modalControllerSpy;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('versionInfo getter', () => {
    const originalVersion = { ...environmentImport.environment.version };

    beforeEach(() => {
      // Mock environment.version
      environmentImport.environment.version = {
        major: 1,
        minor: 19,
        date: '2025-08-30',
      };
    });

    afterEach(() => {
      // Restore original version after test
      environmentImport.environment.version = { ...originalVersion };
    });

    it('should return formatted version', () => {
      expect(component.versionInfo).toBe('Version 1.19 (2025-08-30)');
    });
  });

  describe('openChangelog', () => {
    it('should create and present changelog modal', async () => {
      const mockModal = jasmine.createSpyObj('HTMLIonModalElement', [
        'present',
      ]);
      mockModalController.create.and.returnValue(Promise.resolve(mockModal));

      await component.openChangelog();

      expect(mockModalController.create).toHaveBeenCalledWith({
        component: MarkdownViewerComponent,
        componentProps: {
          fullChangeLogPath: 'assets/logs/CHANGELOG.md',
        },
      });
      expect(mockModal.present).toHaveBeenCalled();
    });
  });
});
