# Android Play Release Debugging

This guide describes how to install and diagnose the signed Android release build
on a physical device. It is intended for comparing a Google Play installation
with an Android Studio or bundletool installation.

## Symptoms

The following behavior was observed on the Samsung Galaxy A33, Galaxy J5, and
Galaxy Tab A7:

- QR Code and Settings tab buttons now open their pages.
- Settings accordions do not open after clicking.
- Clicking the z-control icon in the header opens an empty Settings page instead
  of the feedback accordion.
- The same behavior occurs in a Play Store installation on all tested devices.
- The app works as designed with the live-reload command:

  ```powershell
  ionic cap run android --external -l
  ```

## Install the release variant in Android Studio

An `.aab` file cannot be installed directly onto a physical device. Android
Studio can build and install the corresponding release APK.

1. Open the `android` folder in Android Studio.
2. Select the `app` module.
3. Open **Build > Select Build Variant**.
4. Select the `release` build variant.
5. Connect the Samsung Galaxy A33.
6. Enable USB debugging on the device.
7. Confirm that Android Studio selects the Galaxy A33 in the device selector.
8. Accept any USB authorization prompt on the device.
9. Click **Run** or press `Shift+F10`.

This builds and installs a release-signed APK using
`android/app/build.gradle`. It does not install the AAB itself, but it uses the
same production web assets and native release configuration.

The Android project uses AGP 8.10.1 and Gradle 8.11.1 for compatibility with
Android Studio Meerkat Feature Drop 2024.3.2. If Android Studio reports that
the project uses an incompatible AGP version, update Android Studio before
trying to upgrade AGP beyond 8.10.1.

## Install the exact AAB with bundletool

An exact AAB installation is converted into a device-compatible APK set by
`bundletool`.

### Create the APK set

Run the following command from the repository root:

```powershell
bundletool build-apks `
  --bundle=android/app/build/outputs/bundle/release/app-release.aab `
  --output=android/app/build/outputs/bundle/release/app-release.apks `
  --connected-device
```

The `--connected-device` option generates APKs for the currently connected
device, including only the required screen density, language, and CPU
architecture.

If `bundletool` is not available on `PATH`, use it through Java or install it
before running the command:

```powershell
java -jar .\bundletool-all.jar build-apks `
  --bundle=android/app/build/outputs/bundle/release/app-release.aab `
  --output=android/app/build/outputs/bundle/release/app-release.apks `
  --connected-device
```

### List connected devices

```powershell
adb devices
```

Use the serial shown for the Galaxy A33 in subsequent commands.

### Install the APK set

Install for the only connected device:

```powershell
bundletool install-apks `
  --apks=android/app/build/outputs/bundle/release/app-release.apks
```

Install for a specific device:

```powershell
bundletool install-apks `
  --apks=android/app/build/outputs/bundle/release/app-release.apks `
  --device-id=<DEVICE_SERIAL>
```

Java fallback:

```powershell
java -jar .\bundletool-all.jar install-apks `
  --apks=android/app/build/outputs/bundle/release/app-release.apks `
  --device-id=<DEVICE_SERIAL>
```

## Prepare a clean device test

Before testing, uninstall any existing Play Store or side-loaded installation:

```powershell
adb -s <DEVICE_SERIAL> uninstall at.zcontrol.zoe.qrcodeapp
```

Then install the Android Studio release build or the bundletool APK set.

Keep the Play Store installation available as a separate baseline by
testing on a different device or reinstalling it after the local test.

## Inspect the app in Chrome

WebView debugging is enabled temporarily in
`android/app/src/main/java/zoe/ionic/qrcodeapp/MainActivity.java` for the
diagnostic build.

Add the following imports and override to `MainActivity.java`:

```java
package at.zcontrol.zoe.qrcodeapp;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
```

This is diagnostic code only. Rebuild and reinstall the release APK after
changing `MainActivity.java`.

1. Start the release app on the Galaxy A33.
2. On the phone, verify that Developer options and USB debugging are enabled.
3. Connect the phone with USB and approve the debugging authorization prompt.
4. Open Chrome on the PC.
5. Navigate to:

   ```text
   chrome://inspect
   ```

6. Enable **Discover USB devices**.
7. In the Remote Target section, select the Galaxy A33.
8. Locate `at.zcontrol.zoe.qrcodeapp` or the app name in the WebView targets.
9. Click **Inspect**.
10. Open the **Console** tab.
11. Reproduce the following interactions:
   - Open Settings.
   - Click each settings accordion.
   - Close an accordion.
   - Open another accordion.
   - Click the z-control logo in the Settings header.
12. Preserve each error, warning, failed request, and source location shown in
    the Console and Network tabs.
13. Open the **Sources** tab and set a breakpoint in the Settings and accordion
    event handlers while reproducing the issue.

The console should reveal JavaScript exceptions, missing lazy chunks, failed
network requests, or Ionic custom events that do not fire.

If no WebView target appears:

1. Confirm that the newly rebuilt APK contains `MainActivity.java` with
   `WebView.setWebContentsDebuggingEnabled(true)`.
2. Reinstall the APK and restart the app completely.
3. Run `adb devices` and confirm that the A33 serial appears as `device`.
4. Run `adb forward --list` and remove conflicting Chrome remote-debugging
   entries if necessary.
5. In Chrome, disable and re-enable **Discover USB devices**.
6. Close and reopen `chrome://inspect`.

## Analyzing the problem

Use Chrome DevTools to distinguish an event problem from a bundling or native
WebView problem:

1. Record whether the tap produces a Console error.
2. In the Elements tab, inspect an `ion-accordion` and verify that it receives
   the Ionic `ionValueChange` event.
