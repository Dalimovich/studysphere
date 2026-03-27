# Migration Steps — Mock → Live Stud.IP Data

Do these in order. Each step is self-contained and testable before moving on.

---

## Prerequisites (do before writing any code)

- [ ] University has given you API credentials (OAuth client_id/secret, or API key)
- [ ] Confirmed base URL: `https://studip.tu-braunschweig.de/jsonapi.php/v1/`
- [ ] Tested at least one endpoint manually (e.g. in Postman or curl) and confirmed the JSON shape matches what's documented in `01-api-auth-and-endpoints.md`
- [ ] Know which auth method you have (OAuth2 vs API key)

---

## Step 1 — Backend: OAuth / Token storage

**Where:** Railway backend (not StudySphere frontend)

1. Create Supabase table `studip_tokens`:
   ```sql
   create table studip_tokens (
     user_id uuid references auth.users primary key,
     access_token text not null,
     refresh_token text,
     expires_at timestamptz
   );
   ```

2. If OAuth2: add the callback route `POST /api/studip/oauth/callback` to the backend.
   - Receives `code` from Stud.IP
   - POSTs to Stud.IP token endpoint to exchange for tokens
   - Stores tokens in `studip_tokens` for the user
   - Redirects user back to StudySphere

3. If API key: add a settings UI in StudySphere (profile page) where the user pastes their API key. Save it to `studip_tokens.access_token`.

**Test:** After connecting, row appears in `studip_tokens`. Make a test call from backend to `/semesters` and get a real response.

---

## Step 2 — Backend: Core proxy routes

Add to Railway backend:
- `GET /api/studip/semesters`
- `GET /api/studip/courses?sem={id}`
- `GET /api/studip/courses/:id/files`
- `GET /api/studip/schedule`
- `GET /api/studip/messages`

Each follows the same pattern:
1. Verify Supabase JWT → get `userId`
2. Load `studip_tokens` for user
3. Forward request to Stud.IP with `Authorization: Bearer <studip_token>`
4. Return JSON as-is (or lightly reshape if needed)

**Test:** Call `GET /api/studip/semesters` from Postman with a valid Supabase JWT. Should return semester list.

---

## Step 3 — Frontend: Replace `SEMS` with live data

**File:** `app.js`

1. Remove `var SEMS = { ... }` (line 742–783)

2. Add new variables near line 798 (the STATE section):
   ```js
   var semesterList = [];
   var courseCache = {};
   var fileCache = {};
   ```

3. Add a `loadStudipData()` function that runs after `_enterApp()`:
   ```js
   function loadStudipData() {
     fetch(BACKEND_URL + '/api/studip/semesters', { headers: _sbHeaders() })
       .then(r => r.json())
       .then(data => {
         semesterList = data.data.map(s => ({
           id: s.id,
           title: s.attributes.title,
           isCurrent: s.attributes.is_current
         }));
         activeSemId = (semesterList.find(s => s.isCurrent) || semesterList[0]).id;
         sdActiveSemId = activeSemId;
         return loadCoursesForSem(activeSemId);
       })
       .then(() => {
         populateSemDropdowns();
         renderCourses();
         sdRenderCourses();
       });
   }
   ```

4. Add `loadCoursesForSem(semId)`:
   ```js
   function loadCoursesForSem(semId) {
     if (courseCache[semId]) return Promise.resolve();
     return fetch(BACKEND_URL + '/api/studip/courses?sem=' + semId, { headers: _sbHeaders() })
       .then(r => r.json())
       .then(data => {
         courseCache[semId] = data.data.map(c => {
           var teacher = data.included && data.included.find(
             x => x.type === 'users' && c.relationships.teachers.data[0] &&
                  x.id === c.relationships.teachers.data[0].id
           );
           return {
             id: c.id,
             name: c.attributes.title,
             short: c.attributes.course_number || c.attributes.title.split(' ').map(w=>w[0]).join(''),
             meta: teacher ? teacher.attributes.formatted_name : '',
             files: null  // loaded lazily
           };
         });
       });
   }
   ```

