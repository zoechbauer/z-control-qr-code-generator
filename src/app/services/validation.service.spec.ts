import { TestBed } from '@angular/core/testing';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isValidEmailAddress method', () => {
    it('should validate an email address', () => {
      const result = service.isValidEmailAddress('test@example.com');
      expect(result).toBe(true);
    });

    it('should invalidate invalid email addresses', () => {
      // Arrange
      const invalidEmails = [
        'test@.com',
        'test1.test.com',
        'plainaddress',
        '@missingusername.com',
        '   ',
      ];
      // Act & Assert
      invalidEmails.forEach((email) => {
        expect(service.isValidEmailAddress(email)).toBe(
          false,
          `Failed for: ${email}`
        );
      });
    });
  });

  describe('sanitizeEmail method', () => {
    it('should sanitize a valid email address', () => {
      const sanitized = service.sanitizeEmail('test@example.com');
      expect(sanitized).toBe('test@example.com');
    });

    it('should not sanitize an invalid email address', () => {
      const sanitized = service.sanitizeEmail('invalid-email');
      expect(sanitized).toBe(null);
    });

    it('should trim whitespace from email input', () => {
      const sanitized = service.sanitizeEmail('   test@example.com   ');
      expect(sanitized).toBe('test@example.com');
    });

    it('should convert email to lowercase', () => {
      const testLowerCaseMails = [
        'TEST@EXAMPLE.COM',
        'Test@EXample.CoM',
        'test@example.com',
      ];
      // Act & Assert
      testLowerCaseMails.forEach((email) => {
        const sanitized = service.sanitizeEmail(email);
        expect(sanitized).toBe(email.toLowerCase(), `Failed for: ${email}`);
      });
    });

    it('should return null for null or undefined input', () => {
      const nullEmails = [null, undefined, '    ', ''];
      // Act & Assert
      nullEmails.forEach((email) => {
        const sanitized = service.sanitizeEmail(email);
        expect(sanitized).toBeNull();
      });
    });

    it('should handle special characters in email', () => {
      const emailsWithSpecialChars = [
        'test+alias@example.com',
        'test-alias@example.com',
        'test_alias@example.com',
        'test<alias>@example.com',
      ];
      // Act & Assert
      emailsWithSpecialChars.forEach((email) => {
        const sanitized = service.sanitizeEmail(email);
        expect(sanitized).toBe(email, `Failed for: ${email}`);
      });
    });

    it('should handle emails with subdomains', () => {
      const sanitized = service.sanitizeEmail('test@mail.example.com');
      expect(sanitized).toBe('test@mail.example.com');
    });

    it('should handle emails with international characters', () => {
      const sanitized = service.sanitizeEmail('test@exämple.com');
      expect(sanitized).toBe('test@exämple.com');
    });

    it('should handle emails with dots in the local part', () => {
      const sanitized = service.sanitizeEmail('test.email@example.com');
      expect(sanitized).toBe('test.email@example.com');
    });

    it('should handle emails with numeric TLDs', () => {
      const sanitized = service.sanitizeEmail('test@example.123');
      expect(sanitized).toBe('test@example.123');
    });

    it('should handle emails with numeric characters in the local part', () => {
      const sanitized = service.sanitizeEmail('test123@example.com');
      expect(sanitized).toBe('test123@example.com');
    });
  });
});
