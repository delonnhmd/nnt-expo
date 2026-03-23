# STEP 71B — Real Device Build, Install, and Verification
**Gold Penny — Internal Launch Execution**
Date: 2026-03-23
Step: 71B (follows 71A Expo Readiness Audit)
Status: EXECUTION PLAN READY

---

## Overview

Step 71A completed all Expo + EAS config corrections.
Step 71B executes the internal launch: builds for real devices, installs, verifies gameplay end-to-end on iPhone, iPad, and two Android phones, tests OTA delivery, and produces a go/no-go recommendation.

**Devices:**
| Slot | Platform | Build Profile |
|---|---|---|
| Android #1 | Android | `development` (APK, no credentials) |
| Android #2 | Android | `development` or `preview` APK |
| iPhone | iOS | `preview` (internal .ipa) |
| iPad | iOS | `preview` (internal .ipa, same build) |

---

## Section 1 — Pre-Build Requirements

### 1.1 Required Accounts & Memberships

| Item | Requirement | Status |
|---|---|---|
| EAS account | `nntpress` Expo account | Must be logged in |
| Apple Developer Program | $99/yr — required for iOS sideload | Required before iOS build |
| Google Play (optional) | Free — not needed for APK sideload | Not required |
| Backend host | `EXPO_PUBLIC_BACKEND` secret set | Required before any launch |

### 1.2 One-Time Pre-Build Steps (run once, not per device)

These are performed in the `pft-expo` directory. They are not part of a CI pipeline — run them manually.

```bash
# 1. Log in to EAS CLI (skip if already authenticated)
npx eas login

# 2. Register iOS test device UDIDs (iPhone + iPad)
#    Device must be plugged in OR you paste a UDID you copy from Xcode / Settings
npx eas device:create
#    Follow the prompts to add both devices.
#    This registers UDIDs with your Apple Developer account so EAS can
#    generate provisioning profiles that include them.

# 3. Set the backend URL as an EAS project secret
#    Replace https://your-api-host.com with the real deployed backend URL.
npx eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_BACKEND \
  --value https://your-api-host.com

# 4. Confirm secrets are saved
npx eas secret:list
```

> **Note:** Steps 2–3 only need to be done once. Subsequent builds and OTA updates use the stored credentials and secrets automatically.

---

## Section 2 — Build Execution Plan

All commands run from:
```
cd c:\GoldPenny\goldpenny-backend\PFT\pft-expo
```

### 2.1 Step-by-step order

#### Phase A — Dependency & Validation (local, no cloud build credits)

```bash
# A1. Ensure all packages are installed at locked versions
yarn install

# A2. Doctor — validate SDK + dependency health (must be 17/17)
npx expo-doctor

# A3. TypeScript check — must pass with 0 errors
npx tsc --noEmit
```

Expected output:
- `yarn install` → "Done in X.XXs"
- `expo-doctor` → "17/17 checks passed. No issues detected!"
- `tsc` → *(silent, exit 0)*

If any check fails, resolve before proceeding to cloud builds.

---

#### Phase B — Android Build (no Apple credentials needed)

The `development` profile emits a sideloadable APK with `withoutCredentials: true`, meaning zero keystore setup is required. Install directly on Android without Google Play.

```bash
# B1. Android development APK — no credentials, installable as APK
yarn build:dev:android
# equivalent: eas build --profile development --platform android
```

or if you want a signed APK for pre-release testers:

```bash
# B2. Android preview APK — signed, internal distribution
yarn build:preview:android
# equivalent: eas build --profile preview --platform android
```

> **Recommendation:** Run `build:dev:android` first for Android #1. Use `build:preview:android` for Android #2 if you want autoIncrement applied and a shareable link.

**Where to get the APK:**  
EAS will print a URL like `https://expo.dev/accounts/nntpress/projects/gold-penny-expo/builds/...`  
Download the `.apk` from that URL or install via QR code shown in EAS dashboard.

**Install on Android device:**
1. Enable "Install from unknown sources" in Android Settings → Security.
2. Open the downloaded `.apk` on the device or use:
   ```bash
   adb install path/to/gold-penny.apk
   ```
3. If using `expo-dev-client`, the app will show a dev launcher — enter the Expo server URL or connect to EAS Update channel.

---

#### Phase C — iOS Build (requires Apple Developer Program + registered UDIDs)

```bash
# C1. iOS preview IPA — internal distribution, includes registered test devices
yarn build:preview:ios
# equivalent: eas build --profile preview --platform ios
```

EAS will:
1. Generate a provisioning profile covering the registered iPhone + iPad UDIDs.
2. Build the app on an Apple Silicon Mac (m-medium resource class).
3. Return a download link and/or Expo Go install link.