5. Update `renderCourses()` to use `courseCache[activeSemId]` instead of `SEMS[activeSemId].courses`

6. Update `sdRenderCourses()` same way

7. Update semester dropdowns to populate from `semesterList`

**Test:** Open app → sidebar shows real courses from your TU account.

---

## Step 4 — Frontend: Lazy file loading

**File:** `app.js`

When a course is clicked (`openCourse()`), load files if not yet cached:

```js
function openCourse(course) {
  activeCourseId = course.id;
  // ... existing code up to buildSbCourseNav ...

  if (!fileCache[course.id]) {
    // show loading state in file list
    fetch(BACKEND_URL + '/api/studip/courses/' + course.id + '/files', { headers: _sbHeaders() })
      .then(r => r.json())
      .then(data => {
        fileCache[course.id] = data.data.map(f => ({
          name: f.attributes.name,
          size: formatBytes(f.attributes.size),
          date: formatDate(f.attributes.chdate),
          fileId: f.relationships.file.data.id
        }));
        course.files = fileCache[course.id];
        showCourseSection(course, 'files');
      });
  } else {
    course.files = fileCache[course.id];
    showCourseSection(course, 'files');
  }
}

function formatBytes(b) {
  if (b > 1048576) return (b/1048576).toFixed(1) + ' MB';
  return (b/1024).toFixed(0) + ' KB';
}

function formatDate(unix) {
  var d = new Date(unix * 1000);
  return [d.getDate(), d.getMonth()+1, d.getFullYear()].map(x=>String(x).padStart(2,'0')).join('.');
}
```

**Test:** Open a course → files list shows real files.

---

## Step 5 — Backend: File download proxy

Add route to Railway backend:
```
GET /api/studip/file/:fileId/download
```
Streams the binary from Stud.IP back to browser with original `Content-Type` header.

---

## Step 6 — Frontend: Replace `PDF_DATA` with streamed downloads

**File:** `app.js`

1. Remove `var PDF_DATA = { ... }` (line 3 — the entire base64 object, which is huge)

2. In `openFile(f, course)` replace the base64 block (lines 373–401) with:
   ```js
   function openFile(f, course) {
     activeFileName = f.name;
     currentCourseShort = course.short;
     // ... existing panel show code unchanged ...

     document.getElementById('pdfBody').innerHTML = '<div class="pdf-loading"><div class="loading-dots"><span></span><span></span><span></span></div><p>Loading PDF…</p></div>';

     fetch(BACKEND_URL + '/api/studip/file/' + f.fileId + '/download', { headers: _sbHeaders() })
       .then(r => {
         if (!r.ok) throw new Error('Download failed: ' + r.status);
         return r.blob();
       })
       .then(blob => {
         var url = URL.createObjectURL(blob);
         return pdfjsLib.getDocument({ url: url }).promise;
       })
       .then(function(pdf) {
         pdfDoc = pdf; pdfTotal = pdf.numPages; pdfPage = 1; pdfShowAll = true;
         pdfFullText = '';
         // text extraction — UNCHANGED from current code
         var textPromises = [];
         for (var pi = 1; pi <= pdf.numPages; pi++) {
           textPromises.push(pdf.getPage(pi).then(function(pg) {
             return pg.getTextContent().then(function(tc) {
               return tc.items.map(function(it) { return it.str; }).join(' ');
             });
           }));
         }
         Promise.all(textPromises).then(function(pages) {
           pdfFullText = pages.join('\n\n').slice(0, 12000);
         });
         updatePageInfo(); updateZoomPct();
         document.getElementById('pdfAll').textContent = 'Single page';
         renderPages();
       })
       .catch(function(e) {
         document.getElementById('pdfBody').innerHTML = '<div style="color:#fff;padding:40px">Error: ' + e.message + '</div>';
       });
   }
   ```

