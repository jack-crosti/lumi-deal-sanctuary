## Plan — Admin Businesses Section

Build the full admin-side Businesses experience: list, create/edit, and a tabbed detail page. No document upload, no AI yet — those tabs become elegant placeholders.

### 1. Database migration

Extend the `business_status` enum and add missing columns to `businesses`.

**Enum update**
```text
business_status: draft | internal_review | ready_to_publish | published | archived
```
(Currently only draft / published / archived exist — add the two new values.)

**New columns on `businesses`** (all nullable except where noted):
```text
public_title              text     -- public display title
confidential_title        text     -- confidential display title
business_type             text
industry                  text
city                      text
stock_value               numeric
weekly_sales_min          numeric
weekly_sales_max          numeric
normalised_profit         numeric
rent_per_year             numeric
lease_expiry              date
renewal_rights            text
staff_summary             text
owner_involvement         text
opening_hours             text
broker_notes              text     -- admin-only, never exposed to buyers
archived_at               timestamptz
```

Existing columns kept as-is: `name`, `headline`, `summary`, `slug`, `region`, `suburb`, `address`, `location_mode`, `asking_price`, `revenue`, `ebitda`, `tenure`, `hero_image_url`, `status`, `created_by`, timestamps.

**RLS:** existing policies cover this (admins manage all; buyers see only published + assigned). `broker_notes` will simply not be selected on the buyer side — but to be safe, buyers don't query the table directly for that field anyway.

### 2. List page — `/admin/businesses`

Premium dark table/card hybrid. Columns:
- Title (uses `public_title` or `name`) + small status pill
- Status (Draft / Internal Review / Ready / Published / Archived) — color-coded
- Asking price (formatted NZD)
- Profit (EBITDA)
- Location (suburb when blind/suburb mode, full address when exact)
- Assigned buyers (count from `buyer_business_access`)
- Last updated (relative time)
- Quick actions menu: Edit · Preview buyer view · Manage buyers · Upload documents · Publish/Unpublish · Archive

Filters: status chips (All / Draft / Review / Ready / Published / Archived), search by name.
Empty state retained when no rows.

### 3. Create / Edit form

`/admin/businesses/new` and `/admin/businesses/:id/edit` — same form component.

Organised into collapsible sections so the form stays calm:
1. **Identity** — name, public title, confidential title, business type, industry
2. **Location & confidentiality** — confidentiality mode (radio), suburb, city, region, exact address (only required when mode = exact)
3. **Financials** — asking price, stock value, annual revenue, weekly sales min/max, normalised profit, EBITDA
4. **Lease & operations** — rent per year, lease expiry (date picker), renewal rights, staff summary, owner involvement, opening hours
5. **Internal** — broker notes, status

Validation via `react-hook-form` + `zod`. On save: insert/update with `created_by = auth.uid()`. Redirect to detail page on success. Toasts for success/error.

### 4. Business detail page — `/admin/businesses/:id`

Top header: business title, status pill, last updated, action buttons (Preview buyer view, Publish/Unpublish, Archive).

Tabs (shadcn `Tabs`):
1. **Overview** — read-only summary of all fields entered, grouped like the form. "Edit" button → edit form.
2. **Presentation Studio** — placeholder panel ("Cinematic editor arrives in a later stage").
3. **Documents** — placeholder panel ("Document upload arrives next").
4. **Financials** — focused view of financial fields with formatted currency cards.
5. **Location** — shows confidentiality mode, what buyers will see, and the underlying exact address (admin-only). Map placeholder.
6. **Buyer Access** — placeholder panel ("Buyer assignment in the next stage").
7. **Activity** — placeholder panel.
8. **Questions And Requests** — placeholder panel.
9. **Offer Interest** — placeholder panel.
10. **Settings** — status changer, archive button, delete (with confirm).

Each placeholder uses the existing `PlaceholderPanel` for visual consistency.

### 5. Routing

Add to `App.tsx`:
```text
/admin/businesses/:id           → AdminBusinessDetail
/admin/businesses/:id/edit      → AdminBusinessEdit  (reuses form)
```

### 6. Files to create / change

**New**
- `supabase/migrations/<ts>_extend_businesses.sql`
- `src/pages/admin/AdminBusinessDetail.tsx`
- `src/pages/admin/AdminBusinessEdit.tsx`
- `src/components/admin/BusinessForm.tsx` (shared by new + edit)
- `src/components/admin/BusinessStatusPill.tsx`
- `src/components/admin/BusinessRowActions.tsx`
- `src/lib/format.ts` (currency / relative time helpers, if not present)

**Edited**
- `src/pages/admin/AdminBusinesses.tsx` — real list with filters
- `src/pages/admin/AdminBusinessNew.tsx` — render `BusinessForm`
- `src/App.tsx` — new routes

### 7. Out of scope (intentionally)
- Document upload UI/storage
- Buyer assignment UI
- Presentation Studio editor
- AI generation
- Map provider integration
- Activity tracking writes (table exists, will be wired in a later stage)

### Design notes
Keeps the existing dark luxury aesthetic, hairline borders, eyebrow tracking on labels, generous whitespace, no playful elements. Status pills use restrained tonal variants (no neon).

Approve and I'll implement.