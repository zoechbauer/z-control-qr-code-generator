import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

import { UtilsService } from './utils.service';
import { WindowMockUtil } from '@testing/window-mock.util';
import { GetHelpComponent } from '../ui/components/get-help/get-help.component';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { Tab } from '../shared/enums';
import { Capacitor } from '@capacitor/core';

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
        "Element with id 'non-existent-id' not found",
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
    let originalScreenDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalScreenDescriptor = Object.getOwnPropertyDescriptor(
        window,
        'screen',
      );
    });

    afterEach(() => {
      if (originalScreenDescriptor) {
        Object.defineProperty(window, 'screen', originalScreenDescriptor);
      }
    });

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

    it('should keep the last portrait result while the keyboard is open', () => {
      WindowMockUtil.mockInnerHeight(800);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 800 },
      });
      WindowMockUtil.setupMatchMediaSpy(true);
      expect(service.isPortrait).toBe(true);

      WindowMockUtil.setupMatchMediaSpy(false);
      service['keyboardVisible'] = true;

      expect(service.isPortrait).toBe(true);
    });

    it('should update portrait result after the keyboard closes', () => {
      WindowMockUtil.mockInnerHeight(800);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 800 },
      });
      WindowMockUtil.setupMatchMediaSpy(true);
      expect(service.isPortrait).toBe(true);

      service['keyboardVisible'] = true;
      WindowMockUtil.setupMatchMediaSpy(false);
      expect(service.isPortrait).toBe(true);

      service['keyboardVisible'] = false;
      expect(service.isPortrait).toBe(false);
    });

    it('should keep native portrait orientation stable when keyboard shrinks the viewport', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      Object.defineProperty(window, 'screen', {
        configurable: true,
        value: {
          width: 720,
          height: 616,
          orientation: { angle: 0 },
        },
      });
      WindowMockUtil.setupMatchMediaSpy(false);

      expect(service.isPortrait).toBe(true);

      service['keyboardVisible'] = true;
      WindowMockUtil.mockInnerHeight(307);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 307 },
      });

      expect(service.isPortrait).toBe(true);
    });

    it('should keep native portrait orientation stable with globalThis.screen values', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      Object.defineProperty(globalThis, 'screen', {
        configurable: true,
        value: {
          width: 720,
          height: 816,
          orientation: { angle: undefined },
        },
      });
      WindowMockUtil.setupMatchMediaSpy(false);

      expect(service.isPortrait).toBe(true);

      service['keyboardVisible'] = true;
      WindowMockUtil.mockInnerHeight(307);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 307 },
      });

      expect(service.isPortrait).toBe(true);
    });

    it(
      'should use matchMedia as fallback to determine portrait orientation on native ' +
        'if screen orientation is unavailable',
      () => {
        spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
        Object.defineProperty(globalThis, 'screen', {
          configurable: true,
          value: {
            width: undefined,
            height: undefined,
            orientation: { angle: undefined },
          },
        });
        const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(true);

        expect(service.isPortrait).toBe(true);
        expect(mockMatchMedia).toHaveBeenCalledWith('(orientation: portrait)');
      },
    );
  });

  describe('isDarkMode getter', () => {
    it('should detect dark mode', () => {
      const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(true);

      const isDarkMode = service.isDarkMode;

      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)',
      );
      expect(isDarkMode).toBe(true);
    });

    it('should detect light mode', () => {
      const mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(false);

      const isDarkMode = service.isDarkMode;

      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)',
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
    let originalVisualViewportDescriptor: PropertyDescriptor | undefined;
    let originalScreenDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalVisualViewportDescriptor = Object.getOwnPropertyDescriptor(
        window,
        'visualViewport',
      );
      originalScreenDescriptor = Object.getOwnPropertyDescriptor(
        window,
        'screen',
      );
    });

    afterEach(() => {
      if (originalVisualViewportDescriptor) {
        Object.defineProperty(
          window,
          'visualViewport',
          originalVisualViewportDescriptor,
        );
      } else {
        Reflect.deleteProperty(window, 'visualViewport');
      }
      if (originalScreenDescriptor) {
        Object.defineProperty(window, 'screen', originalScreenDescriptor);
      }
    });

    it('should detect small device', () => {
      // Arrange
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      WindowMockUtil.mockInnerHeight(640);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 640 },
      });
      // Act
      const isSmallDevice = service.isSmallDevice;
      // Assert
      expect(isSmallDevice).withContext('isSmallDevice').toBe(true);
      expect(service.isPortrait).withContext('isPortrait').toBe(true);
    });

    it('should detect large device', () => {
      // Arrange
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      WindowMockUtil.mockInnerHeight(650);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 650 },
      });
      // Act
      const isSmallDevice = service.isSmallDevice;
      // Assert
      expect(isSmallDevice).withContext('isSmallDevice').toBe(false);
      expect(service.isPortrait).withContext('isPortrait').toBe(true);
    });

    it('should keep the device-size result when the keyboard shrinks the visual viewport', () => {
      // Arrange
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      WindowMockUtil.mockInnerHeight(853);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 853 },
      });

      expect(service.isSmallDevice)
        .withContext('isSmallDevice with height 853')
        .toBe(false);

      // Act: the keyboard reduces only the visual viewport
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 482 },
      });

      // Assert
      expect(service.isSmallDevice)
        .withContext('isSmallDevice with visual viewport reduced')
        .toBe(false);
    });

    it('should cache a small device result while the keyboard is open', () => {
      // Arrange
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      WindowMockUtil.mockInnerHeight(640);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 640 },
      });

      expect(service.isSmallDevice)
        .withContext('isSmallDevice with height 640')
        .toBe(true);

      // Act: the keyboard reduces only the visual viewport
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 482 },
      });

      // Assert
      expect(service.isSmallDevice)
        .withContext('isSmallDevice with visual viewport reduced')
        .toBe(true);
    });

    it('should initialize device viewport height correctly if it is not already set and keyboard is opened', () => {
      // Arrange
      service['deviceViewportHeight'] = 0;
      service['keyboardVisible'] = true;

      WindowMockUtil.mockInnerHeight(700);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 700 },
      });

      // Act
      const isSmallDevice = service.isSmallDevice;

      // Assert
      expect(isSmallDevice)
        .withContext('isSmallDevice with height 700')
        .toBe(false);
    });

    it('should keep native small-device classification when keyboard shrinks the viewport', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      spyOnProperty(service, 'isPortrait').and.returnValue(true);
      Object.defineProperty(window, 'screen', {
        configurable: true,
        value: {
          width: 720,
          height: 616,
          orientation: { angle: 0 },
        },
      });
      WindowMockUtil.mockInnerHeight(616);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 616 },
      });

      expect(service.isSmallDevice).toBe(true);

      service['keyboardVisible'] = true;
      WindowMockUtil.mockInnerHeight(307);
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: { height: 307 },
      });

      expect(service.isSmallDevice).toBe(true);
    });
  });

  describe('isKeyboardVisible getter', () => {
    it('should return true when keyboard is visible', () => {
      service['keyboardVisible'] = true;
      expect(service.isKeyboardVisible).toBe(true);
    });

    it('should return false when keyboard is not visible', () => {
      service['keyboardVisible'] = false;
      expect(service.isKeyboardVisible).toBe(false);
    });
  });

  describe('isNative & isDesktop getters', () => {
    it('should detect native platform', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      expect(service.isNative).toBe(true);
      expect(service.isDesktop).toBe(false);
    });

    it('should detect desktop platform', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      expect(service.isDesktop).toBe(true);
      expect(service.isNative).toBe(false);
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

      expect(modal.classList.add)
        .withContext('change-log-modal class added')
        .toHaveBeenCalledWith('change-log-modal');
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
      modal.component = GetHelpComponent;
      modalControllerSpy.create.and.returnValue(Promise.resolve(modal));
    });

    it('should add desktop class when on desktop', fakeAsync(async () => {
      spyOnProperty(service, 'isDesktop').and.returnValue(true);
      spyOnProperty(service, 'isPortrait').and.returnValue(true);

      await service.openHelpModal();
      tick(20);

      expect(modal.classList.add).toHaveBeenCalledWith(
        'manual-email-instructions',
      );
      expect(modal.classList.add).toHaveBeenCalledWith('desktop');
    }));

    it('should not add desktop class when on mobile', fakeAsync(async () => {
      spyOnProperty(service, 'isDesktop').and.returnValue(false);
      spyOnProperty(service, 'isPortrait').and.returnValue(false);

      await service.openHelpModal();
      tick(20);

      expect(modal.classList.add).toHaveBeenCalledWith(
        'manual-email-instructions',
      );
      expect(modal.classList.add).not.toHaveBeenCalledWith('desktop');
      expect(modal.classList.add).toHaveBeenCalledWith('landscape');
    }));

    it('should open help modal and present it', async () => {
      const classSpy = spyOn(
        service,
        'setModalLandscapeClasses',
      ).and.callThrough();
      await service.openHelpModal();

      expect(modalControllerSpy.create).toHaveBeenCalledWith({
        component: GetHelpComponent,
      });
      expect(classSpy).toHaveBeenCalledWith(modal);
      expect((modal as any).present).toHaveBeenCalled();
    });

    it('should react to orientation change when a modal is open', async () => {
      const classSpy = spyOn(
        service,
        'setModalLandscapeClasses',
      ).and.callThrough();
      await service.openHelpModal();
      globalThis.dispatchEvent(new Event('orientationchange'));

      expect(classSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('check valid modal opening', () => {
    it('should add manual-email-instructions class if HelpModalComponent is called', fakeAsync(() => {
      // Arrange: minimal modal-like object that satisfies the guard
      const modal: any = {
        classList: {
          remove: jasmine.createSpy('remove'),
          add: jasmine.createSpy('add'),
        },
        component: GetHelpComponent,
      };

      // Act
      service.setModalLandscapeClasses(modal);
      tick(20); // because of setTimeout(…, 10)

      // Assert
      expect(modal.classList.remove).toHaveBeenCalled();
      expect(modal.classList.add).toHaveBeenCalledWith(
        'manual-email-instructions',
      );
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
        'Unknown modal component for setting landscape class',
      );
    }));
  });

  describe('navigation methods', () => {
    it('should navigate to the correct tab', () => {
      const tabs: Tab[] = [Tab.Qr, Tab.Settings];

      tabs.forEach((tab) => {
        service.navigateToTab(tab);

        expect(routerSpy.navigate).toHaveBeenCalledWith([`/${tab}`]);
      });
    });

    it('should navigate to the correct tab with params', () => {
      const tabs: Tab[] = [Tab.Qr, Tab.Settings];
      const params = { exampleParam: 'value' };

      tabs.forEach((tab) => {
        service.navigateToTabWithParams(tab, params);

        expect(routerSpy.navigate).toHaveBeenCalledWith([`/${tab}`], {
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
        'hide-ion-tab-bar',
      );
      expect(mockElement.classList.remove).toHaveBeenCalledWith(
        'hide-ion-tab-bar',
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
        'hide-ion-tab-bar',
      );
      expect(mockElement.classList.remove).not.toHaveBeenCalled();
    });

    it('should do nothing when showing if ion-tab-bar element is not found', () => {
      spyOn(document, 'querySelector').and.returnValue(null);

      (service as any).showIonTabBar();

      expect(document.querySelector).toHaveBeenCalledWith('ion-tab-bar');
    });

    it('should add the hide-ion-tab-bar class when hiding', () => {
      // Arrange
      const mockElement = jasmine.createSpyObj('HTMLElement', ['']);
      mockElement.classList = jasmine.createSpyObj('classList', [
        'contains',
        'add',
      ]);
      (mockElement.classList.contains as jasmine.Spy).and.returnValue(false);
      spyOn(document, 'querySelector').and.returnValue(mockElement);

      // Act
      (service as any).hideIonTabBar();

      // Assert
      expect(document.querySelector).toHaveBeenCalledWith('ion-tab-bar');
      expect(mockElement.classList.contains).toHaveBeenCalledWith(
        'hide-ion-tab-bar',
      );
      expect(mockElement.classList.add).toHaveBeenCalledWith(
        'hide-ion-tab-bar',
      );
    });

    it('should not add the class if it is already present', () => {
      // Arrange
      const mockElement = jasmine.createSpyObj('HTMLElement', ['']);
      mockElement.classList = jasmine.createSpyObj('classList', [
        'contains',
        'add',
      ]);
      (mockElement.classList.contains as jasmine.Spy).and.returnValue(true);
      spyOn(document, 'querySelector').and.returnValue(mockElement);

      // Act
      (service as any).hideIonTabBar();

      // Assert
      expect(mockElement.classList.add).not.toHaveBeenCalled();
    });

    it('should do nothing when hiding if ion-tab-bar element is not found', () => {
      spyOn(document, 'querySelector').and.returnValue(null);

      (service as any).hideIonTabBar();

      expect(document.querySelector).toHaveBeenCalledWith('ion-tab-bar');
    });
  });

  describe('set service.keyboardVisible on keyboardWillShow and keyboardWillHide events for native platforms', () => {
    it('should set keyboardVisible to true on keyboardWillShow event on mobile', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      service['keyboardVisible'] = false;
      window.dispatchEvent(new Event('keyboardWillShow'));
      expect(service['keyboardVisible']).toBe(true);
    });

    it('should set keyboardVisible to false on keyboardWillHide event on mobile', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      service['keyboardVisible'] = true;
      window.dispatchEvent(new Event('keyboardWillHide'));
      expect(service['keyboardVisible']).toBe(false);
    });

    it('should not set keyboardVisible to true on keyboardWillShow event on web', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      service['keyboardVisible'] = false;
      window.dispatchEvent(new Event('keyboardWillShow'));
      expect(service['keyboardVisible']).toBe(false);
    });

    it('should not set keyboardVisible to false on keyboardWillHide event on web', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      service['keyboardVisible'] = true;
      window.dispatchEvent(new Event('keyboardWillHide'));
      expect(service['keyboardVisible']).toBe(true);
    });
  });
});
