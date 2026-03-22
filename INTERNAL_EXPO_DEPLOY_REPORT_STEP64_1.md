# INTERNAL_EXPO_DEPLOY_REPORT_STEP64_1

Date: 2026-03-22  
Scope: `goldpenny-backend/PFT/pft-expo`  
Terminal rule followed: Git Bash command execution only (via `C:\Program Files\Git\bin\bash.exe`)

## 1) Summary

Internal Expo deployment prep is in a good state after validation and two fixes:

- EAS project linkage is now valid for the current account/project metadata.
- TypeScript scope is now limited to mobile app code (`app` + `src`), so `yarn typecheck` passes.

Current deployment readiness:
- Android internal build: ready (profile `development` or `preview`).
- iOS internal build: ready via `preview` profile (credentials required in EAS).

## 2) Validation Results

### App config readiness

Verified in `app.json`:
- App identity configured
  - name: `Gold Penny`
  - scheme: `goldpenny`
  - android package: `com.pennyfloat.goldpenny`
  - ios bundle ID: `com.pennyfloat.goldpenny`
- Runtime/update configured
  - `runtimeVersion.policy = appVersion`
  - `updates.enabled = true`
  - `updates.checkAutomatically = ON_LOAD`
  - `updates.url` present
- Icon/splash assets present and valid
  - `src/assets/images/icon.png` (1024x1024)
  - `src/assets/images/splash-icon.png` (1024x1024)
  - adaptive icon files present

### EAS config/build profiles

Verified in `eas.json`:
- `development` profile
  - `distribution: internal`
  - `developmentClient: true`
  - Android build type `apk`
- `preview` profile
  - `distribution: internal`
  - Android build type `apk`
- `production` profile
  - `distribution: store`
  - Android build type `app-bundle`

### EAS auth/project/channel status

- `npx eas whoami` => authenticated as `nntpress`
- `npx eas project:info` => linked project `@nntpress/nnt-expo`
- `npx eas build:list --limit 1 --non-interactive` => successful
- `npx eas channel:list` => `preview` and `production` channels exist

Note:
- `preview` currently points at branch `production` (not ideal for staged OTA separation).

### Environment variable validation

Local template (`.env.example`) includes:
- `EXPO_PUBLIC_BACKEND` (required)
- `EXPO_PUBLIC_RPC_URL` (optional wallet/signing)
- `EXPO_PUBLIC_WC_PROJECT_ID` (optional wallet/signing)
- `EXPO_PUBLIC_DEBUG` (optional)

Code usage currently confirms:
- actively used: `EXPO_PUBLIC_BACKEND`, `EXPO_PUBLIC_DEBUG`
- optional wallet envs are documented for future/optional flows

EAS hosted env status:
- `development`: no vars configured
- `preview`: no vars configured
- `production`: no vars configured

## 3) Quality Gate Results (Git Bash)

- `yarn typecheck` => pass
- `yarn lint` => pass with warnings (no errors)

Lint warnings are non-blocking for build.

## 4) Changes Made During Prep

### `app.json`

- Re-linked project metadata through EAS init flow.
- Resulting current metadata:
  - `slug: "nnt-expo"`
  - `owner: "nntpress"`
  - `extra.eas.projectId` populated and valid

### `tsconfig.json`

- Scoped includes to mobile code only:
  - `app/**/*.ts(x)`
  - `src/**/*.ts(x)`
- Excluded `web-bridge` from Expo app typecheck scope.

This removed cross-project TypeScript collisions and unblocked `yarn typecheck`.

## 5) Exact Git Bash Commands

Run from Git Bash:

```bash
cd /c/GoldPenny/goldpenny-backend/PFT/pft-expo
```

### Install

```bash
yarn install --frozen-lockfile
```

### Login / EAS checks

```bash
npx eas --version
npx eas whoami || npx eas login
npx eas project:info
npx eas build:list --limit 1 --non-interactive
```

### Configure EAS env vars for internal testing

Set at least `EXPO_PUBLIC_BACKEND` for `development` and `preview`:

```bash
npx eas env:create development --name EXPO_PUBLIC_BACKEND --value "https://<your-internal-api>" --visibility plaintext --scope project
npx eas env:create preview --name EXPO_PUBLIC_BACKEND --value "https://<your-internal-api>" --visibility plaintext --scope project
```

Optional:

```bash
npx eas env:create development --name EXPO_PUBLIC_DEBUG --value "1" --visibility plaintext --scope project
npx eas env:create preview --name EXPO_PUBLIC_DEBUG --value "0" --visibility plaintext --scope project
npx eas env:create preview --name EXPO_PUBLIC_RPC_URL --value "https://<rpc-url>" --visibility sensitive --scope project
npx eas env:create preview --name EXPO_PUBLIC_WC_PROJECT_ID --value "<walletconnect-project-id>" --visibility sensitive --scope project
```

### Local quality checks

```bash
yarn typecheck
yarn lint
```

### Internal builds

Development client (Android internal APK):

```bash
npx eas build --profile development --platform android
```

Preview internal builds (recommended for QA/testers):

```bash
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
```

### Run app locally (if needed)

```bash
yarn start
# optional
yarn android
yarn ios
```

### OTA/update workflow (if needed)

Align preview channel to preview branch:

```bash
npx eas channel:edit preview --branch preview
```

Publish preview OTA:

```bash
npx eas update --branch preview --message "internal preview update"
```

Publish production OTA:

```bash
npx eas update --branch production --message "production update"
```

## 6) Final Readiness Verdict

Status: Ready for internal Expo/EAS device deployment.

Required before first tester rollout:
- Set `EXPO_PUBLIC_BACKEND` in EAS env for `preview` (and optionally `development`).

Recommended:
- Keep preview channel mapped to preview branch for clean staged OTA behavior.

