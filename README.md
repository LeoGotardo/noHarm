# noHarm — Mobile App

Frontend of the **NoHarm** application — a mobile app for addiction recovery support.

**Stack:** React Native · Expo · Tailwind CSS (NativeWind)

---

## What is NoHarm?

NoHarm helps people in recovery by providing:
- A **clean-days counter** (streak tracker)
- A **friends system** with mutual support
- **Real-time chat** between users
- **Emergency resources** (CVV 188, CAPS, SAMU 192)
- A **badges/achievements** system for recovery milestones
- A **progress screen** with streak history and statistics

---

## Project Structure

```
noHarm/
├── atom/                   # Primitive UI components (no state, no logic)
│   ├── Avatar.jsx
│   ├── Badge.jsx
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Header.jsx
│   ├── IconButon.jsx
│   └── Modal.jsx
├── components/             # Composite components (assemble atoms)
│   ├── ActionCard.jsx
│   ├── ButtonNavigation.jsx
│   ├── CounterCard.jsx
│   ├── EmergencyButton.jsx
│   ├── EmergencyCard.jsx
│   ├── MilestoneItem.jsx
│   ├── ProgressBar.jsx
│   ├── ResetModal.jsx
│   ├── SearchBox.jsx
│   ├── SideMenu.jsx
│   ├── StatCard.jsx
│   └── StatsGrid.jsx
├── screens/                # Full-screen views
│   ├── HomeScreen.jsx      # Root component + navigation state
│   ├── ChatScreen.jsx
│   ├── FrendsScreen.jsx
│   ├── HelpScreen.jsx      # Emergency resources
│   └── ProgressScreen.jsx
├── styles/
│   └── global.css
├── assets/                 # Icons, splash screen, adaptive icon
├── App.js                  # Expo entry point
├── index.js                # registerRootComponent
├── app.json                # Expo config
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── test.jsx                # Self-contained prototype (all components in one file)
```

---

## Component Architecture

The UI follows a layered component model:

```
Screen
  └─ assembles → Components
                    └─ assemble → Atoms
```

### Atoms (`atom/`)

Stateless, purely presentational. Accept only display props.

| Component | Props | Description |
|-----------|-------|-------------|
| `Avatar` | `children`, `gradient`, `size` | Circular avatar with gradient background |
| `Badge` | `children`, `variant` (`primary`/`danger`/`success`) | Small label pill |
| `Button` | `children`, `variant`, `onClick`, `disabled`, `className` | Gradient action button |
| `Card` | `children`, `className` | Rounded slate container |
| `Header` | `onMenuClick` | App bar with logo and menu toggle |
| `IconButton` | `icon`, `onClick`, `variant` | Square icon-only button |
| `Modal` | `isOpen`, `onClose`, `children` | Full-screen overlay modal |

### Components (`components/`)

Assemble atoms into domain-specific blocks.

| Component | Key Props | Description |
|-----------|-----------|-------------|
| `ActionCard` | `icon`, `title`, `description`, `onClick` | Tappable action row with icon |
| `ButtonNavigation` | `active`, `onClick`, `icon`, `label`, `badge` | Bottom nav tab item |
| `CounterCard` | `days`, `onReset`, `onSupport` | Main streak display with progress bar |
| `EmergencyCard` | `icon`, `title`, `subtitle`, `buttonText`, `buttonVariant`, `buttonIcon`, `onClick` | Emergency contact card |
| `MilestoneItem` | `icon`, `name`, `date`, `achieved` | Single milestone row |
| `ProgressBar` | `value`, `max`, `label` | Labelled progress bar |
| `ResetModal` | `isOpen`, `onClose`, `onConfirm` | Confirmation modal with text input guard |
| `SearchBox` | `placeholder`, `value`, `onChange` | Styled text input |
| `SideMenu` | `isOpen`, `onClose`, `onNavigate` | Slide-in navigation drawer |
| `StatCard` | `icon`, `label`, `value` | Compact stat display |
| `StatsGrid` | `children` | 2-column grid wrapper |