**Install on iPhone / iPad:**  
Option A (recommended): EAS will generate an install QR code in the build dashboard. Scan it from Safari on the iOS device to trigger OTA Expo install.  
Option B: Download the `.ipa` and install via Apple Configurator 2.  
Option C: If TestFlight distribution is desired later, that requires the `production` profile + App Store Connect setup (not needed now).

---

#### Phase D — OTA Update Test

> See Section 4 for the full OTA verification procedure.

```bash
# D1. Publish a JS-only update to the preview channel after devices are installed
yarn update:preview -- "test: OTA delivery verification"
# equivalent: eas update --channel preview --message "test: OTA delivery verification"
```

---

### 2.2 Build Command Reference Summary

| Command | Profile | Platform | Output | Credentials |
|---|---|---|---|---|
| `yarn build:dev:android` | development | Android | APK | None required |
| `yarn build:preview:android` | preview | Android | APK | Keystore (EAS managed) |
| `yarn build:preview:ios` | preview | iOS | IPA | Apple cert + provisioning |
| `yarn build:prod:android` | production | Android | AAB | Keystore (EAS managed) |
| `yarn build:prod:ios` | production | iOS | IPA | Apple cert + App Store |
| `yarn update:preview -- "msg"` | preview | Both | JS bundle | None |
| `yarn update:dev -- "msg"` | development | Both | JS bundle | None |

---

## Section 3 — Device Install Verification Checklist

Use this checklist for every device being verified. Mark each item P (Pass), F (Fail), or N/A.

### Checklist Template

```
Device: ___________________________
OS Version: _______________________
Build Profile Used: ________________
Install Date: _______________________

[ ] APK/IPA downloaded successfully
[ ] App installs without errors
[ ] App icon appears on home screen
[ ] App launches without crash on first open
[ ] Splash screen displays correctly (dark bg #0f172a)
[ ] Onboarding flow appears on first launch
[ ] Onboarding completes / can be dismissed
[ ] Player name / setup screen works
[ ] Day 1 gameplay loop loads
[ ] Player can take at least one work action
[ ] Day 1 can be settled / completed
[ ] End-of-day summary appears with earnings
[ ] Cash / stress / health stats display correctly
[ ] Day 2 loads after Day 1 settlement
[ ] Bottom tab bar is visible and navigable
[ ] No route errors / blank screens on navigation
[ ] Deep link goldpenny:// resolves (optional test)
[ ] App returns from background correctly
[ ] No crash after 5 minutes of idle
[ ] OTA update is received (after Section 4 test)
[ ] BUILD_TS label shows updated timestamp after OTA

Notes (UI / bugs / crashes):
_______________________________________________
_______________________________________________
```

### Tablet-Specific Items (iPad only)

```
[ ] Layout fills tablet width — not stretched phone UI
[ ] supportsTablet: true is effective (no letterboxing)
[ ] Tap targets are not oversized / misaligned on large display
[ ] Text legibility at tablet scale is acceptable
[ ] Orientation lock is respected (portrait forced per app.json)
```

### Android-Specific Items

```
[ ] Back button (gesture or hardware) works correctly
[ ] App does not request unexpected permissions on install
[ ] Deep link scheme goldpenny:// registers in Android settings
[ ] Status bar color matches app theme
[ ] No ANR (app not responding) dialogs during gameplay
```

### iOS-Specific Items

```
[ ] Home indicator area is not blocked by UI elements
[ ] Safe area insets respected on notch / Dynamic Island
[ ] No permission dialog appears unexpectedly on first run
[ ] TestFlight or direct install completes without trust warning
```

---

## Section 4 — OTA Verification Procedure

### Purpose

Verify that EAS Update can push a JS-only change to installed apps without requiring a new native build. This confirms the OTA pipeline used for soft launch patch delivery works correctly.

### The Change

The OTA test modifies a visible, non-functional label in `src/constants/index.ts`. The `BUILD_TS` constant is already displayed in some debug/dev surfaces, and this change will be detectable in any screen that shows a build timestamp.

**Before (current value):**
```ts
export const BUILD_TS = '2026-03-23T00:00:00Z';
```

**After (OTA marker):**
```ts
export const BUILD_TS = '2026-03-23T12:00:00Z';
```

This is a pure JS change — no native module, no new package, no schema change. It qualifies as a compatible OTA update under the `appVersion` runtime policy.

### OTA Test Steps

