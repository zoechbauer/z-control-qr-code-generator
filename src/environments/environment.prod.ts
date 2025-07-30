export const environment = {
  production: true,
  
  // Storage duration for temporary files
  // balances user convenience with storage cleanup
  storageDurationInHours: 3,

  // Max preview length for copied text alerts
  // prevents UI overflow on small screens
  maxPreviewLengthOfCopiedText: 200,

  // QR code capacity limit
  // theoretical max is 2953 but scanning fails, using tested value
  maxInputLength: 1000,

  // version info
   version: {
    major: 1,
    minor: 11,
    date: '2025-07-30',
  },
}