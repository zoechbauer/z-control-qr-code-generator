import { WindowMockUtil } from 'src/test-utils/window-mock.util';
import { SafeAreaInsets } from './safe-area-insets';

describe('SafeAreaInsets', () => {
  let service: SafeAreaInsets;

  beforeEach(() => {
    service = new SafeAreaInsets();
    // Reset document styles before each test
    document.documentElement.style.setProperty('--safe-area-bottom-fix', '');
    document.documentElement.style.setProperty('--safe-area-right-fix', '');
  });

  it('should set CSS variables with detected insets', () => {
    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: (prop: string) =>
        prop === 'env(safe-area-inset-bottom)' ? '20' : '10',
    } as any);

    service.setSafeAreaInsetsFix();

    expect(
      document.documentElement.style.getPropertyValue('--safe-area-bottom-fix')
    ).toBe('20px');
    expect(
      document.documentElement.style.getPropertyValue('--safe-area-right-fix')
    ).toBe('10px');
  });

  it('should use fallback values for small screens', () => {
    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: () => '',
    } as any);
    WindowMockUtil.mockInnerWidth(600);

    service.setSafeAreaInsetsFix();

    expect(
      document.documentElement.style.getPropertyValue('--safe-area-bottom-fix')
    ).toBe('50px');
    expect(
      document.documentElement.style.getPropertyValue('--safe-area-right-fix')
    ).toBe('30px');
  });

  it('should use fallback values for large screens', () => {
    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: () => '',
    } as any);
    WindowMockUtil.mockInnerWidth(1080);

    service.setSafeAreaInsetsFix();

    expect(
      document.documentElement.style.getPropertyValue('--safe-area-bottom-fix')
    ).toBe('64px');
    expect(
      document.documentElement.style.getPropertyValue('--safe-area-right-fix')
    ).toBe('45px');
  });

  it('should use fallback values for very large screens', () => {
    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: () => '',
    } as any);
    WindowMockUtil.mockInnerWidth(1200);


    service.setSafeAreaInsetsFix();

    expect(
      document.documentElement.style.getPropertyValue('--safe-area-bottom-fix')
    ).toBe('80px');
    expect(
      document.documentElement.style.getPropertyValue('--safe-area-right-fix')
    ).toBe('45px');
  });


  it('should use Galaxy A55 specific fallback', () => {
    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: () => '',
    } as any);
    WindowMockUtil.mockInnerWidth(700);
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('SM-A556');

    service.setSafeAreaInsetsFix();

    expect(
      document.documentElement.style.getPropertyValue('--safe-area-bottom-fix')
    ).toBe('50px');
    expect(
      document.documentElement.style.getPropertyValue('--safe-area-right-fix')
    ).toBe('65px');
  });

  it('should use Galaxy A33 specific fallback', () => {
    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: () => '',
    } as any);
    WindowMockUtil.mockInnerWidth(700);
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('SM-A336');

    service.setSafeAreaInsetsFix();

    expect(
      document.documentElement.style.getPropertyValue('--safe-area-bottom-fix')
    ).toBe('50px');
    expect(
      document.documentElement.style.getPropertyValue('--safe-area-right-fix')
    ).toBe('45px');
  });

  it('should use Galaxy J5 specific fallback', () => {
    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: () => '',
    } as any);
    WindowMockUtil.mockInnerWidth(700);
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('SM-J530F');

    service.setSafeAreaInsetsFix();

    expect(
      document.documentElement.style.getPropertyValue('--safe-area-bottom-fix')
    ).toBe('0px');
    expect(
      document.documentElement.style.getPropertyValue('--safe-area-right-fix')
    ).toBe('0px');
  });
});
