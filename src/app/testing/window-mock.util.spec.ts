import { WindowMockUtil } from './window-mock.util';

describe('WindowMockUtil', () => {
  afterEach(() => {
    WindowMockUtil.restore();
  });

  it('should mock a custom window property and restore it', () => {
    const propertyName = 'customWindowProperty';

    WindowMockUtil.mockWindowProperty(propertyName, 'mocked-value');

    expect((window as any)[propertyName]).toBe('mocked-value');
    expect(
      Object.getOwnPropertyDescriptor(window, propertyName)
    ).toEqual(
      jasmine.objectContaining({
        value: 'mocked-value',
        writable: true,
        configurable: true,
      })
    );

    WindowMockUtil.restoreProperty(propertyName);

    expect((window as any)[propertyName]).toBeUndefined();
  });

  it('should create a matchMedia spy for responsive tests', () => {
    const matchMediaSpy = WindowMockUtil.setupMatchMediaSpy(false);

    expect(matchMediaSpy).toEqual(jasmine.any(Function));
    expect(window.matchMedia).toBe(matchMediaSpy);
    const mediaQueryList = window.matchMedia('(orientation: portrait)') as any;
    expect(mediaQueryList.matches).toBe(false);
  });

  it('should mock innerWidth and innerHeight values', () => {
    WindowMockUtil.mockInnerWidth(800);
    WindowMockUtil.mockInnerHeight(600);

    expect(window.innerWidth).toBe(800);
    expect(window.innerHeight).toBe(600);

    WindowMockUtil.restore();

    expect(window.innerWidth).toBeGreaterThan(0);
    expect(window.innerHeight).toBeGreaterThan(0);
  });

  it('should throw when attempting to override the browser location object', () => {
    const locationHref = 'https://example.com/test-path?success=true';

    expect(() =>
      WindowMockUtil.mockLocation({ href: locationHref } as Partial<Location>)
    ).toThrow();

    WindowMockUtil.restoreProperty('location');
    expect(window.location.href).toBeDefined();
  });

  it('should restore all mocked window properties to their original descriptors', () => {
    const propertyName = 'restoreAllProperty';
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const matchMediaSpy = WindowMockUtil.setupMatchMediaSpy(true);

    WindowMockUtil.mockWindowProperty(propertyName, true);
    WindowMockUtil.mockInnerWidth(1024);
    WindowMockUtil.mockInnerHeight(768);

    WindowMockUtil.restore();

    expect((window as any)[propertyName]).toBeUndefined();
    expect(window.innerWidth).toBe(originalInnerWidth);
    expect(window.innerHeight).toBe(originalInnerHeight);
    expect(window.matchMedia).not.toBe(matchMediaSpy);
  });
});
