import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';

import { UtilsService } from './utils.service';
import { WindowMockUtil } from 'src/test-utils/window-mock.util';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';

describe('UtilsService', () => {
  let service: UtilsService;
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'dismiss',
    'create',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ModalController, useValue: modalControllerSpy }],
    });
    service = TestBed.inject(UtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('scrollTo', () => {
    let mockEvent: jasmine.SpyObj<Event>;
    let mockElement: jasmine.SpyObj<HTMLElement>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);
      mockElement = jasmine.createSpyObj('HTMLElement', ['scrollIntoView']);
    });

    it('should scroll to element when it exists', () => {
      spyOn(document, 'getElementById').and.returnValue(mockElement);

      service.scrollTo('test-id', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(document.getElementById).toHaveBeenCalledWith('test-id');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    });

    it('should log warning when element does not exist', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      spyOn(console, 'warn');

      service.scrollTo('non-existent-id', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        "Element with id 'non-existent-id' not found"
      );
    });
  });

  describe('isPortrait getter', () => {
    it('should detect portrait orientation', () => {
      // Arrange
      const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(true);
      // Act
      const isPortrait = service.isPortrait;
      // Assert
      expect(mockMatchMedia).toHaveBeenCalledWith('(orientation: portrait)');
      expect(isPortrait).toBe(true);
    });

    it('should detect landscape orientation', () => {
      // Arrange
      const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(false);
      // Act
      const isPortrait = service.isPortrait;
      // Assert
      expect(mockMatchMedia).toHaveBeenCalledWith('(orientation: portrait)');
      expect(isPortrait).toBe(false);
    });
  });

  describe('openChangelog method', () => {
    let modal: any;

    beforeEach(() => {
      modal = jasmine.createSpyObj('HTMLIonModalElement', [
        'present',
        'classList',
      ]);
      modal.classList = jasmine.createSpyObj('classList', ['add', 'remove']);
      modal.component = MarkdownViewerComponent;
      modalControllerSpy.create.and.returnValue(Promise.resolve(modal));
    });

    it('should create and present the changelog modal', async () => {
      await service.openChangelog();

      expect(modalControllerSpy.create).toHaveBeenCalledWith({
        component: MarkdownViewerComponent,
        componentProps: {
          fullChangeLogPath: 'assets/logs/CHANGELOG.md',
        },
      });
      expect(modal.present).toHaveBeenCalled();
    });

    it('should add desktop class when on desktop', fakeAsync(async () => {
      spyOnProperty(service, 'isDesktop').and.returnValue(true);
      spyOnProperty(service, 'isPortrait').and.returnValue(true);

      await service.openChangelog();
      tick(20);

      expect(modal.classList.add).toHaveBeenCalledWith('change-log-modal');
      expect(modal.classList.add).toHaveBeenCalledWith('desktop');
    }));

    it('should not add desktop class when on mobile', fakeAsync(async () => {
      spyOnProperty(service, 'isDesktop').and.returnValue(false);
      spyOnProperty(service, 'isPortrait').and.returnValue(false);

      await service.openChangelog();
      tick(20);

      expect(modal.classList.add).toHaveBeenCalledWith('change-log-modal');
      expect(modal.classList.add).not.toHaveBeenCalledWith('desktop');
      expect(modal.classList.add).toHaveBeenCalledWith('landscape');
    }));
  });

  describe('openHelpModal method', () => {
    let modal: any;

    beforeEach(() => {
      modal = jasmine.createSpyObj('HTMLIonModalElement', [
        'present',
        'classList',
      ]);
      modal.classList = jasmine.createSpyObj('classList', ['add', 'remove']);
      modal.component = HelpModalComponent;
      modalControllerSpy.create.and.returnValue(Promise.resolve(modal));
    });

    it('should add desktop class when on desktop', fakeAsync(async () => {
      spyOnProperty(service, 'isDesktop').and.returnValue(true);
      spyOnProperty(service, 'isPortrait').and.returnValue(true);

      await service.openHelpModal();
      tick(20);

      expect(modal.classList.add).toHaveBeenCalledWith(
        'manual-instructions-modal'
      );
      expect(modal.classList.add).toHaveBeenCalledWith('desktop');
    }));

    it('should not add desktop class when on mobile', fakeAsync(async () => {
      spyOnProperty(service, 'isDesktop').and.returnValue(false);
      spyOnProperty(service, 'isPortrait').and.returnValue(false);

      await service.openHelpModal();
      tick(20);

      expect(modal.classList.add).toHaveBeenCalledWith(
        'manual-instructions-modal'
      );
      expect(modal.classList.add).not.toHaveBeenCalledWith('desktop');
      expect(modal.classList.add).toHaveBeenCalledWith('landscape');
    }));
  });
});
