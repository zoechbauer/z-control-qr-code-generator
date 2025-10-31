# What's New?

All recent updates and improvements to our **z-control QR Code Generator** app.

## [2.5] – YYYY-MM-DD (Web-only release – Firebase)

### 🚀 Improvements

- Tooltips (web): Added descriptive tooltips to buttons and links to improve usability, accessibility, and discoverability.
- Improved Release Notes accordion (web): made the toggle active only when clicking the "Release Notes" button to prevent accidental activation from clicking elsewhere on the row.
- Mouse cursor (web): Use the default system cursor for disabled controls to clearly indicate they are non-interactive.

## [2.4] – 2025-10-26 (Web-only release – Firebase)

### 🚀 Improvements

- Improved the "Select Email App" section in the User Help page (web): explained differences between webmail and native mail apps.

### 📦 Installations

- **Web (Firebase)**: The web app version has been updated and is available via the hosting URL.
- **Mobile (Google Play)**: No mobile APK/AAB was published because changes are web-only.

## [2.3] – 2025-10-20 (Web-only release – Firebase)

### 🚀 Improvements

- Refactored codebase for better readability and maintainability, and updated unit tests to ensure continued reliability.
- Improved mouse pointer behavior: The cursor now changes to a pointer when hovering over the header logo in the web app.
- Removed extra bottom margin after the action buttons in the web app, as there is no navigation bar that could obscure them.

### 🐛 Fixes

- Updated unit tests to support the new tab-based layout and navigation structure.

### 📦 Installations

- **Web (Firebase)**: The web app version has been updated and is available via the hosting URL.
- **Mobile (Google Play)**: No mobile APK/AAB was published because changes are web-only (unit tests and web-specific UI tweaks). Google Play remains at the previous published mobile version.

## [2.2.] – 2025-09-25

### ✨ New Features

- **Flexible QR Code Printing:** Users can now print QR codes in various sizes, with customizable options for size, gap, and quantity. The app automatically calculates the number of QR codes to print, or users can manually enter their preferred amount. The printed QR code size is now always consistent, regardless of the text length, thanks to a new scaling algorithm.
- **Enhanced Print Options Management:** A dedicated accordion has been added to the Settings page for managing print options, making it easier to configure and review printing preferences.
- **Email Integration Improvements:** Selected print options are now appended to the email subject line, and the email body has been updated to provide clearer information about the chosen print settings. Printing instructions are now tailored for webmail clients, and only a snippet of the QR code text is included in the email body to avoid browser limitations.
- **Email Maintenance Notifications:** The Email Maintenance page now displays toast notifications when an email address is added, removed, or if a duplicate is detected.
- **User Help Redesign:** The FAQ section in the user help page has been replaced with two new sections: **General Usage** and **Troubleshooting & Problem Solving**. These sections offer clearer guidance and more focused support. User help content is now context-aware: information relevant to native app or web app is shown only for the active version.
- **Documentation Updates:** The user help pages have been revised to include detailed instructions and tips for using the new print features.

### 🚀 Improvements

- **Improved User Interface:** When an accordion is opened on the Settings page, all other accordions are temporarily hidden, allowing users to focus on the selected section. Closing the accordion restores the display of all sections for easier navigation.
- **Webmail Email Body Update:** In webmail clients, the email body now includes the file names of QR code images that need to be manually attached, along with only a snippet of the QR code text due to browser limitations with sendmail.
- Calculated print height of qr codes so that the selected hight is allways the same for short and long texts.
- **Improved Toast Message Visibility:** Toast notifications are now displayed below the app header, ensuring they are not obscured by the header bar on any device.

### 🐛 Fixes

- Reverted the reduction of header height in landscape mode due to display issues on Huawei phones and tablets.
- In web version the email client did not open if very long text was entered due to Browser limitations in sendmail. Now only the first 500 chars of the qr code text are printed in the email body to avoid this problem.
- **Enhanced Layout on Native App:** Increased the right margin in the native app for phones to improve visual alignment and layout consistency across various devices.

### 📦 Installations

- **Web**: The web app version is hosted on Google Firebase and can be accessed via browser.
- **Mobile (Google Play)**: the app is available on Google Play (Internal Test, Closed Test groups and **production**).

## [2.1] – 2025-09-07

### 🚀 Improvements

- Removed the black border from the Release Notes for a cleaner appearance.
- Reduced header height in landscape mode for better use of screen space.

### 🐛 Fixes

- Added extra padding to the bottom and right edges in landscape mode to prevent overlap with the navigation bar, addressing issues on devices that report incorrect navigation bar dimensions (e.g., Samsung Galaxy A55).

### 📦 Installations

- The app is available on Google Play for the **Internal Test** and **Closed Test** groups.
- The web app version is hosted on **Google Firebase** and can be accessed via browser.

## [2.0] – 2025-09-06

### ✨ New Features

