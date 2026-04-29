# Fix: clear distinction between Admin & Buyer (and signed-in vs signed-out)

The current app makes it hard to tell what mode you're in. Jack signed in as admin but the experience feels generic. Three concrete problems, three concrete fixes.

## Problem 1 — The landing page doesn't know you're signed in

Right now `/` (the marketing page) renders the same way whether you're signed out, an admin, or a buyer. The "Enter deal room" button works, but the page itself gives zero signal that you're authenticated. If you click the wordmark from inside the console, you bounce back to marketing and feel logged out.

**Fix:** Auto-redirect signed-in users away from `/`.
- If `session && role === "admin"` → redirect to `/admin/dashboard`
- If `session && role === "buyer"` → redirect to `/buyer/dashboard`
- Signed-out visitors keep seeing the marketing page exactly as it is.

This is the same pattern already used on `/login` via `RedirectIfAuthed`. We'll wrap `/` with it too.

## Problem 2 — The console header doesn't show who/what you are

Currently `AppShell` shows a tiny grey "Admin Console" eyebrow and the email in muted monospace. Easy to miss.

**Fix:** Add a clear, prominent role badge in the header.

```text
┌────────────────────────────────────────────────────────────────┐
│  LUMI │ ● ADMIN CONSOLE     [nav]     jack@lumi.nz  [Sign out] │
└────────────────────────────────────────────────────────────────┘
       └─ gold pill, role-coloured  └─ avatar circle with initial
```

Specifically:
- **Role pill** next to the wordmark — gold/primary background for Admin, muted/silver for Buyer. Clearly labelled "ADMIN" or "BUYER".
- **Avatar circle** with the user's initial next to their email, so it feels like an account, not a label.
- **Thin top accent bar** in primary gold for Admin, neutral hairline for Buyer — a subtle but instant visual cue.
- **Wordmark no longer links to `/`** when you're inside the console — it links to your own dashboard (`/admin/dashboard` or `/buyer/dashboard`). No more accidental "logged out feeling" bounces.

## Problem 3 — Admin and Buyer feel identical

Same shell, same colours, same layout. Beyond the nav items, nothing distinguishes them.

**Fix:** Tint the Admin chrome with primary gold accents and tag the Buyer chrome as a "Private channel".
- Admin header: gold accent line at top, gold role pill, "Broker console" eyebrow.
- Buyer header: neutral accent line, silver role pill, "Private buyer channel" eyebrow.
- The body content stays as it is — only the chrome changes.

## Files to change

1. `src/App.tsx` — wrap `/` route in `RedirectIfAuthed` so authenticated users skip the marketing page.
2. `src/components/AppShell.tsx` — add role-aware accent bar, role pill, avatar, and make the wordmark link to the role's dashboard. Accept an optional `roleAccent: "admin" | "buyer"` prop.
3. `src/layouts/AdminLayout.tsx` — pass `roleAccent="admin"`.
4. `src/layouts/BuyerLayout.tsx` — pass `roleAccent="buyer"`.

No database changes. No new routes. No removed features.

## What you'll see after

- Sign in as `jack@lumi.nz` → land directly on the Admin console. The top of the screen shows a gold `● ADMIN` pill, your initial in a circle, and a faint gold line across the top.
- Click the Lumi wordmark → stays inside `/admin/dashboard`.
- Sign out and visit `/` → marketing page renders normally.
- Sign in as a buyer → silver `BUYER` pill, neutral chrome, no admin nav items visible.
