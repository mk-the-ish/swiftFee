# Database Seeding

This script is for command-line seeding, but we recommend using the in-app seeding page at `/multi/seed` for authenticated seeding.

## In-App Seeding (Recommended)

1. Start the app: `npm run dev`
2. Log in as a system admin
3. Go to `/multi/seed`
4. Click buttons to seed schools, users, and data

## Command-Line Seeding (Alternative)

1. Temporarily update Firestore rules to allow unauthenticated writes (see firestore-temp.rules)
2. Run: `npm run seed`
3. Revert rules to secure ones

## What it creates

- **Schools:** 2 sample schools
- **Users:** Documents for admins (requires actual UIDs)
- **Sample Data:** Students, bank accounts, exchange rate