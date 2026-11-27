# Android Build Update

## Purpose

This document summarizes the Android and Gradle updates made on 24 November 2026.
The Play Store build showed intermittent tab navigation and accordion interaction
issues that did not occur with `ionic cap run android --external -l`.

The dependency updates are intended to align the Android project with Capacitor 8,
but they do not by themselves prove the UI issue is resolved. The rebuilt Play
Store or internal-test release must be tested on the affected device.

## Current versions

- Capacitor: 8.6.0
- Capacitor CLI: 8.6.0
- Ionic Angular: 8.8.15
- Angular: 20.3.16
- Android compile SDK: 36
- Android target SDK: 36
- Android minimum SDK: 24
- Android Gradle Plugin: 8.10.1
- Gradle wrapper: 8.11.1
- Java: JDK 21
- Application version name: 3.0.1
- Application version code: 70

## Android configuration updates

### Top-level Gradle plugin

Kept [android/build.gradle](../../android/build.gradle) on AGP 8.10.1 for
compatibility with Android Studio Meerkat 2024.3.2:

```groovy
classpath 'com.android.tools.build:gradle:8.10.1'
```

### Gradle wrapper

The [android/gradle/wrapper/gradle-wrapper.properties](../../android/gradle/wrapper/gradle-wrapper.properties)
uses Gradle 8.11.1:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-all.zip
```

### AndroidX dependencies

Updated [android/variables.gradle](../../android/variables.gradle) to align it
with the Capacitor 8 dependency baseline:

| Dependency | Previous | Updated |
|---|---:|---:|
| androidxActivityVersion | 1.8.0 | 1.11.0 |
| androidxAppCompatVersion | 1.6.1 | 1.8.0 |
| androidxCoordinatorLayoutVersion | 1.2.0 | 1.3.0 |
| androidxCoreVersion | 1.12.0 | 1.17.0 |
| androidxFragmentVersion | 1.6.2 | 1.8.9 |
| coreSplashScreenVersion | 1.0.1 | 1.2.0 |
| androidxWebkitVersion | 1.9.0 | 1.14.0 |
| androidxJunitVersion | 1.1.5 | 1.3.0 |
| androidxEspressoCoreVersion | 3.5.1 | 3.7.0 |
| cordovaAndroidVersion | 10.1.1 | 14.0.1 |

AndroidX Core was kept at 1.17.0. AndroidX Core 1.19.1 was also reported by
Android Studio, but it requires Android Gradle Plugin 9.1.0 or later and
compile SDK 37. The project currently uses AGP 8.10.1 and compile SDK 36.
Upgrading Core to 1.19.1 would therefore require a broader SDK and AGP upgrade.

### Application Gradle configuration

Updated [android/app/build.gradle](../../android/app/build.gradle):

- Incremented `versionCode` to 70.
- Set `versionName` to 3.0.1.
- Renamed the unused catch parameter in the optional Google Services section:

```groovy
} catch (Exception ignored) {
```

The signing configuration continues to load the signing values from
`android/keystore.properties`.

## Web asset update

The Angular production build was regenerated and copied into the Android project:

```powershell
npm run build
npx cap copy android
```

This updates the files under `android/app/src/main/assets/public`.

The production build succeeded. Angular reported existing budget and CommonJS
optimization warnings, but no build errors.

## Android build verification

### Debug build

Run:

```powershell
.\android\gradlew.bat -p .\android clean assembleDebug
```

The clean debug build completed successfully.

### Release App Bundle

Run:

```powershell
.\android\gradlew.bat -p .\android bundleRelease
```

The release App Bundle completed successfully at:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

The bundle was signed using the existing release signing configuration.
Do not commit signing credentials or keystore passwords.

## Play Store testing

1. Upload `app-release.aab` to an internal or closed test track.
2. Create a test release with `versionCode` 70.
3. Install the release through Google Play, not through Android Studio or the
   live-reload command.
4. Test on at least the device and Android version that showed the original
   issue.
5. Repeat the following checks:
   - Tap QR Code multiple times and verify that it opens immediately.
   - Tap Settings multiple times and verify that it opens immediately.
   - Switch repeatedly between QR Code and Settings.
   - Open every settings accordion.
   - Close an accordion and open another accordion.
   - Test with both light and dark system themes.
   - Test in portrait and landscape orientation.
   - Repeat the checks after backgrounding and restoring the app.
6. Retain a log or short screen recording if the issue remains reproducible.

## Troubleshooting

If the issue still occurs:

- Confirm that the installed Play Store version reports `70` or the new release
  version.
- Confirm that the Play Store internal-test release has been downloaded and
  installed on the affected device.
- Uninstall stale side-loaded versions before installing the test release.
- Record the Android version, WebView version, device model, and exact tap
  sequence.
- Reproduce whether the issue occurs on app startup, after backgrounding, or
  after opening the keyboard or a modal.

Do not upgrade AndroidX Core to 1.19.1 until the project also moves to a
compatible AGP and compile SDK level.
