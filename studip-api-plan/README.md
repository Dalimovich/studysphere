# Stud.IP API Integration Plan

## What this folder is

Reference docs for when you get API access from TU Braunschweig's Stud.IP instance.
No code has been written yet — this is the blueprint.

## Files in this folder

| File | Purpose |
|------|---------|
| `01-api-auth-and-endpoints.md` | Stud.IP REST API: how auth works, all endpoints you'll call |
| `02-mock-to-live-mapping.md` | Exact map of every mock data object → real API endpoint → UI element |
| `03-migration-steps.md` | Step-by-step order to replace mock data with live calls |

## TL;DR — What needs to change

There are **4 mock data objects** in `app.js` that need to be replaced:

| Variable | Line | What it is | Replaced by |
|----------|------|------------|-------------|
| `SEMS` | 742 | Semesters → courses → files | `GET /semesters` + `GET /courses` + `GET /course/:id/files` |
| `TT` | 784 | Timetable slots | `GET /schedule` (per semester) |
| `MAILS` | 791 | Inbox messages | `GET /messages` |
| `PDF_DATA` | 3 | Base64-encoded PDFs | Streamed from Stud.IP file download URL |

There are also **inline mock arrays** inside `showCourseSection()` (lines 423–441) for:
- Opencast videos → `GET /course/:id/videos`
- Forum posts → `GET /course/:id/forum_categories`
- Wiki pages → `GET /course/:id/wiki`
- Appointments → `GET /course/:id/events`

All API calls go through the **Railway backend proxy** (not directly from the browser) to avoid CORS.

## Current state summary

- `BACKEND_URL = 'https://studysphere-backend-production.up.railway.app'`
- The backend already handles AI calls at `/api/ai`
- Supabase JWT is available via `_sbHeaders()` in `supabase.js`
- The Supabase user's `id` is at `window._currentUser.id`
