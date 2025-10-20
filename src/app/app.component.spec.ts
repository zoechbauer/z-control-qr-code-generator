import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { WindowMockUtil } from 'src/test-utils/window-mock.util';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: any;
  let mockMatchMedia: jasmine.Spy;

  beforeEach(async () => {
    mockMatchMedia = WindowMockUtil.setupMatchMediaSpy(true);

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
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

  it('should not throw error when initializeApp is called on web platform', () => {
    // Arrange
    component.isNativeApp = false;

    // Act & Assert
    expect(() => component.initializeApp()).not.toThrow();
  });

  describe('native platform behavior', () => {
    beforeEach(() => {
      component.isNativeApp = true;
    });

    it('should call window.matchMedia with dark mode query', () => {
      component.initializeApp();

      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should handle light mode preference', () => {
      // Arrange
      mockMatchMedia.and.returnValue({ matches: false }); // Light mode

      // Act & Assert
      expect(() => component.initializeApp()).not.toThrow();
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should handle dark mode preference', () => {
      // Arrange
      mockMatchMedia.and.returnValue({ matches: true }); // Dark mode

      // Act & Assert
      expect(() => component.initializeApp()).not.toThrow();
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should detect system dark mode preference correctly', () => {
      // Test light mode
      mockMatchMedia.and.returnValue({ matches: false });
      component.initializeApp();
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );

      // Reset spy
      mockMatchMedia.calls.reset();

      // Test dark mode
      mockMatchMedia.and.returnValue({ matches: true });
      component.initializeApp();
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });
  });
});
