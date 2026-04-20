# Backend Module

This directory isolates all server-side logic from the Next.js framework boundaries.

## Contents
- `api/`: API logic extracted from Native Next.js routes. Waitlist algorithms, flight queries, and booking mutations occur here.
- `lib/`: Shared logic, utilities, and integrations (like `prisma.ts`).

## Architecture Details
In a strict Next.js App Router setup, API routes reside functionally in `/app/api`. However, to decouple our business logic from Next.js conventions, we store our actual Handler functions here. The files in `/app/api/*` strictly act as references (proxies) that import these functions from `/backend`. This ensures a thin router layer and high testability for backend logic.
