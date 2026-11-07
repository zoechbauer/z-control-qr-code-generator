import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { AppComponent } from './app.component';
import { WindowMockUtil } from '@testing/window-mock.util';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: any;
  let mockMatchMedia: jasmine.Spy;
  let splashHideSpy: jasmine.Spy;
  let setOverlaysSpy: jasmine.Spy;
  let setBackgroundColorSpy: jasmine.Spy;
  let setStyleSpy: jasmine.Spy;
  let showSpy: jasmine.Spy;

  beforeEach(async () => {
    mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(false);
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);

    const splashScreenMock = jasmine.createSpyObj('SplashScreen', ['hide']);
    splashScreenMock.hide.and.resolveTo();
    splashHideSpy = splashScreenMock.hide;

    const statusBarMock = jasmine.createSpyObj('StatusBar', [
      'setOverlaysWebView',
      'setBackgroundColor',
      'setStyle',
      'show',
    ]);
    statusBarMock.setOverlaysWebView.and.resolveTo();
    statusBarMock.setBackgroundColor.and.resolveTo();
    statusBarMock.setStyle.and.resolveTo();
    statusBarMock.show.and.resolveTo();

    setOverlaysSpy = statusBarMock.setOverlaysWebView;
    setBackgroundColorSpy = statusBarMock.setBackgroundColor;
    setStyleSpy = statusBarMock.setStyle;
    showSpy = statusBarMock.show;

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    Object.defineProperty(component, 'splashScreen', {
      value: splashScreenMock,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(component, 'statusBar', {
      value: statusBarMock,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    WindowMockUtil.restore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isNativeApp property', () => {
    expect(component.isNativeApp).toBeDefined();
    expect(typeof component.isNativeApp).toBe('boolean');
  });

  it('should have initializeApp method', () => {
    expect(component.initializeApp).toBeDefined();
    expect(typeof component.initializeApp).toBe('function');
  });

  it('should not throw error when initializeApp is called on web platform', async () => {
    (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
    await expectAsync(component.initializeApp()).toBeResolved();
  });

  it('should call initializeApp on NgOnInit', async () => {
    spyOn(component, 'initializeApp').and.returnValue(Promise.resolve());
    component.ngOnInit();
    expect(component.initializeApp).toHaveBeenCalled();
  });

  describe('native platform behavior', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(true);
    });

    it('should call window.matchMedia with dark mode query', async () => {
      await component.initializeApp();

      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should handle light mode preference', async () => {
      // Arrange
      mockMatchMedia.and.returnValue({ matches: false }); // Light mode

      // Act
      await component.initializeApp();

      // Assert
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should handle dark mode preference', async () => {
      // Arrange
      mockMatchMedia.and.returnValue({ matches: true }); // Dark mode

      // Act
      await component.initializeApp();

      // Assert
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should detect system dark mode preference correctly', async () => {
      // Test light mode
      mockMatchMedia.and.returnValue({ matches: false });
      await component.initializeApp();
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );

      // Reset spy
      mockMatchMedia.calls.reset();

      // Test dark mode
      mockMatchMedia.and.returnValue({ matches: true });
      await component.initializeApp();
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    describe('StatusBar and SplashScreen behavior', () => {
      beforeEach(() => {
        splashHideSpy.calls.reset();
        setOverlaysSpy.calls.reset();
        setBackgroundColorSpy.calls.reset();
        setStyleSpy.calls.reset();
        showSpy.calls.reset();
      });

      it('should apply light style when system prefers dark mode', async () => {
        mockMatchMedia.and.returnValue({ matches: true });

        await component.initializeApp();

        expect(setBackgroundColorSpy).toHaveBeenCalledWith({
          color: '#3880ff',
        });
        expect(setStyleSpy).toHaveBeenCalledWith({
          style: Style.Light,
        });
      });

      it('should apply dark style when system prefers light mode', async () => {
        mockMatchMedia.and.returnValue({ matches: false });

        await component.initializeApp();

        expect(setBackgroundColorSpy).toHaveBeenCalledWith({
          color: '#3880ff',
        });
        expect(setStyleSpy).toHaveBeenCalledWith({
          style: Style.Dark,
        });
      });

      it('should not fail when the plugin is unavailable on web', async () => {
        setOverlaysSpy.and.rejectWith({ code: 'UNIMPLEMENTED' });
        setBackgroundColorSpy.and.rejectWith({ code: 'UNIMPLEMENTED' });
        setStyleSpy.and.rejectWith({ code: 'UNIMPLEMENTED' });
        showSpy.and.rejectWith({ code: 'UNIMPLEMENTED' });

        await expectAsync(component.initializeApp()).toBeResolved();
      });
    });
  });

  describe('renderer - addClass', () => {
    let addClassSpy: jasmine.Spy;
    beforeEach(() => {
      addClassSpy = spyOn(component['renderer'], 'addClass');
      addClassSpy.calls.reset();
    });

    it('should add native-app class when running on native platform', async () => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(true);
      await component.initializeApp();

      expect(addClassSpy).toHaveBeenCalledWith(document.body, 'native-app');
    });

    it('should add web-app class when running on web platform', async () => {
      (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(false);
      await component.initializeApp();

      expect(addClassSpy).toHaveBeenCalledWith(document.body, 'web-app');
    });
  });
});
