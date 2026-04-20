# Database Module

This directory isolates all database-related concerns for the project.

## Contents
- `prisma/schema.prisma`: The Prisma ORM schema definition.
- `prisma/seed.js`: Database seeding script.
- `.env`: Database credentials and configuration.

## Commands
Because the schema is under `database/prisma`, use standard Prisma commands from the project root (as it is configured in `package.json`):

- **Generate Client**: `npx prisma generate`
- **Push Schema**: `npx prisma db push`
- **Seed Database**: `npx prisma db seed`
