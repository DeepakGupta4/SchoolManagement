# SchoolDeck Mobile

One app for teacher / student / staff / driver / parent. Built with **Expo (React Native) + TypeScript + Expo Router**. Uses the **same backend** as the web app.

> Phase 1 = **Teacher** section. Driver GPS tracking, student/staff/parent screens come next.

## Run it

```bash
cd mobile
npm install
npx expo install --fix     # aligns native package versions to the Expo SDK (run if you see version warnings)
npx expo start
```

Then:
- **Phone** (easiest): install **Expo Go** (Play Store / App Store) → scan the QR. The teacher section runs fully in Expo Go (no custom build needed).
- **Emulator**: press `a` (Android) or `i` (iOS) in the terminal.

Sign in with a **teacher** account from your school.

## Backend

Points at the live Render API in [`src/config.ts`](src/config.ts). For a local backend, change `API_URL` there (e.g. `http://<your-LAN-ip>:4000` — not `localhost`, phone can't reach that).

## Structure

```
app/                 file-based routes
  _layout.tsx        root: restores session
  index.tsx          entry gate → login / teacher / coming-soon (by role)
  login.tsx          email + password (+ 2FA code step)
  teacher/           teacher tabs (Home, Timetable, More)
src/
  theme/colors.ts    SINGLE source of truth for colours
  theme/index.ts     spacing / radius / fontSize / shadow tokens
  components/         reusable: Screen, AppText, Button, TextField, Card, StatCard, Loading
  api/               client (token + refresh) + auth + teacher — reuses the web backend
  store/auth.ts      auth state (zustand + expo-secure-store)
  config.ts          API base URL
```

## Conventions

- **Colours only from `src/theme/colors.ts`** — never hardcode a hex.
- Reuse the `components/` primitives; keep screens thin.
- Short comments.

## Next (planned)

1. Driver: live-location toggle + background tracking (foreground service) → stops on toggle-off / app-kill.
2. Parent/Student: live bus map (OpenStreetMap) + ETA.
3. Teacher: attendance marking, assignments, notices.
4. Staff screens.
