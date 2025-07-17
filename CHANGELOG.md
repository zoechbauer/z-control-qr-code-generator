# What's New

All recent updates and improvements to our landing page.

## [1.4] - 2025-07-17

### Changed

- Removed indentation from lists in the user help page for better readability on mobile devices.
- Long texts in the user help page have been divided into paragraphs for better readability

## [1.3] - 2025-07-15

**Hosted on Google Play Store**
  - App is now in status "Internal Test"

### Added

- Display version info in help modal
- External link icons for privacy policy and GitHub
- New help section: Reset default app

### Changed

- Updated documentation structure
- Improved privacy policy link handling

### Fixed

- Minor UI bugs




## [1.2] - 2025-07-03

### 🐛 Fixes

- **Email Client Issue on mobile devices when using the Wep App**

  - **Issue**: In the web app, the email client does not open on mobile devices when the "Mail Code" button is used

  - **Solution**: new user experience flow for e-mail sending

    - ***Native Apps (Android)***

      1. User clicks "Mail Code"
      2. QR code downloads automatically
      3. Email client opens with pre-filled recipients, content and attachments
      4. User sends email

    - ***Desktop Web***

      1. User clicks "Mail Code"
      2. QR code downloads to Downloads folder
      3. Alert shows instruction to manually attach files
      4. Email client opens via mailto: with recipients and content pre-filled
      5. User manually attaches downloaded files and sends

    - ***Mobile Web***

        - **Android browsers**: Full functionality with options dialog (Try Email App, 
            Copy QR Text, Manual Instructions, Cancel)

        - **iOS Safari/browsers**: ⚠️ **Limited functionality** - QR code downloads but email options dialog may not appear due to iOS browser restrictions

## [1.1] - 2025-07-02

### 🚀 Improvements

- **Code Quality & Reliability**

  - Enhanced error handling throughout the application
  - Added input validation service to prevent circular dependencies
  - Refactored email utilities for better maintainability

- **Accessibility Enhancements**

  - Added keyboard navigation support (`Enter` and `Space` keys) for all interactive elements
  - Improved screen reader compatibility

- **Developer Experience**
  - Eliminated SonarQube warnings for better code quality
  - Improved TypeScript type safety

## [1.0] - 2025-06-30

### 🎉 Initial Release

- **Privacy Policy**: Comprehensive privacy information in German and English
- **Mobile Ready**: Fully responsive design for all devices
- **Professional Design**: Clean, modern interface following best practices

## What's Coming Next

We're continuously working to improve your experience. Future updates will include:

- QR Code App will be tested in a Closed Group

Thank you for using our applications!