- **Refactored Layout:** Introduced a tab-based interface with separate tabs for QR Code generation and Settings.
- **Centralized Language Selection:** Moved the language selection option from the header to the Settings page for easier access.
- **Footer Relocation:** The footer component is now part of the Settings page.
- **Privacy Policy Update:** The privacy policy has been relocated from the user help page to the Settings page.
- **Source Code Download:** The option to download the source code is now available on the Settings page instead of the user help page.
- **Mobile App Download:** Added a direct download link for the mobile app to the Settings page in the **web app**.

### 🚀 Improvements

- Implemented translations in the GetSourceCode, GetMobileApp, and PrivacyPolicy components for a consistent multilingual experience.
- Created a reusable ToastService for displaying toast notifications in both the QR code and Settings pages.
- Moved the email maintenance template and logic from the QR code page to the Settings page for better organization.
- Removed the button logic for switching between QR code creation and email maintenance, simplifying the workflow.
- Replaced the email button with the z-control logo on the QR code page for a cleaner and more consistent UI.
- The accordion header now displays the current count of stored email addresses for easier overview.
- Updated help page to reflect the new tab-based layout, providing clearer instructions for using the QR Code and Settings
- Various UI and UX enhancements, including interface refactoring for improved usability and visual consistency.
- Developed a reusable header component now shared by both the QR code and Settings pages, ensuring a consistent look and streamlined navigation across the app.
- The user help page and Release Notes now have a consistent height in the **web app** for a more uniform appearance.

### 🐛 Fixes

- The QR Code, Settings, user help, and Release Notes pages now consistently avoid overlapping the navigation bar for improved visual clarity.

### 📦 Installations

- The app is available on Google Play for the **Internal Test** and **Closed Test** groups.
- The web app version is hosted on **Google Firebase** and can be accessed via browser.

## [1.19] – 2025-08-31

### ✨ New Features

- Added a persistent z-control footer to the **web app**, displaying the current version number, release notes link, support email, and a direct download link for the mobile app. This provides users with quick access to important information and support resources.

### 🚀 Improvements

- Enhanced app infrastructure for greater stability and performance.
- Enhanced header design: All headers now have a blue background with white text and icons for improved visibility and a modern look. In the **web app**, header height is reduced since there is no status bar, providing a more streamlined appearance.
- Minor wording improvements for greater clarity in the user help page.
- Revised the "QR Codes Explained" section: removed generic examples and added app-specific examples to better illustrate usage within this application.
- Relocated the displayed version information and release notes link from the user help page to the new z-control footer for easier access.
- Updated the Google Play link for this app from the Internal Test group to the public release link.
- Updated the alert message explaining why QR codes are not automatically attached to emails in the web version for greater clarity.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.18] – 2025-08-25

### 🚀 Improvements

- Enhanced app infrastructure for greater stability and performance.

### 🐛 Fixes

- Fixed issue where the Release Notes button was overlapped by the navigation bar, preventing it from being opened.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.17] – 2025-08-24

### ✨ New Features

- Added a workflow feature that dynamically displays the next recommended user action, guiding users step-by-step through the QR code creation and email process.

### 🚀 Improvements

- Added new screenshots demonstrating the smart Keyboard Alert and multi-criteria text detection features for small devices to the documentation folder, providing clearer visual guidance for users.
- Added additional helpful information and clarifications to the user help page.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.16] – 2025-08-20

### ✨ New Features

- **Smart Keyboard Alert for Small Devices**: Added intelligent detection system for text input that may be covered by keyboard on small Android devices (Galaxy J5 and similar)
- **Multi-Criteria Text Detection for Small Devices**: Automatic alert appears when users type substantial content (90+ characters, 15+ words, 4+ line breaks, or long sentences)
- **Contextual Help Navigation**: Alert provides direct links to floating keyboard instructions and web version for better typing experience
- **Clear Input Confirmation**: Added confirmation dialog when clearing QR Code input field with more than 100 characters (configurable threshold)
- **Disabled Button Tooltips**: Added helpful tooltips when clicking disabled buttons to explain why they're unavailable
- **Enhanced Email Content**: Added QR code printing instructions and help page references to email templates
- **Comprehensive Web Documentation**: Added detailed web version documentation for creating QR codes with longer texts
- **Storage Permission Guide**: Added step-by-step storage permission instructions to the user help page
- **Floating Keyboard Instructions**: Added step-by-step floating keyboard instructions to the user help page for smaller screens
- **Email Address Counter:** The number of stored email addresses is now displayed on the email management page for easier overview.

### 🚀 Improvements

- **Redesigned Email Layout**: Fixed keyboard overlap issues on smaller Android devices (Galaxy J5) with responsive flexbox layout
- **Enhanced Error Messages**: Improved error message clarity when storage permissions are not granted
- **Better Navigation**: Moved navigation button in user help page from bottom to header to prevent overlap with Samsung navigation bar
- **Improved Text Input**: Enhanced placeholder text for QR Code text entry field
- **Larger Text Area**: Increased default text area height from 3 to 6 lines for better user experience

### 🐛 Fixes

