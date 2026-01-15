# Project Handover Notes - Portfolio Optimizer v3.4.1

## 1. Current Status (as of 2026-01-15 08:08 UTC)
- **Fixed**: Real-time stock price fetching in `src/components/ResultsDisplay.tsx`. It now uses a multi-proxy fallback system (`codetabs` -> `allorigins` -> `corsproxy`) to bypass CORS and Yahoo Finance limitations.
- **Migrated**: Backend functions moved from Netlify to Vercel (`api/` directory).
- **Environment Adaptive**: Frontend (`src/App.tsx`) automatically detects the host and switches between `/.netlify/functions` and `/api`.
- **Auto-Registration Implemented**: New users who sign in via Firebase are now automatically added to Airtable with status "Pending". Admins can then approve them manually.

## 2. Technical Architecture
### Frontend
- **Auth**: Firebase Authentication (Google Redirect).
- **API Calls**: `checkUserStatus` in `App.tsx` calls the backend with a cache-buster (`t=Date.now()`).

### Backend (Vercel Functions)
- `api/check-user-status.ts`: Validates user against Airtable.
- `api/get_security_factor.ts`: Returns a security multiplier for calculations.

## 3. Auto-Registration Flow
When a user signs in via Firebase:
1. `api/check-user-status.ts` queries Airtable for the user's email.
2. **If found**: Returns the user's current status (`Approved` or `Pending`).
3. **If not found**: Automatically creates a new record in Airtable with:
   - `Email`: User's email from Firebase
   - `Status`: `Pending`
4. The user sees the "Pending" screen and must wait for admin approval.

### Debugging
Enhanced logging is available in `api/check-user-status.ts`:
- Go to **Vercel Dashboard -> Logs**.
- Look for `[Debug]` entries (logged as `console.error` for visibility).
- Key logs include:
  - `[Debug] Airtable Raw Data`: Shows the query result
  - `[Debug] Auto-registration result`: Shows if a new user was created

## 4. Critical Configurations
- **Airtable**:
  - Base ID: `app7BB9VmwXmVov5c`
  - Table Name: `Users`
  - Expected Columns: `Email` (or `email`), `Status` (must be `Approved`).
- **Firebase**:
  - Ensure `portfolioblender.vercel.app` is added to **Authorized Domains** in Firebase Console.

## 5. Admin Workflow
To approve new users:
1. Go to your Airtable base: `app7BB9VmwXmVov5c`
2. Open the `Users` table
3. Find users with `Status = Pending`
4. Change their `Status` to `Approved`
5. Users can now access the portfolio optimizer on their next login

## 6. Completed Tasks
- [x] Fixed real-time stock price fetching with multi-proxy fallback
- [x] Migrated backend from Netlify to Vercel
- [x] Implemented auto-registration for new Firebase users
- [x] Added comprehensive debug logging
- [x] Updated user interface to reflect auto-registration

---
*Prepared by Cline (AI Assistant)*
