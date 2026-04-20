# Frontend Module

This directory isolates the presentation layer and client-side logic of the application.

## Contents
- `styles/globals.css`: The root CSS stylesheet.
- `views/`: The main UI layouts and page components (e.g., `HomePage.tsx`, `RootLayout.tsx`).

## Architecture Details
While Next.js mandates that `page.tsx` and `layout.tsx` exist under the `/app` router directory in the project root to function, we have configured `/app` as a "thin proxy". All actual UI structure, client-side behaviors, and React views live within this `/frontend` directory and are cleanly imported by the root Next.js app.
