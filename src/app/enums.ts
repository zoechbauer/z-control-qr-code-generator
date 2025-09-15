export enum Tab {
  Settings = 'settings',
  Qr = 'qr',
}

export enum LogoType {
  Copyright = 'copyright',
  Company = 'company',
}

export enum Modal {
  Changelog = 'changelog_modal',
  Help = 'help_modal',
}

export enum QrCodeSize {
  XSMALL = 1.5, // cm
  SMALL = 3,
  MEDIUM = 5,
  LARGE = 7.5,
  XLARGE = 14,
}

export enum QrCodeGapSize {
  SMALL = 0.5, // cm
  MEDIUM = 2,
  LARGE = 5,
}

export enum QrCodesCountPerPage {
  FULL_PAGE = 'Full Page',
  CUSTOM_NUMBER = 'Custom Number',
}