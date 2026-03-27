# Mock Data → Live API Mapping

For each mock data object: what it is now, what API call replaces it, and exactly what changes in `app.js`.

---

## 1. `SEMS` (app.js line 742)

### Current mock shape
```js
var SEMS = {
  ws2526: {
    color: '#06D6A0',
    courses: [
      {
        id: 'c1',
        name: 'Grundlagen kpl. Maschinenelemente',
        short: 'GkMA',
        meta: 'Dipl.-Ing. Philipp',
        files: [
          { name: 'file.pdf', size: '4.5 MB', date: '24.10.2024' }
        ]
      },
      ...
    ]
  },
  ss25: { ... },
  ...
}
```

### API calls that build this
1. `GET /semesters` → list of semesters (IDs + titles)
2. `GET /users/me/courses?filter[semester]={semId}` → courses per semester
3. `GET /courses/{courseId}/file-refs` → files per course (lazy — only when user opens the course)

### New data shape (what SEMS becomes)
```js
// SEMS is no longer a static var.
// Instead, store in two runtime variables:
var semesterList = [];   // array from /semesters
var courseCache = {};    // keyed by semId → array of courses
var fileCache = {};      // keyed by courseId → array of file refs
```

### Field mapping

**Semester:**
| Mock field (SEMS key) | API source | Notes |
|----------------------|------------|-------|
| `ws2526` (key) | `semester.id` | Use API id as key |
| (displayed title) | `semester.attributes.title` | "Wintersemester 2025/26" |
| `color` | Not from API | Generate from COLORS array by index |

**Course:**
| Mock field | API source | Notes |
|-----------|------------|-------|
| `id` | `course.id` | Direct |
| `name` | `course.attributes.title` | Direct |
| `short` | `course.attributes.course_number` OR first letters of words | May need to derive |
| `meta` | `included[teacherId].attributes.formatted_name` | From `included` array |
| `files` | Lazy: `GET /courses/{id}/file-refs` when user opens course | Not fetched upfront |

**File:**
| Mock field | API source | Notes |
|-----------|------------|-------|
| `name` | `fileRef.attributes.name` | Direct |
| `size` | `fileRef.attributes.size` (bytes) | Format: `(size/1024/1024).toFixed(1) + ' MB'` |
| `date` | `fileRef.attributes.chdate` | Format: Unix → `DD.MM.YYYY` |
| `id` | `fileRef.id` | New field — needed for download URL |
| `fileId` | `fileRef.relationships.file.data.id` | New field — for actual binary download |

### Where SEMS is read in app.js

| Function | Line | Change needed |
|----------|------|--------------|
| `renderCourses()` | 242 | Read `courseCache[activeSemId]` instead of `SEMS[activeSemId].courses` |
| `sdRenderCourses()` | 296 | Same — read `courseCache[sdActiveSemId]` |
| Semester dropdown (portal + studip) | ~820 | Populate from `semesterList` instead of `Object.keys(SEMS)` |

---

## 2. `TT` (app.js line 784)

### Current mock shape
```js
var TT = [
  { day: 'Montag', start: '08:00', end: '09:30', name: 'Mathematik...', room: 'PK 2.1', ci: 1 },
  ...
]
```

### API call
```
GET /users/me/schedule   (or GET /schedule/{semesterId})
```

### Field mapping
| Mock field | API source | Notes |
|-----------|------------|-------|
| `day` | `slot.attributes.weekday` (1=Mon…7=Sun) | Map number → German day name |
| `start` | `slot.attributes.start` (ISO datetime) | Extract `HH:MM` |
| `end` | `slot.attributes.end` (ISO datetime) | Extract `HH:MM` |
| `name` | `slot.relationships.course → course.attributes.title` | Via included |
| `room` | `slot.attributes.room` | Direct |
| `ci` | Not from API | Derive from course index in semester's course list (for color) |

### Where TT is read

| Function | Line | Change needed |
|----------|------|--------------|
| `renderTT()` | 268 | Read live `ttData` array |
| `sdRenderTT()` | 319 | Same |

---

## 3. `MAILS` (app.js line 791)

### Current mock shape
```js
var MAILS = [
  { subject: '...', date: '18.03.2026', unread: true, preview: '...' },
  ...
]
```

### API call
```
GET /users/me/inbox
```

### Field mapping
| Mock field | API source | Notes |
|-----------|------------|-------|
| `subject` | `msg.attributes.subject` | Direct |
| `date` | `msg.attributes.mkdate` (Unix timestamp) | Format: `DD.MM.YYYY` |
| `unread` | `msg.attributes.unread` | Bool, direct |
| `preview` | `msg.attributes.message` stripped of HTML, first 100 chars | Strip tags |
| `id` | `msg.id` | New field — needed for "open mail" action |

### Where MAILS is read

| Function | Line | Change needed |
|----------|------|--------------|
| `renderMails()` | 284 | Read live `mailsData` array |
| `sdRenderMails()` | 337 | Same |

---

## 4. `PDF_DATA` (app.js line 3)

### Current mock shape
```js
var PDF_DATA = {
  'filename.pdf': 'base64string...',
  ...
}
```

### API approach
No longer a lookup object. PDFs are streamed from the backend.

