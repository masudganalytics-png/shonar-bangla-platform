## Scope

Extend the existing teachers module (already at `/teachers`, `/teachers/register`, `/teachers/$id`, `/admin/teachers`) into the full "উখিয়ার শিক্ষক খুঁজুন" education hub — WITHOUT touching any other module (bills, workers, complaints, CV builder, etc.).

Everything follows existing patterns: TanStack Start file routes, shadcn/ui, Supabase RLS, `_authenticated/admin.*` pages for admin, Bengali UI, English code.

## New routes

Public (under `/teachers`):
- `/teachers` — new **Education Home**: hero + Featured Tutors, Latest Tuition Requests, Education News, Student Achievements, Study Resources.
- `/teachers/directory` — full tutor directory (current `/teachers` list moves here, with added filters: Class, Gender).
- `/teachers/$id` — keep existing tutor profile (extend fields).
- `/teachers/register` — extend existing form with Class, Gender, Bio.
- `/teachers/tuitions` — approved tuition requests list.
- `/teachers/tuitions/$id` — request detail + "এই টিউশনের জন্য আবেদন করুন" (approved tutors only).
- `/teachers/tuitions/new` — parent request form.
- `/teachers/resources` — study resources grid.
- `/teachers/news` — education news list + `/teachers/news/$id`.
- `/teachers/achievements` — student achievements list + `/teachers/achievements/$id`.

Admin (under `/_authenticated/admin/`):
- `admin.teachers.tsx` — keep, add tabs: Applications, Profiles, Categories.
- `admin.tuition-requests.tsx` — parent requests CRUD + approve/reject/close/match.
- `admin.tuition-applications.tsx` — tutor applications to requests.
- `admin.education-news.tsx` — CRUD.
- `admin.achievements.tsx` — CRUD.
- `admin.study-resources.tsx` — CRUD.
- Link all from `admin.index.tsx`.

## Database (single migration)

New tables (all with standard `id/created_at/updated_at`, GRANTs, RLS):

- `tuition_requests` — parent_name, phone (private), area, upazila, student_class, subject, preferred_gender, budget, days_per_week, preferred_time, mode (online/offline/both), notes, status enum (pending/approved/rejected/matched/filled/closed), submitted_by.
  - Public SELECT: only `status='approved'`, phone hidden via a view `public_tuition_requests` (or via `.select()` column list — we'll use a view for safety).
  - Admin ALL; owner SELECT own.
- `tuition_applications` — request_id, tutor_id, message, status (pending/accepted/rejected), created_at. Tutor (submitted_by=auth.uid via teachers join) can insert; admin manages.
- `education_news` — title, cover_image_url, category, content (markdown/text), publish_date, is_published, author_id. Public reads only `is_published=true`.
- `student_achievements` — student_name, photo_url, institution, area, achievement, story, is_published. Public reads only published.
- `study_resources` — title, description, student_class, subject, category, thumbnail_url, resource_type enum (website/gdrive/youtube/pdf/link), external_url, is_published.

Extend `teachers` table: add `student_class text`, `gender text`, `bio text` (bio may reuse `description`; we'll add explicit columns).

New enums: `tuition_status`, `tuition_app_status`, `resource_type`, `tutor_gender`.

Storage: reuse existing pattern; add public bucket `education-media` for news covers, achievement photos, resource thumbnails (public read).

## Server functions

Add `src/lib/education.functions.ts` with admin-guarded server fns (create/update/delete/publish/approve/reject for all new entities) using `requireSupabaseAuth` + `has_role('admin')` — mirrors existing `teachers.functions.ts` style.

Add `src/lib/education-shared.ts` with types and enums.

Public reads use the browser Supabase client directly (RLS enforces filters).

## Security

- Parent phone never returned in the public tuition_requests view / policy — only exposed to admin and matched tutor via server fn.
- Approved-tutor-only apply: server fn checks caller has an approved teacher row (submitted_by=userId).
- Pending/rejected content never queried publicly (RLS enforces).
- Uploads: image size + mime validation client-side; server fn signs.

## UX

- Mobile-first, reuse Card/Badge/Skeleton components.
- Empty states, loading skeletons, toast success/error, zod validation on all forms.
- SEO: `head()` per route with Bengali title/description; OG image on leaf pages with cover.

## Non-goals

- No redesign of existing pages.
- No removal of any feature.
- Not hosting external resource files (only external URLs stored).
- No payment/messaging system (contact happens via WhatsApp/phone shown only to matched tutor).

## Implementation order

1. Migration (schema + RLS + GRANTs + seed news/resources categories if any).
2. `education-shared.ts` + `education.functions.ts`.
3. Public routes (home, directory move, tuitions, resources, news, achievements).
4. Admin routes + link from admin index.
5. Extend teacher registration + directory filters.
6. Storage bucket for education media.
7. Verify build.
