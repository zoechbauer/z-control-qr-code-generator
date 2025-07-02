import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  /**
   * Validates if an email address has a valid format
   * @param email - The email address to validate
   * @returns true if email format is valid, false otherwise
   */
  isValidEmailAddress(email: string): boolean {
    if (!email?.trim()) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates and sanitizes an email address
   * @param email - The email address to validate and sanitize
   * @returns sanitized email or null if invalid
   */
  sanitizeEmail(email: string): string | null {
    if (!email?.trim()) {
      return null;
    }

    const trimmed = email.trim().toLowerCase();
    return this.isValidEmailAddress(trimmed) ? trimmed : null;
  }
}
