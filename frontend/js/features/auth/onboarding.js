let _obTest = '';
let _obLevel = '';
const _obTestLevels = {
    TestDaF: ['TDN 3', 'TDN 4', 'TDN 5'],
    DSH: ['DSH-1', 'DSH-2', 'DSH-3'],
    Goethe: ['B1', 'B2', 'C1', 'C2'],
    telc: ['B2', 'C1', 'C1 Hochschule', 'C2'],
    OESD: ['B2', 'C1', 'C2'],
    DSD: ['DSD I (B1/B2)', 'DSD II (C1)'],
};
function _obShowStep(step) {
    ['obStep1', 'obStep2', 'obStep3a', 'obStep3b'].forEach((id) => {
        const el = document.getElementById(id);
        if (el)
            el.style.display = 'none';
    });
    const target = document.getElementById('obStep' + step);
    if (target)
        target.style.display = 'flex';
    const grad = 'linear-gradient(90deg,#3b82f6,#0ea5e9)';
    const dim = 'rgba(255,255,255,.12)';
    const p1 = document.getElementById('obProg1');
    const p2 = document.getElementById('obProg2');
    const p3 = document.getElementById('obProg3');
    if (step === '1') {
        if (p1)
            p1.style.background = grad;
        if (p2)
            p2.style.background = dim;
        if (p3)
            p3.style.background = dim;
    }
    else if (step === '2') {
        if (p1)
            p1.style.background = grad;
        if (p2)
            p2.style.background = grad;
        if (p3)
            p3.style.background = dim;
    }
    else {
        if (p1)
            p1.style.background = grad;
        if (p2)
            p2.style.background = grad;
        if (p3)
            p3.style.background = grad;
    }
}
function inputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}
function _obBaseInfo() {
    return {
        first: inputValue('obFirst'),
        last: inputValue('obLast'),
        age: inputValue('obAge'),
        email: inputValue('obEmail'),
    };
}
async function _obSaveAndClose(profilePayload, cachePayload, onError) {
    const _currentUser = window._currentUser;
    if (_currentUser) {
        const sb = window._sb;
        if (sb) {
            try {
                const res = await sb.from('profiles').upsert(profilePayload);
                if (res && res.error) {
                    const fallback = Object.assign({}, profilePayload);
                    delete fallback.vertiefung;
                    delete fallback.german_test;
                    delete fallback.german_level;
                    delete fallback.user_type;
                    const fallbackRes = await sb
                        .from('profiles')
                        .upsert(fallback);
                    if (fallbackRes && fallbackRes.error) {
                        console.warn('Profile save error (both attempts failed):', fallbackRes.error);
                        if (typeof onError === 'function')
                            onError();
                        return;
                    }
                    console.warn('Profile partial save:', res.error);
                }
            }
            catch (e) {
                console.warn('Profile save error:', e);
                if (typeof onError === 'function')
                    onError();
                return;
            }
        }
        try {
            const uid = _currentUser.id;
            if (uid) {
                localStorage.setItem('profile_cache_' + uid, JSON.stringify(cachePayload));
            }
        }
        catch {
            /* ignore */
        }
    }
    const pName = document.getElementById('profileName');
    const pEmail = document.getElementById('profileEmail');
    const pUni = document.getElementById('profileUniversity');
    const pProg = document.getElementById('profileProgramme');
    const pInit = document.getElementById('profileInitial');
    const fullName = profilePayload.full_name;
    if (pName)
        pName.value = fullName;
    if (pEmail)
        pEmail.value = profilePayload.email;
    if (pUni && profilePayload.university)
        pUni.value = profilePayload.university;
    if (pProg && profilePayload.programme)
        pProg.value = profilePayload.programme;
    if (pInit)
        pInit.textContent = fullName.charAt(0).toUpperCase();
    if (typeof window.updateAuthIndicator === 'function' && _currentUser)
        window.updateAuthIndicator(_currentUser);
    localStorage.setItem('ob_done_' + (_currentUser ? _currentUser.id : 'u'), '1');
    const modal = document.getElementById('onboardModal');
    if (modal)
        modal.style.display = 'none';
}
export function showOnboarding(email) {
    _obTest = '';
    _obLevel = '';
    _obShowStep('1');
    const title = document.getElementById('obTitle');
    const sub = document.getElementById('obSub');
    const emoji = document.getElementById('obEmoji');
    if (title)
        title.textContent = 'Welcome to Minallo!';
    if (sub)
        sub.textContent = "Let's set up your profile — step 1 of 3";
    if (emoji)
        emoji.textContent = '👋';
    const emailField = document.getElementById('obEmail');
    if (emailField && email)
        emailField.value = email;
    const modal = document.getElementById('onboardModal');
    if (modal)
        modal.style.display = 'flex';
}
function setupProgAutocomplete() {
    const inp = document.getElementById('obProg');
    const drop = document.getElementById('obProgDrop');
    if (!inp || !drop)
        return;
    function _showProgDrop(q) {
        if (!drop || !inp)
            return;
        const MAJOR_LIST = window.MAJOR_LIST || [];
        const items = q
            ? MAJOR_LIST.filter((v) => v.toLowerCase().includes(q.toLowerCase()))
            : MAJOR_LIST;
        if (!items.length) {
            drop.style.display = 'none';
            return;
        }
        drop.innerHTML = '';
        items.forEach((v) => {
            const opt = document.createElement('div');
            opt.textContent = v;
            opt.style.cssText =
                "padding:9px 14px;cursor:pointer;font-size:.85rem;color:rgba(255,255,255,.85);border-bottom:1px solid rgba(59,130,246,.1);font-family:'Nunito',sans-serif;font-weight:700";
            opt.addEventListener('mouseenter', () => {
                opt.style.background = 'rgba(59,130,246,.15)';
            });
            opt.addEventListener('mouseleave', () => {
                opt.style.background = '';
            });
            opt.addEventListener('mousedown', (e) => {
                e.preventDefault();
                inp.value = v;
                drop.style.display = 'none';
                _obToggleVertiefung(v);
            });
            drop.appendChild(opt);
        });
        drop.style.display = 'block';
    }
    function _obToggleVertiefung(major) {
        const row = document.getElementById('obVertiefungRow');
        const vInp = document.getElementById('obVertiefung');
        if (!row)
            return;
        const VERTIEFUNG_MAP = window.VERTIEFUNG_MAP || {};
        const list = VERTIEFUNG_MAP[major];
        const hasVertiefung = !!(list && list.length);
        row.style.display = hasVertiefung ? 'flex' : 'none';
        if (!hasVertiefung && vInp)
            vInp.value = '';
    }
    inp.addEventListener('focus', () => {
        _showProgDrop(inp.value.trim());
    });
    inp.addEventListener('input', () => {
        _showProgDrop(inp.value.trim());
        _obToggleVertiefung(inp.value.trim());
    });
    inp.addEventListener('blur', () => {
        setTimeout(() => {
            drop.style.display = 'none';
        }, 150);
    });
    _obToggleVertiefung(inp.value.trim());
}
function setupVertOnboardingAutocomplete() {
    const inp = document.getElementById('obVertiefung');
    const drop = document.getElementById('obVertDrop');
    if (!inp || !drop)
        return;
    function _showVertDrop(q) {
        if (!drop || !inp)
            return;
        const majorInp = document.getElementById('obProg');
        const major = majorInp ? majorInp.value.trim() : '';
        const VERTIEFUNG_MAP = window.VERTIEFUNG_MAP || {};
        const VERTIEFUNG_LIST = window.VERTIEFUNG_LIST || [];
        const mapped = VERTIEFUNG_MAP[major];
        const base = mapped && mapped.length ? mapped : VERTIEFUNG_LIST;
        const items = q ? base.filter((v) => v.toLowerCase().includes(q.toLowerCase())) : base;
        if (!items.length) {
            drop.style.display = 'none';
            return;
        }
        drop.innerHTML = '';
        items.forEach((v) => {
            const opt = document.createElement('div');
            opt.textContent = v;
            opt.style.cssText =
                "padding:9px 14px;cursor:pointer;font-size:.85rem;color:rgba(255,255,255,.85);border-bottom:1px solid rgba(59,130,246,.1);font-family:'Nunito',sans-serif;font-weight:700";
            opt.addEventListener('mouseenter', () => {
                opt.style.background = 'rgba(59,130,246,.15)';
            });
            opt.addEventListener('mouseleave', () => {
                opt.style.background = '';
            });
            opt.addEventListener('mousedown', (e) => {
                e.preventDefault();
                inp.value = v;
                drop.style.display = 'none';
            });
            drop.appendChild(opt);
        });
        drop.style.display = 'block';
    }
    inp.addEventListener('focus', () => {
        _showVertDrop(inp.value.trim());
    });
    inp.addEventListener('input', () => {
        _showVertDrop(inp.value.trim());
    });
    inp.addEventListener('blur', () => {
        setTimeout(() => {
            drop.style.display = 'none';
        }, 150);
    });
}
function setupVertProfileAutocomplete() {
    const inp = document.getElementById('profileVertiefung');
    const drop = document.getElementById('pfVertDrop');
    if (!inp || !drop)
        return;
    function _showPfVertDrop(q) {
        if (!drop || !inp)
            return;
        const VERTIEFUNG_LIST = window.VERTIEFUNG_LIST || [];
        const items = q
            ? VERTIEFUNG_LIST.filter((v) => v.toLowerCase().includes(q.toLowerCase()))
            : VERTIEFUNG_LIST;
        if (!items.length) {
            drop.style.display = 'none';
            return;
        }
        drop.innerHTML = '';
        items.forEach((v) => {
            const opt = document.createElement('div');
            opt.textContent = v;
            opt.style.cssText =
                "padding:9px 14px;cursor:pointer;font-size:.85rem;color:rgba(255,255,255,.85);border-bottom:1px solid rgba(59,130,246,.1);font-family:'Nunito',sans-serif;font-weight:700";
            opt.addEventListener('mouseenter', () => {
                opt.style.background = 'rgba(59,130,246,.15)';
            });
            opt.addEventListener('mouseleave', () => {
                opt.style.background = '';
            });
            opt.addEventListener('mousedown', (e) => {
                e.preventDefault();
                inp.value = v;
                drop.style.display = 'none';
            });
            drop.appendChild(opt);
        });
        drop.style.display = 'block';
    }
    inp.addEventListener('focus', () => {
        _showPfVertDrop(inp.value.trim());
    });
    inp.addEventListener('input', () => {
        _showPfVertDrop(inp.value.trim());
    });
    inp.addEventListener('blur', () => {
        setTimeout(() => {
            drop.style.display = 'none';
        }, 150);
    });
}
export function initOnboarding() {
    setupProgAutocomplete();
    setupVertOnboardingAutocomplete();
    setupVertProfileAutocomplete();
    window._obLogout = function () {
        localStorage.removeItem('sb_token');
        localStorage.removeItem('sb_refresh');
        sessionStorage.removeItem('sb_sess_refresh');
        sessionStorage.removeItem('sb_sess_token');
        sessionStorage.removeItem('ss_last_active');
        sessionStorage.removeItem('ss_logged_in');
        window.location.reload();
    };
    window._obNext = function () {
        const first = inputValue('obFirst');
        const last = inputValue('obLast');
        const age = inputValue('obAge');
        const email = inputValue('obEmail');
        const err = document.getElementById('obErr1');
        if (!err)
            return;
        if (!first || !last || !age || !email) {
            err.textContent = 'Please fill in all fields';
            err.style.display = 'block';
            return;
        }
        if (!email.includes('@')) {
            err.textContent = 'Please enter a valid email';
            err.style.display = 'block';
            return;
        }
        err.style.display = 'none';
        _obShowStep('2');
        const title = document.getElementById('obTitle');
        const sub = document.getElementById('obSub');
        const emoji = document.getElementById('obEmoji');
        if (title)
            title.textContent = 'Your path';
        if (sub)
            sub.textContent = 'Tell us about yourself — step 2 of 3';
        if (emoji)
            emoji.textContent = '🧭';
    };
    window._obSelectPath = function (path) {
        document.querySelectorAll('.ob-path-card').forEach((c) => {
            c.classList.remove('selected');
        });
        const card = document.getElementById(path === 'enrolled' ? 'obPathEnrolled' : 'obPathLearner');
        if (card)
            card.classList.add('selected');
        setTimeout(() => {
            _obShowStep(path === 'enrolled' ? '3a' : '3b');
            const title = document.getElementById('obTitle');
            const sub = document.getElementById('obSub');
            const emoji = document.getElementById('obEmoji');
            if (title)
                title.textContent = path === 'enrolled' ? 'Almost there!' : 'Your German journey';
            if (sub)
                sub.textContent = 'Details — step 3 of 3';
            if (emoji)
                emoji.textContent = path === 'enrolled' ? '🎓' : '🇩🇪';
        }, 200);
    };
    window._obBack = function (fromStep) {
        if (fromStep === 1 || fromStep === undefined) {
            _obShowStep('1');
            const title = document.getElementById('obTitle');
            const sub = document.getElementById('obSub');
            const emoji = document.getElementById('obEmoji');
            if (title)
                title.textContent = 'Welcome to Minallo!';
            if (sub)
                sub.textContent = "Let's set up your profile — step 1 of 3";
            if (emoji)
                emoji.textContent = '👋';
        }
        else {
            _obShowStep('2');
            const title = document.getElementById('obTitle');
            const sub = document.getElementById('obSub');
            const emoji = document.getElementById('obEmoji');
            if (title)
                title.textContent = 'Your path';
            if (sub)
                sub.textContent = 'Tell us about yourself — step 2 of 3';
            if (emoji)
                emoji.textContent = '🧭';
        }
    };
    window._obSelectTest = function (card) {
        document.querySelectorAll('.ob-test-card').forEach((c) => {
            c.classList.remove('selected');
        });
        card.classList.add('selected');
        _obTest = card.dataset['test'] || '';
        _obLevel = '';
        const wrap = document.getElementById('obLevelWrap');
        const grid = document.getElementById('obLevelGrid');
        if (!wrap || !grid)
            return;
        const levels = _obTestLevels[_obTest] || [];
        grid.innerHTML = levels
            .map((l) => '<button class="ob-level-btn" data-level="' + l + '">' + l + '</button>')
            .join('');
        wrap.style.display = 'flex';
    };
    window._obSelectLevel = function (btn, level) {
        document.querySelectorAll('.ob-level-btn').forEach((b) => {
            b.classList.remove('selected');
        });
        btn.classList.add('selected');
        _obLevel = level;
    };
    window._obFinish = async function () {
        const prog = inputValue('obProg');
        const vertiefung = inputValue('obVertiefung');
        const sem = inputValue('obSem');
        const matrikel = inputValue('obMatrikel');
        const err = document.getElementById('obErr3a');
        if (!err)
            return;
        if (!prog || !sem || !matrikel) {
            err.textContent = 'Please fill in all fields';
            err.style.display = 'block';
            return;
        }
        err.style.display = 'none';
        const btn = document.getElementById('obFinish');
        if (btn) {
            btn.textContent = '⏳ Saving…';
            btn.disabled = true;
        }
        function _reEnableFinish() {
            if (btn) {
                btn.textContent = 'Finish';
                btn.disabled = false;
            }
        }
        const info = _obBaseInfo();
        const fullName = info.first + ' ' + info.last;
        const programmeStr = prog + ', ' + sem + '. Semester';
        const MAJOR_LIST = window.MAJOR_LIST || [];
        if (vertiefung) {
            window._userVertiefung = vertiefung;
            localStorage.setItem('ss_vertiefung', vertiefung);
        }
        const _obMatchedMajor = MAJOR_LIST.find((m) => m.toLowerCase() === prog.toLowerCase());
        if (_obMatchedMajor) {
            window._userMajor = _obMatchedMajor;
            localStorage.setItem('ss_major', _obMatchedMajor);
        }
        const pVert = document.getElementById('profileVertiefung');
        const pMat = document.getElementById('profileMatrikel');
        if (pVert)
            pVert.value = vertiefung;
        if (pMat)
            pMat.value = matrikel;
        const _currentUser = window._currentUser;
        const payload = {
            id: _currentUser?.id,
            full_name: fullName,
            email: info.email,
            auth_email: _currentUser?.email || '',
            university: 'TU Braunschweig',
            programme: programmeStr,
            vertiefung: vertiefung,
            matrikel: matrikel,
            user_type: 'enrolled',
            age: parseInt(info.age) || null,
            updated_at: new Date().toISOString(),
        };
        await _obSaveAndClose(payload, {
            full_name: fullName,
            email: info.email,
            university: 'TU Braunschweig',
            programme: programmeStr,
            vertiefung: vertiefung,
            matrikel: matrikel,
            user_type: 'enrolled',
        }, _reEnableFinish);
    };
    window._obFinishLearner = async function () {
        const err = document.getElementById('obErr3b');
        if (!err)
            return;
        if (!_obTest) {
            err.textContent = 'Please select a test';
            err.style.display = 'block';
            return;
        }
        if (!_obLevel) {
            err.textContent = 'Please select your level';
            err.style.display = 'block';
            return;
        }
        err.style.display = 'none';
        const btn = document.getElementById('obFinishLearner');
        if (btn) {
            btn.textContent = '⏳ Saving…';
            btn.disabled = true;
        }
        function _reEnableFinishLearner() {
            if (btn) {
                btn.textContent = 'Finish';
                btn.disabled = false;
            }
        }
        const info = _obBaseInfo();
        const fullName = info.first + ' ' + info.last;
        const _currentUser = window._currentUser;
        const _uid = _currentUser?.id || '';
        if (_uid) {
            localStorage.setItem('ss_user_type_' + _uid, 'learner');
            localStorage.setItem('ss_german_test_' + _uid, _obTest);
            localStorage.setItem('ss_german_level_' + _uid, _obLevel);
        }
        localStorage.setItem('ss_user_type', 'learner');
        const payload = {
            id: _currentUser?.id,
            full_name: fullName,
            email: info.email,
            auth_email: _currentUser?.email || '',
            user_type: 'learner',
            german_test: _obTest,
            german_level: _obLevel,
            age: parseInt(info.age) || null,
            updated_at: new Date().toISOString(),
        };
        await _obSaveAndClose(payload, {
            full_name: fullName,
            email: info.email,
            user_type: 'learner',
            german_test: _obTest,
            german_level: _obLevel,
        }, _reEnableFinishLearner);
    };
    window.addEventListener('ss-ready', () => {
        const logoutBtn = document.getElementById('obLogoutBtn');
        const continueBtn = document.getElementById('obContinueBtn');
        const back1Btn = document.getElementById('obBack1Btn');
        const back2aBtn = document.getElementById('obBack2aBtn');
        const back2bBtn = document.getElementById('obBack2bBtn');
        const finishBtn = document.getElementById('obFinish');
        const finishLrnBtn = document.getElementById('obFinishLearner');
        const testGrid = document.getElementById('obTestGrid');
        const levelGrid = document.getElementById('obLevelGrid');
        if (logoutBtn)
            logoutBtn.addEventListener('click', () => {
                window._obLogout?.();
            });
        if (continueBtn)
            continueBtn.addEventListener('click', () => {
                window._obNext?.();
            });
        if (back1Btn)
            back1Btn.addEventListener('click', () => {
                window._obBack?.(1);
            });
        if (back2aBtn)
            back2aBtn.addEventListener('click', () => {
                window._obBack?.(2);
            });
        if (back2bBtn)
            back2bBtn.addEventListener('click', () => {
                window._obBack?.(2);
            });
        if (finishBtn)
            finishBtn.addEventListener('click', () => {
                void window._obFinish?.();
            });
        if (finishLrnBtn)
            finishLrnBtn.addEventListener('click', () => {
                void window._obFinishLearner?.();
            });
        document.querySelectorAll('.ob-path-card[data-path]').forEach((card) => {
            card.addEventListener('click', () => {
                const path = card.dataset['path'];
                if (path)
                    window._obSelectPath?.(path);
            });
        });
        if (testGrid) {
            testGrid.addEventListener('click', (e) => {
                const target = e.target;
                const card = target ? target.closest('.ob-test-card') : null;
                if (card && window._obSelectTest)
                    window._obSelectTest(card);
            });
        }
        if (levelGrid) {
            levelGrid.addEventListener('click', (e) => {
                const target = e.target;
                const btn = target ? target.closest('.ob-level-btn') : null;
                if (btn && btn.dataset['level'] && window._obSelectLevel)
                    window._obSelectLevel(btn, btn.dataset['level']);
            });
        }
    });
}
//# sourceMappingURL=onboarding.js.map