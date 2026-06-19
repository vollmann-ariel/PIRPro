# PIRPro

PIRPro is an Android field-inspection app built with Expo / React Native. It lets an auditor log defects ("problems") found while testing a vehicle — photos, a written or voice-dictated description, a severity score, plant of origin, and GPS coordinates — and groups them under an **Inspection** (test type + vehicle VIN), since a single inspection can span multiple sessions over several weeks.

## Features

- **Inspections**: pick a test type (PAT / SD / PPV / Screening) and search or create a VIN. Typo-tolerant search suggests similar existing VINs (Levenshtein distance) to avoid splitting data across duplicate inspections.
- **Problems (defects)**: each one requires at least 3 photos (camera or gallery), a description (with optional voice dictation), a severity level (3/6/20/50), and a plant of origin (BR/AR). GPS coordinates are captured automatically in the background and never block saving if unavailable.
- **PIR flag**: any problem can be marked as a Product Incident Report.
- **Editing**: problems can be edited after creation, including adding/removing photos.
- **Local export**: generate a CSV + photo bundle (ZIP) for an inspection, shareable via the OS share sheet.
- **Settings**: configurable photo compression preset and user name.
- All data is stored locally on-device with SQLite (`expo-sqlite`) and the filesystem (`expo-file-system`) — no backend required for this phase.

## Planned (Phase 2)

Microsoft/OneDrive sign-in with incremental sync of inspections to a shared corporate OneDrive folder, plus shareable organization-scoped links. Blocked on registering an Azure AD app (single-tenant) to obtain a Client ID.

## Tech Stack

- [Expo](https://expo.dev) / React Native, TypeScript
- `expo-sqlite` for local storage, `expo-file-system` for photo storage
- `expo-image-picker` + `expo-image-manipulator` for capture and compression
- `expo-speech-recognition` for voice dictation, `expo-location` for GPS
- `@react-navigation/native` (native-stack) for navigation
- `fastest-levenshtein` for fuzzy VIN matching
- `fflate` for ZIP export

## Getting Started

```bash
npm install
npx expo start
```

This app uses native modules (voice dictation, file system, location) that require a **development client** rather than Expo Go:

```bash
npx eas build --profile development -p android
```

Build a distributable APK with:

```bash
npx eas build -p android --profile preview
```

## Project Structure

```
src/
  screens/        Inspection picker, problem list/detail/new, export, settings
  navigation/      React Navigation stack setup
  db/              SQLite schema and repositories (inspections, reports)
  storage/         Photo file storage and compression
  export/          CSV and local ZIP export
  location/        GPS capture
  voice/           Voice dictation hook
  components/      Reusable UI (photo grid, segmented selectors, description field)
  utils/           Shared helpers (ids, text, photo picker, confirmation dialogs)
  types/           Shared TypeScript types
```
