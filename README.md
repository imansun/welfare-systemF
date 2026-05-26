# Tailux Admin

React 19 + TypeScript + Vite admin dashboard with auth, theming, i18n, and dashboard CRUD flows.

## Scripts
- `npm run dev` — start the dev server
- `npm run build` — type-check and build production assets
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build

## Notes
- API base URL lives in `src/configs/auth.ts`.
- Auth/session bootstrap is handled in `src/main.tsx` and `src/utils/jwt.ts`.
- Route guards live in `src/middleware/AuthGuard.tsx` and `src/middleware/GhostGuard.tsx`.
