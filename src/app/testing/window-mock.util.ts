export class WindowMockUtil {
  private static originalDescriptors: Map<
    string,
    PropertyDescriptor | undefined
  > = new Map();

  /**
   * Mock a window property with a specific value
   */
  static mockWindowProperty(property: string, value: any): void {
    // Store original property descriptor (not just value)
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      property
    );
    this.originalDescriptors.set(property, originalDescriptor);

    // Mock the property
    Object.defineProperty(window, property, {
      writable: true,
      configurable: true,
      value: value,
    });
  }

  /**
   * Setup matchMedia spy for testing responsive behavior
   */
  static setupMatchMediaSpy(defaultMatches: boolean = true): jasmine.Spy {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'matchMedia'
    );
    this.originalDescriptors.set('matchMedia', originalDescriptor);

    // Create and setup the spy
    const mockMatchMedia = jasmine.createSpy('matchMedia').and.returnValue({
      matches: defaultMatches,
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: mockMatchMedia,
    });

    return mockMatchMedia;
  }

  /**
   * Mock window.innerWidth specifically (handles read-only property)
   */
  static mockInnerWidth(width: number): void {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'innerWidth'
    );
    this.originalDescriptors.set('innerWidth', originalDescriptor);

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  }

  /**
   * Mock window.innerHeight specifically (handles read-only property)
   */
  static mockInnerHeight(height: number): void {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'innerHeight'
    );
    this.originalDescriptors.set('innerHeight', originalDescriptor);

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
  }

  /**
   * Mock window location for navigation testing
   */
  static mockLocation(locationProps: Partial<Location>): void {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'location'
    );
    this.originalDescriptors.set('location', originalDescriptor);

    const mockLocation = {
      ...window.location,
      ...locationProps,
    };

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: mockLocation,
    });
  }

  /**
   * Restore all mocked window properties to their original state
   */
  static restore(): void {
    this.originalDescriptors.forEach((descriptor, property) => {
      if (descriptor) {
        // Restore original property descriptor
        Object.defineProperty(window, property, descriptor);
      } else {
        // Property didn't exist originally, delete it
        delete (window as any)[property];
      }
    });
    this.originalDescriptors.clear();
  }

  /**
   * Restore a specific property
   */
  static restoreProperty(property: string): void {
    const descriptor = this.originalDescriptors.get(property);
    if (descriptor) {
      Object.defineProperty(window, property, descriptor);
    } else if (this.originalDescriptors.has(property)) {
      // Property was undefined originally
      delete (window as any)[property];
    }
    this.originalDescriptors.delete(property);
  }
}
