# Upgrade QR App: Angular 18 → 20 (Stepwise Guide)

This document describes a safe, repeatable process to upgrade the QR app from Angular 18 to Angular 20.

## Summary

- **Goal:** Upgrade Angular 18 → 19 → 20, update peers (TypeScript, RxJS), verify Ionic/Capacitor compatibility, and validate on web and Android.
- **Strategy:** Incremental `ng update` migrations, run builds/tests after each major step, and keep a rollback branch.

## Pre-Upgrade Checklist

- **Create branch:** `git checkout -b upgrade/angular-18-to-20`
- **Commit work-in-progress:** `git add -A && git commit -m "wip: before angular upgrade"`
- **Record environment:** `node -v` (Volta pinned), `npm -v`, `npx ng --version`
- **List outdated deps:** `npm outdated > upgrade-deps.txt`
- **Read release notes:** Angular 19/20, `@ionic/angular`, `@capacitor/*`, and critical third-party libs (`angularx-qrcode`, `ngx-markdown`, etc.).
- **CI & backups:** Ensure CI passes on the base branch and you can revert with your branch/PR.

## Stepwise Upgrade Commands

1. Prepare

```bash
# from project root
git checkout -b upgrade/angular-18-to-20
npm ci
npx ng --version
```

2. Angular 18 → 19

```bash
npx ng update @angular/core@19 @angular/cli@19
npm install
git add -A && git commit -m "chore: upgrade angular 18->19"
```

3. Build & test after 19

```bash
npm run build
npm test
npm run lint
```

Fix compilation/template/runtime issues before continuing.

4. Angular 19 → 20

```bash
npx ng update @angular/core@20 @angular/cli@20
npm install
git add -A && git commit -m "chore: upgrade angular 19->20"
```

5. Update peer deps shown by `ng update` (TypeScript, RxJS, etc.)

    Follow ng update output: it will list required TypeScript and RxJS versions.

```bash
# Example (follow ng update output)
npm install typescript@<required-version> --save-dev
npm install rxjs@<required-version>
```

6. Ionic / Capacitor / Plugins

- Check compatibility for `@ionic/angular` and `@capacitor/*` with Angular 20.
- If upgrading plugins run:

```bash
npm install @ionic/angular@<target> @capacitor/core@<target> @capacitor/cli@<target> @capacitor/android@<target>
npx cap sync
```

7. Android Gradle wrapper (if needed for AGP compatibility)

```bash
cd android
gradlew.bat wrapper --gradle-version 9.2.0 --distribution-type bin
cd ..
```

If you prefer to pin the JDK used by Gradle, add to `android/gradle.properties`:

```
org.gradle.java.home=C:/Program Files/Java/jdk-21.0.2
```

## Testing Checklist (after each major step)

- **Web dev server:** `npm start` — smoke test main flows.
- **Production build:** `npm run build` — verify no errors and inspect bundle.
- **Unit tests:** `npm test` — resolve failing tests.
- **E2E tests:** `npm run e2e` — run and verify flows.
- **Ionic native:** `ionic build && npx cap sync android` then `ionic cap run android --external` or open Android Studio and run on device.
- **Device smoke:** Camera/QR scan, storage, permissions, and any native plugin behavior.

## Rollback Plan

- If upgrade is broken, reset to main and delete branch, or revert commits:

```bash
git checkout main
git branch -D upgrade/angular-18-to-20
```

Or use `git revert` on the upgrade commits and open a PR for fixes.

## Troubleshooting & Tips

- Run migrations incrementally; do not jump to Angular 20 in a single step.
- If `ng update` lists migrations, run them and follow prompts.
- Remove `node_modules` and lockfile if dependency resolution is stuck:

```bash
rm -rf node_modules package-lock.json
npm install
```

- For Android issues after plugin upgrades: `npx cap sync android && cd android && gradlew.bat clean assembleDebug`.
- If the IDE picks a different Gradle than the wrapper, configure Android Studio to use the Gradle wrapper and VS Code to not import `node_modules` Gradle projects.

## Acceptance / Sign-off

- All unit tests pass.
- E2E smoke flows succeed on device.
- Android build produces an installable debug/release artifact and manual QA verifies camera and plugin flows.

## If upgrade is not possible

Open a PR with the upgrade branch and document blockers, then revert to main and continue development on Angular 18 until blockers are resolved.

- Stay on Angular 18. Do these maintenance steps:
- Keep dependencies up-to-date within the same major (use npm update / npm audit fix).
- Upgrade Capacitor plugins to versions compatible with Capacitor 7 (you already have Capacitor 7).
- Apply backported fixes or shims for libraries that require newer Angular features.
- Make a plan to migrate later (maintain a compatibility test suite).

## References

- Angular update guide: https://update.angular.io/
- Capacitor docs: https://capacitorjs.com/docs
- Ionic docs: https://ionicframework.com/docs
