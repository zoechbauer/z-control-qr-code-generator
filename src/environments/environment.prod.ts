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

  // confirm deleting input data with 100 chars or more
  clearConfirmationLength: 100,

  // version info
  version: {
    major: 2,
    minor: 2,
    date: '2025-09-25',
  },
};
