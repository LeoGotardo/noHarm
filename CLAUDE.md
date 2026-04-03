# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NoHarm** is a React Native (Expo) mobile app for addiction recovery support. It features a clean-day streak tracker, friends system, emergency resources, and progress analytics. The UI is in Portuguese.

## Development Commands

```bash
npm install          # Install dependencies
npm start            # Launch Expo dev server (Expo Go or web)
npm run android      # Run on Android emulator/device
npm run ios          # Run on iOS simulator/device
npm run web          # Run in browser
```

No test runner or linter is configured yet.

## Architecture

### Component Hierarchy

The app uses a three-tier component model:

```
screens/   → Full-page views (assembled from components)
components/ → Domain-specific composite blocks
atom/       → Primitive, stateless UI elements
```

### Navigation

Navigation is purely state-based — no routing library. `HomeScreen.jsx` is the root component that owns all navigation state (`currentScreen`, `menuOpen`, `resetModalOpen`, `cleanDays`) and renders one of 5 screens conditionally. There is no React Navigation or Expo Router.

### State Management

All state lives locally in `HomeScreen`. Data is currently hardcoded (mock). No persistence layer (AsyncStorage not yet implemented). The app is designed for future backend integration via JWT-authenticated REST APIs.

### Styling

NativeWind (Tailwind CSS for React Native) with a custom dark theme. Extended Tailwind palette with `slate-850` and `slate-950`. Bootstrap Icons loaded via CDN `<link>` tag embedded inside `HomeScreen.jsx`. Heavy use of inline `<style>` tags for custom animations (shimmer, pulse).

### Entry Point Flow

`index.js` → `registerRootComponent(App)` → `App.js` → `HomeScreen` (renders everything)

Note: `App.js` calls `HomeScreen()` as a plain function call rather than JSX — this works but is unconventional.

## Key Files

| File | Purpose |
|------|---------|
| `screens/HomeScreen.jsx` | Root component + all navigation state |
| `tailwind.config.js` | Custom slate color extensions (slate-850, slate-950) |
| `app.json` | Expo config — portrait-only, edge-to-edge Android, newArch enabled |
| `prototype.html` | Standalone vanilla HTML/CSS/JS prototype (no build needed, useful for UI reference) |
| `test.jsx` | Single-file React sandbox for rapid component iteration |

## Known Issues

- `screens/FrendsScreen.jsx` has a typo in the filename (missing 'i').
- No error boundaries, loading states, or API integration yet — all data is hardcoded mock values.
