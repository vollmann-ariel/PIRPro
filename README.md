# PIRPro

PIRPro is an Android field-inspection app built with Expo / React Native. It lets an auditor log defects found while testing a vehicle — photos, videos, a written or voice-dictated description, a severity score, plant of origin, and GPS coordinates — and groups them under an **Inspection** (test type + vehicle VIN), since a single inspection can span multiple sessions over several weeks.

## Features

- **Inspections**: a flat list of all inspections ordered by recent activity. Each entry shows a color-coded type badge (PAT / SD / PPV / Screening) and the vehicle VIN. A FAB (+) opens a modal to create a new inspection with VIN input, type selector, and fuzzy duplicate detection (Levenshtein distance) to avoid splitting data across similar VINs. Long-press any entry to export, rename the VIN, or delete.
- **Observations (defects)**: each one requires at least 3 photos, a description (with optional voice dictation), a severity level (Obs / 3 / 6 / 20 / 50 / 100), and a plant of origin. GPS coordinates are captured in the background and never block saving.
- **Multi-select**: long-press any observation in the list to enter selection mode. Tap additional items to add them to the selection. A bottom action bar appears with **Export** and **Delete** actions. Back gesture exits selection mode.
- **Photos**: taken with the integrated in-app camera (stays open between shots) or picked from the gallery. Configurable compression preset (light / medium / high quality).
- **Videos**: recorded via the native camera or picked from the gallery (max 3 per observation). Stored at original quality. Tap the ▶ tile to play fullscreen via `expo-video`.
- **Observation fields**: title, severity, plant of origin, hours, PIR flag, repetitive flag, reported-by-plant flag, observation type (PAT / SD / OBS for PPV inspections), and product scope (New Product / Current Product).
- **Editing**: observations can be edited after creation, including adding or removing photos and videos.
- **Local export**: generates an XLSX report + photo/video bundle (ZIP) for an inspection or a selected subset. The spreadsheet has one row per observation with all fields and hyperlinked photo/video columns. Shareable via the OS share sheet. Partial exports (from multi-select) show a warning before proceeding.
- **Settings**: configurable photo compression preset and user name.
- All data is stored locally on-device with SQLite (`expo-sqlite`) and the filesystem (`expo-file-system`) — no backend required.

## Tech Stack

- [Expo](https://expo.dev) SDK 56 / React Native, TypeScript
- `expo-sqlite` for local storage, `expo-file-system` for photo and video storage
- `expo-camera` (integrated in-app camera), `expo-image-picker` (gallery + native camera for videos)
- `react-native-compressor` for photo compression
- `expo-video` for video playback
- `expo-speech-recognition` for voice dictation, `expo-location` for GPS
- `@react-navigation/native` (native-stack) for navigation
- `fastest-levenshtein` for fuzzy VIN matching
- `xlsx` (SheetJS) for spreadsheet generation, `fflate` for ZIP export

## Getting Started

```bash
npm install
npx expo start
```

This app uses native modules (voice dictation, file system, location, video) that require a **development client** rather than Expo Go:

```bash
npx eas build --profile development -p android
```

Build a distributable APK locally with:

```bash
cd android && ./gradlew assembleRelease
```

## Project Structure

```
src/
  screens/        Inspection picker, observation list/detail/new, export, settings
  navigation/     React Navigation stack setup
  db/             SQLite schema and repositories (inspections, reports, videos)
  storage/        Photo and video file storage and compression
  export/         XLSX generation and local ZIP export
  location/       GPS capture
  voice/          Voice dictation hook
  components/     Reusable UI (media grid, video overlay, camera, context menu, …)
  utils/          Shared helpers (ids, photo/video picker, confirmation dialogs)
  types/          Shared TypeScript types
```
