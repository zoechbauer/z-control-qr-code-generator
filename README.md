# z-control QR Code Generator

A modern, user-friendly QR code generator app built with Ionic and Angular.  
Easily create QR codes, share them via email, and enjoy multi-language support.

## Features

- Generate QR codes from text input
- Share QR codes via email with attachments
- Multi-language support (English, German)
- Dark and light theme support
- Clean, responsive UI
- Offline functionality
- Change log

## 🛠️ Tech Stack

- **Framework**: Ionic 8 with Angular 18
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
│   ├── app/
│   │   ├── help-modal/          # Help page
│   │   ├── home/                # Main QR code page
│   │   └── services/            # Application services
│   ├── assets/                  # Static assets
│   │   └── logs/                # CHANGELOG.md
│   ├── environments/            # Environment configurations
│   └── theme/                   # Global styling
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
[hans.zoechbauer@gmail.com](mailto:hans.zoechbauer@gmail.com)  
[Project Website](https://z-control-4070.web.app/home)
