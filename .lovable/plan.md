## Goal

Replace every user-facing mention of "mandate / mandates" with "Information Memorandum" (or a natural short form) across the app. No logic, schema, or routing changes — copy only.

## Wording rules

To keep sentences readable, use these context-appropriate replacements rather than a blind find-and-replace:

- "mandate" / "mandates" (generic noun, listings) → **Information Memorandum** / **Information Memorandums**
- "Active mandates" (stat label) → **Active Information Memorandums**
- "New mandate" / "Create new mandate" / "Create first mandate" → **New Information Memorandum** / **Create new Information Memorandum** / **Create first Information Memorandum**
- "Edit mandate" → **Edit Information Memorandum**
- "Confidential mandate" → **Confidential Information Memorandum**
- "Mandates closed since 2019" → **Information Memorandums closed since 2019**
- "Our mandate" (Index hero link + heading) → **Our approach**  *(this one is editorial copy about the firm's stance, not a deal document — "Information Memorandum" doesn't fit. Will flag if you'd prefer a literal swap.)*
- "the mandated broker" → **the assigned broker**
- "this mandate" (in admin body copy) → **this Information Memorandum**
- `eyebrow={b.business_type || "Mandate"}` fallback → **"Information Memorandum"**
- BuyerAccessManager fallback label `"Mandate"` → **"Information Memorandum"**

## Files to edit

1. `src/pages/Index.tsx` — anchor link, hero stat, badge text, section id/heading/subhead (lines 50, 121, 154, 177, 179, 185, 189). Note: section `id="mandate"` and `href="#mandate"` will be renamed to `id="approach"` to match the new heading.
2. `src/pages/buyer/BuyerDashboard.tsx` — sign-in description and empty state (lines 76, 213).
3. `src/pages/buyer/BuyerBusiness.tsx` — "Confidential mandate" badge, "mandated broker" title (lines 347, 865).
4. `src/pages/admin/AdminBusinessDetail.tsx` — eyebrow fallback, BuyerAccess card body (lines 139, 212).
5. `src/pages/admin/AdminActivity.tsx` — page description (line 9).
6. `src/pages/admin/AdminBusinesses.tsx` — eyebrow (line 116).
7. `src/pages/admin/AdminBusinessEdit.tsx` — eyebrow (line 70).
8. `src/pages/admin/AdminBusinessNew.tsx` — eyebrow (line 10).
9. `src/pages/admin/AdminDashboard.tsx` — stat label, quick action, page description, button, empty-state heading + CTA (lines 7, 14, 28, 32, 85, 88, 98, 107).
10. `src/components/admin/BuyerAccessManager.tsx` — fallback label (line 176).

## Out of scope

- No database column, enum, or route renames.
- No changes to document type label "Information Memorandum" (already correct).
- No design or layout changes.

## Verification

After edits, re-run `rg -i "mandate"` to confirm zero remaining occurrences (except possibly the renamed `#approach` anchor, which should also be clean).