**New flow when user clicks a file:**
1. User clicks file row → `openFile(f, course)` is called
2. `f` now has `f.fileId` (the Stud.IP file ID)
3. Call Railway backend: `GET /api/studip/file/{fileId}/download`
4. Backend fetches `GET /files/{fileId}/download` from Stud.IP with the user's token
5. Backend streams binary response back to browser
6. Frontend creates `URL.createObjectURL(blob)` and passes to pdf.js

### Change in `openFile()` (line 363)
```js
// OLD:
var b64 = PDF_DATA[f.name];
var binary = atob(b64), bytes = new Uint8Array(binary.length);
pdfjsLib.getDocument({data: bytes}).promise.then(...)

// NEW:
fetch(BACKEND_URL + '/api/studip/file/' + f.fileId + '/download', {
  headers: _sbHeaders()   // Supabase JWT so backend knows who the user is
})
.then(r => r.blob())
.then(blob => {
  var url = URL.createObjectURL(blob);
  pdfjsLib.getDocument({url: url}).promise.then(function(pdf) {
    // rest of the existing logic is unchanged
    pdfDoc = pdf; ...
  });
});
```

`_sbHeaders()` is already defined in `supabase.js` — it returns `{ Authorization: 'Bearer <token>', apikey: '...' }`.

---

## 5. Inline mock data inside `showCourseSection()` (line 404)

There are 4 hardcoded arrays inside this function:

### Opencast (`OC` array, line 423)
```js
var OC = [
  { title: '...', date: '...', dur: '87 min' },
  ...
]
```
**Replace with:** `GET /courses/{courseId}/videos`
| Mock field | API source |
|-----------|------------|
| `title` | `video.attributes.title` |
| `date` | `video.attributes.start` → format `DD.MM.YYYY` |
| `dur` | `video.attributes.duration` (seconds) → `Math.floor(s/60) + ' min'` |
| (new) `playerUrl` | `video.attributes.player_url` → open in modal/iframe |

### Forum (`FORUM` array, line 430)
```js
var FORUM = [
  { title: '...', replies: 5, author: 'Max M.', date: '...', unread: true },
  ...
]
```
**Replace with:** `GET /courses/{courseId}/forum_categories` then entries per category
| Mock field | API source |
|-----------|------------|
| `title` | `entry.attributes.subject` |
| `replies` | `entry.attributes.children_count` (if available) or count children |
| `author` | `included[authorId].attributes.formatted_name` |
| `date` | `entry.attributes.chdate` → format |
| `unread` | `entry.attributes.unread` or not present — derive from last read timestamp |

### Wiki (`WIKI` array, line 435)
```js
var WIKI = [
  { title: '...', edited: '...', author: '...' },
  ...
]
```
**Replace with:** `GET /courses/{courseId}/wiki_pages`
| Mock field | API source |
|-----------|------------|
| `title` | `page.attributes.keyword` |
| `edited` | `page.attributes.chdate` → format |
| `author` | `included[authorId].attributes.formatted_name` |

### Appointments (`APPTS` array, line 440)
```js
var APPTS = [
  { day: '21', mon: 'Mär', title: '...', time: '...', room: '...', type: 'lecture' },
  ...
]
```
**Replace with:** `GET /courses/{courseId}/events`
| Mock field | API source |
|-----------|------------|
| `day` | `event.attributes.start` → extract day number |
| `mon` | `event.attributes.start` → extract short month (German: Jan, Feb...) |
| `title` | `event.attributes.title` |
| `time` | `event.attributes.start` + `end` → "Do 09:45–11:15" |
| `room` | `event.attributes.room` |
| `type` | `event.attributes.event_type` → map to 'lecture'/'exercise'/etc. |

---

## Railway backend new endpoints needed

The backend (`studysphere-backend`) needs these new routes added:

| Route | What it does |
|-------|-------------|
| `GET /api/studip/semesters` | Fetches `/semesters` from Stud.IP for the user |
| `GET /api/studip/courses?sem={id}` | Fetches `/users/me/courses?filter[semester]={id}` |
| `GET /api/studip/courses/:id/files` | Fetches `/courses/:id/file-refs` |
| `GET /api/studip/file/:id/download` | Streams file binary from `/files/:id/download` |
| `GET /api/studip/schedule` | Fetches timetable |
| `GET /api/studip/messages` | Fetches inbox |
| `GET /api/studip/courses/:id/videos` | Fetches Opencast list |
| `GET /api/studip/courses/:id/forum` | Fetches forum entries |
| `GET /api/studip/courses/:id/wiki` | Fetches wiki pages |
| `GET /api/studip/courses/:id/events` | Fetches events/appointments |
| `POST /api/studip/oauth/callback` | Handles OAuth code exchange (if using OAuth2) |

Each route:
1. Reads `Authorization: Bearer <supabaseJWT>` header
2. Verifies JWT with Supabase to get `userId`
3. Looks up `studip_tokens` in Supabase for that user
4. Calls Stud.IP API with the user's Stud.IP access token
5. Returns the JSON response (or streams binary for downloads)

---

## Text extraction for AI (pdfFullText)

Currently `openFile()` extracts text via pdf.js `getTextContent()` and stores in `pdfFullText` (capped at 12,000 chars).

With live PDFs this same code still works — pdf.js can extract text from a blob URL just as well as from a `data:` buffer. **No change needed here.**
