# Google Play Store Deployment Guide

## Complete Step-by-Step Process for z-control QR Code App

> **Use this guide every time you want to deploy to Google Play Store**  
> _Works for both first-time uploads and updates_

---

## 📋 **Prerequisites**

- ✅ Ionic app is ready and tested
- ✅ All changes are committed to git
- ✅ Google Play Developer account is set up
- ✅ Android development environment is working
- ✅ **Remove any debug keystore shortcuts** (see Step 0 below)

---

## 🚀 **Step-by-Step Deployment Process**

### **Step 0: Clean Debug Keystores (Important!)**

```powershell
# In project root: c:\SOURCE-ACTIVE\ionic\qr-code\
# Remove or rename any debug keystore shortcuts
ren "keystore - Verknüpfung.lnk" "keystore-debug-backup.lnk"
```

**Why:** Prevents automatic debug signing and ensures proper release signing

### **Step 0a: Create Upload Keystore (FIRST TIME ONLY!)**

> ⚠️ **Do this ONLY ONCE per app - then reuse the same keystore for all future updates**

```powershell
# In project root: c:\SOURCE-ACTIVE\ionic\qr-code\
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

**You'll be prompted for:**

1. **Keystore password** (e.g., `MySecurePassword123!`) - **SAVE THIS SECURELY!**
2. **Key password** (use same as keystore password)
3. **Your name** (e.g., Hans Zöchbauer)
4. **Organization** (e.g., Development)
5. **City, State, Country** (e.g., AT for Austria)

**Then create keystore.properties:**

```powershell
# Create android/keystore.properties with your passwords
cd android
# Edit keystore.properties file:
```

```properties
storePassword=YOUR_SECURE_PASSWORD_HERE
keyPassword=YOUR_SECURE_PASSWORD_HERE
keyAlias=upload
storeFile=../../upload-keystore.jks
```

**⚠️ CRITICAL:**

- **Save your keystore password securely** - you need it for ALL future updates
- **Backup your upload-keystore.jks file** - losing it means you can't update your app
- **Never share or commit** the keystore.properties file to git
- **See ANDROID_BACKUP_STRATEGY.md** for complete backup instructions

### **Step 1: Update Version Numbers (For Updates Only)**

> ⚠️ **Skip this step for first-time upload**

```powershell
# Edit android/app/build.gradle
# Increment these values:
versionCode 3        # Previous: 2
versionName "1.2"    # Previous: "1.1"
```

### **Step 2: Build Production Ionic App**

```powershell
# In project root: c:\SOURCE-ACTIVE\ionic\qr-code\
ionic build --prod
```

**Expected:** Build completes successfully (warnings are normal)

### **Step 3: Sync with Capacitor**

```powershell
npx cap sync android
```

**Expected:** Web assets copied to Android project

### **Step 4: Generate Signed App Bundle**

```powershell
# Navigate to Android directory
cd android

# Generate the signed bundle
.\gradlew bundleRelease
```

**Expected:** `BUILD SUCCESSFUL` message

### **Step 5: Locate Your App Bundle**

Your signed `.aab` file is located at:

```
android\app\build\outputs\bundle\release\app-release.aab
```

### **Step 6: Upload to Google Play Console**

1. **Go to:** [Google Play Console](https://play.google.com/console)
2. **Select:** Your app (or create new app for first upload)
3. **Navigate to:** Production → Releases
4. **Click:** "Create new release"
5. **Upload:** `app-release.aab` file
6. **Fill in:** Release notes
7. **Review and publish**

---

## 🔐 **App Signing Configuration**

### **For First Upload:**

- ✅ Use **Google Play App Signing** (recommended)
- ✅ Let Google manage your app signing key
- ✅ Your upload will work with debug signing initially

### **For Subsequent Updates:**

- ✅ Same process - Google handles signing automatically
- ✅ Just increment version numbers before building

---

## 📁 **File Locations Reference**

| File                | Location                                                   | Purpose                                |
| ------------------- | ---------------------------------------------------------- | -------------------------------------- |
| **App Bundle**      | `android\app\build\outputs\bundle\release\app-release.aab` | Upload this to Google Play             |
| **Version Config**  | `android\app\build.gradle`                                 | Update `versionCode` and `versionName` |
| **Screenshots**     | `upload-to-google-playstore\*.png`                         | Use for store listing                  |
| **Feature Graphic** | `upload-to-google-playstore\feature-graphic-final.png`     | Store listing banner                   |
| **App Icon**        | `upload-to-google-playstore\app-icon-512px.png`            | Store listing icon                     |

---

## ⚠️ **Important Notes**

### **Version Management:**

- **versionCode:** Must increase by 1 for each update (1, 2, 3, 4...)
- **versionName:** User-facing version (1.0, 1.1, 1.2, 2.0...)
- **First upload:** Keep existing numbers if never uploaded before

### **Common Issues:**

- **Build fails:** Make sure you're in the correct directory
- **Upload rejected:** Check if version numbers are higher than previous
- **Signing errors:** Google Play App Signing will handle this

### **Quality Checklist:**

- [ ] App tested on device/emulator
- [ ] All features working correctly
- [ ] Screenshots and store listing updated
- [ ] Version numbers incremented (for updates)
- [ ] Release notes written

---

## 🎯 **Quick Command Sequence**

For experienced use, here's the complete sequence:

```powershell
# 1. Update version (if needed) in android/app/build.gradle
# 2. Build and deploy
ionic build --prod
npx cap sync android
cd android
.\gradlew bundleRelease
cd ..
# 3. Upload: android\app\build\outputs\bundle\release\app-release.aab
```

---

## 📞 **Need Help?**

- Check this guide first
- Verify all prerequisites
- Ensure you're in the correct directory
- Test the app before building

**Success indicator:** `BUILD SUCCESSFUL` message and `.aab` file created

---

_Last updated: July 13, 2025_  
_App: z-control QR Code Generator_