- Fixed app name display in Android Settings/Apps to show "z-control QR Code Generator"
- Fixed extra space at the bottom to prevent overlap with the navigation bar when present
- Fixed logic for detecting small mobile devices to avoid false positives in landscape mode on modern phones

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.15] – 2025-08-13

### 🚀 Improvements

- Display a loading spinner while generating QR codes and loading emails.
- Automatically scroll to the action buttons after generating a QR code.
- Enhanced app infrastructure for greater stability and performance.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.14] – 2025-08-05

### 🚀 Improvements

- Made the email maintenance page easier to read and use.
- Uploaded updated screenshots for both English and German versions of the app to the Google Play Console.

### 🐛 Fixes

- Fixed the horizontal positioning of the language selection popup menu in landscape mode.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.13] – 2025-08-04

### 🚀 Improvements

- Uploaded updated and new screenshots for both English and German versions of the app to the Google Play Console.
- Updated app infrastructure for improved stability and performance.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.12] – 2025-08-01

### 🚀 Improvements

- When the text is modified after generating a QR code, the QR code is cleared and a notification is shown for 3 seconds.
- A FAQ-section has been added to the user help page.
- Added information about BlueMail issues to the FAQ section.
- Added details about toolbar display issues to the FAQ section.

### 🐛 Fixes

- On some older Android versions, the status bar (top system bar) overlapped the toolbar. The toolbar now displays correctly.
- The app title font size has been reduced to prevent truncation when system font size is increased.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.11] – 2025-07-30

### 🚀 Improvements

- Updated the z-control support email address.
- Improved the height of the user help dialog when accessed from desktop devices.
- Enhanced the initial layout for landscape mode.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.10] – 2025-07-28

### 🚀 Improvements

- Updated mobile phone images used for Google Play app promotion.
- Added tablet images used for Google Play app promotion.
- Refined wording and phrasing in the user help page for clarity.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.9] – 2025-07-25

### 🐛 Fixes

- Status bar (top system bar) was not displayed on Android 14 (API level 34) and above. The status bar is now visible again.
- The title was cut off on the user help page in portrait format.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.8] – 2025-07-24

### 🚀 Improvements

- Google requested to upgrade to Android 14 (API-Level 34)
- The subject line of the email has been improved
- Due to the mailto protocol, leading spaces in the mail body are removed by the browser. The mail body contains a warning in this case. This only occurs in the **web app**, not in the mobile app.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.7] – 2025-07-22

### 🚀 Improvements

- If spaces or line breaks are entered at the end, they are removed from the input field during generation and a hint (toast) is displayed. The user help page has been updated accordingly.
- Description of QR codes and the benefits for individuals and companies added to user help page.
- Tips have been added to the user help page on how to print the QR code in a specific size.
- Added used QR Code Generator library to README.

### 🐛 Fixes

- If spaces or line breaks were entered at the end, the email button was disabled.

### 📦 Installations

- App is hosted at Google Play for **Internal Test** group and **Closed Test** group.

## [1.6] – 2025-07-21

### 🚀 Improvements

- Stored email addresses are displayed on desktop and mobile in larger font for better readability.
- The language selection menu items are displayed better on different screen sizes.

### 🐛 Fixes

- Green background on desktop is now replaced with light gray for a cleaner look (global.scss updated). Note: you can run z-control QR Code Generator App on mobile and desktop via Browser.

### 📦 Installations

- Test status in Google Play changed from Internal Test to **Closed Test**.

## [1.5] - 2025-07-19

### 🚀 Improvements

- Added changelog display in user help page.
- Changed order of categories in change log.
- New wording for app name: QR code was renamed to **z-control QR Code Generator** (brand).
- CHANGELOG.md moved from root folder to assets/logs folder so that it can be read via http.

## [1.4] - 2025-07-17

### 🚀 Improvements

- Removed indentation from lists in the user help page for better readability on mobile devices.
- Long texts in the user help page have been divided into paragraphs for better readability.

## [1.3] - 2025-07-15

### 🚀 Improvements

- Display version info in help modal.
- External link icons for privacy policy and GitHub.
- New help section: Reset default app.
- Updated documentation structure.
- Improved privacy policy link handling.

### 🐛 Fixes

- Minor UI bugs

### 📦 Installations

- **Hosted on Google Play**: z-control QR Code Generator App is now in **"Internal Test" status**.

## [1.1] - 2025-07-02

### 🚀 Improvements

- Enhanced error handling throughout the application.
- Refactored email utilities for better maintainability.
- Added input validation service to prevent circular dependencies.
- Added keyboard navigation support (`Enter` and `Space` keys) for all interactive elements.
- Improved screen reader compatibility.
- Eliminated SonarQube warnings for better code quality.
- Improved TypeScript type safety.

## [1.0] - 2025-06-30

### 🎉 Initial Release

- **Privacy Policy**: Comprehensive privacy information in German and English.
- **Mobile Ready**: Fully responsive design for all devices.
- **Professional Design**: Clean, modern interface following best practices.

---

Thank you for using our z-control applications!