**Test:** Click a PDF → loads and renders. AI panel gets text content.

---

## Step 7 — Frontend: Replace `TT` and `MAILS`

**File:** `app.js`

1. Remove `var TT = [...]` (line 784) and `var MAILS = [...]` (line 791)

2. Add `var ttData = []; var mailsData = [];`

3. In `loadStudipData()` add parallel fetches:
   ```js
   fetch(BACKEND_URL + '/api/studip/schedule', { headers: _sbHeaders() })
     .then(r => r.json())
     .then(data => {
       var days = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
       ttData = data.data.map(s => ({
         day: days[s.attributes.weekday],
         start: s.attributes.start.substring(11, 16),
         end: s.attributes.end.substring(11, 16),
         name: /* resolve course name from included */ '...',
         room: s.attributes.room,
         ci: 0  // derive from course index
       }));
       renderTT(); sdRenderTT();
     });

   fetch(BACKEND_URL + '/api/studip/messages', { headers: _sbHeaders() })
     .then(r => r.json())
     .then(data => {
       mailsData = data.data.map(m => ({
         subject: m.attributes.subject,
         date: formatDate(m.attributes.mkdate),
         unread: m.attributes.unread,
         preview: m.attributes.message.replace(/<[^>]+>/g, '').slice(0, 120),
         id: m.id
       }));
       renderMails(); sdRenderMails();
     });
   ```

4. Update `renderTT()` to use `ttData` instead of `TT`
5. Update `renderMails()` to use `mailsData` instead of `MAILS`
6. Update `sdRenderTT()` and `sdRenderMails()` same way

**Test:** Timetable and mail list show real data.

---

## Step 8 — Frontend: Live course sections (Opencast, Forum, Wiki, Events)

**File:** `app.js`

Add backend routes for each (Step 2 covered the backend side).

In `showCourseSection(course, section)`, replace the 4 hardcoded arrays with async fetches:

```js
// Instead of: var OC = [...]
if (section === 'opencast') {
  fetch(BACKEND_URL + '/api/studip/courses/' + course.id + '/videos', { headers: _sbHeaders() })
    .then(r => r.json())
    .then(data => renderOpencast(data.data, co));
}
// Same pattern for forum, wiki, events
```

Each section shows a loading spinner while fetching, then renders the real data.

**Test:** Open a course → each tab loads real content.

---

## Step 9 — Cleanup

- Delete all base64 content from `PDF_DATA` at the top of `app.js` (this alone removes ~90% of the file's size)
- Remove the `SEMS`, `TT`, `MAILS` variable declarations
- Remove the inline `OC`, `FORUM`, `WIKI`, `APPTS` arrays from `showCourseSection()`
- Test sign-out / sign-in flow — make sure `loadStudipData()` only runs when user is authenticated

---

## Loading order summary (after migration)

```
ss-ready fires
  → _enterApp(user)
    → showPortal()
    → loadStudipData()          ← NEW
        → /semesters
        → /courses?sem=current  ← parallel with semesters
        → /schedule             ← parallel
        → /messages             ← parallel
        → populateSemDropdowns()
        → renderCourses()
        → sdRenderCourses()
        → renderTT()
        → renderMails()

User opens course
  → openCourse(c)
    → /courses/:id/files        ← lazy, only if not cached

User opens file
  → openFile(f, course)
    → /file/:id/download        ← streamed each time (or cache in IndexedDB)
```

---

## What does NOT change

- `openAI()` / `askAI()` / all AI panel logic — untouched
- `pdfFullText` extraction — same pdf.js code, just different source
- `renderMarkdown()` — untouched
- Lecture notes (Supabase) — untouched
- Auth flow (Google/Supabase) — untouched
- All CSS — untouched
- Night mode — untouched
- Chat history per file (`ss_chat_<filename>`) — still keyed by filename, works as-is
