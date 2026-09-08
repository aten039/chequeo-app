# Chequeo-precios - Project Structure

## Overview
This is an Expo application using **Expo Router** for navigation. The project follows a clean architecture with separation of concerns.

## Directory Structure

### `app/` - Routing (Expo Router)
- **Purpose**: Handles all navigation, tabs, and screen stacking
- **Convention**: File-based routing - each file becomes a route
- **Structure**:
  - `app/(tabs)/` - Tab navigator container
    - `_layout.tsx` - Tab bar configuration (hides default tab bar, provides custom)
    - `index.tsx` - Home screen (root route)
    - `profile.tsx` - Profile screen
    - `settings.tsx` - Settings screen
- **Key files**:
  - `app/(tabs)/_layout.tsx` - Configures the tab navigator, sets `tabBar={() => null}` to hide default
  - `app/index.tsx` - Entry point if needed (Expo Router uses file-based routing)

### `src/components/` - Reusable UI Components
- **Purpose**: Visual components that don't know about navigation or data
- **Contents**: Buttons, Cards, Inputs, etc.
- **Example structure**:
  - `src/components/Button.tsx` - Reusable button component
  - `src/components/Card.tsx` - Reusable card component
  - `src/components/Input.tsx` - Input field component

### `src/database/` - SQLite & Data Logic
- **Purpose**: All SQLite operations, queries, and repositories
- **Contents**:
  - Database connection setup
  - Query functions
  - Repository patterns for data access
- **Note**: Created in step 2 of the plan

### `src/services/` - Import/Export Logic
- **Purpose**: CSV import/export functionality
- **Contents**:
  - CSV parsing and validation
  - File reading/writing
  - Data transformation

## Key Configuration Files

### `package.json`
- `"main": "expo-router/entry"` - Points Expo Router as the entry point
- Dependencies: `expo-router`, `expo-sqlite`, `lucide-react-native`, `nativewind`, `tailwindcss`

### `tailwind.config.js`
```js
content: [
  "./app/**/*.{js,jsx,ts,tsx}", 
  "./src/**/*.{js,jsx,ts,tsx}"
],
```
- Scans both `app/` (routes) and `src/` (components) for Tailwind class names

### `babel.config.js`
```js
plugins: ["nativewind/babel"],
```
- Enables Tailwind Just-In-Time processing

### `app.json`
- Includes `expo-router` and `expo-status-bar` plugins
- Configures orientation, icons, and platform-specific settings

## Navigation Patterns

### Tabs
- Created using `(tabs)` folder convention in Expo Router
- Each file inside becomes a tab item
- `_layout.tsx` customizes the tab bar behavior

### Stacks
- Created using regular folder nesting (e.g., `(auth)/login.tsx`)
- Back navigation handled automatically by Expo Router

## Development Commands

- `npm run start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS (macOS required)
- `npm run web` - Run in web browser

## Adding New Screens

1. **Tab screen**: Add file to `app/(tabs)/`
2. **Stack screen**: Create nested folder structure like `app/(auth)/login.tsx`
3. **Component**: Add to `src/components/`
4. **Database query**: Add to `src/database/`
5. **Service**: Add to `src/services/`