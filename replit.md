# Board Games in English - Moscow Games Club

## Overview

This is a full-stack web application for managing a board game club community in Moscow. Members can browse upcoming game night events, reserve seats, explore the game library, nominate games for events, and vote on nominations. The app includes a loyalty system where members earn "dice" points for attending events. Admins can create/manage events and games through a dedicated admin panel.

The app follows a monorepo structure with a React frontend (Vite), Express backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite + TypeScript)
- `server/` — Express backend (TypeScript)
- `shared/` — Shared code between frontend and backend (schema, API route contracts)
- `migrations/` — Drizzle database migrations
- `script/` — Build scripts

### Frontend Architecture
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming. Warm/playful color palette (coral primary, teal secondary, cream background)
- **Fonts**: DM Sans (body), Architects Daughter (display/headings)
- **Animations**: Framer Motion for page transitions and element animations
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Key Pages**: Home, Events, Games, Profile, Admin, Login, Register
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Authentication**: Passport.js with Local Strategy, session-based auth using express-session
- **Session Store**: PostgreSQL-backed sessions via connect-pg-simple
- **Password Hashing**: Node.js crypto scrypt with random salt
- **Authorization**: Role-based (admin vs member), checked inline in route handlers
- **API Contract**: Shared route definitions in `shared/routes.ts` with Zod schemas for input validation — both client and server reference the same contract

### Database
- **Database**: PostgreSQL (required, via DATABASE_URL environment variable)
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts`
- **Tables**:
  - `users` — id, username, password, role (admin/member), dice (loyalty points), createdAt
  - `games` — id, title, description, imageUrl, minPlayers, maxPlayers
  - `events` — id, title, description, date, location, maxSeats, isCompleted
  - `reservations` — id, userId, eventId, status (confirmed/waitlist/cancelled), createdAt
  - `nominations` — id, eventId, gameId, nominatedBy
  - `votes` — id, nominationId, userId (referenced in storage interface)
- **Migrations**: Use `npm run db:push` (drizzle-kit push) to sync schema to database

### Build & Dev
- **Dev**: `npm run dev` — runs tsx for the Express server with Vite middleware for HMR
- **Build**: `npm run build` — Vite builds the client to `dist/public`, esbuild bundles the server to `dist/index.cjs`
- **Production**: `npm start` — serves the built app with `node dist/index.cjs`
- **Type checking**: `npm run check` — runs tsc with noEmit

### Storage Pattern
- The `server/storage.ts` file defines an `IStorage` interface and a concrete implementation using Drizzle
- All database access goes through the `storage` object, making it possible to swap implementations

### Key Design Decisions
1. **Shared API contract** (`shared/routes.ts`): Both client and server reference the same route paths and Zod schemas, ensuring type safety across the stack
2. **Session-based auth over JWT**: Simpler for a traditional web app; sessions stored in PostgreSQL for persistence across restarts
3. **Drizzle over Prisma**: Lighter weight, SQL-like API, better for this scale of application
4. **Wouter over React Router**: Minimal router footprint, sufficient for this app's needs
5. **shadcn/ui**: Copy-paste component model allows full customization; components live in `client/src/components/ui/`

## External Dependencies

### Database
- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable. Used for all data storage and session management.

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for signing session cookies (falls back to a default in dev)

### Key npm Packages
- **Backend**: express, passport, passport-local, express-session, connect-pg-simple, drizzle-orm, drizzle-kit, zod
- **Frontend**: react, wouter, @tanstack/react-query, framer-motion, react-hook-form, date-fns, lucide-react
- **UI**: Full shadcn/ui component library (Radix UI primitives, class-variance-authority, tailwind-merge, clsx)
- **Build**: vite, esbuild, tsx, typescript

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in development
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)