3. Add a temporary breakpoint or log statement in
   `onAccordionGroupChange()` at the point where `event.detail.value` is read.
4. Click an accordion header and verify whether:
   - no event arrives,
   - the value is not recognized,
   - `openAccordion` is assigned,
   - the Settings template switches sections,
   - or a lazy component throws an exception.
5. Add a breakpoint or log statement around the z-control logo subscription in
   `setupSubscriptions()` and verify whether `logoClicked$` emits.
6. If it emits, verify whether `openFeedbackAccordion()` assigns
   `openAccordion = 'z-control'`.
7. If it does not emit, inspect the header logo click handler and emitted event.
8. Check the Network tab for failed or missing JavaScript chunks.
9. Reload or restart the app and repeat the same steps on the A33.
10. Compare the Console and Network results with Android Studio live reload.
11. Save the relevant Console, Network, and source-state details before
    changing the implementation.

The first failing boundary should identify the defect:

- no event: touch, overlay, or Ionic event issue;
- unknown/invalid value: accordion value normalization issue;
- state assigned but page remains empty: template or lazy-load issue;
- logo event missing: header-to-settings subscription issue;
- failed JavaScript chunk: production bundle or asset-copy issue.

## Root cause and fix found

The console error was:

```text
TypeError: r.requestAccordionToggle is not a function
```

This indicates that the Settings page mixed Ionic component registration modes.
The page imported `IonicModule`, while the accordion components imported
standalone Ionic components through `@ionic/angular/standalone`.

The fix is to register the Settings page Ionic components explicitly in
standalone mode:

```typescript
import {
  IonAccordionGroup,
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';

@Component({
  // ...
  imports: [
    IonAccordionGroup,
    IonButton,
    IonContent,
    IonIcon,
    // Other Settings page components
  ],
})
export class TabSettingsPage {
  // ...
}
```

This ensures that `ion-accordion-group` and all child `ion-accordion`
components come from the same Ionic runtime registration. The production web
bundle now imports the standalone Ionic group implementation, where
`requestAccordionToggle()` is available.

Verification performed:

- Angular production build succeeded.
- Android web assets were copied with `npx cap copy android`.
- `assembleRelease` succeeded.
- The rebuilt APK is
  `android/app/build/outputs/apk/release/app-release.apk`.

## Inspect Android logs

Monitor errors:

```powershell
adb -s <DEVICE_SERIAL> logcat *:E
```

Clear old messages and monitor while reproducing the issue:

```powershell
adb -s <DEVICE_SERIAL> logcat -c
adb -s <DEVICE_SERIAL> logcat
```

Useful filters:

```powershell
adb -s <DEVICE_SERIAL> logcat | findstr /I "chromium console WebView Capacitor ionic"
```

## Diagnostic focus

The tab buttons and settings accordions share the production WebView, Angular
build, and Ionic runtime. The fact that tabs now work while accordions remain
broken makes a completely stale native build less likely and narrows the issue
to application event handling or production bundling.

Check especially for:

- Whether the `ionValueChange` event fires.
- Whether the value emitted by the accordion is included in
  `ACCORDION_VALUES`.
- Whether the lazy component for the selected accordion loads successfully.
- Whether JavaScript exceptions occur before `openAccordion` is assigned.
- Whether any overlay, safe-area style, or content element covers the accordion.
- Whether the production bundle contains the latest web assets.
- Whether the Android System WebView version differs from the live-reload
  environment.
- Whether the z-control logo click emits `logoClicked$` and opens the
  `z-control` accordion.

Relevant Settings implementation:

- [tab-settings.page.html](../../src/app/tab-settings/tab-settings.page.html)
- [tab-settings.page.ts](../../src/app/tab-settings/tab-settings.page.ts)
- [tabs.page.html](../../src/app/tabs/tabs.page.html)
- [tabs.page.ts](../../src/app/tabs/tabs.page.ts)

## Interpret the result

### Android Studio release or bundletool installation works

The issue is likely specific to Play delivery or a Play Store installation
difference. Verify the exact AAB uploaded to Play and compare its WebView,
bundle, and signing state with the local release build.

### Android Studio release or bundletool installation also fails

The issue is reproducible in the release configuration. Investigate Chrome
WebView DevTools and `adb logcat`, then add targeted diagnostics around
accordion event handling and lazy component loading.

### Both releases fail but live reload works

Compare the production Angular bundle against the development bundle. This
suggests a production optimization, stale copied web asset, event-name,
dependency, or WebView compatibility problem rather than a native Gradle
dependency update.

## Remove WebView debugging before a Google Play release

Before rebuilding the final AAB for Google Play, remove the temporary imports
and `onCreate()` override from
`android/app/src/main/java/zoe/ionic/qrcodeapp/MainActivity.java`.

Restore the original activity:

```java
package at.zcontrol.zoe.qrcodeapp;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
```

Then perform the release checks:

1. Confirm that `MainActivity.java` contains no
   `WebView.setWebContentsDebuggingEnabled(true)` call.
2. Confirm that no diagnostic breakpoints or temporary logging are committed.
3. Run the production web build:

   ```powershell
   npm run build
   npx cap copy android
   ```

4. Increment `versionCode` in `android/app/build.gradle`.
5. Keep `versionName` consistent with the Play Store release.
6. Build and verify the release bundle:

   ```powershell
   .\android\gradlew.bat -p .\android clean bundleRelease
   ```

7. Upload only `android/app/build/outputs/bundle/release/app-release.aab`.
8. Test the final Play Store build because removing WebView debugging is not
   a code behavior change, but it creates a separate release artifact.
