export enum Tab {
  Settings = 'settings',
  Qr = 'qr',
}

export enum LogoType {
  Copyright = 'copyright',
  Company = 'company',
}

export enum EmailAddressStatus {
  Added = 'added',
  Duplicate = 'duplicate',
  Removed = 'removed',
  NotFound = 'not_found',
}

export enum Modal {
  Changelog = 'changelog_modal',
  Help = 'help_modal',
}

export enum QrCodeSize {
  SMALL = 3,  // cm
  MEDIUM = 5,
  LARGE = 10,
  XLARGE = 15,
}

export enum QrCodeGapSize {
  SMALL = 0.5, // cm
  LARGE = 2,
}

export enum QrCodesCountPerPage {
  FULL_PAGE = 'Full Page',
  CUSTOM_NUMBER = 'Custom Number',
}

export enum ToastAnchor {
  QR_PAGE = 'toast-anchor-qr',
  SETTINGS_PAGE = 'toast-anchor-settings',
}