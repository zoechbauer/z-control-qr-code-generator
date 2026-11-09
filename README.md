# z-control QR Code Generator

Create, share & print QR codes from text or links — fast, easy, and secure!

z-control QR Code Generator is a modern, user-friendly app built with Ionic and Angular.  
Easily convert text or web links into QR codes in seconds, send them directly via email (as image or PDF), and print them in your preferred format.  
Perfect for small businesses, clubs, students, and creative minds.  
Enjoy a clean, accessible design, step-by-step workflow, and integrated help — all with privacy in mind.

## Features

- **Fast QR code creation**: Instantly generate QR codes from text or links (up to 1000 characters)
- **Share via email**: Send QR codes as image (PNG) or PDF attachments with pre-filled emails and recipient management
- **Print functionality**: Choose size and quantity, and print QR codes easily on A4 paper
- **Step-by-step workflow**: Guided process from text entry to QR generation, sharing, and printing
- **Integrated help**: Built-in help modal and manual instructions for every step
- **Multi-language support**: English and German
- **Modern, accessible UI**: Clean design with light/dark mode and responsive layout
- **Offline functionality**: Works without an internet connection
- **Automatic file cleanup**: Keeps your device tidy by removing old QR code files
- **Privacy-first**: No data collection — everything stays local on your device

Download now for free and create, share & print QR codes with ease!

## Download & Online Access

- **Google Play:**  
  [![Get it on Google Play](https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png)](https://play.google.com/store/apps/details?id=at.zcontrol.zoe.qrcodeapp)
  <br>
  [Download from Google Play](https://play.google.com/store/apps/details?id=at.zcontrol.zoe.qrcodeapp)

- **Web App:**  
  [Run the app online (Firebase Hosting)](https://z-control-qr-code.web.app/)

---

## 🛠️ Tech Stack

- **Framework**: Ionic 8 with Angular 20
- **Language**: TypeScript
- **Styling**: SCSS with Ionic CSS Variables
- **Hosting**: Firebase Hosting
- **Build Tool**: Angular CLI
- **Icons**: Ionicons
- **QR Code Generator**: for generating the QR Code we used this library https://github.com/Cordobo/angularx-qrcode

## 📁 Project Structure

```

qr-code/
├── docs/                        # All documentation and deployment guides
│   ├── dev-and-test/            # Development and testing docs
│   ├── upload-to-google-playstore/   # Play Store deployment docs & assets
│   │   └── tool-templates/      # Deployment helper scripts/templates
│   └── README.md                # Docs folder overview
├── ressources/                  # Icons & splashscreens
├── src/
│   ├── android-config.txt
│   ├── declarations.d.ts
│   ├── global.scss
│   ├── index.html
│   ├── main.ts
│   ├── polyfills.ts
│   ├── test.ts
│   ├── zone-flags.ts
│   │
│   ├── app/
│   │   ├── app-routes.ts
│   │   ├── app.component.*
│   │   ├── app.config.ts
│   │   ├── enums.ts
│   │   ├── services.modules.ts
│   │   │
│   │   ├── help-modal/
│   │   │   └── help-modal.component.*
│   │   │
│   │   ├── services/
│   │   │   ├── alert.service.*
│   │   │   ├── email-utils.service.*
│   │   │   ├── file-utils.service.*
│   │   │   ├── filesystem.token.ts
│   │   │   ├── local-storage.service.*
│   │   │   ├── print-utils.service.*
│   │   │   ├── qr-utils.service.ts
│   │   │   ├── safe-area-insets.ts
│   │   │   ├── toast.service.*
│   │   │   ├── utils.service.*
│   │   │   ├── validation.service.*
│   │   │
│   │   ├── tab-qr/
│   │   │   ├── manual-instructions-modal.component.ts
│   │   │   ├── tab-qr.page.*
│   │   │
│   │   ├── tab-settings/
│   │   │   ├── tab-settings.page.*
│   │   │
│   │   ├── tabs/
│   │   │   ├── tabs-routes.ts
│   │   │   ├── tabs.page.*
│   │   │
│   │   └── ui/
│   │       └── components/
│   │           ├── accordions/
│   │           │   ├── change-log-accordion.component.*
│   │           │   ├── email-maintenance-accordion.component.*
│   │           │   ├── feedback-accordion.component.*
│   │           │   ├── get-mobile-app-accordion.component.*
│   │           │   ├── get-source-accordion.component.*
│   │           │   ├── language-accordion.component.*
│   │           │   ├── print-accordion.component.*
│   │           │   └── privacy-policy-accordion.component.*
│   │           ├── email-maintenance/
│   │           │   └── email-maintenance.component.*
│   │           ├── footer/
│   │           │   └── footer.component.*
│   │           ├── get-mobile-app/
│   │           │   └── get-mobile-app.component.*
│   │           ├── get-source-code/
│   │           │   └── get-source-code.component.*
│   │           ├── header/
│   │           │   └── header.component.*
│   │           ├── logo/
│   │           │   └── logo.component.*
│   │           ├── markdown-viewer/
│   │           │   └── markdown-viewer.component.*
│   │           └── privacy-policy/
│   │               └── privacy-policy.component.*
│   │
│   ├── assets/
│   │   ├── i18n/
│   │   │   ├── de.json
│   │   │   └── en.json
│   │   ├── icon/
│   │   │   └── z-control-qrcode-generator-logo-32px.png
│   │   └── logs/
│   │       └── CHANGELOG.md
│   │
│   ├── environments/
│   │   ├── environment.prod.ts
│   │   └── environment.ts
│   │
│   ├── testing/
│   │   ├── translate-service.mock.ts
│   │   └── window-mock.util.*
│   │
│   └── theme/
│       └── variables.scss
│
├── tools/                       # Project-wide dev tools (e.g., backup scripts, CHANGELOG-Templates)
├── README.md                    # Project overview (root)

```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Ionic CLI](https://ionicframework.com/docs/cli)
- [Angular CLI](https://angular.io/cli)
- [Android Studio](https://developer.android.com/studio) (for Android builds)

### Installation

```bash
git clone https://github.com/zoechbauer/z-control-qr-code-generator
cd qr-code-generator
npm install
ionic serve
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with code coverage
npm run test:coverage
```

### Building for Android

```bash
ionic build --prod
npx cap sync android
cd android
./gradlew assembleRelease
```

## Documentation

All documentation, deployment guides, and helper tools are located in the [`docs/`](docs/) folder.

## Privacy Policy

See [Privacy Policy](https://z-control-4070.web.app/privacy/basic/en).

## License

[MIT](LICENSE)

## Contact

For questions or support, contact:  
[z-control Support](mailto:zcontrol.app.qr@gmail.com)  
[Project Website](https://z-control-4070.web.app/home)