```bash
# 1. Make the BUILD_TS change in src/constants/index.ts
#    Change '2026-03-23T00:00:00Z' → '2026-03-23T12:00:00Z'

# 2. Publish to the preview channel
cd c:\GoldPenny\goldpenny-backend\PFT\pft-expo
yarn update:preview -- "test: OTA BUILD_TS marker 2026-03-23T12"

# 3. EAS CLI will output the update group ID and manifest URL, e.g.:
#    ✓ Published!  Update group ID: xxxxxxx
#    Channel: preview
#    Runtime version: 1.0.1

# 4. On each installed device:
#    a. Close the app fully (swipe away from app switcher)
#    b. Reopen the app
#    c. The app checks expo-updates ON_LOAD (per app.json)
#    d. The new JS bundle downloads in the background
#    e. Close and reopen the app a second time to load the new bundle

# 5. Verify the update was received:
#    - In any screen that shows BUILD_TS, confirm it now reads 12:00:00Z
#    - In Expo Dev Tools (if using development build), check update manifest
#    - Use the Expo Updates debug panel if available in dev build

# 6. Restore BUILD_TS after OTA is confirmed:
#    Change '2026-03-23T12:00:00Z' back → '2026-03-23T00:00:00Z'
#    This revert does NOT need to be pushed as an update — it will be included
#    in the next full build naturally.
```

### OTA Compatibility Rules

| Allowed in OTA | Not Allowed in OTA (requires new build) |
|---|---|
| JS/TS logic changes | Adding new native modules |
| UI text, colors, layout | Changing `app.json` plugins |
| New screens / routes | expo SDK version bump |
| API call changes | New native permissions |
| Bug fixes in existing code | Changes to `android/` or `ios/` native code |

### OTA Failure Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Update not received after reopen | Channel mismatch | Confirm app was built with `preview` profile |
| "Update unavailable" | runtimeVersion mismatch | Rebuild the app — JS bundle compiled against different native version |
| App crashes after OTA | New code uses uninstalled native module | Revert via `eas update --rollback` or push a fix update |
| Update downloaded but not applied | App not fully closed | Force-close and reopen |

---

## Section 5 — Launch Issue Log Format

Use one entry per device per test session. Store in a shared doc or paste into a GitHub issue.

```markdown
## Device Test Log — Gold Penny Internal Launch

### Entry
- **Date:** YYYY-MM-DD
- **Tester:** [name or initials]
- **Session:** Step 71B internal verification

---

**Device:** [e.g., iPhone 15 Pro]
**OS Version:** [e.g., iOS 18.3.1]
**Build Profile:** [development | preview]
**Build ID:** [from EAS dashboard, e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]
**App Version:** 1.0.1 (build 3)

**Install Result:** [✅ Success | ❌ Failed — describe]

**Gameplay Result:**
- Onboarding: [✅ Passed | ❌ failed at step: ___ ]
- Day 1 completed: [✅ | ❌]
- Summary shown: [✅ | N/A]

**UI Issues:**
- [ ] None
- [ ] Describe: ___________________

**Crash / Bug Notes:**
- [None observed]
- [Bug: describe exact screen, action, error message or crash type]

**OTA Update Received:** [✅ Yes / ❌ No / — Not tested]

**Overall:**  [✅ PASS — ready for soft launch | ⚠️ CONDITIONAL — minor issues |  ❌ BLOCK — critical issue]

---
```

---

## Section 6 — Build & Test Results

*This section is pre-populated with known state after Step 71A. Update each row as real device builds complete.*

### 6.1 Pre-Build Validation Results (Step 71A confirmed)

| Check | Result | Notes |
|---|---|---|
| `yarn install` | ✅ PASS | Lockfile saved, 45.50s |
| `npx expo-doctor` | ✅ PASS | 17/17 checks |
| `npx tsc --noEmit` | ✅ PASS | 0 errors |
| Android package ID | ✅ FIXED | `com.pennyfloat.goldpenny` in build.gradle + Kotlin |
| iOS buildNumber format | ✅ FIXED | `"3"` (integer string) |
| OTA enabled | ✅ FIXED | AndroidManifest `"true"` |
| Deep-link schemes | ✅ FIXED | `goldpenny`, `exp+gold-penny-expo` |
| `expo-dev-client` in plugins | ✅ FIXED | Added to `app.json` |
| `supportsTablet` | ✅ FIXED | `true` |

### 6.2 Build Results (fill as builds complete)

| Build | Profile | Platform | EAS Build ID | Result | APK/IPA URL |
|---|---|---|---|---|---|
| Android #1 | development | Android | — | PENDING | — |
| Android #2 | development | Android | — | PENDING | — |
| iPhone | preview | iOS | — | PENDING | — |
| iPad | preview | iOS | — | PENDING | (same IPA as iPhone) |

