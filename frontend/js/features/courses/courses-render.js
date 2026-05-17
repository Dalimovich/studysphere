import { panelShow, panelHide } from '../../core/panels.js';
import { listCourseDocuments } from '../../services/ai-service.js';
// Reuse one in-flight fetch per course so opening the dashboard repeatedly
// doesn't fan out into duplicate /api/documents/list calls.
const _countFetchInFlight = {};
function _hydrateCardCount(courseId, badge) {
    // The cached-profile IIFE in app.ts renders course cards before _verifyAndEnter
    // sets window._sbToken, so a fetch fired here would 401. Render the cached count
    // (written by a prior successful fetch) and bail — a second render runs once
    // auth completes via loadUserData → _loadUserCourses, which will repopulate.
    if (!window._sbToken) {
        try {
            const cached = localStorage.getItem('ss_fc_' + courseId);
            if (cached != null) {
                const n = Number(cached);
                if (Number.isFinite(n))
                    badge.textContent = n + ' file' + (n !== 1 ? 's' : '');
            }
        }
        catch { /* quota / parse */ }
        return;
    }
    const inFlight = _countFetchInFlight[courseId];
    if (inFlight) {
        inFlight.then((count) => {
            if (count != null)
                badge.textContent = count + ' file' + (count !== 1 ? 's' : '');
        });
        return;
    }
    _countFetchInFlight[courseId] = listCourseDocuments(courseId)
        .then((docs) => {
        const count = Array.isArray(docs) ? docs.length : 0;
        try {
            localStorage.setItem('ss_fc_' + courseId, String(count));
        }
        catch { /* quota */ }
        if (badge.isConnected)
            badge.textContent = count + ' file' + (count !== 1 ? 's' : '');
        return count;
    })
        .catch(() => null)
        .finally(() => { delete _countFetchInFlight[courseId]; });
}
export function renderCourses(state) {
    const cl = document.getElementById('courseList');
    if (!cl)
        return;
    cl.innerHTML = '';
    const sem = state.SEMS[state.activeSemId];
    if (!sem)
        return;
    sem.courses.forEach((c, i) => {
        const col = state.COLORS[i % state.COLORS.length] || '#2563EB';
        const wrap = document.createElement('div');
        const row = document.createElement('div');
        row.className = 'course-row' + (state.activeCourseId === c.id ? ' active' : '');
        const bar = document.createElement('div');
        bar.className = 'cr-bar';
        bar.style.background = col;
        const info = document.createElement('div');
        info.className = 'cr-info';
        const name = document.createElement('div');
        name.className = 'cr-name';
        name.textContent = c.name;
        const meta = document.createElement('div');
        meta.className = 'cr-meta';
        meta.textContent = c.meta || '';
        info.append(name, meta);
        row.append(bar, info);
        row.addEventListener('click', () => {
            if (state.activeCourseId === c.id) {
                state.activeCourseId = null;
                panelHide(document.getElementById('courseOverview'));
                panelShow(document.getElementById('welcomeState'));
                const crumb = document.getElementById('breadcrumb');
                if (crumb)
                    crumb.textContent = 'Courses';
                renderCourses(state);
            }
            else {
                state._cameFromStudip = false;
                if (typeof window.openCourse === 'function')
                    window.openCourse(c);
            }
        });
        wrap.appendChild(row);
        cl.appendChild(wrap);
    });
}
export function sdRenderCourses(state) {
    const cl = document.getElementById('sdCourseList');
    if (!cl)
        return;
    cl.innerHTML = '';
    const sem = state.SEMS[state.sdActiveSemId];
    if (!sem)
        return;
    if (!sem.courses.length) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:32px;text-align:center;opacity:.5;font-size:.9rem';
        empty.textContent = 'No subjects added yet. Use the search bar above to add your courses.';
        cl.appendChild(empty);
        return;
    }
    sem.courses.forEach((c, i) => {
        const col = state.COLORS[i % state.COLORS.length] || '#2563EB';
        const card = document.createElement('div');
        card.className = 'sd-course-card';
        const folderCount = (c.userFolders || []).reduce((s, fd) => s + (fd.files ? fd.files.length : 0), 0);
        const liveCount = (c.files?.length || 0) + folderCount;
        let cachedCount = 0;
        if (!liveCount) {
            try {
                const ufc = JSON.parse(localStorage.getItem('ss_uf_cache_' + c.id) || 'null');
                if (ufc) {
                    cachedCount =
                        (ufc.files || []).length +
                            (ufc.folders || []).reduce((s, fd) => s + (fd.files ? fd.files.length : 0), 0);
                }
            }
            catch { /* corrupted cache */ }
        }
        const count = liveCount || cachedCount || parseInt(localStorage.getItem('ss_fc_' + c.id) || '0', 10);
        // Glow strip — full-bleed gradient on top so the card reads from a distance.
        const colorBar = document.createElement('div');
        colorBar.className = 'sd-course-bar';
        colorBar.style.background =
            'linear-gradient(90deg, ' + col + ' 0%, ' + col + '88 100%)';
        // Subject monogram derived from the first letters of the course name.
        const monogram = document.createElement('div');
        monogram.className = 'sd-course-monogram';
        monogram.style.background =
            'linear-gradient(135deg, ' + col + '38, ' + col + '14)';
        monogram.style.color = col;
        monogram.textContent = (c.name || '?')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        const courseName = document.createElement('div');
        courseName.className = 'sd-course-name';
        courseName.textContent = c.name;
        const courseMeta = document.createElement('div');
        courseMeta.className = 'sd-course-meta';
        courseMeta.textContent = c.meta || '';
        const badge = document.createElement('div');
        badge.className = 'sd-course-badge';
        badge.textContent = count + ' file' + (count !== 1 ? 's' : '');
        if (!liveCount)
            _hydrateCardCount(c.id, badge);
        const footer = document.createElement('div');
        footer.className = 'sd-course-footer';
        const openCta = document.createElement('span');
        openCta.className = 'sd-course-open';
        openCta.textContent = 'Open course →';
        footer.append(badge, openCta);
        const delBtn = document.createElement('button');
        delBtn.className = 'sd-del-btn';
        delBtn.title = 'Remove';
        delBtn.setAttribute('aria-label', 'Remove course');
        delBtn.textContent = '✕';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.SEMS[state.sdActiveSemId]?.courses.splice(i, 1);
            if (typeof window._saveUserCourses === 'function')
                window._saveUserCourses();
            sdRenderCourses(state);
        });
        card.append(colorBar, monogram, courseName, courseMeta, footer, delBtn);
        if (count === 0)
            card.classList.add('sd-course-card-empty');
        card.addEventListener('click', () => {
            if (typeof window.hideStudip === 'function')
                window.hideStudip();
            state._cameFromStudip = true;
            state.activeSemId = state.sdActiveSemId;
            renderCourses(state);
            if (typeof window.openCourse === 'function')
                window.openCourse(c);
        });
        cl.appendChild(card);
    });
}
//# sourceMappingURL=courses-render.js.map