### Screens (`screens/`)

`HomeScreen.jsx` is the root component. It owns all navigation state and renders the correct screen based on `currentScreen`.

| Screen | Component | Data Source |
|--------|-----------|-------------|
| Home | `HomeScreen` | `cleanDays` state (local) |
| Friends | `FriendsScreen` | Hardcoded mock |
| Chat | `ChatScreen` | Hardcoded mock |
| Emergency | `EmergencyScreen` / `HelpScreen` | Static |
| Progress | `ProgressScreen` | `cleanDays` prop |

---

## Screens

### Home

- Displays the user's clean-day count with an animated counter
- Progress bar toward the next 6-month milestone
- Quick-action shortcuts (Journal, Meditation, Affirmations)
- Emergency button at the bottom

### Friends

- Searchable friend list with online/offline status indicators
- Action buttons per friend: open chat, more options

### Chat

- Conversation list with unread badge count
- Unread conversations highlighted with a blue left border

### Emergency

- CVV (188), CAPS locator, coping techniques, SAMU (192)
- Each card shows a title, subtitle, and a single action button

### Progress

- Total clean time display
- Statistics grid (best streak, average time)
- Chronological milestone list (achieved vs. locked)

---

## Navigation

Navigation is managed with a simple `useState` in `HomeScreen`. There is no routing library — screens are conditionally rendered:

```jsx
const screens = {
  home:      <HomeScreen ... />,
  friends:   <FriendsScreen />,
  chat:      <ChatScreen />,
  emergency: <EmergencyScreen />,
  progress:  <ProgressScreen cleanDays={cleanDays} />
};

return screens[currentScreen] || screens.home;
```

The bottom navigation bar and the side drawer both call `handleNavigation(screenName)`.

---

## State

All state is currently local to `HomeScreen`:

| State | Type | Description |
|-------|------|-------------|
| `currentScreen` | `string` | Active screen identifier |
| `menuOpen` | `boolean` | Side drawer open/closed |
| `resetModalOpen` | `boolean` | Reset confirmation modal |
| `cleanDays` | `number` | Current clean-day count (will come from API) |

---

## Prototype

`prototype.html` is a standalone vanilla HTML/CSS/JS prototype with no dependencies beyond Bootstrap Icons. It serves as a visual reference and can be opened directly in a browser without any build step.

`test.jsx` is a single-file React version of the complete app, useful for rapid iteration in a sandboxed environment (e.g. Claude Artifacts).

---

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

---

## Backend Integration

The app currently uses hardcoded mock data. Backend integration will follow this pattern for each feature:

| Feature | Endpoint (planned) |
|---------|--------------------|
| Login | `POST /auth/login` |
| Register | `POST /auth/register` |
| Current streak | `GET /streaks/current` |
| End streak (reset) | `POST /streaks/end` |
| Friend list | `GET /users/{userId}/friends` |
| Chat list | `GET /chats` |
| Send message | `POST /chats/send` (REST) or `message` event (WebSocket) |
| User badges | `GET /badges` |
| Progress/history | `GET /streaks/history` |

Authentication will use a JWT `Bearer` token stored in `AsyncStorage`, sent as the `Authorization` header on every API request. Token refresh will be handled transparently by an Axios interceptor or equivalent.

---

## Roadmap

### Short term
- [ ] Connect to backend API (authentication flow)
- [ ] Replace mock data with real API calls (streak, friends, chat)
- [ ] WebSocket connection for real-time chat
- [ ] `AsyncStorage` for JWT persistence across app restarts

### Medium term
- [ ] Push notifications for friend requests, messages, and milestone achievements
- [ ] Guided meditation screen
- [ ] Emotional journal / diary screen
- [ ] Positive affirmations daily feed

### Long term
- [ ] Offline support (local streak counter that syncs on reconnect)
- [ ] CAPS locator with map integration
- [ ] Accessibility improvements (screen reader support, dynamic font sizes)
- [ ] Internationalisation (i18n)