### 6.3 Device Verification Matrix (fill after installs)

| Device | Install | Launch | Onboarding | Day 1 | Summary | OTA | Result |
|---|---|---|---|---|---|---|---|
| Android #1 | — | — | — | — | — | — | PENDING |
| Android #2 | — | — | — | — | — | — | PENDING |
| iPhone | — | — | — | — | — | — | PENDING |
| iPad | — | — | — | — | — | — | PENDING |

### 6.4 OTA Verification Result

| Channel | Update Published | Android #1 Received | Android #2 Received | iPhone Received | iPad Received |
|---|---|---|---|---|---|
| preview | PENDING | — | — | — | — |

---

## Section 7 — Soft Launch Go / No-Go

### Criteria

| Criterion | Required | Status |
|---|---|---|
| Android APK installs cleanly | Yes | PENDING |
| iOS .ipa installs cleanly | Yes | PENDING |
| App launches without crash | Yes | PENDING |
| Onboarding completes | Yes | PENDING |
| Day 1 settles correctly | Yes | PENDING |
| OTA update delivered | Yes | PENDING |
| Backend responds to API requests | Yes | PENDING — requires `EXPO_PUBLIC_BACKEND` set |
| No layout breakage on iPad | Yes | PENDING |
| No data loss on app reopen | Yes | PENDING |

### Blockers Found (update as tests run)

| # | Device | Issue | Severity | Resolution |
|---|---|---|---|---|
| — | — | — | — | — |

### Recommendation

```
CURRENT STATE: PENDING DEVICE BUILDS

Pre-build state: GO (all 71A blockers resolved, expo-doctor 17/17, tsc clean)
Device verification: PENDING (builds not yet submitted)

Next action required:
  1. Set EXPO_PUBLIC_BACKEND secret (npx eas secret:create ...)
  2. Register iOS device UDIDs (npx eas device:create)
  3. Run yarn build:dev:android → install on 2 Android phones
  4. Run yarn build:preview:ios → install on iPhone + iPad
  5. Fill in Section 6 verification matrix
  6. Publish OTA test update and confirm delivery
  7. Update this document with results
  8. Issue final GO / NO-GO based on results
```

---

## Section 8 — Remaining Housekeeping (Non-Blocking)

These items do not block the internal launch but should be resolved before public release.

| Item | Priority | Action |
|---|---|---|
| Kotlin source directory `com/yourcompany/nnt/` | Low | `git mv android/app/src/main/java/com/yourcompany/nnt android/app/src/main/java/com/pennyfloat/goldpenny` |
| Stale app routes (`/post`, `/claim`, `/referral`) | Medium | Add 404 redirect or `notFound()` guard |
| `.env.local` not in `.gitignore` | Check | Confirm `.env.local` is in `.gitignore` |
| Apple provisioning cert renewal process | Low | Document before cert expiry (1 year from first build) |
| Backend URL (`EXPO_PUBLIC_BACKEND`) in EAS secrets | **Required** | `npx eas secret:create --scope project --name EXPO_PUBLIC_BACKEND --value ...` |

---

## Section 9 — Quick Reference

### All EAS Build Commands

```bash
# From: c:\GoldPenny\goldpenny-backend\PFT\pft-expo

# Android (no credentials)
yarn build:dev:android

# Android (signed APK)
yarn build:preview:android

# iOS (requires Apple Dev account + UDIDs registered)
yarn build:preview:ios

# OTA push (JS-only, no rebuild)
yarn update:preview -- "description of change"
yarn update:dev -- "description of change"

# List active secrets
npx eas secret:list

# List registered devices
npx eas device:list

# Check current update status
npx eas update:list --branch preview
```

### Runtime Version Policy Note

The `runtimeVersion.policy` is `"appVersion"` (from `app.json`).  
This means:
- OTA updates are only delivered to builds with **the same `version` string** (`"1.0.1"`).
- If `version` changes to `"1.0.2"`, a new native build is required before OTA updates apply.
- Incrementing `versionCode` / `buildNumber` alone does **not** break OTA compatibility.

### Channel → Build Profile Mapping

| EAS Update Channel | Built With Profile | When to Use |
|---|---|---|
| `development` | `development` | Active development, dev-client APK/IPA |
| `preview` | `preview` | Internal testers, no App Store |
| `production` | `production` | App Store / Google Play |

---

*Report prepared for Step 71B — Gold Penny Internal Launch Execution.*
*All pre-build conditions confirmed by Step 71A Expo Readiness Audit (2026-03-23).*
