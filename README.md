# Nari - Privacy-First Cycle Tracker

Nari is a discreet, local-first period and cycle tracker designed with privacy as its core principle.

## Core Features

- **Local-First Persistence**: All your data stays on your device using IndexedDB. No accounts, no cloud sync, no tracking.
- **PWA Support**: Install Nari as a native app on your home screen. Works fully offline.
- **Smart Predictions**: Predicts your next period and fertile window based on your local history.
- **One-Handed Logging**: Quick entry for symptoms, moods, and notes in just a few taps.
- **Data Ownership**: Export your data to JSON, CSV, or PDF anytime. Full data wipe available in settings.
- **App Lock**: Secure your data with a passcode or biometric lock.

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Animations**: motion (framer-motion)
- **Icons**: lucide-react
- **Storage**: IndexedDB (via `idb` library)
- **Date Logic**: date-fns
- **Exports**: jsPDF for PDF generation

## Privacy Note

Nari does not use any third-party analytics, ads, or tracking. Your data is yours alone.

## Setup

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Build for production: `npm run build`
