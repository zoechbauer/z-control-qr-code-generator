import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

import { UtilsService } from './utils.service';
import { WindowMockUtil } from 'src/test-utils/window-mock.util';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { Tab } from '../enums';

describe('UtilsService', () => {
  let service: UtilsService;
  let routerSpy: jasmine.SpyObj<Router>;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;

  beforeEach(() => {
    modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'dismiss',
      'create',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: Router, useValue: routerSpy },
      ],
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

  describe('scrollToElement smoothly', () => {
    let mockElement: jasmine.SpyObj<HTMLElement>;

    beforeEach(() => {
      mockElement = jasmine.createSpyObj('HTMLElement', ['scrollIntoView']);
    });

    it('should scroll to element smoothly when it exists', () => {
      spyOn(document, 'getElementById').and.returnValue(mockElement);

      service.scrollToElement('test-id');

      expect(document.getElementById).toHaveBeenCalledWith('test-id');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    it('should do nothing when element does not exist', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      spyOn(console, 'warn');

      service.scrollToElement('non-existent-id');

      expect(mockElement.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('scrollToElementUsingTabBar', () => {
    let mockElement: jasmine.SpyObj<HTMLElement>;

    beforeEach(() => {
      mockElement = jasmine.createSpyObj('HTMLElement', ['scrollTo']);
      (mockElement as any).getBoundingClientRect = () => ({ top: 4 });
    });

    it('should scroll to element when it exists', () => {
      spyOn(document, 'getElementById').and.returnValue(mockElement);

      service.scrollToElementUsingTabBar('test-id');

      expect(document.getElementById).toHaveBeenCalledWith('test-id');
      expect(mockElement.scrollTo as any).toHaveBeenCalledWith({
        top: -100, // 4 - 104 (tab bar height)
        behavior: 'smooth',
      });
    });

    it('should do nothing when element does not exist', () => {
      spyOn(document, 'getElementById').and.returnValue(null);

      service.scrollToElementUsingTabBar('non-existent-id');
      expect(mockElement.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('isPortrait getter', () => {
    it('should detect portrait orientation', () => {
      const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(true);
      
      const isPortrait = service.isPortrait;
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(orientation: portrait)');
      expect(isPortrait).toBe(true);
    });

    it('should detect landscape orientation', () => {
      const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(false);
      
      const isPortrait = service.isPortrait;
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(orientation: portrait)');
      expect(isPortrait).toBe(false);
    });
  });

  describe('isDarkMode getter', () => {
    it('should detect dark mode', () => {
      const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(true);
      
      const isDarkMode = service.isDarkMode;
      
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
      expect(isDarkMode).toBe(true);
    });

    it('should detect light mode', () => {
      const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(false);
      
      const isDarkMode = service.isDarkMode;
      
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
      expect(isDarkMode).toBe(false);
    });
  });

  describe('isSmallScreen getter', () => {
    it('should detect small screen', () => {
      // Arrange
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      WindowMockUtil.mockInnerWidth(768);
      // Act
      const isSmallScreen = service.isSmallScreen;
      // Assert
      expect(isSmallScreen).toBe(true);
      expect(service.isPortrait).toBe(true);
    });

    it('should detect large screen', () => {
      // Arrange
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      WindowMockUtil.mockInnerWidth(1024);
      // Act
      const isSmallScreen = service.isSmallScreen;
      // Assert
      expect(isSmallScreen).toBe(false);
      expect(service.isPortrait).toBe(true);
    });
  });

  describe('isSmallDevice getter', () => {
    it('should detect small device', () => {
      // Arrange
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      WindowMockUtil.mockInnerHeight(640);
      // Act
      const isSmallDevice = service.isSmallDevice;
      // Assert
      expect(isSmallDevice).toBe(true);
      expect(service.isPortrait).toBe(true);
    });

    it('should detect large device', () => {
      // Arrange
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      WindowMockUtil.mockInnerHeight(650);
      // Act
      const isSmallDevice = service.isSmallDevice;
      // Assert
      expect(isSmallDevice).toBe(false);
      expect(service.isPortrait).toBe(true);
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

  describe('check valid modal opening', () => {
    it('should add manual-instructions-modal class if HelpModalComponent is called', fakeAsync(() => {
      // Arrange: minimal modal-like object that satisfies the guard
      const modal: any = {
        classList: {
          remove: jasmine.createSpy('remove'),
          add: jasmine.createSpy('add'),
        },
        component: HelpModalComponent,
      };

      // Act
      service.setModalLandscapeClasses(modal);
      tick(20); // because of setTimeout(…, 10)

      // Assert
      expect(modal.classList.remove).toHaveBeenCalled();
      expect(modal.classList.add).toHaveBeenCalledWith('manual-instructions-modal');
    }));

    it('should add change-log-modal class if MarkdownViewerComponent is called', fakeAsync(() => {
      // Arrange: minimal modal-like object that satisfies the guard
      const modal: any = {
        classList: {
          remove: jasmine.createSpy('remove'),
          add: jasmine.createSpy('add'),
        },
        component: MarkdownViewerComponent,
      };

      // Act
      service.setModalLandscapeClasses(modal);
      tick(20); // because of setTimeout

      // Assert
      expect(modal.classList.remove).toHaveBeenCalled();
      expect(modal.classList.add).toHaveBeenCalledWith('change-log-modal');
    }));

    it('should log an error if neither HelpModalComponent nor MarkdownViewerComponent is called', fakeAsync(() => {
      // Arrange: minimal modal-like object that satisfies the guard
      const modal: any = {
        classList: {
          remove: jasmine.createSpy('remove'),
          add: jasmine.createSpy('add'),
        },
        component: undefined, // not HelpModalComponent nor MarkdownViewerComponent
      };
      spyOn(console, 'error');

      // Act
      service.setModalLandscapeClasses(modal);
      tick(20); // because of setTimeout

      // Assert
      expect(modal.classList.remove).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Unknown modal component for setting landscape class'
      );
    }));
  });

  describe('navigation methods', () => {
    it('should navigate to the correct tab', () => {
      const tabs: Tab[] = [Tab.Qr, Tab.Settings];

      tabs.forEach((tab) => {
        service.navigateToTab(tab);

        expect(routerSpy.navigate).toHaveBeenCalledWith([`/tabs/tab-${tab}`]);
      });
    });

    it('should navigate to the correct tab with params', () => {
      const tabs: Tab[] = [Tab.Qr, Tab.Settings];
      const params = { exampleParam: 'value' };

      tabs.forEach((tab) => {
        service.navigateToTabWithParams(tab, params);

        expect(routerSpy.navigate).toHaveBeenCalledWith([`/tabs/tab-${tab}`], {
          queryParams: params,
        });
      });
    });
  });

  describe('showOrHideIonToolbar', () => {
    it('should show the toolbar on small screens', () => {
      spyOn<any>(service, 'showIonTabBar');
      spyOn<any>(service, 'hideIonTabBar');
      spyOnProperty(service, 'isSmallScreen', 'get').and.returnValue(true);

      service.showOrHideIonTabBar();

      expect((service as any).showIonTabBar).toHaveBeenCalled();
      expect((service as any).hideIonTabBar).not.toHaveBeenCalled();
    });

    it('should hide the toolbar on large screens', () => {
      spyOn<any>(service, 'showIonTabBar');
      spyOn<any>(service, 'hideIonTabBar');
      spyOnProperty(service, 'isSmallScreen', 'get').and.returnValue(false);

      service.showOrHideIonTabBar();

      expect((service as any).hideIonTabBar).toHaveBeenCalled();
      expect((service as any).showIonTabBar).not.toHaveBeenCalled();
    });

    it('should remove the hide-ion-tab-bar class when showing', () => {
      // Arrange
      const mockElement = jasmine.createSpyObj('HTMLElement', ['']);
      mockElement.classList = jasmine.createSpyObj('classList', [
        'contains',
        'remove',
      ]);
      (mockElement.classList.contains as jasmine.Spy).and.returnValue(true);
      spyOn(document, 'querySelector').and.returnValue(mockElement);

      // Act
      (service as any).showIonTabBar();

      // Assert
      expect(document.querySelector).toHaveBeenCalledWith('ion-tab-bar');
      expect(mockElement.classList.contains).toHaveBeenCalledWith(
        'hide-ion-tab-bar'
      );
      expect(mockElement.classList.remove).toHaveBeenCalledWith(
        'hide-ion-tab-bar'
      );
    });

    it('should not remove the class if it is not present', () => {
      // Arrange
      const mockElement = jasmine.createSpyObj('HTMLElement', ['']);
      mockElement.classList = jasmine.createSpyObj('classList', [
        'contains',
        'remove',
      ]);
      (mockElement.classList.contains as jasmine.Spy).and.returnValue(false);
      spyOn(document, 'querySelector').and.returnValue(mockElement);

      // Act
      (service as any).showIonTabBar();

      // Assert
      expect(document.querySelector).toHaveBeenCalledWith('ion-tab-bar');
      expect(mockElement.classList.contains).toHaveBeenCalledWith(
        'hide-ion-tab-bar'
      );
      expect(mockElement.classList.remove).not.toHaveBeenCalled();
    });

    it('should do nothing if ion-tab-bar element is not found', () => {
      spyOn(document, 'querySelector').and.returnValue(null);

      (service as any).showIonTabBar();

      expect(document.querySelector).toHaveBeenCalledWith('ion-tab-bar');
    });
  });
});
