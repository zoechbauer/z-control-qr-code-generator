import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import * as environmentImport from 'src/environments/environment';
import { TabSettingsPage } from './tab-settings.page';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';

describe('TabSettingsPage', () => {
  let component: TabSettingsPage;
  let fixture: ComponentFixture<TabSettingsPage>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockModal: jasmine.SpyObj<HTMLIonModalElement>;

  beforeEach(async () => {
    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'dismiss',
      'create',
    ]);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
      'get',
    ]);
    const localStorageServiceSpy = jasmine.createSpyObj(
      'LocalStorageService',
      [],
      {
        selectedLanguage$: of('de'),
      }
    );
    mockModalController = modalControllerSpy;
    mockModal = jasmine.createSpyObj('HTMLIonModalElement', [
      'present',
      'classList',
    ]);
    Object.defineProperty(mockModal, 'classList', {
      value: jasmine.createSpyObj('classList', ['add', 'remove']),
      configurable: true,
    });
    mockModal.component = MarkdownViewerComponent;
    mockModalController.create.and.returnValue(Promise.resolve(mockModal));

    await TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        UtilsService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabSettingsPage);
    component = fixture.componentInstance;
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
      expect(component.versionInfo).toBe('App Version 1.19 (2025-08-30)');
    });
  });

  describe('openChangelog', () => {
    it('should create and present changelog modal', async () => {
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
