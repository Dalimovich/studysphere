# Stud.IP API — Auth & Endpoints

## Base URL

TU Braunschweig Stud.IP instance:
```
https://studip.tu-braunschweig.de/api.php/v2/
```
(Confirm this with the university — some instances use `/jsonapi.php/v1/` for JSON-API spec)

---

## Authentication

Stud.IP supports two auth mechanisms. Which one you get depends on what the university grants:

### Option A — OAuth 2.0 (preferred)
The university issues you a **client_id** and **client_secret**.

Flow:
1. User clicks "Connect Stud.IP" in StudySphere
2. Redirect to: `https://studip.tu-braunschweig.de/dispatch.php/api/oauth2/authorize?client_id=YOUR_ID&redirect_uri=YOUR_BACKEND/studip/callback&response_type=code`
3. User logs in at TU portal → grants permission
4. Stud.IP redirects to your Railway backend with `?code=...`
5. Backend exchanges `code` for `access_token` + `refresh_token` (via POST to `/oauth2/token`)
6. Backend stores tokens in Supabase under user's `id` (table: `studip_tokens`)
7. All subsequent Stud.IP API calls use `Authorization: Bearer <access_token>`

Token refresh: send `grant_type=refresh_token` when you get a 401.

### Option B — HTTP Basic / API Key
Simpler — university gives you a personal access token.
```
Authorization: Basic base64(username:password)
```
or
```
Authorization: Token <api_key>
```

### Where tokens live (in StudySphere)

Store in Supabase table `studip_tokens`:
```
user_id     uuid  (foreign key to auth.users)
access_token  text
refresh_token text
expires_at    timestamptz
```
The Railway backend reads these before making Stud.IP requests on behalf of a user.

---

## Endpoints you'll use

All relative to `https://studip.tu-braunschweig.de/jsonapi.php/v1/`

### Semesters
```
GET /semesters
```
Returns array of semesters. Each has:
- `id` — semester ID (use as key, replaces `ws2526`, `ss25`, etc.)
- `attributes.title` — e.g. "Wintersemester 2025/26"
- `attributes.begin` / `attributes.end` — Unix timestamps
- `attributes.is_current` — bool

### Courses for the current user
```
GET /users/me/courses
```
or filtered by semester:
```
GET /users/me/courses?filter[semester]={semesterId}
```
Each course object has:
- `id` — course ID (replaces `c1`, `c2`, etc.)
- `attributes.title` — full course name
- `attributes.subtitle` — short description
- `attributes.course_number` — the module number
- `relationships.teachers.data[]` — array of teacher user refs

### Course teachers (to get `meta` field = "Prof. Dr. X")
```
GET /users/{teacherId}
```
Returns `attributes.formatted_name`

### Files in a course
```
GET /courses/{courseId}/file-refs
```
or the top-level folder:
```
GET /courses/{courseId}/top_folder
GET /folders/{folderId}/file-refs
```
Each file-ref has:
- `id` — file ref ID
- `attributes.name` — filename
- `attributes.size` — bytes
- `attributes.chdate` — last changed timestamp
- `attributes.mime_type`
- `relationships.file.data.id` — actual file ID for download

### Download a PDF
```
GET /files/{fileId}/download
```
Returns binary stream with `Content-Type: application/pdf`.
**Not base64 — it's a real binary download.**

### Timetable / Schedule
```
GET /users/me/schedule
```
or by semester:
```
GET /schedule/{semesterId}
```
Each slot has:
- `attributes.start` / `attributes.end` — ISO datetime
- `attributes.weekday` — 1=Mon … 7=Sun
- `attributes.room` — room name
- `relationships.course.data.id` — link back to course

### Messages (Inbox)
```
GET /users/me/inbox
```
Each message has:
- `id`
- `attributes.subject`
- `attributes.message` — body HTML
- `attributes.mkdate` — sent timestamp
- `attributes.unread` — bool
- `relationships.sender.data.id` — sender user ref

### Opencast / Videos
```
GET /courses/{courseId}/videos
```
(Only available if the course uses Opencast plugin)
Each video:
- `attributes.title`
- `attributes.start` — recording date
- `attributes.duration` — seconds
- `attributes.preview_image` — thumbnail URL
- `attributes.player_url` — embed URL

### Forum
```
GET /courses/{courseId}/forum_categories
GET /forum_categories/{categoryId}/forum_entries
GET /forum_entries/{entryId}/children
```
Each entry:
- `attributes.subject`
- `attributes.content`
- `attributes.chdate`
- `attributes.anonymous` — bool
- `relationships.author.data.id`

### Wiki
```
GET /courses/{courseId}/wiki_pages
GET /wiki_pages/{pageId}
```
Each page:
- `attributes.keyword` — page title
- `attributes.content` — wiki markup
- `attributes.chdate`
- `relationships.author.data.id`

### Appointments / Events
```
GET /courses/{courseId}/events
```
Each event:
- `attributes.title`
- `attributes.start` / `attributes.end` — ISO datetime
- `attributes.room`
- `attributes.canceled` — bool
- `attributes.event_type` — 'Vorlesung', 'Übung', etc.

---

## JSON:API response shape

All endpoints return JSON:API format:
```json
{
  "data": [
    {
      "type": "courses",
      "id": "abc123",
      "attributes": { "title": "...", ... },
      "relationships": {
        "teachers": { "data": [{ "type": "users", "id": "xyz" }] }
      }
    }
  ],
  "included": [
    { "type": "users", "id": "xyz", "attributes": { "formatted_name": "Prof. Dr. Schmidt" } }
  ]
}
```

The `included` array contains related objects to avoid N+1 fetches. Always check it before making extra requests.

---

## Rate limits

Not publicly documented for TU BS. Safe assumption: cache aggressively.
- Semester list: cache in localStorage indefinitely (changes once per 6 months)
- Course list: cache per session
- File list: cache per session, invalidate on manual refresh
- PDF content: cache in IndexedDB or localStorage by file ID
