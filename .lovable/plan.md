## Scope

Add a new "স্থানীয় ব্যবসা" (Local Businesses) module — a Google Business-inspired directory where Ukhiya businesses register public profiles and residents discover/contact them. Mirrors the existing Workers/Teachers modules in patterns (TanStack routes, RLS, admin panel, Bangla UI, English code). Does NOT modify any other module.

## Routes

Public:
- `/business` — Directory home: hero, featured strip, category tiles, latest listings, search.
- `/business/directory` — Full listings with filters (category, union, area, verified, open-now, featured, rating).
- `/business/$slug` — SEO-friendly public profile (e.g. `/business/al-madina-pharmacy`). Increments `view_count`.
- `/business/register` — Owner registration form (multi-section: basics, contacts, media, hours, products).

Auth-only:
- `/_authenticated/my-business` — Owner's listings (edit, upload gallery, view stats).

Admin:
- `/_authenticated/admin/businesses` — Approve/reject, verify, feature, suspend; tabs by status.
- `/_authenticated/admin/business-categories` — Manage categories.
- `/_authenticated/admin/business-reviews` — Moderate reviews.
- Link from `admin.index.tsx` + add tab in admin layout.

## Database (single migration)

New enums:
- `business_status`: pending, approved, rejected, suspended
- `business_day`: mon..sun

New tables (standard id/created_at/updated_at, GRANTs, RLS, updated_at trigger):

- `business_categories` — id, name_bn, slug (unique), group_bn (e.g. "খুচরা", "খাবার"), icon, sort_order, is_active. Public read; admin write. Seed with all 38 categories from spec, grouped.
- `businesses` — owner_id, name, slug (unique, generated from name + short id), category_id, short_description, full_description, address, union_name, area, upazila, district, lat, lng, phone, whatsapp, facebook_url, website_url, email, logo_url, cover_url, owner_photo_url, established_year, products (text[]), status, is_verified, is_featured, view_count, avg_rating (numeric), review_count. Public read only where status='approved'; owner read/update own; admin all.
- `business_hours` — business_id, day (business_day), is_closed, open_time, close_time. Owner+admin write.
- `business_gallery` — business_id, image_url, sort_order. Public read when parent approved.
- `business_reviews` — business_id, user_id, rating (1-5), comment, is_hidden. Public read where not hidden; auth user insert/update/delete own; admin all. Trigger to recompute businesses.avg_rating + review_count.

Storage: new **public** bucket `business-media` for logos, covers, gallery (fast public reads; profiles are public anyway). Owner-scoped upload path `{owner_id}/...`.

Slug generation: DB trigger — slugify(name) + '-' + substr(id,0,6), ensures uniqueness.

## Server functions

`src/lib/business.functions.ts` with `requireSupabaseAuth` + `has_role('admin')`-guarded fns:
- Owner: `createBusiness`, `updateMyBusiness`, `listMyBusinesses`, `addGalleryImage`, `removeGalleryImage`, `setHours`.
- Public (unauth): `incrementViewCount` (server fn, no auth needed, rate-limited by IP hash).
- Reviews: `submitReview`, `deleteMyReview`.
- Admin: `listAllBusinesses`, `setBusinessStatus`, `setVerified`, `setFeatured`, `manageCategory`, `moderateReview`.

`src/lib/business-shared.ts` — enums, types, category groups, day labels.

Public directory reads use browser Supabase client directly (RLS filters).

## Components

- `src/components/business/BusinessCard.tsx`
- `src/components/business/BusinessLogo.tsx` (fallback initial)
- `src/components/business/RatingStars.tsx`
- `src/components/business/HoursDisplay.tsx` + open-now helper
- `src/components/business/ContactButtons.tsx` (Call, WhatsApp, FB, Website, Directions, Share)
- `src/components/business/CategoryFilter.tsx`

## UI

Google Business inspired: white cards, rounded-2xl, soft shadows, blue (#1565C0 existing primary) + emerald accent (`--accent-emerald`) added to `src/styles.css`. Mobile-first grid. Verified/Featured badges. Sticky contact bar on profile page for mobile.

## SEO

- Slug-based URLs.
- Per-profile `head()`: title=business name+category, description=short_description, og:image=cover_url, JSON-LD LocalBusiness.
- Add `/business` to sitemap.

## Homepage integration

Add "স্থানীয় ব্যবসা" CTA tile on `/` alongside existing quick-links. No layout redesign.

## Security

- Owner-only writes enforced by RLS (`owner_id = auth.uid()`).
- Reviews: one per user per business (unique constraint), self-delete only.
- View counter is throttled server-side (in-memory not durable — accept eventual small over-count; use a lightweight `pg` upsert).
- Uploads validated (mime, size) client + storage path scoped to owner id.
- Featured/verified flags admin-only via server fn.

## Future-ready (schema-only stubs, no UI yet)

- `is_sponsored boolean`, `sponsor_until timestamptz` on businesses.
- `business_coupons` table skeleton (created but not surfaced) — SKIP for now to keep migration focused; can add later.

## Non-goals (this pass)

- Coupons/offers UI, QR code generator, promotional banners, sponsored-listing purchase flow, analytics dashboard beyond simple view/review counts.
- Payment integration.

## Implementation order

1. Migration (enums, tables, RLS, GRANTs, triggers, category seed, storage bucket).
2. `business-shared.ts` + `business.functions.ts`.
3. Shared components.
4. Public routes: directory home, listings, profile, register.
5. Owner `/my-business`.
6. Admin routes + link from admin index + tab in admin layout.
7. Homepage tile + sitemap entry.
8. Verify build.
