I understand. The current blocker is not the password: `jack@lumi.nz` exists and is already assigned the admin role. The app is getting stuck because the frontend waits on a database role lookup after login, and that lookup is intermittently returning `503 / schema cache retrying`, so the route guard keeps showing “Verifying access…” or eventually sends you to the wrong place.

I will simplify and harden the login flow now.

## Plan

1. Replace the fragile post-login role lookup for routing
   - Make the app determine the active area directly from the signed-in email:
     - `jack@lumi.nz` → Admin
     - every other signed-in email → Buyer
   - Keep the existing `user_roles` table and database RLS policies in place for backend protection.
   - Stop the UI from depending on `user_roles` just to decide which page to load.

2. Fix the “Verifying access…” loop
   - Update `useAuth` so initial auth loading only waits for the actual session, not a separate database role request.
   - Remove the retry loop that can keep the user stuck for too long.
   - Ensure the role is immediately available from the session email once login succeeds.

3. Make the login page clearer
   - Keep one simple login page at `/login`.
   - Add clear UI copy explaining:
     - `jack@lumi.nz` opens the Admin broker console.
     - other approved accounts open the Buyer private channel.
   - After login, navigate directly to the correct dashboard instead of bouncing through `/`.

4. Make route guards deterministic
   - `/admin/*` allows only `jack@lumi.nz`.
   - `/buyer/*` allows any signed-in non-admin email.
   - If an admin lands on buyer routes, send them to `/admin/dashboard`.
   - If a buyer lands on admin routes, send them to `/buyer/dashboard` or `/unauthorized` with a clear message.

5. Reduce confusing unauthorized states
   - Update the unauthorized page copy so it explains which account is signed in and where it should go.
   - Make the “Back to your deal room” button route to the correct dashboard based on email.

6. Test after changes
   - Run the app test suite.
   - Verify the affected files compile through the automatic checks.
   - Manually review the expected flows:
     - `jack@lumi.nz` login → `/admin/dashboard`
     - other email login → `/buyer/dashboard`
     - logged-out admin route → `/login`
     - buyer trying admin route → no admin access

## Technical details

Files to update:
- `src/hooks/useAuth.tsx`
- `src/components/RouteGuards.tsx`
- `src/pages/Auth.tsx`
- `src/pages/Unauthorized.tsx`
- possibly `src/pages/Index.tsx` if it still relies on the old role lookup

No database change is required for this fix. The existing admin role record for `jack@lumi.nz` is present, but the UI should not be blocked by a database role query when the requested rule is email-based routing.