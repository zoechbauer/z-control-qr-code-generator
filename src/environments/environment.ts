// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

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
    major: 1,
    minor: 15,
    date: '2025-08-13',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
