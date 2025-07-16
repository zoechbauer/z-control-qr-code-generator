# Google Play Store Deployment Guide

## Complete Step-by-Step Process for z-control QR Code App

> **Use this guide every time you want to deploy to Google Play Store**  
> _Works for both first-time uploads and updates_

---

## 📋 Prerequisites

- ✅ Ionic app is ready and tested
- ✅ All changes are committed to git
- ✅ Google Play Developer account is set up
- ✅ Android development environment is working
- ✅ **Changelog** (`CHANGELOG.md`) is updated
- ✅ **Version info** is updated in `src/environments/environment.ts` and `environment.prod.ts`
- ✅ **Remove any debug keystore shortcuts** (see Step 0 below)

---

# 1️⃣ Initial Upload to Google Play Store

### **Step 0: Clean Debug Keystores (Important!)**

```powershell
# In project root: c:\SOURCE-ACTIVE\ionic\qr-code\
# Remove or rename any debug keystore shortcuts
ren "keystore - Verknüpfung.lnk" "keystore-debug-backup.lnk"
```
**Why:** Prevents automatic debug signing and ensures proper release signing

---

### **Step 1: Create Upload Keystore (FIRST TIME ONLY!)**

> ⚠️ **Do this ONLY ONCE per app - then reuse the same keystore for all future updates**

```powershell
# In project root: c:\SOURCE-ACTIVE\ionic\qr-code\
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

**You'll be prompted for:**
- Keystore password (save securely!)
- Key password (use same as keystore password)
- Your name, organization, city, country

**Then create `keystore.properties`:**

```properties
storePassword=YOUR_SECURE_PASSWORD_HERE
keyPassword=YOUR_SECURE_PASSWORD_HERE
keyAlias=upload
storeFile=../../upload-keystore.jks
```

**CRITICAL:**
- Save your keystore password securely
- Backup your `upload-keystore.jks` file
- Never share or commit the `keystore.properties` file to git

---

### **Step 2: Prepare App for Release**

- Update version info in `src/environments/environment.ts` and `environment.prod.ts`
- Set `versionCode` and `versionName` in `android/app/build.gradle` (e.g., `versionCode 1`, `versionName "1.0"`)

---

### **Step 3: Build and Bundle the App**

```powershell
ionic build --prod
npx cap sync android
cd android
.\gradlew bundleRelease
```

**Expected:** `BUILD SUCCESSFUL` message

---

### **Step 4: Locate and Upload App Bundle**

- Find your `.aab` file at:  
  `android\app\build\outputs\bundle\release\app-release.aab`
- Go to [Google Play Console](https://play.google.com/console)
- Create a new app entry if needed
- Go to **Production → Releases → Create new release**
- Upload the `.aab` file
- Copy the relevant section from `CHANGELOG.md` and paste as release notes (plain text)
- Complete all required Play Store listing fields (screenshots, privacy policy, etc.)
- Review and publish

---

# 2️⃣ Uploading Updates (New Versions)

### **Step 1: Update Version Info**

- Update version in `src/environments/environment.ts` and `environment.prod.ts`
- Increment `versionCode` and update `versionName` in `android/app/build.gradle`
- Update `CHANGELOG.md` with new changes

---

### **Step 2: Build and Bundle the App**

```powershell
ionic build --prod
npx cap sync android
cd android
.\gradlew bundleRelease
```

---

### **Step 3: Upload to Google Play Console**

- Go to your app in [Google Play Console](https://play.google.com/console)
- Go to **Production → Releases → Create new release**
- Upload the new `.aab` file
- Copy the latest changes from `CHANGELOG.md` and paste as release notes (plain text)
- Review and publish

---

# 3️⃣ Notes on Internal Test, Closed Test, and Production Mode

## **Internal Test**
- Use for quick, private testing with a small group.
- Add tester emails in Play Console.
- Share the internal test link manually with testers.
- No automatic email invitations.
- Testers must use the same Google account as in the test group.

## **Closed Test**
- Required before production release (as per latest Play Console rules).
- Create a closed test track in Play Console.
- Add testers (can be same as internal test group).
- Upload your `.aab` file and release notes.
- Share the closed test link with testers.
- Wait for feedback and ensure all features work as expected.

## **Production Mode**
- Only release to production after successful internal and closed tests.
- Double-check all Play Store listing requirements (screenshots, privacy policy, contact info, etc.).
- Ensure version numbers are incremented.
- Use the latest `.aab` file.
- Copy release notes from `CHANGELOG.md` (plain text).
- Submit for review and wait for Google approval.

---

## 📁 File Locations Reference

| File                | Location                                                   | Purpose                                |
| ------------------- | ---------------------------------------------------------- | -------------------------------------- |
| **App Bundle**      | `android\app\build\outputs\bundle\release\app-release.aab` | Upload this to Google Play             |
| **Version Config**  | `android\app/build.gradle`                                 | Update `versionCode` and `versionName` |
| **Screenshots**     | `docs/upload-to-google-playstore/*.png`                    | Use for store listing                  |
| **Feature Graphic** | `docs/upload-to-google-playstore/feature-graphic-final.png`| Store listing banner                   |
| **App Icon**        | `docs/upload-to-google-playstore/app-icon-512px.png`       | Store listing icon                     |
| **Changelog**       | `CHANGELOG.md`                                             | Release notes and version history      |

---

## ⚠️ Important Notes

- **Never commit keystore files or passwords to git.**
- **Always backup your keystore and passwords securely.**
- **Increment `versionCode` for every update.**
- **Release notes in Play Console must be plain text (copy from `CHANGELOG.md`).**
- **Test your app thoroughly before every release.**

---

_Last updated: July 16, 2025_  
_App: z-