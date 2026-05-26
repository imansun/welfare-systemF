# Tailux Admin — Project Context

## Overview

**Tailux Admin** is a React 19 + TypeScript + Vite admin dashboard application. It provides authentication, theming, internationalization (i18n), and dashboard CRUD flows. The project is built as a single-page application (SPA) deployed on Vercel.

### Key Technologies

- **React 19** with TypeScript
- **Vite 7** as the build tool and dev server
- **Tailwind CSS 4** for styling (with SCSS for global styles)
- **React Router 7** for routing with protected/public/ghost route groups
- **i18next** for internationalization (default language: Persian/Fa `fa`)
- **React Hook Form + Yup** for form handling and validation
- **Axios** for HTTP requests
- **JWT-based auth** (`jwt-decode` for decoding tokens)
- **ApexCharts** for data visualization
- **TanStack Table** for data tables
- **Headless UI + Heroicons** for UI components
- **Quill** for rich text editing
- **FilePond** for file uploads
- **Sonner** for toast notifications

## Project Structure

```
src/
├── @types/              # TypeScript type declarations
├── app/
│   ├── contexts/        # React context providers (auth, theme, locale, sidebar, breakpoint)
│   ├── layouts/         # Page layout components
│   ├── navigation/      # Navigation/menu configuration
│   ├── pages/           # Page components (Auth, dashboards, errors, settings, tools)
│   ├── router/          # React Router configuration (protected, public, ghost routes)
│   └── services/        # API service layer
├── assets/              # Static assets (images, fonts, etc.)
├── components/          # Reusable UI components
├── configs/             # Configuration files (auth API endpoint lives here)
├── constants/           # Application constants
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization setup and translations
├── middleware/          # Route guards (AuthGuard, GhostGuard)
├── styles/              # Global CSS and SCSS styles
├── utils/               # Utility functions (JWT helpers, etc.)
├── App.tsx              # Root component with context providers
└── main.tsx             # Entry point (bootstraps app, imports i18n and styles)
```

## Building and Running

```bash
# Install dependencies
yarn install

# Start the dev server
npm run dev          # or: yarn dev

# Type-check and build for production
npm run build        # or: yarn build

# Run ESLint
npm run lint         # or: yarn lint

# Preview production build locally
npm run preview      # or: yarn preview
```

## Architecture Notes

### Authentication
- API base URL is configured in `src/configs/auth.ts` (currently `http://localhost:3001`)
- Auth/session bootstrap happens in `src/main.tsx` and `src/utils/jwt.ts`
- Route guards: `src/middleware/AuthGuard.tsx` (protected routes) and `src/middleware/GhostGuard.tsx` (ghost/invisible routes)

### Routing
- Routes are split into three groups in `src/app/router/`:
  - `protected.tsx` — authenticated-only routes
  - `public.tsx` — publicly accessible routes (login, register, etc.)
  - `ghost.tsx` — routes without layout wrapper
  - `router.tsx` — combines all route groups

### Context Providers
The app wraps the router with these providers (in order):
1. `AuthProvider` — authentication state
2. `ThemeProvider` — theme (light/dark)
3. `LocaleProvider` — i18n/locale state
4. `BreakpointProvider` — responsive breakpoint detection
5. `SidebarProvider` — sidebar collapse/expand state

### Internationalization
- Default and fallback language is Persian (`fa`)
- Uses `i18next-browser-languagedetector` with localStorage persistence
- Supported languages are defined in `src/i18n/langs/`

### Styling
- Tailwind CSS 4 via the Vite plugin
- Global styles in `src/styles/global.scss`
- CSS entry point in `src/styles/index.css`
- Path alias `@/` maps to `src/` (configured in `tsconfig.app.json` and `vite.config.ts`)

### Deployment
- Deployed on **Vercel** (see `vercel.json` — SPA fallback to `index.html`)

## Development Conventions

- **TypeScript strict mode** enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- **ESLint** with `typescript-eslint`, `react-hooks`, and `react-refresh` plugins
- **Prettier** for code formatting (with `prettier-plugin-tailwindcss`)
- `@typescript-eslint/no-explicit-any` is intentionally turned off
- Module resolution uses the bundler strategy with path alias `@/*` → `./src/*`
