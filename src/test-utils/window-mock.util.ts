/**
 * Utility for managing window.matchMedia mocks across test suites
 */
export class WindowMockUtil {
  private static originalMatchMedia: any;

  /**
   * Sets up a fresh window.matchMedia spy
   */
  static setupMatchMediaSpy(defaultMatches: boolean = true): jasmine.Spy {
    // Store original if not already stored
    if (!this.originalMatchMedia) {
      this.originalMatchMedia = (window as any).matchMedia;
    }

    // Create fresh spy
    const spy = jasmine.createSpy('matchMedia');
    spy.and.returnValue({ matches: defaultMatches });

    // Attach to window
    (window as any).matchMedia = spy;

    return spy;
  }

  /**
   * Restores original window.matchMedia (call in afterEach)
   */
  static restore(): void {
    if (this.originalMatchMedia) {
      (window as any).matchMedia = this.originalMatchMedia;
    } else {
      delete (window as any).matchMedia;
    }
  }

  /**
   * Checks if matchMedia is currently spied
   */
  static isSpied(): boolean {
    return !!(window as any).matchMedia?.isSpy;
  }
}
