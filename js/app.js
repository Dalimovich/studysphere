// StudySphere app.js — build 1774335018 — async fixes

var PDF_DATA = {
  'Aufgabe_1_3.pdf': 'assets/Aufgabe_1_3.pdf'
};

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Suppress harmless PDF.js warnings
(function(){
  var _w=console.warn.bind(console),_e=console.error.bind(console);
  var sup=['fake worker','TT:','undefined function','scale-factor'];
  console.warn=function(){var m=Array.prototype.join.call(arguments,' ');if(sup.some(function(s){return m.indexOf(s)!==-1;}))return;_w.apply(console,arguments);};
  console.error=function(){var m=Array.prototype.join.call(arguments,' ');if(sup.some(function(s){return m.indexOf(s)!==-1;}))return;_e.apply(console,arguments);};
})();

// ── GLOBAL FUNCTIONS (accessible from inline onclick) ─────────────────────

function copyBubble(btn){
  var bubble=btn.closest('.msg-body').querySelector('.ai-bubble');
  var text=bubble.innerText||bubble.textContent;
  var orig=btn.textContent;
  function done(){btn.textContent='✅';setTimeout(function(){btn.textContent=orig;},1400);}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(function(){fallbackCopy(text);done();});
  } else {fallbackCopy(text);done();}
}
function fallbackCopy(text){
  var ta=document.createElement('textarea');
  ta.value=text;ta.style.cssText='position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(ta);
}
function regenMsg(btn){
  var wrap=btn.closest('.ai-msg-wrap');
  var q=wrap.getAttribute('data-q');
  if(!q)return;
  if(window.stopGeneration)window.stopGeneration();
  var next=wrap.nextElementSibling;
  while(next&&!next.classList.contains('user')){
    var rem=next;next=next.nextElementSibling;rem.remove();
  }
  var sendBtn=document.getElementById('aiSend');
  if(sendBtn)sendBtn.disabled=false;
  if(window.askAI)window.askAI(q,true);
}

// ── GLOBAL STUBS (reassigned in DOMContentLoaded) ────────────────────────
var askAI=function(q,s){console.warn('AI not ready yet');};
var stopGeneration=function(){};
var pinAI=function(){};

// ── NIGHT MODE (global — referenced by supabase.js before DOMContentLoaded) ──
var nightOn = true;
(function(){
  var _sd = localStorage.getItem('ss_dark'); // localStorage so preference survives browser restart
  if (_sd !== null) {
    nightOn = (_sd === '1');
    document.body.classList.toggle('night', nightOn);
  }
  // else: keep default dark (nightOn=true, body has class "night")
})();

// deferredSave declared globally so ss-ready can wrap it
var deferredSave = function(){};



// ── FUNCTIONS HOISTED TO GLOBAL SCOPE ─────────────────────────────────────
function showStudip(){
  var appEl=document.getElementById('app');
  if(appEl) appEl.style.display='flex';
  var portal=document.getElementById('portal');
  var studip=document.getElementById('studipDash');
  sdRenderCourses();sdRenderTT();sdRenderMails();
  try{var _sst=JSON.parse(localStorage.getItem('ss_state')||'{}');_sst.view='studip';_sst.inApp=true;localStorage.setItem('ss_state',JSON.stringify(_sst));}catch(e){}
  studip.style.display='block';
  studip.style.transition='none';
  studip.style.opacity='0';
  studip.style.transform='scale(0.97)';
  studip.style.pointerEvents='none';
  studip.style.zIndex='220';
  void studip.offsetWidth;
  studip.style.transition = 'opacity 460ms cubic-bezier(0.22,1,0.36,1), transform 460ms cubic-bezier(0.22,1,0.36,1)';
  studip.style.opacity = '1';
  studip.style.transform = 'scale(1)';
  studip.style.pointerEvents = 'auto';
  setTimeout(function(){
    portal.classList.remove('show');
    portal.style.display='none';
    portal.style.opacity=''; portal.style.transition=''; portal.style.pointerEvents=''; portal.style.zIndex='';
    studip.style.zIndex='210'; studip.style.transition=''; studip.style.transform='';
  }, 480);
}

function showPortal(){
  var appEl=document.getElementById('app');
  if(appEl) appEl.style.display='none';
  var portal=document.getElementById('portal');
  var studip=document.getElementById('studipDash');
  portal.style.transition='none';
  portal.style.opacity='0';
  portal.style.transform='scale(0.97)';
  portal.style.pointerEvents='none';
  portal.style.zIndex='220';
  portal.classList.add('show');
  void portal.offsetWidth;
  portal.style.transition = 'opacity 460ms cubic-bezier(0.22,1,0.36,1), transform 460ms cubic-bezier(0.22,1,0.36,1)';
  portal.style.opacity = '1';
  portal.style.transform = 'scale(1)';
  portal.style.pointerEvents = 'auto';
  setTimeout(function(){
    studip.style.transition='none'; studip.style.opacity='0'; studip.style.pointerEvents='none';
    portal.style.zIndex=''; portal.style.opacity=''; portal.style.transition=''; portal.style.transform='';
    portal.style.display='block';
    try{var st=JSON.parse(localStorage.getItem('ss_state')||'{}');st.inApp=false;st.view='';localStorage.setItem('ss_state',JSON.stringify(st));}catch(e){}
  }, 500);
}

function hideStudip(){
  // Instant hide — used when navigating into a course
  var s=document.getElementById('studipDash');
  s.style.transition='none';s.style.opacity='0';s.style.pointerEvents='none';
  s.style.display='none';
  var appEl=document.getElementById('app');
  if(appEl) appEl.style.display='flex';
}

function showApp() {
  showStudip();
  _ssReplaceHistory({ view: 'studip' }, '#studip');
}

function setNavActive(id) {
  document.querySelectorAll('.psb').forEach(function(el){ el.classList.remove('on'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function showPortalSection(sec) {
  document.querySelectorAll('.portal-section').forEach(function(el){ el.style.display='none'; });
  var target = document.getElementById('psec-'+sec);
  if (target) target.style.display = 'block';
  // Show/hide lecture notes and extension banner only on dashboard/home
  var isDash = (sec === 'dashboard');
  var ln = document.getElementById('lnSection');
  var ext = document.getElementById('extBanner');
  if (ln) ln.style.display = isDash ? '' : 'none';
  if (ext) ext.style.display = isDash ? '' : 'none';
}

function openSB(){sbOpen=true;document.getElementById('sidebar').classList.add('visible');}

function closeSB(){sbOpen=false;document.getElementById('sidebar').classList.remove('visible');}

function showToast(title, sub) {
  var toast = document.getElementById('ss-toast');
  document.getElementById('ss-toast-title').textContent = title;
  document.getElementById('ss-toast-sub').textContent = sub || 'From StudySphere Extension';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 6000);
}

function saveState(){
  try{
    var portalVisible = document.getElementById('portal').classList.contains('show');
    if(portalVisible) return; // don't save portal state
    var st={
      semId: activeSemId,
      courseId: activeCourseId,
      fileName: activeFileName,
      section: activeCourseSection,
      inApp: true
    };
    localStorage.setItem('ss_state', JSON.stringify(st));
  }catch(e){}
}

function restoreState(){
  try{
    var raw=localStorage.getItem('ss_state');
    if(!raw) return;
    var st=JSON.parse(raw);
    // Only restore app state if user was in the app (not portal)
    if(!st.inApp) return;
    var _pEl=document.getElementById('portal');
    if(!_pEl){ console.warn('restoreState skipped: #portal not found'); return; }
    _pEl.style.opacity='';_pEl.style.transition='';_pEl.style.pointerEvents='';_pEl.style.zIndex='';_pEl.classList.remove('show');

    if(st.view === 'studip') { showStudip(); return; }

    var _appEl=document.getElementById('app');
    if(_appEl) _appEl.style.display='flex';

    // Night mode is controlled by Supabase settings, not localStorage

    // Semester
    if(st.semId && SEMS[st.semId]){
      activeSemId=st.semId;
      var opt=document.querySelector('.sem-opt[data-sid="'+st.semId+'"]');
      if(opt){
        document.querySelectorAll('.sem-opt').forEach(function(x){x.classList.remove('sel');});
        opt.classList.add('sel');
        document.getElementById('semLabel').textContent=opt.textContent.trim();
        document.getElementById('semDot').style.background=opt.getAttribute('data-col');
      }
      renderCourses();
    }

    // Course
    if(st.courseId){
      var sem=SEMS[activeSemId];
      if(sem){
        var course=sem.courses.find(function(c){return c.id===st.courseId;});
        if(course){
          // Restore course view
          activeCourseId=st.courseId;
          _panelHide(document.getElementById('welcomeState'));
          _panelShow(document.getElementById('courseOverview'));
          document.getElementById('breadcrumb').innerHTML='<b>'+course.name+'</b>';
          document.getElementById('sbMain').style.display='none';
          document.getElementById('sbCourse').style.display='flex';
          buildSbCourseNav(course, st.section||'files');
          renderCourses();

          // Restore file
          if(st.fileName){
            var f=course.files.find(function(x){return x.name===st.fileName;});
            if(f){
              openFile(f, course);
              return;
            }
          }
          showCourseSection(course, st.section||'files');
          return;
        }
      }
    }
  }catch(e){ console.warn('State restore failed:', e); }
}

function forceCloseAI(){aiPinned=false;aiOpen=false;aiPanel.classList.remove('visible');aiTab.classList.remove('hidden');}

function closeAI(){if(aiPinned)return;aiOpen=false;aiPanel.classList.remove('visible');aiTab.classList.remove('hidden');}

function openAI(){aiOpen=true;aiPanel.classList.add('visible');aiTab.classList.add('hidden');}

function renderCourses(){
  var cl=document.getElementById('courseList');cl.innerHTML='';
  var sem=SEMS[activeSemId];if(!sem)return;
  sem.courses.forEach(function(c,i){
    var col=COLORS[i%COLORS.length],wrap=document.createElement('div');
    var row=document.createElement('div');
    row.className='course-row'+(activeCourseId===c.id?' active':'');
    row.innerHTML='<div class="cr-bar" style="background:'+col+'"></div>'+
      '<div class="cr-info"><div class="cr-name">'+c.name+'</div><div class="cr-meta">'+c.meta+'</div></div>';
    row.addEventListener('click',function(){
      if(activeCourseId===c.id){
        activeCourseId=null;
        _panelHide(document.getElementById('courseOverview'));
        _panelShow(document.getElementById('welcomeState'));
        document.getElementById('sbCourse').style.display='none';
        document.getElementById('sbMain').style.display='block';
        document.getElementById('breadcrumb').innerHTML='Stud.IP — <b>TU Braunschweig</b>';
        renderCourses();closeSB();
      } else {
        _cameFromStudip=false;
        openCourse(c);
      }
    });
    wrap.appendChild(row);cl.appendChild(wrap);
  });
}

function renderTT(){
  var tl=document.getElementById('ttList');tl.innerHTML='';
  var days={};
  TT.forEach(function(s){if(!days[s.day])days[s.day]=[];days[s.day].push(s);});
  Object.keys(days).forEach(function(day){
    var dl=document.createElement('div');dl.className='tt-day-sb';dl.textContent=day;tl.appendChild(dl);
    days[day].forEach(function(s){
      var sl=document.createElement('div');sl.className='tt-slot-sb';
      sl.style.borderLeftColor=COLORS[s.ci%COLORS.length];
      sl.innerHTML='<div class="tt-time-sb">'+s.start+' – '+s.end+'</div>'+
        '<div class="tt-name-sb">'+s.name+'</div><div class="tt-room-sb">📍 '+s.room+'</div>';
      tl.appendChild(sl);
    });
  });
}

function renderMails(){
  var ml=document.getElementById('mailList');ml.innerHTML='';
  MAILS.forEach(function(m){
    var el=document.createElement('div');
    el.className='mail-sb'+(m.unread?' unread':'');
    el.innerHTML='<div class="mail-sb-subj">'+(m.unread?'● ':'')+m.subject+'</div>'+
      '<div class="mail-sb-date">'+m.date+'</div>'+
      '<div class="mail-sb-prev">'+m.preview+'</div>';
    ml.appendChild(el);
  });
}

function sdRenderCourses(){
  var cl=document.getElementById('sdCourseList');cl.innerHTML='';
  var sem=SEMS[sdActiveSemId];if(!sem)return;
  sem.courses.forEach(function(c,i){
    var col=COLORS[i%COLORS.length];
    var card=document.createElement('div');card.className='sd-course-card';
    card.innerHTML='<div class="sd-course-bar" style="background:'+col+'"></div>'+
      '<div class="sd-course-name">'+c.name+'</div>'+
      '<div class="sd-course-meta">'+c.meta+'</div>'+
      '<div class="sd-course-badge">'+c.files.length+' file'+(c.files.length!==1?'s':'')+'</div>';
    card.addEventListener('click',function(){
      // Hide portal and studipDash, show #app
      var portalEl=document.getElementById('portal');
      if(portalEl){portalEl.classList.remove('show');portalEl.style.display='none';portalEl.style.opacity='';portalEl.style.pointerEvents='';}
      hideStudip();
      _cameFromStudip=true;
      activeSemId=sdActiveSemId;
      renderCourses();
      openCourse(c);
    });
    cl.appendChild(card);
  });
}

function sdRenderTT(){
  var tl=document.getElementById('sdTTList');tl.innerHTML='';
  var days={};
  TT.forEach(function(s){if(!days[s.day])days[s.day]=[];days[s.day].push(s);});
  Object.keys(days).forEach(function(day){
    var dl=document.createElement('div');dl.className='sd-tt-day';dl.textContent=day;tl.appendChild(dl);
    days[day].forEach(function(s){
      var sl=document.createElement('div');sl.className='sd-tt-slot';
      var col=COLORS[s.ci%COLORS.length];
      sl.style.borderLeftColor=col;
      sl.innerHTML='<div class="sd-tt-time">'+s.start+' – '+s.end+'</div>'+
        '<div class="sd-tt-name">'+s.name+'</div>'+
        '<div class="sd-tt-room">'+s.room+'</div>';
      tl.appendChild(sl);
    });
  });
}

function sdRenderMails(){
  var ml=document.getElementById('sdMailList');ml.innerHTML='';
  MAILS.forEach(function(m){
    var el=document.createElement('div');el.className='sd-mail';
    el.innerHTML='<div class="sd-mail-subj">'+(m.unread?'<span class="sd-mail-unread"></span>':'')+m.subject+'</div>'+
      '<div class="sd-mail-date">'+m.date+'</div>'+
      '<div class="sd-mail-prev">'+m.preview+'</div>';
    ml.appendChild(el);
  });
}

function openCourse(course){
  activeCourseId=course.id;activeFileName=null;
  var ws=document.getElementById('welcomeState');
  var pv=document.getElementById('pdfView');
  var co=document.getElementById('courseOverview');
  ws.style.display='none'; pv.style.display='none';
  document.getElementById('breadcrumb').innerHTML='<b>'+course.name+'</b>';
  document.getElementById('sbMain').style.display='none';
  document.getElementById('sbCourse').style.display='flex';
  buildSbCourseNav(course,'files');
  co.style.display = 'block';
  showCourseSection(course,'files');
  closeSB();renderCourses();
}

// Fetches a PDF file by path and calls cb(Uint8Array).
// Fully async — zero main-thread blocking.
function _fetchPdfBytes(path, cb, onError) {
  fetch(path)
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.arrayBuffer();
    })
    .then(function(buf) { cb(new Uint8Array(buf)); })
    .catch(function(e) { if (onError) onError(e); });
}

function openFile(f,course){
  activeFileName=f.name;currentCourseShort=course.short;
  _panelHide(document.getElementById('welcomeState'));
  _panelHide(document.getElementById('courseOverview'));
  var pv=document.getElementById('pdfView');
  _panelShow(pv, true);
  document.getElementById('pdfFileName').textContent=f.name;
  document.getElementById('breadcrumb').innerHTML=course.short+' › <b>'+f.name+'</b>';
  document.getElementById('aiFileLabel').textContent=f.name;
  renderCourses();
  var pdfPath=PDF_DATA[f.name];
  if(!pdfPath){
    document.getElementById('pdfBody').innerHTML='<div style="color:#fff;padding:40px;text-align:center;font-family:Fredoka One,cursive">📄 '+f.name+'<br><span style="font-size:.85rem;opacity:.7">Not available in demo</span></div>';
    return;
  }
  document.getElementById('pdfBody').innerHTML='<div class="pdf-loading"><div class="loading-dots"><span></span><span></span><span></span></div><p>Loading PDF…</p></div>';
  _fetchPdfBytes(pdfPath, function(bytes){
    pdfjsLib.getDocument({data:bytes}).promise.then(function(pdf){
      pdfDoc=pdf;pdfTotal=pdf.numPages;pdfPage=1;pdfShowAll=false;
      pdfFullText='';
      var textPromises=[];
      for(var pi=1;pi<=pdf.numPages;pi++){
        textPromises.push(pdf.getPage(pi).then(function(pg){
          return pg.getTextContent().then(function(tc){
            return tc.items.map(function(it){return it.str;}).join(' ');
          });
        }));
      }
      Promise.all(textPromises).then(function(pages){
        pdfFullText=pages.join('\n\n');
      });
      updatePageInfo();updateZoomPct();
      document.getElementById('pdfAll').textContent='All pages';
      renderPages();
    })
    .catch(function(e){
      document.getElementById('pdfBody').innerHTML='<div style="color:#fff;padding:40px">Error: '+e.message+'</div>';
    });
  }, function(e){
    document.getElementById('pdfBody').innerHTML='<div style="color:#fff;padding:40px">Error loading PDF: '+e.message+'</div>';
  });
}

function showCourseSection(course,section){
  activeCourseRef=course;activeCourseSection=section;
  activeFileName=null;
  document.getElementById('pdfView').style.display='none';
  document.getElementById('welcomeState').style.display='none';
  var co=document.getElementById('courseOverview');
  var nav=document.getElementById('sbCourseNav');
  if(nav) nav.querySelectorAll('.sb-nav-item').forEach(function(x){
    x.classList.toggle('active',x.getAttribute('data-sec')===section);
  });
  var co=document.getElementById('courseOverview');
  var SECTIONS=[
    {id:'files',icon:'📁',label:'Files'},
    {id:'opencast',icon:'🎬',label:'Opencast'},
    {id:'forum',icon:'💬',label:'Forum'},
    {id:'wiki',icon:'📖',label:'Wiki'},
    {id:'appointments',icon:'📅',label:'Appointments'},
    {id:'participants',icon:'👥',label:'Participants'},
  ];
  var OC=[
    {title:'Einführung — WNV Grundlagen',date:'24.10.2024',dur:'87 min'},
    {title:'Zylindrische Pressverbindung Teil 1',date:'07.11.2024',dur:'91 min'},
    {title:'Zylindrische Pressverbindung Teil 2',date:'14.11.2024',dur:'78 min'},
    {title:'Kegelpressverbindung',date:'21.11.2024',dur:'84 min'},
    {title:'Wälzlager Grundlagen',date:'29.11.2024',dur:'76 min'},
  ];
  var FORUM=[
    {title:'Frage zu Übungsblatt 1, Aufgabe 1.1.1',replies:5,author:'Max M.',date:'10.11.2024',unread:true},
    {title:'Klausur Altaufgaben — wo finden?',replies:12,author:'Lisa K.',date:'05.11.2024',unread:false},
    {title:'Sprechstunde Termin WS 2024/25',replies:3,author:'Tim B.',date:'01.11.2024',unread:false},
  ];
  var WIKI=[
    {title:'Lernmaterialien und nützliche Links',edited:'15.11.2024',author:'Dipl.-Ing. Philipp'},
    {title:'Zusammenfassung WNV Kapitel 1–3',edited:'10.11.2024',author:'Max M.'},
    {title:'Klausurrelevante Themen und Formeln',edited:'08.11.2024',author:'Lisa K.'},
  ];
  var APPTS=[
    {day:'21',mon:'Mär',title:'Vorlesung — WNV Wiederholung',time:'Do 09:45–11:15',room:'PK 11.2',type:'lecture'},
    {day:'21',mon:'Mär',title:'Übung — Gruppe A',time:'Do 11:30–13:00',room:'PK 11.2',type:'exercise'},
    {day:'28',mon:'Mär',title:'Vorlesung — Wälzlager',time:'Do 09:45–11:15',room:'PK 11.2',type:'lecture'},
    {day:'15',mon:'Apr',title:'Klausur WS 2024/25',time:'Di 09:00–11:00',room:'Audimax',type:'exam'},
  ];
  var PARTS=[
    {name:'Dipl.-Ing. Dirk Philipp',role:'Dozent',col:'#9B5DE5'},
    {name:'Dr. Anna Weber',role:'Tutorin',col:'#FF6FB7'},
    {name:'Mohamed Ali Mariam',role:'Student',col:'#4CC9F0'},
    {name:'Max Mustermann',role:'Student',col:'#06D6A0'},
    {name:'Lisa König',role:'Student',col:'#FF6B35'},
  ];

  function buildContent(){
    if(section==='files'){
      var filesHtml = course.files.map(function(f){
        var icon=f.name.includes('Lösung')?'✅':f.name.includes('Aufgabe')?'📋':'📊';
        return '<div class="co-file" data-fname="'+f.name+'">'+
          '<div class="co-file-cb" data-fname="'+f.name+'"></div>'+
          '<span class="co-file-icon">'+icon+'</span>'+
          '<div style="flex:1;min-width:0"><div class="co-file-name">'+f.name+'</div>'+
          '<div class="co-file-meta">'+f.size+' · '+f.date+'</div></div>'+
          '<span class="co-open-btn" style="font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(192,132,252,.18);color:rgba(192,132,252,.9);border:1px solid rgba(192,132,252,.3);cursor:pointer;flex-shrink:0">Open</span>'+
          '<span class="co-dl-btn" data-fname="'+f.name+'" title="Download" style="margin-left:6px;font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(6,214,160,.15);color:rgba(6,214,160,.9);border:1px solid rgba(6,214,160,.3);cursor:pointer;flex-shrink:0">⬇</span>'+
        '</div>';
      }).join('');
      return '<div class="co-files-toolbar">'+
        '<button class="co-select-toggle" id="coSelectToggle">☑ Select multiple</button>'+
        '</div>'+
        '<div id="coFilesList">'+filesHtml+'</div>'+
        '<div class="co-multi-bar" id="coMultiBar">'+
          '<span class="co-multi-count"><b id="coSelCount">0</b> files selected</span>'+
          '<span class="co-multi-clear" id="coMultiClear">Clear</span>'+
          '<button class="co-multi-summarise" id="coMultiSumBtn">✨ Summarise together</button>'+
        '</div>';
    }
    if(section==='opencast'){
      return OC.map(function(v){
        return '<div class="co-file"><span class="co-file-icon">▶️</span>'+
          '<div style="flex:1;min-width:0"><div class="co-file-name">'+v.title+'</div>'+
          '<div class="co-file-meta">'+v.date+'</div></div>'+
          '<span style="font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(6,214,160,.15);color:rgba(6,214,160,.9);border:1px solid rgba(6,214,160,.3)">'+v.dur+'</span>'+
        '</div>';
      }).join('');
    }
    if(section==='forum'){
      return FORUM.map(function(f){
        return '<div class="co-file" style="flex-direction:column;align-items:flex-start;gap:4px">'+
          '<div style="display:flex;align-items:center;gap:8px;width:100%">'+
          '<span style="font-size:1rem">'+(f.unread?'🔵':'💬')+'</span>'+
          '<span class="co-file-name" style="flex:1">'+f.title+'</span>'+
          '<span style="font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(192,132,252,.15);color:rgba(192,132,252,.9);border:1px solid rgba(192,132,252,.3)">'+f.replies+' replies</span>'+
          '</div><div class="co-file-meta" style="margin-left:28px">'+f.author+' · '+f.date+'</div></div>';
      }).join('');
    }
    if(section==='wiki'){
      return WIKI.map(function(w){
        return '<div class="co-file"><span class="co-file-icon">📄</span>'+
          '<div style="flex:1;min-width:0"><div class="co-file-name">'+w.title+'</div>'+
          '<div class="co-file-meta">Edited by '+w.author+' · '+w.edited+'</div></div></div>';
      }).join('');
    }
    if(section==='appointments'){
      return APPTS.map(function(a){
        var bg=a.type==='exam'?'rgba(251,146,60,.15)':a.type==='exercise'?'rgba(6,214,160,.15)':'rgba(192,132,252,.15)';
        var col=a.type==='exam'?'rgba(251,146,60,.9)':a.type==='exercise'?'rgba(6,214,160,.9)':'rgba(192,132,252,.9)';
        var bc=a.type==='exam'?'rgba(251,146,60,.3)':a.type==='exercise'?'rgba(6,214,160,.3)':'rgba(192,132,252,.3)';
        var lbl=a.type==='exam'?'Klausur':a.type==='exercise'?'Übung':'Vorlesung';
        return '<div class="co-file" style="gap:12px">'+
          '<div style="background:rgba(192,132,252,.2);border:1px solid rgba(192,132,252,.3);color:#fff;border-radius:10px;padding:5px 10px;text-align:center;flex-shrink:0">'+
          '<div style="font-family:Fredoka One,cursive;font-size:1.2rem;line-height:1">'+a.day+'</div>'+
          '<div style="font-size:.62rem;font-weight:800;opacity:.7">'+a.mon+'</div></div>'+
          '<div style="flex:1;min-width:0"><div class="co-file-name">'+a.title+'</div>'+
          '<div class="co-file-meta">'+a.time+' · '+a.room+'</div></div>'+
          '<span style="font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:'+bg+';color:'+col+';border:1px solid '+bc+'">'+lbl+'</span></div>';
      }).join('');
    }
    if(section==='participants'){
      return PARTS.map(function(p){
        var ini=p.name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();
        var isDoz=p.role!=='Student';
        return '<div class="co-file" style="gap:10px">'+
          '<div style="width:34px;height:34px;border-radius:50%;background:'+p.col+';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.78rem;color:#fff;flex-shrink:0">'+ini+'</div>'+
          '<div style="flex:1;min-width:0"><div class="co-file-name">'+p.name+'</div>'+
          '<div class="co-file-meta">'+p.role+'</div></div>'+
          '<span style="font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:'+(isDoz?'rgba(192,132,252,.15)':'rgba(6,214,160,.12)')+';color:'+(isDoz?'rgba(192,132,252,.9)':'rgba(6,214,160,.9)')+';border:1px solid '+(isDoz?'rgba(192,132,252,.3)':'rgba(6,214,160,.3)')+'">'+p.role+'</span></div>';
      }).join('');
    }
    return '';
  }

  var navHTML=SECTIONS.map(function(s){
    return '<button class="co-nav-btn'+(section===s.id?' active':'')+'" data-sec="'+s.id+'">'+s.icon+' '+s.label+'</button>';
  }).join('');

  // Build content first, animate the inner card after
  co.style.display='block';
  co.innerHTML='<div class="co-inner">'+
    '<div class="co-logo">📚 StudySphere</div>'+
    '<p class="co-tag">'+course.name+' · '+course.meta+'</p>'+
    '<div class="co-nav">'+navHTML+'</div>'+
    '<div class="co-card" style="margin-top:0">'+buildContent()+'</div>'+
    '</div>';

  co.querySelectorAll('.co-nav-btn').forEach(function(btn){
    btn.addEventListener('click',function(){showCourseSection(course,btn.getAttribute('data-sec'));});
  });
  // Trigger CSS animation on inner card — no JS style juggling
  var coInner = co.querySelector('.co-inner');
  if (coInner) {
    coInner.classList.remove('panel-enter');
    void coInner.offsetWidth;
    coInner.classList.add('panel-enter');
  }

  // ── Multi-select logic ────────────────────────────────────────────────
  var selectMode = false;
  var selectedFiles = [];

  function updateMultiBar() {
    var bar = co.querySelector('#coMultiBar');
    var cnt = co.querySelector('#coSelCount');
    var btn = co.querySelector('#coMultiSumBtn');
    if (!bar) return;
    cnt.textContent = selectedFiles.length;
    bar.classList.toggle('show', selectedFiles.length > 0);
    btn.disabled = selectedFiles.length < 2;
    btn.title = selectedFiles.length < 2 ? 'Select at least 2 files' : '';
    if(selectedFiles.length === 1) btn.textContent = '✨ Summarise 1 file';
    else if(selectedFiles.length > 1) btn.textContent = '✨ Summarise '+selectedFiles.length+' files together';
    else btn.textContent = '✨ Summarise together';
  }

  var selectToggle = co.querySelector('#coSelectToggle');
  if (selectToggle) {
    selectToggle.addEventListener('click', function() {
      selectMode = !selectMode;
      selectToggle.classList.toggle('active', selectMode);
      selectToggle.textContent = selectMode ? '✕ Cancel selection' : '☑ Select multiple';
      var filesList = co.querySelector('#coFilesList');
      if (filesList) filesList.classList.toggle('co-select-mode', selectMode);
      if (!selectMode) {
        selectedFiles = [];
        co.querySelectorAll('.co-file').forEach(function(el){el.classList.remove('selected');});
        co.querySelectorAll('.co-file-cb').forEach(function(cb){cb.classList.remove('checked');});
        updateMultiBar();
      }
    });
  }

  var multiClear = co.querySelector('#coMultiClear');
  if (multiClear) {
    multiClear.addEventListener('click', function() {
      selectedFiles = [];
      co.querySelectorAll('.co-file').forEach(function(el){el.classList.remove('selected');});
      co.querySelectorAll('.co-file-cb').forEach(function(cb){cb.classList.remove('checked');});
      updateMultiBar();
    });
  }

  var multiSumBtn = co.querySelector('#coMultiSumBtn');
  if (multiSumBtn) {
    multiSumBtn.addEventListener('click', function() {
      if (selectedFiles.length === 0) return;
      runMultiSummary(selectedFiles, course);
    });
  }

  co.querySelectorAll('.co-file[data-fname]').forEach(function(el){
    el.addEventListener('click',function(e){
      if(e.target.closest('.co-dl-btn')) return;
      var fname = el.getAttribute('data-fname');
      if (selectMode) {
        // Toggle selection
        var idx = selectedFiles.indexOf(fname);
        if (idx === -1) { selectedFiles.push(fname); el.classList.add('selected'); el.querySelector('.co-file-cb').classList.add('checked'); }
        else { selectedFiles.splice(idx,1); el.classList.remove('selected'); el.querySelector('.co-file-cb').classList.remove('checked'); }
        updateMultiBar();
        return;
      }
      if(e.target.closest('.co-open-btn') || !selectMode) {
        var f=course.files.find(function(x){return x.name===fname;});
        if(f)openFile(f,course);
      }
    });
  });
  co.querySelectorAll('.co-dl-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      downloadFile(btn.getAttribute('data-fname'));
    });
  });
}

async function lnLoadFromSupabase(uid) {
  if (!uid) return;
  try {
    var r = await fetch(
      SUPA_URL + '/rest/v1/lecture_notes?select=*&user_id=eq.' + encodeURIComponent(uid) + '&order=date.desc',
      { headers: _sbHeaders() }
    );
    if (!r.ok) return;
    var rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) return;
    var dbNotes = rows.map(function(row) {
      return { id: row.id, title: row.title, text: row.content, date: row.date, url: row.url || '' };
    });
    // Merge: DB notes take priority; keep any in-memory-only notes (e.g. not yet saved)
    var inMemoryOnly = lnSummaries.filter(function(n) {
      return !n.id || !dbNotes.find(function(d) { return d.id === n.id; });
    });
    var merged = dbNotes.concat(inMemoryOnly);
    merged.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    lnRender(merged);
  } catch(e) { console.warn('lnLoadFromSupabase error:', e); }
}

function lnOpenModal(idx) {
  lnOpenIdx = idx;
  var s = lnSummaries[idx];
  if (!s) return;
  document.getElementById('lnModalTitle').textContent = s.title;
  document.getElementById('lnModalBody').innerHTML = lnRenderMarkdown(s.text);
  document.getElementById('lnModalDate').textContent = lnFormatDate(s.date);
  document.getElementById('lnModal').classList.add('show');
}

function lnRender(summaries) {
  var content = document.getElementById('lnContent');
  if (!content) return;
  lnSummaries = summaries || [];
  if (lnSummaries.length === 0) {
    content.innerHTML = '<div class="ln-empty"><span class="ln-empty-icon">🎓</span>No lecture summaries yet.<br>Install the <strong style="color:rgba(192,132,252,.7)">StudySphere Extension</strong>, watch a lecture on YouTube or Opencast,<br>then press <strong style="color:rgba(192,132,252,.7)">✨ Summarize</strong> — your notes will appear here automatically.</div>';
    return;
  }
  var html = '<div class="ln-grid">';
  lnSummaries.forEach(function(s, i) {
    var preview = lnGetPreview(s.text);
    var source = s.url ? (s.url.includes('youtube') ? '▶ YouTube' : s.url.includes('opencast') ? '🎓 Opencast' : s.url.includes('zoom') ? '📹 Zoom' : '🎬 Lecture') : '🎬 Lecture';
    html += '<div class="ln-card" data-idx="'+i+'">' +
      '<div class="ln-card-hdr">' +
        '<div class="ln-card-title">'+s.title+'</div>' +
        '<div class="ln-card-meta"><span class="ln-card-date">'+lnFormatDate(s.date)+'</span><span class="ln-card-badge">'+source+'</span></div>' +
      '</div>' +
      '<div class="ln-card-preview">'+preview+'…</div>' +
    '</div>';
  });
  html += '</div>';
  content.innerHTML = html;
  content.querySelectorAll('.ln-card').forEach(function(card) {
    card.addEventListener('click', function() { lnOpenModal(parseInt(card.getAttribute('data-idx'))); });
  });
}

function updatePageInfo(){document.getElementById('pdfPageInfo').textContent=pdfPage+' / '+pdfTotal;}

function renderPages(){
  if(!pdfDoc)return;
  var body=document.getElementById('pdfBody');body.innerHTML='';
  var navStyle=pdfShowAll?'none':'inline-flex';
  document.getElementById('pdfPrev').style.display=navStyle;
  document.getElementById('pdfNext').style.display=navStyle;
  document.getElementById('pdfPageInfo').style.display=navStyle;
  var toRender=pdfShowAll?Array.from({length:pdfTotal},function(_,i){return i+1;}):[pdfPage];
  toRender.forEach(function(num){
    pdfDoc.getPage(num).then(function(page){
      var cW=body.clientWidth-32;
      var vp0=page.getViewport({scale:1});
      var scale=pdfScale*(cW/vp0.width);
      var vp=page.getViewport({scale:scale});
      var wrap=document.createElement('div');wrap.className='pdf-page-wrap';
      wrap.style.width=vp.width+'px';wrap.style.height=vp.height+'px';
      var canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;
      wrap.appendChild(canvas);
      var textDiv=document.createElement('div');textDiv.className='pdf-text-layer';
      textDiv.style.width=vp.width+'px';textDiv.style.height=vp.height+'px';
      wrap.appendChild(textDiv);body.appendChild(wrap);
      page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise.then(function(){
        return page.getTextContent();
      }).then(function(tc){
        textDiv.style.setProperty('--scale-factor',String(vp.scale));
        var rl=pdfjsLib.renderTextLayer({textContentSource:tc,container:textDiv,viewport:vp,textDivs:[]});
        if(rl&&rl.promise)rl.promise.catch(function(){});
      });
      textDiv.addEventListener('mouseup',function(){
        setTimeout(function(){
          var sel=window.getSelection();
          if(sel&&sel.toString().trim().length>3)showSelectionBanner(sel.toString().trim());
        },30);
      });
    });
  });
}


// ── INIT ─────────────────────────────────────────────────────────────────────


var COLORS=['#9B5DE5','#FF6FB7','#4CC9F0','#06D6A0','#FF6B35','#FFD93D'];

// ── DATA ──────────────────────────────────────────────────────────────────
var SEMS={
  ws2526:{color:'#06D6A0',courses:[
    {id:'c1',name:'Grundlagen kpl. Maschinenelemente',short:'GkMA',meta:'Dipl.-Ing. Philipp',files:[
      {name:'2024_10_24_IK_UE_1_Reibschlüssige_WNV.pdf',size:'4.5 MB',date:'24.10.2024'},
      {name:'Aufgabe_1_1_1_und_1_1_2_und_1_2.pdf',size:'384 KB',date:'24.10.2024'},
      {name:'Aufgabe_1_1_1_Lösung_korrigiert.pdf',size:'416 KB',date:'28.10.2024'},
      {name:'Aufgabe_1_3.pdf',size:'370 KB',date:'07.11.2024'},
      {name:'Aufgabe_3_1_und_3_2.pdf',size:'1.8 MB',date:'15.11.2024'},
    ]},
    {id:'c2',name:'Mathematik für Informatiker II',short:'MfI II',meta:'Prof. Dr. Schmidt',files:[
      {name:'Skript_Kapitel4.pdf',size:'3.8 MB',date:'15.11.2025'},
    ]},
    {id:'c3',name:'Softwaretechnik',short:'SWT',meta:'Prof. Dr. Weber',files:[
      {name:'UML_Folien.pptx',size:'5.1 MB',date:'10.11.2025'},
    ]},
    {id:'c4',name:'Flugleistungen',short:'FL',meta:'Prof. Dr. Bollmann',files:[
      {name:'FL_VL_Kap04_WS2025.pdf',size:'2.9 MB',date:'12.11.2025'},
    ]},
    {id:'c5b',name:'Technische Thermodynamik',short:'ThermD',meta:'Prof. Dr. Klose',files:[
      {name:'ThermD_Skript_WS2526.pdf',size:'5.2 MB',date:'15.10.2025'},
      {name:'ThermD_Uebung_01.pdf',size:'980 KB',date:'22.10.2025'},
    ]},
    {id:'c6b',name:'Strömungslehre',short:'StröL',meta:'Prof. Dr. Radespiel',files:[
      {name:'Stroemungslehre_VL1.pdf',size:'3.6 MB',date:'14.10.2025'},
    ]},
    {id:'c7b',name:'Regelungstechnik',short:'RT',meta:'Prof. Dr. Müller',files:[
      {name:'RT_Vorlesung_Kap1-3.pdf',size:'4.1 MB',date:'20.10.2025'},
      {name:'RT_Aufgabenblatt_1.pdf',size:'540 KB',date:'27.10.2025'},
    ]},
    {id:'c8b',name:'Werkstofftechnik',short:'WerkT',meta:'Prof. Dr. Bäker',files:[
      {name:'Werkstoffe_Skript_Teil1.pdf',size:'6.3 MB',date:'13.10.2025'},
    ]},
    {id:'c9b',name:'Technisches Englisch',short:'TechEng',meta:'Dr. Harrison',files:[
      {name:'TechEng_Reader_WS2526.pdf',size:'2.1 MB',date:'16.10.2025'},
      {name:'TechEng_Vocabulary_Sheet.pdf',size:'310 KB',date:'16.10.2025'},
    ]},
  ]},
  ss25:{color:'#9B5DE5',courses:[{id:'c5',name:'Technische Mechanik II',short:'TM II',meta:'Prof. Dr. Brandt',files:[{name:'TM2_Skript.pdf',size:'4.5 MB',date:'10.04.2025'}]}]},
  ws2425:{color:'#FF6FB7',courses:[{id:'c8',name:'Analysis I',short:'Ana I',meta:'Prof. Dr. Lang',files:[{name:'Analysis_Skript.pdf',size:'5.8 MB',date:'20.10.2024'}]}]},
  ss24:{color:'#4CC9F0',courses:[{id:'c10',name:'Thermodynamik',short:'Thermo',meta:'Prof. Dr. Schulz',files:[{name:'Thermo_VL.pdf',size:'3.1 MB',date:'08.04.2024'}]}]},
  ws2324:{color:'#FF6B35',courses:[{id:'c12',name:'Mathematik I',short:'Math I',meta:'Prof. Dr. Schmidt',files:[{name:'Math1_Skript.pdf',size:'4.2 MB',date:'16.10.2023'}]}]}
};
var TT=[
  {day:'Montag',start:'08:00',end:'09:30',name:'Mathematik für Informatiker II',room:'PK 2.1',ci:1},
  {day:'Montag',start:'10:00',end:'11:30',name:'GkMA Vorlesung',room:'PK 11.2',ci:0},
  {day:'Dienstag',start:'11:30',end:'13:00',name:'GkMA Übung',room:'PK 11.2',ci:0},
  {day:'Mittwoch',start:'10:00',end:'11:30',name:'Softwaretechnik',room:'IZ 161',ci:2},
  {day:'Donnerstag',start:'11:30',end:'13:00',name:'Flugleistungen',room:'HB 35.1',ci:3},
];
var MAILS=[
  {subject:'GkMA: Klausuranmeldung — Frist verlängert',date:'18.03.2026',unread:true,preview:'Die Anmeldefrist wurde bis zum 25. März verlängert.'},
  {subject:'Übungsblatt 5 — Abgabe bis Freitag 23:59',date:'17.03.2026',unread:true,preview:'Bitte gebt Übungsblatt 5 rechtzeitig über Stud.IP ab.'},
  {subject:'Raumänderung: GkMA Übung morgen',date:'17.03.2026',unread:true,preview:'Die morgige Übung findet in Raum PK 4.1 statt.'},
  {subject:'Willkommen im WS 2025/26',date:'01.10.2025',unread:false,preview:'Herzlich willkommen zum Wintersemester 2025/26.'},
];

// ── STATE ──────────────────────────────────────────────────────────────────
var activeSemId='ws2526',activeCourseId=null,activeFileName=null,currentCourseShort='';
var pdfDoc=null,pdfPage=1,pdfTotal=0,pdfScale=0.9,pdfShowAll=false,pdfFullText='';
var aiOpen=false,aiPinned=false,sbOpen=false,sbHideTimer=null;
var BACKEND_URL='https://studysphere-backend-production.up.railway.app'; // ← change to your deployed backend URL when hosting
var activeTypeTimer=null,activeThinkTimer=null,generationStopped=false,currentGenId=0;
var activeCourseRef=null,activeCourseSection='files';
var activePortalSection='dashboard';
var ddOpen=false;
var _cameFromStudip=false;



// ── STUDIP DASHBOARD RENDER ────────────────────────────────────────────────
var sdActiveSemId='ws2526';










// Studip semester dropdown
var sdSemBtn=document.getElementById('sdSemBtn'),sdSemDD=document.getElementById('sdSemDD');
var sdSemDot=document.getElementById('sdSemDot'),sdSemLabel=document.getElementById('sdSemLabel'),sdSemChev=document.getElementById('sdSemChev');
var sdDdOpen=false;
sdSemBtn.addEventListener('click',function(e){
  e.stopPropagation();sdDdOpen=!sdDdOpen;
  sdSemDD.classList.toggle('open',sdDdOpen);sdSemBtn.classList.toggle('open',sdDdOpen);sdSemChev.classList.toggle('up',sdDdOpen);
});
sdSemDD.querySelectorAll('.sem-opt').forEach(function(o){
  o.addEventListener('click',function(){
    sdActiveSemId=o.getAttribute('data-sid');
    sdSemLabel.textContent=o.textContent.trim();
    sdSemDot.style.background=o.getAttribute('data-col');
    sdSemDD.querySelectorAll('.sem-opt').forEach(function(x){x.classList.remove('sel');});
    o.classList.add('sel');sdDdOpen=false;sdSemDD.classList.remove('open');sdSemBtn.classList.remove('open');sdSemChev.classList.remove('up');
    sdRenderCourses();
  });
});
document.addEventListener('click',function(e){
  if(sdDdOpen&&!e.target.closest('#sdSemBtn')&&!e.target.closest('#sdSemDD')){
    sdDdOpen=false;sdSemDD.classList.remove('open');sdSemBtn.classList.remove('open');sdSemChev.classList.remove('up');
  }
});
// ── NAVIGATION ───────────────────────────────────────────────────────────
// Ghost-proof approach:
// 1. Body bg = same dark color as overlays — any bleed-through is invisible
// 2. The incoming page is shown at full opacity BEFORE the outgoing fades
//    so there's never a gap where the app is visible
// 3. z-index is adjusted so the visible page always sits on top












// ── PANEL TRANSITIONS (opacity only — zero flash) ─────────────────────────
function _panelShow(el, isFlexEl) {
  if (!el) return;
  el.style.display = isFlexEl ? 'flex' : 'block';
}
function _panelHide(el) {
  if (!el) return;
  el.style.display = 'none';
}




// nav/portal listeners moved to ss-ready
// ── SIDEBAR ───────────────────────────────────────────────────────────────




// sidebar listeners moved to ss-ready

// ── SEMESTER DROPDOWN ─────────────────────────────────────────────────────
var semBtn=document.getElementById('semBtn'),semDD=document.getElementById('semDD');
var semDot=document.getElementById('semDot'),semLabel=document.getElementById('semLabel'),semChev=document.getElementById('semChev');
function closeDD(){ddOpen=false;semDD.classList.remove('open');semBtn.classList.remove('open');semChev.classList.remove('up');}
semBtn.addEventListener('click',function(e){
  e.stopPropagation();ddOpen=!ddOpen;
  semDD.classList.toggle('open',ddOpen);semBtn.classList.toggle('open',ddOpen);semChev.classList.toggle('up',ddOpen);
});
semDD.querySelectorAll('.sem-opt').forEach(function(o){
  o.addEventListener('click',function(){
    activeSemId=o.getAttribute('data-sid');
    semLabel.textContent=o.textContent.trim();
    semDot.style.background=o.getAttribute('data-col');
    semDD.querySelectorAll('.sem-opt').forEach(function(x){x.classList.remove('sel');});
    o.classList.add('sel');closeDD();renderCourses();
  });
});
document.addEventListener('click',function(e){if(ddOpen&&!e.target.closest('.sem-wrap'))closeDD();});

// ── NIGHT MODE ────────────────────────────────────────────────────────────
// nightOn is declared globally above DOMContentLoaded — sync the button here
(function(){
  var _b = document.getElementById('nightBtn');
  if (_b) _b.textContent = nightOn ? '☀️' : '🌙';
})();
// nightBtn listener moved to ss-ready

// ── COURSES ───────────────────────────────────────────────────────────────



// ── TIMETABLE ─────────────────────────────────────────────────────────────



// ── MAILS ─────────────────────────────────────────────────────────────────



// ── COURSE NAVIGATION ─────────────────────────────────────────────────────



function buildSbCourseNav(course,activeSection){
  var SECTIONS=[
    {id:'files',icon:'📁',label:'Files'},
    {id:'opencast',icon:'🎬',label:'Opencast'},
    {id:'forum',icon:'💬',label:'Forum'},
    {id:'wiki',icon:'📖',label:'Wiki'},
    {id:'appointments',icon:'📅',label:'Appointments'},
    {id:'participants',icon:'👥',label:'Participants'},
  ];
  var OC=[
    {title:'Einführung — WNV Grundlagen',date:'24.10.2024',dur:'87 min'},
    {title:'Zylindrische Pressverbindung Teil 1',date:'07.11.2024',dur:'91 min'},
    {title:'Zylindrische Pressverbindung Teil 2',date:'14.11.2024',dur:'78 min'},
    {title:'Kegelpressverbindung',date:'21.11.2024',dur:'84 min'},
    {title:'Wälzlager Grundlagen',date:'29.11.2024',dur:'76 min'},
  ];
  var FORUM=[
    {title:'Frage zu Übungsblatt 1, Aufgabe 1.1.1',replies:5,unread:true},
    {title:'Klausur Altaufgaben — wo finden?',replies:12,unread:false},
    {title:'Sprechstunde Termin WS 2024/25',replies:3,unread:false},
  ];
  var WIKI=[
    {title:'Lernmaterialien und nützliche Links',author:'Dipl.-Ing. Philipp'},
    {title:'Zusammenfassung WNV Kapitel 1–3',author:'Max M.'},
    {title:'Klausurrelevante Themen und Formeln',author:'Lisa K.'},
  ];
  var APPTS=[
    {day:'21 Mär',title:'Vorlesung — WNV Wiederholung',time:'Do 09:45',type:'lecture'},
    {day:'21 Mär',title:'Übung — Gruppe A',time:'Do 11:30',type:'exercise'},
    {day:'28 Mär',title:'Vorlesung — Wälzlager',time:'Do 09:45',type:'lecture'},
    {day:'15 Apr',title:'Klausur WS 2024/25',time:'Di 09:00',type:'exam'},
  ];
  var PARTS=[
    {name:'Dipl.-Ing. Dirk Philipp',role:'Dozent',col:'#9B5DE5'},
    {name:'Dr. Anna Weber',role:'Tutorin',col:'#FF6FB7'},
    {name:'Mohamed Ali Mariam',role:'Student',col:'#4CC9F0'},
    {name:'Max Mustermann',role:'Student',col:'#06D6A0'},
    {name:'Lisa König',role:'Student',col:'#FF6B35'},
  ];

  function buildRows(secId){
    if(secId==='files'){
      return course.files.map(function(f){
        var icon=f.name.includes('Lösung')?'✅':f.name.includes('Aufgabe')?'📋':'📊';
        var isActive=activeFileName===f.name;
        return {icon:icon,name:f.name,meta:f.size,active:isActive,
          action:function(){openFile(f,course);closeSB();},
          download:function(){downloadFile(f.name);}};
      });
    }
    if(secId==='opencast') return OC.map(function(v){return {icon:'▶️',name:v.title,meta:v.dur,action:function(){if(!activeFileName){showCourseSection(course,'opencast');}closeSB();}};});
    if(secId==='forum') return FORUM.map(function(f){return {icon:f.unread?'🔵':'💬',name:f.title,meta:f.replies+' rep.',action:function(){if(!activeFileName){showCourseSection(course,'forum');}closeSB();}};});
    if(secId==='wiki') return WIKI.map(function(w){return {icon:'📄',name:w.title,meta:w.author,action:function(){if(!activeFileName){showCourseSection(course,'wiki');}closeSB();}};});
    if(secId==='appointments') return APPTS.map(function(a){var e=a.type==='exam'?'🔴':a.type==='exercise'?'🟢':'🟣';return {icon:e,name:a.title,meta:a.time,action:function(){if(!activeFileName){showCourseSection(course,'appointments');}closeSB();}};});
    if(secId==='participants') return PARTS.map(function(p){return {icon:'👤',name:p.name,meta:p.role,action:function(){if(!activeFileName){showCourseSection(course,'participants');}closeSB();}};});
    return [];
  }

  var nav=document.getElementById('sbCourseNav');
  nav.innerHTML='';
  SECTIONS.forEach(function(s){
    var rows=buildRows(s.id);
    var item=document.createElement('div');
    item.className='sb-acc-item'+((s.id===activeSection || (s.id==='files' && activeFileName))?' open':'');
    var hdr=document.createElement('div');
    hdr.className='sb-acc-hdr';
    hdr.innerHTML=
      '<div class="sb-acc-label-btn">'+
        '<span class="sb-acc-icon">'+s.icon+'</span>'+
        '<span class="sb-acc-label">'+s.label+'</span>'+
      '</div>'+
      '<div class="sb-acc-chev-btn"><span class="sb-acc-chev">▼</span></div>';
    var body=document.createElement('div');
    body.className='sb-acc-body';
    if(rows.length===0){
      body.innerHTML='<div class="sb-acc-empty">Nothing here yet</div>';
    } else {
      rows.forEach(function(r){
        var row=document.createElement('div');
        row.className='sb-acc-row'+(r.active?' sb-acc-row-active':'');
        row.innerHTML='<span class="sb-acc-row-icon">'+r.icon+'</span>'+
          '<span class="sb-acc-row-name">'+r.name+'</span>'+
          '<span class="sb-acc-row-meta">'+r.meta+'</span>'+
          (r.download?'<span class="sb-dl-btn" title="Download">⬇</span>':'');
        row.addEventListener('click',function(e){e.stopPropagation();r.action();});
        if(r.download){
          row.querySelector('.sb-dl-btn').addEventListener('click',function(e){
            e.stopPropagation();r.download();
          });
        }
        body.appendChild(row);
      });
    }
    // Chevron: toggle dropdown only
    hdr.querySelector('.sb-acc-chev-btn').addEventListener('click',function(e){
      e.stopPropagation();
      var isOpen=item.classList.contains('open');
      nav.querySelectorAll('.sb-acc-item').forEach(function(x){x.classList.remove('open');});
      if(!isOpen) item.classList.add('open');
    });
    // Label: always navigate to that section in the main view
    hdr.querySelector('.sb-acc-label-btn').addEventListener('click',function(e){
      e.stopPropagation();
      nav.querySelectorAll('.sb-acc-item').forEach(function(x){x.classList.remove('open');});
      item.classList.add('open');
      showCourseSection(course,s.id);
      closeSB();
    });
    item.appendChild(hdr);item.appendChild(body);nav.appendChild(item);
  });
}

(document.getElementById('sbBack')||{addEventListener:function(){}}).addEventListener('click',function(){
  activeCourseId=null;activeCourseRef=null;activeFileName=null;pdfDoc=null;pdfFullText='';
  closeSB();
  showStudip();
  _ssPushHistory({ view: 'studip' }, '#studip');
});




// ── MULTI-FILE SUMMARY ────────────────────────────────────────────────────
var msmCurrentText = '';
var msmCurrentTitle = '';

(document.getElementById('msmClose')||{addEventListener:function(){}}).addEventListener('click', function(){
  document.getElementById('multiSumModal').classList.remove('show');
});
(document.getElementById('multiSumModal')||{addEventListener:function(){}}).addEventListener('click', function(e){
  if (e.target === this) this.classList.remove('show');
});
(document.getElementById('msmSaveBtn')||{addEventListener:function(){}}).addEventListener('click', async function(){
  if (!msmCurrentText) return;
  // Save to lecture notes (assign a stable id for DB sync)
  var note = { id: lnGenId(), title: msmCurrentTitle, text: msmCurrentText, date: new Date().toISOString(), url: '' };
  var summaries = lnSummaries.slice();
  summaries.unshift(note);
  lnRender(summaries);
  window.postMessage({ type: 'SS_DELETE_SUMMARY', summaries: summaries }, '*');
  document.getElementById('multiSumModal').classList.remove('show');
  showToast('💾 Saved to Lecture Notes', msmCurrentTitle.slice(0,50));
  // Persist to Supabase
  await lnSaveNoteToSupabase(note);
});

async function runMultiSummary(fnames, course) {
  var modal = document.getElementById('multiSumModal');
  var body = document.getElementById('msmBody');
  var title = document.getElementById('msmTitle');
  msmCurrentText = ''; msmCurrentTitle = '';
  document.getElementById('msmSaveBtn').style.display = 'none';

  // Build title
  var shortNames = fnames.map(function(n){ return n.replace(/\.pdf$/i,'').slice(0,30); });
  msmCurrentTitle = course.short + ' — Combined: ' + shortNames.join(', ');
  title.textContent = '✨ Combined Summary (' + fnames.length + ' files)';

  // Show tags of selected files
  var tagsHtml = '<div class="msm-files-list">' + fnames.map(function(n){
    return '<span class="msm-file-tag">📄 '+n+'</span>';
  }).join('') + '</div>';

  body.innerHTML = tagsHtml + '<div class="msm-loading"><div class="msm-dots"><span></span><span></span><span></span></div><p>Extracting text from ' + fnames.length + ' files…</p></div>';
  modal.classList.add('show');

  // Extract text from all selected PDFs
  var textParts = [];
  var promises = fnames.map(function(fname) {
    return new Promise(function(resolve) {
      var pdfPath = PDF_DATA[fname];
      if (!pdfPath) { resolve('[' + fname + ': not available in demo]'); return; }
      _fetchPdfBytes(pdfPath, function(bytes) {
        pdfjsLib.getDocument({ data: bytes }).promise.then(function(pdf) {
          var pagePromises = [];
          for (var p = 1; p <= Math.min(pdf.numPages, 20); p++) {
            pagePromises.push(pdf.getPage(p).then(function(page){
              return page.getTextContent().then(function(tc){
                return tc.items.map(function(it){ return it.str; }).join(' ');
              });
            }));
          }
          Promise.all(pagePromises).then(function(pages){
            resolve('=== ' + fname + ' ===\n' + pages.join('\n'));
          });
        }).catch(function(){ resolve('[' + fname + ': error reading]'); });
      }, function(){ resolve('[' + fname + ': error loading]'); });
    });
  });

  Promise.all(promises).then(function(parts) {
    var combined = parts.join('\n\n').slice(0, 20000);
    body.innerHTML = tagsHtml + '<div class="msm-loading"><div class="msm-dots"><span></span><span></span><span></span></div><p>Asking AI to summarise all files together…</p></div>';

    fetch(BACKEND_URL + '/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'You are StudySphere, an AI tutor for TU Braunschweig engineering students. The student has selected multiple related files (e.g. different parts of the same lecture script) and wants a single unified summary. Combine and synthesise all content into one coherent study guide. Use the same language as the documents (German or English).',
        messages: [{ role: 'user', content:
          'These are ' + fnames.length + ' related course files from ' + course.name + ':\n\n' + combined +
          '\n\n---\nCreate a single unified study summary covering all files:\n\n## 📝 Summary\nUnified summary across all files (8-12 sentences).\n\n## 🔑 Key Concepts\nAll important concepts from all files combined.\n\n## 🔢 Formulas & Definitions\nAll formulas and definitions from all files.\n\n## 📂 File Breakdown\nBrief note on what each file covers.\n\n## ❓ Quiz Questions\n5 questions that span across the combined content.'
        }]
      })
    }).then(function(r){ return r.json(); }).then(function(data){
      if (data.error) { body.innerHTML = tagsHtml + '<p style="color:#ff6b35">❌ '+(data.error.message||'API error')+'</p>'; return; }
      msmCurrentText = data.content ? data.content.map(function(b){ return b.text||''; }).join('') : '';
      body.innerHTML = tagsHtml + lnRenderMarkdown(msmCurrentText);
      document.getElementById('msmSaveBtn').style.display = '';
    }).catch(function(e){
      body.innerHTML = tagsHtml + '<p style="color:#ff6b35">❌ ' + e.message + '</p>';
    });
  });
}


async function downloadFile(fname){
  var pdfPath=PDF_DATA[fname];
  if(!pdfPath){alert('This file is not available in the demo.');return;}
  var r=await fetch(pdfPath);
  if(!r.ok){alert('Download failed.');return;}
  var buf=await r.arrayBuffer();
  var blob=new Blob([buf],{type:'application/pdf'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=fname;
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(url);a.remove();},1000);
}

// ── PDF ───────────────────────────────────────────────────────────────────





function updateZoomPct(){var el=document.getElementById('pdfZoomPct');if(el)el.textContent=Math.round(pdfScale*100)+'%';}




(document.getElementById('pdfBody')||{addEventListener:function(){}}).addEventListener('mouseup',function(){
  setTimeout(function(){
    var sel=window.getSelection();
    if(sel&&sel.toString().trim().length>3)showSelectionBanner(sel.toString().trim());
  },30);
});

(document.getElementById('pdfPrev')||{addEventListener:function(){}}).addEventListener('click',function(){if(pdfPage>1){pdfPage--;pdfShowAll=false;updatePageInfo();renderPages();}});
(document.getElementById('pdfNext')||{addEventListener:function(){}}).addEventListener('click',function(){if(pdfPage<pdfTotal){pdfPage++;pdfShowAll=false;updatePageInfo();renderPages();}});
(document.getElementById('pdfZoomIn')||{addEventListener:function(){}}).addEventListener('click',function(){pdfScale=Math.min(Math.round((pdfScale+.1)*10)/10,3);updateZoomPct();renderPages();});
(document.getElementById('pdfZoomOut')||{addEventListener:function(){}}).addEventListener('click',function(){pdfScale=Math.max(Math.round((pdfScale-.1)*10)/10,0.2);updateZoomPct();renderPages();});
(document.getElementById('pdfFit')||{addEventListener:function(){}}).addEventListener('click',function(){pdfScale=0.9;updateZoomPct();renderPages();});

(document.getElementById('pdfDownload')||{addEventListener:function(){}}).addEventListener('click',function(){
  if(activeFileName)downloadFile(activeFileName);
});
(document.getElementById('pdfAll')||{addEventListener:function(){}}).addEventListener('click',function(){
  pdfShowAll=!pdfShowAll;
  document.getElementById('pdfAll').textContent=pdfShowAll?'Single page':'All pages';
  renderPages();
});

// ── AI PANEL ──────────────────────────────────────────────────────────────
var aiPanel=document.getElementById('aiPanel'),aiTab=document.getElementById('aiTab');
var hoverZone=document.getElementById('aiHoverZone');








var _aiManualClosed = false;

// Only open on click or direct hover over the tab logo — not the wide hover zone
aiTab.addEventListener('click', openAI);
aiTab.addEventListener('mouseenter', function(){
  if (!_aiManualClosed) openAI();
});

(document.getElementById('aiClose')||{addEventListener:function(){}}).addEventListener('click', function(){
  forceCloseAI();
  _aiManualClosed = true;
});

// Reset manual-closed once cursor moves far from right edge (150px)
document.addEventListener('mousemove', function(e){
  if (!_aiManualClosed) return;
  if (window.innerWidth - e.clientX > 150) _aiManualClosed = false;
});

aiPanel.addEventListener('mouseleave', function(){ if(!aiPinned) setTimeout(closeAI, 600); });

pinAI=function(){aiPinned=true;};
window.pinAI=pinAI;

// ── SELECTION BANNER ──────────────────────────────────────────────────────
function showSelectionBanner(txt){
  openAI();pinAI();
  var msgs=document.getElementById('aiMsgs');
  var old=msgs.querySelector('.ai-sel-banner');if(old)old.remove();
  var banner=document.createElement('div');banner.className='ai-sel-banner';
  var explainBtn = document.createElement('button');
  explainBtn.className='ai-sel-btn';explainBtn.textContent='Explain this';
  var formulaBtn = document.createElement('button');
  formulaBtn.className='ai-sel-btn';formulaBtn.textContent='Break down formula';
  var dismissBtn = document.createElement('button');
  dismissBtn.className='ai-sel-dismiss';dismissBtn.textContent='Dismiss';

  var preview = document.createElement('div');
  preview.innerHTML='<b>📌 You selected:</b><em>"'+txt.slice(0,120)+(txt.length>120?'…':'')+'"</em>';
  var actions = document.createElement('div');
  actions.className='ai-sel-actions';
  actions.appendChild(explainBtn);actions.appendChild(formulaBtn);actions.appendChild(dismissBtn);
  banner.appendChild(preview);banner.appendChild(actions);

  explainBtn.addEventListener('click',function(){
    banner.remove();
    askAI('Explain this in detail for an engineering student: "'+txt+'"');
  });
  formulaBtn.addEventListener('click',function(){
    banner.remove();
    askAI('Break down this formula step by step, explain every symbol: "'+txt+'"');
  });
  dismissBtn.addEventListener('click',function(){banner.remove();});

  msgs.appendChild(banner);msgs.scrollTop=msgs.scrollHeight;
}

// ── AI MESSAGES ───────────────────────────────────────────────────────────
var aiMsgs=document.getElementById('aiMsgs');

function getTime(){var d=new Date();return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');}

function renderMarkdown(text){
  text=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  text=text.replace(/`([^`\n]+)`/g,'<code>$1</code>');
  text=text.replace(/^### (.+)$/gm,'<h3>$1</h3>');
  // Group consecutive bullet lines into a proper <ul> before newline conversion
  text=text.replace(/((?:^[•\-\*] .+$\n?)+)/gm,function(block){
    return '<ul>'+block.replace(/^[•\-\*] (.+)$/gm,'<li>$1</li>').replace(/\n/g,'')+'</ul>';
  });
  text=text.replace(/\n\n/g,'<br>');
  text=text.replace(/\n/g,'<br>');
  return text;
}

function addBotMsg(text){
  var wrap=document.createElement('div');wrap.className='ai-msg-wrap';
  var t=getTime();
  wrap.innerHTML=
    '<div class="msg-sender bot-sender"><span class="msg-sender-dot"></span>StudySphere AI</div>'+
    '<div class="msg-body">'+
      '<div class="ai-bubble bot">'+renderMarkdown(text)+'</div>'+
      '<div class="msg-meta">'+
        '<span class="msg-time">'+t+'</span>'+
        '<button class="msg-action-btn" onclick="copyBubble(this)">Copy</button>'+
      '</div>'+
    '</div>';
  aiMsgs.appendChild(wrap);aiMsgs.scrollTop=aiMsgs.scrollHeight;return wrap;
}

// Welcome message — user name resolved after ss-ready; use generic greeting here
addBotMsg("Hey! 👋 Open a PDF, select any text or formula and I'll help you understand it!");

function addUserMsg(text){
  var wrap=document.createElement('div');wrap.className='ai-msg-wrap user';
  var t=getTime();var safe=text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  wrap.innerHTML=
    '<div class="msg-sender user-sender"><span class="msg-sender-dot"></span>You</div>'+
    '<div class="msg-body">'+
      '<div class="ai-bubble user">'+safe+'</div>'+
      '<div class="msg-meta">'+
        '<span class="msg-time">'+t+'</span>'+
        '<button class="msg-action-btn user-btn" onclick="copyBubble(this)">Copy</button>'+
        '<button class="msg-action-btn user-btn" onclick="regenMsg(this)">Regenerate</button>'+
      '</div>'+
    '</div>';
  wrap.setAttribute('data-q',text);
  aiMsgs.appendChild(wrap);aiMsgs.scrollTop=aiMsgs.scrollHeight;return wrap;
}

function addTyping(){
  var wrap=document.createElement('div');wrap.className='ai-msg-wrap typing-wrap';
  wrap.innerHTML=
    '<div class="msg-sender bot-sender"><span class="msg-sender-dot"></span>StudySphere AI</div>'+
    '<div class="typing-bubble"><span></span><span></span><span></span></div>';
  aiMsgs.appendChild(wrap);aiMsgs.scrollTop=aiMsgs.scrollHeight;return wrap;
}



// ── ASK AI ────────────────────────────────────────────────────────────────
stopGeneration=function(){
  generationStopped=true;
  currentGenId++; // invalidate any running generation
  if(activeTypeTimer){clearTimeout(activeTypeTimer);activeTypeTimer=null;}
  if(activeThinkTimer){clearInterval(activeThinkTimer);activeThinkTimer=null;}
  var btn=document.getElementById('aiSend');
  btn.disabled=false;
  btn.classList.remove('is-stop');
};
window.stopGeneration=stopGeneration;

askAI=function(question,skipUserBubble){
  if(!question)return;
  generationStopped=false;
  currentGenId++; // new generation
  var myGenId=currentGenId; // capture — if this changes, we're stale
  pinAI();
  if(!skipUserBubble)addUserMsg(question);
  document.getElementById('aiSend').disabled=true;
  document.getElementById('stopBtn').style.display='flex';

  var thinkWrap=document.createElement('div');thinkWrap.className='ai-msg-wrap';
  thinkWrap.innerHTML=
    '<div class="msg-sender bot-sender"><span class="msg-sender-dot"></span>StudySphere AI</div>'+
    '<div class="think-bubble">'+
      '<span class="think-label">Thinking…</span>'+
      '<span class="think-text" id="thinkText"></span>'+
    '</div>';
  aiMsgs.appendChild(thinkWrap);aiMsgs.scrollTop=aiMsgs.scrollHeight;

  var THOUGHTS=['Reading the document context…','Identifying key concepts…','Checking formulas…','Structuring a clear explanation…','Almost ready…'];
  var tIdx=0;
  function cycleThought(){
    var el=document.getElementById('thinkText');if(!el)return;
    el.textContent='';var txt=THOUGHTS[tIdx%THOUGHTS.length];tIdx++;
    var i=0;var ti=setInterval(function(){if(!document.getElementById('thinkText')){clearInterval(ti);return;}document.getElementById('thinkText').textContent=txt.slice(0,i+1);i++;if(i>=txt.length)clearInterval(ti);},20);
  }
  cycleThought();
  activeThinkTimer=setInterval(cycleThought,1100);

  fetch(BACKEND_URL+'/api/ai',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens:1024,
      system:'You are StudySphere, a friendly tutor for TU Braunschweig engineering students. The student is reading "'+activeFileName+'" from '+currentCourseShort+'. ALWAYS base your answers on the actual document content provided below. Do not use general knowledge when the document covers the topic. Be thorough but concise. Use markdown: **bold**, `code`, ### headers, - bullet points.\n\nDOCUMENT CONTENT:\n'+(pdfFullText||'(document text not yet extracted — please wait a moment after opening the file)'),
      messages:[{role:'user',content:question}]
    })
  })
  .then(function(r){return r.json();})
  .then(function(data){
    if(myGenId!==currentGenId){thinkWrap.remove();return;} // stale — discard
    clearInterval(activeThinkTimer);activeThinkTimer=null;
    thinkWrap.style.transition='opacity .3s';thinkWrap.style.opacity='0';
    setTimeout(function(){thinkWrap.remove();},320);
    var rawText=data.error?('❌ Error: '+(data.error.message||JSON.stringify(data.error))):(data.content?data.content.map(function(b){return b.text||'';}).join(''):'No response');
    // Append answer wrap immediately to preserve order
    var ansWrap=document.createElement('div');ansWrap.className='ai-msg-wrap';
    var t=getTime();
    ansWrap.innerHTML=
      '<div class="msg-sender bot-sender"><span class="msg-sender-dot"></span>StudySphere AI</div>'+
      '<div class="msg-body">'+
        '<div class="ai-bubble bot" id="streamBubble" style="min-height:20px"></div>'+
        '<div class="msg-meta" id="streamMeta" style="display:none">'+
          '<span class="msg-time">'+t+'</span>'+
          '<button class="msg-action-btn" onclick="copyBubble(this)">Copy</button>'+
        '</div>'+
      '</div>';
    aiMsgs.appendChild(ansWrap);
    aiMsgs.scrollTop=aiMsgs.scrollHeight;
    var bubble=document.getElementById('streamBubble');
    var meta=document.getElementById('streamMeta');
    setTimeout(function(){
      // re-grab in case DOM changed
      bubble=ansWrap.querySelector('.ai-bubble.bot');
      meta=ansWrap.querySelector('.msg-meta');
      var i=0;
      function typeNext(){
        if(generationStopped||myGenId!==currentGenId){bubble=ansWrap.querySelector('.ai-bubble.bot');meta=ansWrap.querySelector('.msg-meta');bubble.innerHTML=renderMarkdown(rawText.slice(0,i));meta.style.display='flex';return;}
        if(i>=rawText.length){
          bubble=ansWrap.querySelector('.ai-bubble.bot');
          meta=ansWrap.querySelector('.msg-meta');
          bubble.innerHTML=renderMarkdown(rawText);
          meta.style.display='flex';
          document.getElementById('aiSend').disabled=false;
          document.getElementById('stopBtn').style.display='none';
          spawnConfetti();return;
        }
        bubble.innerHTML=renderMarkdown(rawText.slice(0,i+1))+'<span class="stream-cursor">▋</span>';
        i++;
        var atBottom=(aiMsgs.scrollHeight-aiMsgs.scrollTop-aiMsgs.clientHeight)<80;
        if(atBottom)aiMsgs.scrollTop=aiMsgs.scrollHeight;
        activeTypeTimer=setTimeout(typeNext,16+(Math.random()>0.93?55:0));
      }
      typeNext();
    },340);
  })
  .catch(function(e){
    clearInterval(activeThinkTimer);activeThinkTimer=null;
    thinkWrap.remove();
    addBotMsg('❌ Error: '+e.message);
    document.getElementById('aiSend').disabled=false;
    document.getElementById('stopBtn').style.display='none';
  });
};
window.askAI=askAI;

// ── SEND BUTTON ───────────────────────────────────────────────────────────
(document.getElementById('aiSend')||{addEventListener:function(){}}).addEventListener('click',function(){
  if(this.classList.contains('is-stop')){if(window.stopGeneration)window.stopGeneration();return;}
  var q=document.getElementById('aiInput').value.trim();if(!q)return;
  document.getElementById('aiInput').value='';
  document.getElementById('aiInput').style.height='auto';
  document.getElementById('aiCharCount').textContent='0 / 2000';
  askAI(q);
});
(document.getElementById('aiInput')||{addEventListener:function(){}}).addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('aiSend').click();}
});
(document.getElementById('aiInput')||{addEventListener:function(){}}).addEventListener('input',function(){
  document.getElementById('aiCharCount').textContent=this.value.length+' / 2000';
  this.style.height='auto';
  this.style.height=Math.min(this.scrollHeight,120)+'px';
});
// ── Quick action chips — all use actual document content ────────────────
function closeAllOpts(){
  document.querySelectorAll('.chip-drawer').forEach(function(el){el.classList.remove('open');});
}

function chipPrompt(type, level) {
  var hasDoc = !!pdfFullText;
  var base = hasDoc
    ? 'Using ONLY the content of the document "'+activeFileName+'" provided in the system prompt, '
    : 'As a knowledgeable tutor, ';
  if(!hasDoc) addBotMsg('💡 Tip: open a PDF first so I can answer from the actual document!');

  var prompts = {
    summarise: {
      small:    base + 'give me a SHORT summary of the document in 3-5 bullet points covering only the most essential points. Be very concise.',
      medium:   base + 'give me a MEDIUM summary of the document. Structure it with: ## 📝 Overview (3-4 sentences), ## 🔑 Main Topics (bullet points), ## 💡 Key Takeaways (3-5 points).',
      thorough: base + 'give me a THOROUGH and detailed summary of the entire document. Cover every section in depth. Structure it with: ## 📝 Overview, ## 🔑 Main Topics (with sub-points for each), ## 🔢 Formulas Mentioned, ## 💡 Key Takeaways, ## 📌 Things to Remember for the Exam.'
    },
    formulas:  base + 'extract and explain every formula, equation and mathematical expression in the document. For each one: show the formula, define every symbol, and give a brief explanation of what it calculates.',
    quiz: {
      easy:   base + 'create an EASY quiz of 6 questions based on the document. Focus on basic definitions and straightforward facts. After each question provide the answer with a simple explanation.',
      medium: base + 'create a MEDIUM difficulty quiz of 8 questions based on the document. Mix multiple choice and open questions requiring understanding. After each question provide the answer and explanation.',
      hard:   base + 'create a HARD quiz of 10 challenging questions based on the document. Include calculation problems, tricky concepts, and application questions. After each question provide a detailed answer and explanation.'
    },
    keyideas:  base + 'identify and explain the 8-10 most important concepts and key ideas from the document. For each concept give a clear definition and explain why it matters.',
    analogy:   base + 'explain the main concepts from the document using simple real-world analogies that an engineering student would understand easily. Make each analogy vivid and memorable.'
  };

  var prompt = typeof prompts[type] === 'object' ? prompts[type][level||'medium'] : prompts[type];
  closeAllOpts();
  askAI(prompt);
}

// Chips that need sub-options first
(document.getElementById('chip-summarise')||{addEventListener:function(){}}).addEventListener('click', function(){
  closeAllOpts();
  var opts = document.getElementById('opts-summarise');
  opts.classList.toggle('open');
});
(document.getElementById('chip-quiz')||{addEventListener:function(){}}).addEventListener('click', function(){
  closeAllOpts();
  var opts = document.getElementById('opts-quiz');
  opts.classList.toggle('open');
});

// Chips that fire directly
(document.getElementById('chip-formulas')||{addEventListener:function(){}}).addEventListener('click',  function(){ closeAllOpts(); chipPrompt('formulas');  });
(document.getElementById('chip-keyideas')||{addEventListener:function(){}}).addEventListener('click',  function(){ closeAllOpts(); chipPrompt('keyideas'); });
(document.getElementById('chip-analogy')||{addEventListener:function(){}}).addEventListener('click',   function(){ closeAllOpts(); chipPrompt('analogy');  });

// Option pill clicks
document.querySelectorAll('.chip-sub').forEach(function(opt){
  opt.addEventListener('click', function(){
    chipPrompt(opt.getAttribute('data-type'), opt.getAttribute('data-level'));
  });
});
// ── PER-PDF CHAT PERSISTENCE ──────────────────────────────────────────────
var CHAT_PREFIX = 'ss_chat_';

// Build a stable storage key from file name + course
function chatKeyFor(fileName, courseShort) {
  return (courseShort || '') + '||' + (fileName || '');
}

// Track the active file key
var _prevChatKey = null;

// Serialize all visible messages from the DOM
function serializeChatDOM() {
  var out = [];
  aiMsgs.querySelectorAll('.ai-msg-wrap').forEach(function(wrap) {
    // Skip typing indicators and thinking bubbles
    if (wrap.classList.contains('typing-wrap')) return;
    var bubble = wrap.querySelector('.ai-bubble');
    if (!bubble) return;
    var isUser = bubble.classList.contains('user');
    // For user messages store plain text (stored in data-q on the wrap or inner text)
    if (isUser) {
      var txt = wrap.getAttribute('data-q') || bubble.textContent || '';
      out.push({ role: 'user', text: txt.trim() });
    } else {
      // Bot: store rendered HTML so markdown formatting is preserved
      out.push({ role: 'bot', html: bubble.innerHTML });
    }
  });
  return out;
}

// Save current chat to localStorage
function saveChatForFile(fileKey) {
  if (!fileKey) return;
  try {
    var msgs = serializeChatDOM();
    if (msgs.length === 0) {
      localStorage.removeItem(CHAT_PREFIX + fileKey);
    } else {
      localStorage.setItem(CHAT_PREFIX + fileKey, JSON.stringify(msgs));
    }
  } catch(e) { console.warn('Chat save failed:', e); }
}

// Load and re-render saved chat; returns true if history was found
function loadChatForFile(fileKey) {
  if (!fileKey) return false;
  try {
    var raw = localStorage.getItem(CHAT_PREFIX + fileKey);
    if (!raw) return false;
    var msgs = JSON.parse(raw);
    if (!msgs || !msgs.length) return false;
    aiMsgs.innerHTML = '';
    var t = getTime();
    msgs.forEach(function(m) {
      if (m.role === 'user') {
        // Rebuild user bubble
        var wrap = document.createElement('div');
        wrap.className = 'ai-msg-wrap user';
        var safe = (m.text||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        wrap.setAttribute('data-q', m.text || '');
        wrap.innerHTML =
          '<div class="msg-sender user-sender"><span class="msg-sender-dot"></span>You</div>'+
          '<div class="msg-body">'+
            '<div class="ai-bubble user">'+safe+'</div>'+
            '<div class="msg-meta">'+
              '<span class="msg-time">'+t+'</span>'+
              '<button class="msg-action-btn user-btn" onclick="copyBubble(this)">Copy</button>'+
              '<button class="msg-action-btn user-btn" onclick="regenMsg(this)">Regenerate</button>'+
            '</div>'+
          '</div>';
        aiMsgs.appendChild(wrap);
      } else {
        // Rebuild bot bubble
        var wrap = document.createElement('div');
        wrap.className = 'ai-msg-wrap';
        wrap.innerHTML =
          '<div class="msg-sender bot-sender"><span class="msg-sender-dot"></span>StudySphere AI</div>'+
          '<div class="msg-body">'+
            '<div class="ai-bubble bot">'+(m.html||'')+'</div>'+
            '<div class="msg-meta">'+
              '<span class="msg-time">'+t+'</span>'+
              '<button class="msg-action-btn" onclick="copyBubble(this)">Copy</button>'+
            '</div>'+
          '</div>';
        aiMsgs.appendChild(wrap);
      }
    });
    aiMsgs.scrollTop = aiMsgs.scrollHeight;
    return true;
  } catch(e) { console.warn('Chat load failed:', e); return false; }
}

// Delete saved chat
function deleteChatForFile(fileKey) {
  if (!fileKey) return;
  try { localStorage.removeItem(CHAT_PREFIX + fileKey); } catch(e) {}
}

// Deferred save helper (used after streaming completes)
deferredSave = function() {
  if (!_prevChatKey) return;
  setTimeout(function(){ saveChatForFile(_prevChatKey); }, 300);
}

// ── PATCH openFile: save old chat → clear → load new chat ─────────────────
var _origOpenFileChat = openFile;
openFile = function(f, c) {
  // 1. Save outgoing chat before navigating away
  if (_prevChatKey) saveChatForFile(_prevChatKey);

  // 2. Compute new key early
  var newKey = chatKeyFor(f.name, c.short);
  _prevChatKey = newKey;

  // 3. Open the file (renders PDF, sets activeFileName etc.)
  _origOpenFileChat(f, c);

  // 4. Clear panel and load saved history (or show welcome)
  aiMsgs.innerHTML = '';
  var hadHistory = loadChatForFile(newKey);
  if (!hadHistory) {
    addBotMsg('📄 <strong>' + f.name + '</strong> loaded! Ask me anything about it — I\'ll answer based on the document content. 🎓');
  } else {
    // Subtle "restored" separator
    var note = document.createElement('div');
    note.className = 'chat-restore-note';
    note.style.cssText = 'text-align:center;font-size:.67rem;color:rgba(155,93,229,.45);padding:6px 0 2px;font-style:italic;letter-spacing:.02em';
    note.textContent = '— chat history restored —';
    aiMsgs.appendChild(note);
    aiMsgs.scrollTop = aiMsgs.scrollHeight;
  }
  saveState();
};

// ── PATCH addUserMsg: save after user sends a message ─────────────────────
var _origAddUserMsg = addUserMsg;
addUserMsg = function(text) {
  var result = _origAddUserMsg(text);
  deferredSave();
  return result;
};

// ── PATCH askAI: save after streaming finishes ────────────────────────────
// We hook into the typeNext completion point by patching spawnConfetti
// (called exactly when streaming ends successfully)
var _origSpawnConfetti = spawnConfetti;
spawnConfetti = function() {
  _origSpawnConfetti();
  deferredSave();
};

// Also save when user manually stops generation
var _origStopGeneration = stopGeneration;
stopGeneration = function() {
  _origStopGeneration();
  deferredSave();
};

// ── PATCH Clear button: wipe DOM + localStorage ───────────────────────────
(document.getElementById('aiClearBtn')||{addEventListener:function(){}}).addEventListener('click', function() {
  aiMsgs.innerHTML = '';
  if (_prevChatKey) deleteChatForFile(_prevChatKey);
  addBotMsg('Chat cleared! What would you like to know? 😊');
  aiPinned = false;
  forceCloseAI(); setTimeout(openAI, 100);
});


// ── CONFETTI ──────────────────────────────────────────────────────────────
function spawnConfetti(){
  var cols=['#FFD93D','#FF6B35','#FF6FB7','#9B5DE5','#4CC9F0','#06D6A0'];
  for(var i=0;i<16;i++){
    (function(){
      var el=document.createElement('div');el.className='confetti-piece';
      el.style.cssText='left:'+(Math.random()*100)+'vw;background:'+cols[Math.floor(Math.random()*cols.length)]+';animation-delay:'+(Math.random()*.5)+'s;animation-duration:'+(1+Math.random())+'s;';
      document.body.appendChild(el);setTimeout(function(){el.remove();},2200);
    })();
  }
}

// ── LECTURE NOTES ─────────────────────────────────────────────────────────
var lnSummaries = [];
var lnOpenIdx = -1;

function lnRenderMarkdown(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  text = text.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  // Group consecutive bullet lines into a proper <ul> before newline conversion
  text = text.replace(/((?:^[•\-\*] .+$\n?)+)/gm, function(block) {
    return '<ul>' + block.replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>').replace(/\n/g, '') + '</ul>';
  });
  text = text.replace(/\n\n/g, '<br>');
  text = text.replace(/\n/g, '<br>');
  return text;
}

function lnFormatDate(iso) {
  try {
    var d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch(e) { return iso; }
}

async function lnGetPreview(text) {
  // Extract just the summary part
  var m = text.match(/##\s*📝.*?\n([\s\S]*?)(?=##|$)/);
  var raw = m ? m[1] : text;
  return raw.replace(/[#*`]/g, '').replace(/<[^>]+>/g, '').trim().slice(0, 160);
}







(document.getElementById('lnModalClose')||{addEventListener:function(){}}).addEventListener('click', function() {
  document.getElementById('lnModal').classList.remove('show');
});
(document.getElementById('lnModal')||{addEventListener:function(){}}).addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('show');
});
(document.getElementById('lnModalDel')||{addEventListener:function(){}}).addEventListener('click', async function() {
  if (lnOpenIdx < 0) return;
  var deleted = lnSummaries[lnOpenIdx];
  lnSummaries.splice(lnOpenIdx, 1);
  document.getElementById('lnModal').classList.remove('show');
  lnRender(lnSummaries);
  // Persist deletion — if extension available, update storage via postMessage
  window.postMessage({ type: 'SS_DELETE_SUMMARY', summaries: lnSummaries }, '*');
  // Delete from Supabase
  if (deleted && deleted.id) await lnDeleteNoteFromSupabase(deleted.id);
});

// Sync button
var lnSyncing = false;
(document.getElementById('lnSyncBtn')||{addEventListener:function(){}}).addEventListener('click', function() {
  if (lnSyncing) return;
  lnSyncing = true;
  document.getElementById('lnSyncLabel').textContent = 'Syncing…';
  document.getElementById('lnSyncDot').style.background = '#f472b6';
  window.postMessage({ type: 'SS_REQUEST_SUMMARIES' }, '*');
  // Timeout fallback
  setTimeout(function() {
    if (lnSyncing) {
      lnSyncing = false;
      document.getElementById('lnSyncLabel').textContent = 'Extension not detected';
      document.getElementById('lnSyncDot').style.background = '#ff6b35';
      setTimeout(function() {
        document.getElementById('lnSyncLabel').textContent = 'Sync from Extension';
        document.getElementById('lnSyncDot').style.background = '#c084fc';
      }, 2500);
    }
  }, 3000);
});

// ── TOAST ─────────────────────────────────────────────────────────────────
var toastTimer = null;


(document.getElementById('ss-toast-action')||{addEventListener:function(){}}).addEventListener('click', function() {
  document.getElementById('ss-toast').classList.remove('show');
  // Show portal and scroll to lecture notes
  document.getElementById('portal').classList.add('show');
  setTimeout(function() {
    var ln = document.querySelector('.ln-section');
    if (ln) ln.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
});

// ── LECTURE NOTES — SUPABASE SYNC ─────────────────────────────────────────
function lnGenId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'ln-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

async function lnSaveNoteToSupabase(note) {
  if (!_currentUser || !note || !note.id) return;
  try {
    await fetch(SUPA_URL + '/rest/v1/lecture_notes', {
      method: 'POST',
      headers: Object.assign(_sbHeaders(), { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({
        id: note.id,
        user_id: _currentUser.id,
        title: note.title,
        content: note.text,
        url: note.url || '',
        date: note.date
      })
    });
  } catch(e) { console.warn('lnSaveNoteToSupabase error:', e); }
}

async function lnDeleteNoteFromSupabase(id) {
  if (!_currentUser || !id) return;
  try {
    await fetch(
      SUPA_URL + '/rest/v1/lecture_notes?id=eq.' + encodeURIComponent(id) +
      '&user_id=eq.' + encodeURIComponent(_currentUser.id),
      { method: 'DELETE', headers: _sbHeaders() }
    );
  } catch(e) { console.warn('lnDeleteNoteFromSupabase error:', e); }
}

// ── End Supabase lecture notes helpers ────────────────────────────────────

// Listen for data from extension content script
var lnPrevCount = 0;
window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== 'SS_SUMMARIES_DATA') return;
  lnSyncing = false;
  var summaries = e.data.summaries || [];
  var isManualSync = document.getElementById('lnSyncLabel').textContent === 'Syncing…';

  document.getElementById('lnSyncLabel').textContent = 'Synced ✓';
  document.getElementById('lnSyncDot').style.background = '#06D6A0';
  setTimeout(function() {
    document.getElementById('lnSyncLabel').textContent = 'Sync from Extension';
    document.getElementById('lnSyncDot').style.background = '#c084fc';
  }, 2000);

  // Show toast only when a genuinely new summary arrives (not on first load)
  if (lnPrevCount > 0 && summaries.length > lnPrevCount) {
    var newest = summaries[0];
    showToast('📝 New summary: ' + newest.title.slice(0, 40) + (newest.title.length > 40 ? '…' : ''), 'Tap View to open your lecture notes');
  } else if (isManualSync && summaries.length > 0) {
    showToast('✅ ' + summaries.length + ' note' + (summaries.length !== 1 ? 's' : '') + ' synced', summaries[0].title.slice(0, 50));
  } else if (isManualSync && summaries.length === 0) {
    showToast('⚠️ No notes found', 'Summarize a lecture in the extension first');
  }

  // Assign stable IDs to extension notes and save any new ones to Supabase
  var existingKeys = lnSummaries.map(function(n) {
    return (n.title || '') + '|' + (n.date || '').slice(0, 10);
  });
  summaries.forEach(function(s) {
    // Reuse existing id if we've seen this note before (match by title+date)
    if (!s.id) {
      var key = (s.title || '') + '|' + (s.date || '').slice(0, 10);
      var match = lnSummaries.find(function(n) {
        return ((n.title || '') + '|' + (n.date || '').slice(0, 10)) === key;
      });
      s.id = match ? match.id : lnGenId();
    }
    // Save to Supabase if this note wasn't already in memory
    var key = (s.title || '') + '|' + (s.date || '').slice(0, 10);
    if (!existingKeys.includes(key)) {
      lnSaveNoteToSupabase(s);
    }
  });

  lnPrevCount = summaries.length;
  lnRender(summaries);
});

// Auto-request on load
setTimeout(function() { window.postMessage({ type: 'SS_REQUEST_SUMMARIES' }, '*'); }, 800);

// ── INIT ──────────────────────────────────────────────────────────────────
renderCourses();renderTT();renderMails();

// ── STATE PERSISTENCE ─────────────────────────────────────────────────────

// ── BROWSER HISTORY HELPERS ───────────────────────────────────────────────
var _ssHandlingPop = false;

function _ssPushHistory(state, hash) {
  if (_ssHandlingPop) return;
  try {
    history.pushState(state, '', hash || window.location.pathname);
  } catch (e) {}
}

function _ssReplaceHistory(state, hash) {
  try {
    history.replaceState(state, '', hash || window.location.pathname);
  } catch (e) {}
}

function _ssFindCourseById(courseId) {
  if (!courseId) return null;
  for (var semId in SEMS) {
    if (!SEMS[semId] || !SEMS[semId].courses) continue;
    var found = SEMS[semId].courses.find(function(c) { return c.id === courseId; });
    if (found) return found;
  }
  return null;
}

function _ssFindCourseByShort(shortName) {
  if (!shortName) return null;
  for (var semId in SEMS) {
    if (!SEMS[semId] || !SEMS[semId].courses) continue;
    var found = SEMS[semId].courses.find(function(c) { return c.short === shortName; });
    if (found) return found;
  }
  return null;
}

function _ssFindFileInCourse(course, fileName) {
  if (!course || !fileName) return null;
  var pools = [];
  if (Array.isArray(course.files)) pools.push(course.files);
  if (Array.isArray(course.folders)) {
    course.folders.forEach(function(folder) {
      if (folder && Array.isArray(folder.files)) pools.push(folder.files);
    });
  }
  for (var i = 0; i < pools.length; i++) {
    var found = pools[i].find(function(f) { return f.name === fileName; });
    if (found) return found;
  }
  return null;
}

function _ssApplyHistoryState(state) {
  if (!state) {
    showPortal();
    return;
  }

  if (state.view === 'portal') {
    showPortal();
    if (state.section) {
      setNavActive(
        state.section === 'dashboard' ? 'psbDashboard' :
        state.section === 'profile' ? 'psbProfile' :
        state.section === 'settings' ? 'psbSettings' :
        state.section === 'subscription' ? 'psbSubscription' :
        'psbDashboard'
      );
      showPortalSection(state.section);
    }
    return;
  }

  if (state.view === 'studip') {
    showStudip();
    return;
  }

  if (state.view === 'course') {
    var course = _ssFindCourseById(state.courseId) || _ssFindCourseByShort(state.courseShort);
    if (course) {
      openCourse(course);
      if (state.section) showCourseSection(course, state.section);
    }
    return;
  }

  if (state.view === 'file') {
    var course = _ssFindCourseById(state.courseId) || _ssFindCourseByShort(state.courseShort);
    if (course) {
      var file = _ssFindFileInCourse(course, state.fileName);
      if (file) {
        openFile(file, course);
      } else {
        openCourse(course);
        if (state.section) showCourseSection(course, state.section);
      }
    }
  }
}




// Save state on any navigation + browser history
var _origOpenCourse = openCourse;
openCourse = function(c) {
  _pendingPortalRestore = null; // entering files view — no portal section to restore
  _origOpenCourse(c);
  saveState();
  _ssPushHistory(
    {
      view: 'course',
      courseId: c.id || null,
      courseShort: c.short || null,
      section: activeCourseSection || 'files'
    },
    '#course=' + encodeURIComponent(c.id || c.short || '')
  );
};

var _origOpenFile = openFile;
openFile = function(f, c) {
  _pendingPortalRestore = null; // entering files view — no portal section to restore
  _origOpenFile(f, c);
  saveState();
  _ssPushHistory(
    {
      view: 'file',
      courseId: c.id || null,
      courseShort: c.short || null,
      fileName: f.name || null,
      section: activeCourseSection || 'files'
    },
    '#file=' + encodeURIComponent(f.name || '')
  );
};

var _origShowSection = showCourseSection;
showCourseSection = function(c, s) {
  _origShowSection(c, s);
  saveState();
  _ssPushHistory(
    {
      view: 'course',
      courseId: c.id || null,
      courseShort: c.short || null,
      section: s || 'files'
    },
    '#course=' + encodeURIComponent(c.id || c.short || '') + '&section=' + encodeURIComponent(s || 'files')
  );
};

// Capture the tab saved before this page load (before _enterApp overwrites it with 'dashboard')
// Capture saved portal section BEFORE _enterApp can overwrite ss_portal_tab.
// Used to restore the correct section when _enterApp calls showPortalSection('dashboard').
var _savedPortalTab = (function(){ try { return sessionStorage.getItem('ss_portal_tab'); } catch(e) { return null; } })();
var _pendingPortalRestore = (_savedPortalTab && _savedPortalTab !== 'dashboard') ? _savedPortalTab : null;
var _origShowPortalSection = showPortalSection;
showPortalSection = function(sec) {
  var target = sec || 'dashboard';

  // When _enterApp calls showPortalSection('dashboard'), the portal is already
  // visible at that exact moment. Intercept and redirect to the saved section.
  if (target === 'dashboard' && _pendingPortalRestore) {
    target = _pendingPortalRestore;
    _pendingPortalRestore = null;
    var _nm = {profile:'psbProfile', settings:'psbSettings', subscription:'psbSubscription'};
    setNavActive(_nm[target] || 'psbDashboard');
  }

  activePortalSection = target;
  _origShowPortalSection(target);
  try { sessionStorage.setItem('ss_portal_tab', target); } catch(e) {}
  _ssPushHistory(
    { view: 'portal', section: target },
    '#portal=' + encodeURIComponent(target)
  );
};

// Restore on load
restoreState();

// Don't overwrite the URL hash if it contains an OAuth token — supabase.js
// needs to read #access_token in its ss-ready handler. It will clean the hash itself.
if (!window.location.hash || window.location.hash.indexOf('access_token') === -1) {
  var _rst = {};
  try { _rst = JSON.parse(localStorage.getItem('ss_state') || '{}'); } catch(e) {}
  if (_rst.inApp && _rst.view === 'studip') {
    _ssReplaceHistory({ view: 'studip' }, '#studip');
  } else if (_rst.inApp && _rst.fileName) {
    _ssReplaceHistory({ view: 'file', courseId: _rst.courseId, fileName: _rst.fileName, section: _rst.section }, '#file=' + encodeURIComponent(_rst.fileName));
  } else if (_rst.inApp && _rst.courseId) {
    _ssReplaceHistory({ view: 'course', courseId: _rst.courseId, section: _rst.section }, '#course=' + encodeURIComponent(_rst.courseId));
  } else {
    var _initSec = _pendingPortalRestore || 'dashboard';
    _ssReplaceHistory({ view: 'portal', section: _initSec }, '#portal=' + encodeURIComponent(_initSec));
  }
}

window.addEventListener('popstate', function(e) {
  _ssHandlingPop = true;
  try {
    _ssApplyHistoryState(e.state);
  } finally {
    _ssHandlingPop = false;
  }
});

// Flash scroll hint when new message arrives
var _origAppend = aiMsgs.appendChild.bind(aiMsgs);
aiMsgs.appendChild = function(el){
  var result = _origAppend(el);
  aiMsgs.classList.remove('new-msg');
  void aiMsgs.offsetWidth;
  aiMsgs.classList.add('new-msg');
  setTimeout(function(){aiMsgs.classList.remove('new-msg');}, 700);
  return result;
};


// ── INTERACTIVE EFFECTS JS ─────────────────────────────────────────


// Ripple effect on any clickable element in AI panel
(document.getElementById('aiPanel')||{addEventListener:function(){}}).addEventListener('click', function(e){
  var btn = e.target.closest('button, .ai-tip, .chip-sub, .ai-sel-btn');
  if(!btn) return;
  var r = document.createElement('span');
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height) * 1.5;
  r.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,.3);width:'+size+'px;height:'+size+'px;'+
    'left:'+(e.clientX-rect.left-size/2)+'px;top:'+(e.clientY-rect.top-size/2)+'px;'+
    'animation:rippleOut .5s ease forwards;pointer-events:none;z-index:99';
  if(getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(r);
  setTimeout(function(){r.remove();}, 520);
});







// ── PORTAL SECTION SWITCHER ───────────────────────────────────────────────





// pc* card listeners moved to ss-ready

// ── SUPABASE AUTH + DATA ─────────────────────────────────────────────────
// Note: auth DOM elements are injected dynamically by loader.js, so we must
// wait for 'ss-ready' before querying them — NOT DOMContentLoaded.



// ── END INIT ─────────────────────────────────────────────────────────────────



// ── SS-READY (runs at top level since app.js loads after all HTML) ───────────


// ── DOM LISTENERS (elements injected by loader.js — must be in ss-ready) ────

// Nav buttons
function _bindIf(id, ev, fn){
  var el = document.getElementById(id);
  if (el) el.addEventListener(ev, fn);
}

_bindIf('studipBack', 'click', function(){
  showPortal();
  _ssPushHistory({ view: 'portal', section: 'dashboard' }, '#portal=dashboard');
});
_bindIf('psbDashboard', 'click', function(){
  setNavActive('psbDashboard'); showPortalSection('dashboard');
});
_bindIf('psbProfile', 'click', function(){
  setNavActive('psbProfile'); showPortalSection('profile');
});
_bindIf('psbSettings', 'click', function(){
  setNavActive('psbSettings'); showPortalSection('settings');
});
_bindIf('psbSubscription', 'click', function(){
  setNavActive('psbSubscription'); showPortalSection('subscription');
});
_bindIf('goPortal', 'click', function(){
  if (activeFileName && activeCourseRef) {
    // Inside a PDF → go back to course overview
    activeFileName = null;
    pdfDoc = null;
    pdfFullText = '';
    document.getElementById('pdfView').style.display = 'none';
    document.getElementById('courseOverview').style.display = 'block';
    showCourseSection(activeCourseRef, 'files');
  } else {
    // In course overview (or welcome state) → go back to Stud.IP
    activeCourseId = null;
    activeCourseRef = null;
    showStudip();
  }
});

// Sidebar
var sbPanel=document.getElementById('sidebar');
_bindIf('sidebarToggle','click',function(){sbOpen?closeSB():openSB();});
_bindIf('sbClose','click',closeSB);

// ── Theme transition: radial ripple from click origin ────────────────────
function _applyTheme(toNight, originEl) {
  var rect = originEl
    ? originEl.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  var x = Math.round(rect.left + rect.width / 2);
  var y = Math.round(rect.top + rect.height / 2);

  function _commitTheme() {
    nightOn = toNight;
    document.body.classList.toggle('night', toNight);
    var nb = document.getElementById('nightBtn');
    if (nb) nb.textContent = toNight ? '☀️' : '🌙';
    var dm = document.getElementById('settingsDarkMode');
    if (dm) dm.checked = toNight;
    localStorage.setItem('ss_dark', toNight ? '1' : '0');
    saveState();
  }

  // View Transitions API — browser screenshots old & new state,
  // then reveals the real new-theme content as an expanding circle
  if (!document.startViewTransition) {
    _commitTheme(); // fallback: instant switch
    return;
  }

  var transition = document.startViewTransition(_commitTheme);

  transition.ready.then(function() {
    var endRadius = Math.hypot(
      Math.max(x, window.innerWidth  - x),
      Math.max(y, window.innerHeight - y)
    );
    document.documentElement.animate(
      {
        clipPath: [
          'circle(0px at ' + x + 'px ' + y + 'px)',
          'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)'
        ]
      },
      {
        duration: 500,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)'
      }
    );
  });
}

// Night mode button
_bindIf('nightBtn', 'click', function() {
  _applyTheme(!nightOn, this);
});

// Dashboard cards
_bindIf('pcStudip','click',function(){ showStudip(); _ssPushHistory({ view: 'studip' }, '#studip'); });
_bindIf('pcMail','click',function(){window.open('https://mail.tu-braunschweig.de','_blank');});
_bindIf('pcConnect','click',function(){window.open('https://connect.tu-braunschweig.de','_blank');});
_bindIf('pcTT','click',function(){window.open('https://connect.tu-braunschweig.de','_blank');});
_bindIf('pcCert','click',function(){window.open('https://connect.tu-braunschweig.de','_blank');});
_bindIf('pcWeb','click',function(){window.open('https://www.tu-braunschweig.de','_blank');});

// Auth modal logic
var _authMode = 'signin'; // or 'signup'
var authModal = document.getElementById('authModal');
var authEmail = document.getElementById('authEmail');
var authPassword = document.getElementById('authPassword');
var authSubmit = document.getElementById('authSubmit');
var authSwitch = document.getElementById('authSwitch');
var authError = document.getElementById('authError');
var authTitle = document.getElementById('authTitle');

function showAuthError(msg) {
  authError.textContent = msg;
  authError.style.display = 'block';
}


function hideAuthError() { authError.style.display = 'none'; }

function _setAuthMode(mode) {
  _authMode = mode;
  var isSignup = mode === 'signup';
  var _t = (_translations[_lang] || _translations.en);
  authTitle.textContent = isSignup ? _t.auth_title_signup : _t.auth_title_signin;
  authSubmit.textContent = isSignup ? _t.auth_submit_signup : _t.auth_submit_signin;
  authSwitch.textContent = isSignup ? _t.auth_switch_signup : _t.auth_switch_signin;
  var confirmWrap = document.getElementById('authConfirmWrap');
  var strengthWrap = document.getElementById('pwStrengthWrap');
  if (confirmWrap) confirmWrap.style.display = isSignup ? 'flex' : 'none';
  if (strengthWrap) strengthWrap.style.display = isSignup ? 'block' : 'none';
  if (!isSignup) {
    var ac = document.getElementById('authConfirm');
    if (ac) ac.value = '';
    var hint = document.getElementById('authConfirmHint');
    if (hint) hint.textContent = '';
    ['pws1','pws2','pws3','pws4'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.style.background = 'rgba(255,255,255,.1)';
    });
    var lbl = document.getElementById('pwStrengthLabel');
    if (lbl) lbl.textContent = '';
  }
  hideAuthError();
}

authSwitch.addEventListener('click', function(){
  _setAuthMode(_authMode === 'signin' ? 'signup' : 'signin');
});

// Password strength meter
authPassword.addEventListener('input', function(){
  if (_authMode !== 'signup') return;
  var pw = this.value;
  var score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score = Math.min(score + 1, 4);
  score = Math.min(score, 4);
  var colors = ['#ef4444','#f97316','#eab308','#22c55e'];
  var labels = ['Weak','Fair','Good','Strong'];
  ['pws1','pws2','pws3','pws4'].forEach(function(id, i){
    document.getElementById(id).style.background = i < score ? colors[score-1] : 'rgba(255,255,255,.1)';
  });
  var lbl = document.getElementById('pwStrengthLabel');
  lbl.textContent = pw.length ? (labels[score-1] || '') : '';
  lbl.style.color = score > 0 ? colors[score-1] : 'rgba(255,255,255,.35)';
});

// Confirm password match hint
document.getElementById('authConfirm').addEventListener('input', function(){
  var hint = document.getElementById('authConfirmHint');
  var pw = authPassword.value;
  if (!this.value) { hint.textContent = ''; return; }
  if (this.value === pw) {
    hint.textContent = '✓ Passwords match';
    hint.style.color = '#22c55e';
  } else {
    hint.textContent = '✗ Passwords do not match';
    hint.style.color = '#ef4444';
  }
});

authSubmit.addEventListener('click', async function(){
  if (!_sb) { showAuthError('Connection error — please refresh the page'); return; }
  var email = authEmail.value.trim();
  var password = authPassword.value;
  if (!email || !password) { showAuthError('Please fill in all fields'); return; }

  authSubmit.textContent = '⏳ Please wait…';
  authSubmit.disabled = true;
  hideAuthError();

  try {
    // ── SIGN UP MODE ──────────────────────────────────────────────────────
    if (_authMode === 'signup') {
      var confirmVal = document.getElementById('authConfirm').value;
      if (!confirmVal) { showAuthError('Please confirm your password'); authSubmit.textContent='Create Account'; authSubmit.disabled=false; return; }
      if (password !== confirmVal) { showAuthError('Passwords do not match'); authSubmit.textContent='Create Account'; authSubmit.disabled=false; return; }
      if (password.length < 8) { showAuthError('Password must be at least 8 characters'); authSubmit.textContent='Create Account'; authSubmit.disabled=false; return; }

      var result = await _sb.auth.signUp(email, password, 'https://studysphere-website.netlify.app/');
      
      // Check for errors
      if (result.error || result.error_description) {
        throw new Error(result.error_description || result.error);
      }

      // Mark this email as pending confirmation
      sessionStorage.setItem('pendingConfirm', email);

      // If Supabase returned a session directly (email confirm disabled)
      if (result.access_token) {
        localStorage.setItem('sb_token', result.access_token);
        if (result.refresh_token) localStorage.setItem('sb_refresh', result.refresh_token);
        _verifyAndEnter(result.access_token);
        return;
      }

      // User created but needs email confirmation
      if (result.id || (result.user && result.user.id)) {
        showAuthError('✅ Account created! Check your email and click the confirmation link to get started.');
        authSubmit.textContent = 'Create Account';
        authSubmit.disabled = false;
        return;
      }

      throw new Error('Signup failed — please try again.');
    }

    // ── SIGN IN MODE ──────────────────────────────────────────────────────
    var result = await _sb.auth.signIn(email, password);

    // Login failed — no access token
    if (!result.access_token) {
      var msg = (result.error_description || result.error || result.msg || '').toLowerCase();

      // Email not confirmed yet
      if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
        showAuthError('⚠️ Please confirm your email first — check your inbox for the link.');
        authSubmit.textContent = 'Sign In';
        authSubmit.disabled = false;
        return;
      }

      // Wrong password, or account was created via Google (no password set).
      // Both produce identical errors so keep the user in sign-in mode and
      // surface both possibilities with a clear hint toward the Google button.
      showAuthError('⚠️ Incorrect password — or did you sign up with Google? Try the Google button below, or use the link to create a new account.');
      authSubmit.textContent = 'Sign In';
      authSubmit.disabled = false;
      return;
    }

    // Sign in succeeded — _enterApp handles onboarding check
  } catch(e) {
    var msg = e.message || String(e);
    if (msg.includes('fetch')) {
      showAuthError('Network error — check your connection.');
    } else {
      showAuthError(msg);
    }
  } finally {
    if (authSubmit.textContent === '⏳ Please wait…') {
      authSubmit.textContent = _authMode === 'signin' ? 'Sign In' : 'Create Account';
      authSubmit.disabled = false;
    }
  }
});

// Handle Enter key in auth inputs
[authEmail, authPassword].forEach(function(el){
  el.addEventListener('keydown', function(e){ if(e.key==='Enter') authSubmit.click(); });
});

// Auth state listener
_sb.auth.onAuthStateChange(function(event, data){
  var user = data && (data.user || (data.access_token && _currentUser));
  if (event === 'SIGNED_IN') {
    if (_currentUser) { _enterApp(_currentUser); }
    _resetActivityTimer();
  } else if (event === 'SIGNED_OUT') {
    // supabase.js has already cleared all tokens and ss_logged_in.
    // A reload is the cleanest recovery: loader.js will show the landing page.
    window.location.reload();
  }
});

function updateAuthIndicator(user) {
  if (!user) return;
  // Prefer profile name from the profile fields if available
  var profileNameEl = document.getElementById('profileName');
  var profileName = profileNameEl && profileNameEl.value ? profileNameEl.value : null;
  var name = profileName || (user.user_metadata && user.user_metadata.full_name) || (user.email ? user.email.split('@')[0] : 'User');
  var initial = name.charAt(0).toUpperCase();
  var av = document.getElementById('authAvatar');
  var nm = document.getElementById('authName');
  if (av) av.textContent = initial;
  if (nm) nm.textContent = name;
  var ai = document.getElementById('authIndicator');
  if (ai) ai.style.display = 'flex';
}
window.updateAuthIndicator = updateAuthIndicator;

function handleAuthClick() {
  if (_currentUser) {
    // Show sign out confirmation via toast
    if (confirm('Sign out of StudySphere?')) {
      _sb.auth.signOut().then(function(){
        document.getElementById('authAvatar').textContent='?';
        document.getElementById('authName').textContent='Sign in';
      });
    }
  } else {
    authModal.style.display = 'flex';
  }
}

// ── LOAD USER DATA ────────────────────────────────────────────────────────
async function loadUserData(uid) {
  try {
    var profile = await _sb.from('profiles').select('*').eq('id', uid).single();
    // Fallback: if Supabase returned nothing, try localStorage cache
    if (!profile || !profile.full_name) {
      try {
        var cached = localStorage.getItem('profile_cache_' + uid);
        if (cached) profile = JSON.parse(cached);
      } catch(e) {}
    }
    if (profile && profile.full_name) applyProfile(profile);

    var settings = await _sb.from('settings').select('*').eq('id', uid).single();
    if (settings) applySettings(settings);

    var sub = await _sb.from('subscriptions').select('*').eq('id', uid).single();
    if (sub) applySubscription(sub);

    // Load lecture notes from Supabase and merge with in-memory state
    await lnLoadFromSupabase(uid);
  } catch(e) { console.warn('loadUserData error:', e); }
}
window.loadUserData = loadUserData;

function applyProfile(p) {
  if (!p) return;
  var n = document.getElementById('profileName');
  var e = document.getElementById('profileEmail');
  var u = document.getElementById('profileUniversity');
  var pr = document.getElementById('profileProgramme');
  var m = document.getElementById('profileMatrikel');
  var i = document.getElementById('profileInitial');
  if (n && p.full_name) n.value = p.full_name;
  if (e && p.email) e.value = p.email;
  if (u && p.university) u.value = p.university;
  if (pr && p.programme) pr.value = p.programme;
  if (m && p.matrikel) m.value = p.matrikel;
  if (i && p.full_name) i.textContent = p.full_name.charAt(0).toUpperCase();
  if (p.full_name && typeof updateAuthIndicator === 'function' && _currentUser) {
    updateAuthIndicator(_currentUser);
  }
}

// ── LANGUAGE / i18n ───────────────────────────────────────────────────────
var _lang = localStorage.getItem('ss_lang') || 'en';

var _translations = {
  en: {
    nav_home: 'Home', nav_profile: 'Profile', nav_settings: 'Settings', nav_subscription: 'Subscription',
    auth_email_label: 'Email', auth_password_label: 'Password', auth_confirm_label: 'Confirm Password',
    auth_title_signin: 'Sign in to your account', auth_title_signup: 'Create your account',
    auth_submit_signin: 'Sign In', auth_submit_signup: 'Create Account',
    auth_google_btn: 'Continue with Google',
    auth_stay: 'Stay signed in', auth_stay_timeout: '(30 min timeout)',
    auth_switch_signin: "Don't have an account? Sign up", auth_switch_signup: 'Already have an account? Sign in',
    ob_step1: "Let's set up your profile — step 1 of 2", ob_step2: 'Almost there — step 2 of 2',
    ob_first_name: 'First Name', ob_last_name: 'Last Name', ob_age: 'Age', ob_email: 'TU-Mail',
    ob_programme: 'Study Programme', ob_semester: 'Semester', ob_matrikel: 'Matrikel Nr.',
    ob_continue_btn: 'Continue →', ob_back_btn: '← Back', ob_finish_btn: "🎓 Let's go!",
    settings_save_btn: 'Save Changes',
    card_studip_desc: 'Courses & materials', card_mail_desc: 'Outlook Web Access',
    card_connect_desc: 'Exams & grades', card_timetable_name: 'Timetable',
    card_timetable_desc: 'Semester schedule', card_cert_name: 'Certificates',
    card_cert_desc: 'Enrolment docs',
    profile_label_name: 'Full name', profile_label_email: 'Email',
    profile_label_university: 'University', profile_label_programme: 'Study programme',
    profile_label_matrikel: 'Matrikel number', profile_save_btn: '💾 Save changes',
    settings_appearance: 'Appearance', settings_dark_mode: 'Dark mode',
    settings_language: 'Language', settings_ai_section: 'AI Assistant',
    settings_auto_open: 'Auto-open on text select', settings_save_chat: 'Save chat history per PDF',
    settings_notifications: 'Notifications', settings_sync_alerts: 'Lecture note sync alerts',
    settings_mail_alerts: 'New mail alerts', settings_data: 'Data',
    settings_clear_chat: 'Clear all AI chat history', settings_clear_btn: 'Clear history',
    settings_account: 'Account', settings_signout: 'Sign out of StudySphere',
    settings_logout_btn: 'Log out',
    ln_title: '🎬 Lecture Notes', ln_sync_btn: 'Sync from Extension',
    sb_subjects: '📚 Subjects', sb_timetable: '🗓️ Timetable', sb_mails: '✉️ Mails',
    sb_back: '← All subjects', back_btn: '← Back',
    welcome_title: 'Select a file to read',
    welcome_sub: 'Open a subject in the sidebar and click any file — it loads here as a real document.',
    welcome_hint: '💡 Select any text or formula → AI automatically asks if you need help',
    pdf_fit: 'Fit', pdf_single: 'Single page', pdf_download: '⬇ Download',
    ai_ready: 'Ready to help',
    chip_summarise: '✨ Summarise', chip_formulas: '🔢 Formulas', chip_quiz: '📝 Quiz me',
    chip_keyideas: '💡 Key ideas', chip_analogy: '🔗 Analogy',
    depth_label: 'Depth:', chip_brief: 'Brief', chip_standard: 'Standard', chip_thorough: 'In-depth',
    level_label: 'Level:', chip_easy: 'Easy', chip_medium: 'Medium', chip_hard: 'Hard',
    stop_btn: '⏹ Stop generating', ai_placeholder: 'Ask anything about this document…'
  },
  de: {
    nav_home: 'Startseite', nav_profile: 'Profil', nav_settings: 'Einstellungen', nav_subscription: 'Abonnement',
    auth_email_label: 'E-Mail', auth_password_label: 'Passwort', auth_confirm_label: 'Passwort bestätigen',
    auth_title_signin: 'Bei deinem Konto anmelden', auth_title_signup: 'Konto erstellen',
    auth_submit_signin: 'Anmelden', auth_submit_signup: 'Konto erstellen',
    auth_google_btn: 'Mit Google fortfahren',
    auth_stay: 'Angemeldet bleiben', auth_stay_timeout: '(30 Min. Timeout)',
    auth_switch_signin: 'Kein Konto? Registrieren', auth_switch_signup: 'Bereits ein Konto? Anmelden',
    ob_step1: 'Profil einrichten — Schritt 1 von 2', ob_step2: 'Fast geschafft — Schritt 2 von 2',
    ob_first_name: 'Vorname', ob_last_name: 'Nachname', ob_age: 'Alter', ob_email: 'TU-Mail',
    ob_programme: 'Studiengang', ob_semester: 'Semester', ob_matrikel: 'Matrikelnummer',
    ob_continue_btn: 'Weiter →', ob_back_btn: '← Zurück', ob_finish_btn: "🎓 Los geht's!",
    settings_save_btn: 'Änderungen speichern',
    card_studip_desc: 'Kurse & Materialien', card_mail_desc: 'Outlook Web-Zugang',
    card_connect_desc: 'Prüfungen & Noten', card_timetable_name: 'Stundenplan',
    card_timetable_desc: 'Semesterplan', card_cert_name: 'Zertifikate',
    card_cert_desc: 'Immatrikulationsdokumente',
    profile_label_name: 'Vollständiger Name', profile_label_email: 'E-Mail',
    profile_label_university: 'Universität', profile_label_programme: 'Studiengang',
    profile_label_matrikel: 'Matrikelnummer', profile_save_btn: '💾 Änderungen speichern',
    settings_appearance: 'Erscheinungsbild', settings_dark_mode: 'Dunkelmodus',
    settings_language: 'Sprache', settings_ai_section: 'KI-Assistent',
    settings_auto_open: 'Automatisch bei Textauswahl öffnen', settings_save_chat: 'Chatverlauf pro PDF speichern',
    settings_notifications: 'Benachrichtigungen', settings_sync_alerts: 'Vorlesungsnotiz-Synchronisierung',
    settings_mail_alerts: 'Neue E-Mail-Benachrichtigungen', settings_data: 'Daten',
    settings_clear_chat: 'Gesamten KI-Chatverlauf löschen', settings_clear_btn: 'Verlauf löschen',
    settings_account: 'Konto', settings_signout: 'Von StudySphere abmelden',
    settings_logout_btn: 'Abmelden',
    ln_title: '🎬 Vorlesungsnotizen', ln_sync_btn: 'Von Erweiterung synchronisieren',
    sb_subjects: '📚 Fächer', sb_timetable: '🗓️ Stundenplan', sb_mails: '✉️ E-Mails',
    sb_back: '← Alle Fächer', back_btn: '← Zurück',
    welcome_title: 'Datei auswählen',
    welcome_sub: 'Öffne ein Fach in der Seitenleiste und klicke auf eine Datei — sie wird hier als Dokument angezeigt.',
    welcome_hint: '💡 Markiere Text oder eine Formel → KI fragt automatisch, ob du Hilfe brauchst',
    pdf_fit: 'Anpassen', pdf_single: 'Einzelseite', pdf_download: '⬇ Herunterladen',
    ai_ready: 'Bereit zu helfen',
    chip_summarise: '✨ Zusammenfassen', chip_formulas: '🔢 Formeln', chip_quiz: '📝 Quiz',
    chip_keyideas: '💡 Kernideen', chip_analogy: '🔗 Analogie',
    depth_label: 'Tiefe:', chip_brief: 'Kurz', chip_standard: 'Standard', chip_thorough: 'Ausführlich',
    level_label: 'Niveau:', chip_easy: 'Einfach', chip_medium: 'Mittel', chip_hard: 'Schwer',
    stop_btn: '⏹ Stopp', ai_placeholder: 'Stelle eine Frage zu diesem Dokument…'
  }
};

function applyLanguage(lang) {
  _lang = (lang === 'de') ? 'de' : 'en';
  localStorage.setItem('ss_lang', _lang);
  var t = _translations[_lang];
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-ph');
    if (t[key] !== undefined) el.placeholder = t[key];
  });
  var langSel = document.getElementById('settingsLanguage');
  if (langSel) langSel.value = _lang;
  // Re-translate dynamic auth modal text
  if (typeof _authMode !== 'undefined' && typeof _setAuthMode === 'function') _setAuthMode(_authMode);
  // Re-translate onboarding step subtitle
  var obSub = document.getElementById('obSub');
  if (obSub) obSub.textContent = t[obSub.getAttribute('data-i18n')] || obSub.textContent;
  // Translate save settings button
  var ssb = document.getElementById('saveSettingsBtn');
  if (ssb) ssb.textContent = t.settings_save_btn || ssb.textContent;
}

function applySettings(s) {
  {
    // Dark mode is controlled by sessionStorage only, not DB
    var dm = document.getElementById('settingsDarkMode');
    if (dm) dm.checked = nightOn;
  }
  if (typeof s.auto_open_ai === 'boolean') {
    var ao = document.getElementById('settingsAutoOpen');
    if (ao) { ao.checked = s.auto_open_ai; _autoOpenEnabled = s.auto_open_ai; }
  }
  if (typeof s.save_chat_history === 'boolean') {
    var sc = document.getElementById('settingsSaveChat');
    if (sc) { sc.checked = s.save_chat_history; _saveChatEnabled = s.save_chat_history; }
  }
  if (s.language) applyLanguage(s.language);
}

function applySubscription(sub) {
  var badge = document.querySelector('.sub-badge');
  var currentBtn = document.querySelector('.sub-btn-current');
  if (badge) badge.textContent = sub.plan === 'pro' ? '⭐ Pro Plan' : '🎓 Free Plan';
  if (currentBtn) currentBtn.textContent = sub.plan === 'pro' ? '✓ Current plan' : 'Current plan';
}

// ── SAVE HELPERS ─────────────────────────────────────────────────────────
async function saveProfile() {
  if (!_currentUser) { showToast('⚠️ Sign in to save', ''); return; }
  var data = {
    id: _currentUser.id,
    full_name: (document.getElementById('profileName') || {}).value || '',
    email: (document.getElementById('profileEmail') || {}).value || '',
    university: (document.getElementById('profileUniversity') || {}).value || '',
    programme: (document.getElementById('profileProgramme') || {}).value || '',
    matrikel: (document.getElementById('profileMatrikel') || {}).value || '',
    updated_at: new Date().toISOString()
  };
  try {
    await _sb.from('profiles').upsert(data);
    showToast('✅ Profile saved', 'Saved to your account');
    // Update local cache so data persists across page loads
    try { localStorage.setItem('profile_cache_' + _currentUser.id, JSON.stringify(data)); } catch(e) {}
    var init = document.getElementById('profileInitial');
    if (init && data.full_name) init.textContent = data.full_name.charAt(0).toUpperCase();
    updateAuthIndicator(_currentUser);
  } catch(e) {
    showToast('❌ Save failed', String(e));
  }
}

async function saveSettings(patch) {
  if (!_currentUser) return;
  var data = Object.assign({ id: _currentUser.id, updated_at: new Date().toISOString() }, patch);
  var result = await _sb.from('settings').upsert(data);
  if (result && result.error) console.error('saveSettings error:', result.error);
}

// ── SETTINGS ──────────────────────────────────────────────────────────────

var _autoOpenEnabled = true;
var _saveChatEnabled = true;

// 0. Language
var settingsLanguage = document.getElementById('settingsLanguage');
if (settingsLanguage) {
  settingsLanguage.value = _lang;
  settingsLanguage.addEventListener('change', function(){
    applyLanguage(this.value);
  });
}
// Apply saved language on startup
applyLanguage(_lang);

// 1. Dark mode
var dmToggle = document.getElementById('settingsDarkMode');
if (dmToggle) {
  dmToggle.checked = nightOn;
  dmToggle.addEventListener('change', function(){
    _applyTheme(this.checked, this);
  });
  document.getElementById('nightBtn').addEventListener('click', function(){
    setTimeout(function(){ if (dmToggle) dmToggle.checked = nightOn; }, 650);
  });
}

// 2. Auto-open AI on text select
var settingsAutoOpen = document.getElementById('settingsAutoOpen');
if (settingsAutoOpen) {
  settingsAutoOpen.addEventListener('change', function(){
    _autoOpenEnabled = this.checked;
  });
}
document.getElementById('pdfBody').addEventListener('mouseup', function(){
  if (!_autoOpenEnabled) {
    setTimeout(function(){
      var banner = document.getElementById('aiMsgs') && document.getElementById('aiMsgs').querySelector('.ai-sel-banner');
      if (banner) banner.remove();
      if (!aiPinned) forceCloseAI();
    }, 50);
  }
});

// 3. Save chat history
var settingsSaveChat = document.getElementById('settingsSaveChat');
if (settingsSaveChat) {
  settingsSaveChat.addEventListener('change', function(){
    _saveChatEnabled = this.checked;
  });
}
var _origDeferredSave = deferredSave;
deferredSave = function(){ if (_saveChatEnabled) _origDeferredSave(); };

// 4. Clear chat history
var dangerBtn = document.querySelector('.settings-danger-btn');
if (dangerBtn) {
  dangerBtn.addEventListener('click', function(){
    Object.keys(localStorage).filter(function(k){ return k.startsWith('ss_chat_'); })
      .forEach(function(k){ localStorage.removeItem(k); });
    if (typeof aiMsgs !== 'undefined') aiMsgs.innerHTML = '';
    if (_prevChatKey) _prevChatKey = null;
    showToast('🗑️ Chat history cleared', 'All saved chats have been removed');
  });
}

// Save Changes button
var saveSettingsBtn = document.getElementById('saveSettingsBtn');
if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', async function() {
    var lang = (document.getElementById('settingsLanguage') || {}).value || _lang;
    var autoOpen = !!(document.getElementById('settingsAutoOpen') || {}).checked;
    var saveChat = !!(document.getElementById('settingsSaveChat') || {}).checked;
    if (!saveChat) {
      Object.keys(localStorage).filter(function(k){ return k.startsWith('ss_chat_'); })
        .forEach(function(k){ localStorage.removeItem(k); });
    }
    await saveSettings({ language: lang, auto_open_ai: autoOpen, save_chat_history: saveChat });
    showToast('✅ Settings saved', 'Your preferences have been updated');
  });
}

// Logout button
var logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function(){
    // Clear all tokens and session flags
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_refresh');
    sessionStorage.removeItem('sb_sess_token');
    sessionStorage.removeItem('ss_last_active');
    sessionStorage.removeItem('ss_logged_in');
    _sbToken = null;
    _currentUser = null;
    // Hide portal
    var portal = document.getElementById('portal');
    if (portal) {
      portal.classList.remove('show');
      portal.style.display = 'none';
    }
    // Hide user indicator
    var ai = document.getElementById('authIndicator');
    if (ai) ai.style.display = 'none';
    // Reset auth form
    if (typeof _setAuthMode === 'function') _setAuthMode('signin');
    var emailEl = document.getElementById('authEmail');
    var pwEl = document.getElementById('authPassword');
    if (emailEl) emailEl.value = '';
    if (pwEl) pwEl.value = '';
    // Show login modal
    var authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'flex';
    showToast('👋 Signed out', 'See you next time!');
  });
}

// ── PROFILE SAVE ─────────────────────────────────────────────────────────
var profileSaveBtn = document.querySelector('.profile-save-btn');
if (profileSaveBtn) {
  profileSaveBtn.addEventListener('click', saveProfile);
}

// ── SUBSCRIPTION UPGRADE ─────────────────────────────────────────────────
var upgradeBtn = document.querySelector('.sub-btn-upgrade');
if (upgradeBtn) {
  upgradeBtn.addEventListener('click', function(){
    showToast('🚀 Coming soon', 'Payment integration coming soon!');
  });
}


// ── LANDING PAGE ─────────────────────────────────────────────────────────
function landShowAuth(mode) {
  (function(){var l=document.getElementById('landing');if(l)l.classList.add('hidden');})();
  var modal = document.getElementById('authModal');
  modal.style.display = 'flex';
  // Pre-set the mode
  if (mode === 'signup' && _authMode !== 'signup') {
    document.getElementById('authSwitch').click();
  } else if (mode === 'signin' && _authMode !== 'signin') {
    // already signin by default
  }
}


// ── END SS-READY ─────────────────────────────────────────────────────────────


// ── ONBOARDING ──────────────────────────────────────────────────────────────

async function _showOnboarding(email) {
  // Pre-fill email if known
  var emailField = document.getElementById('obEmail');
  if (emailField && email) emailField.value = email;
  document.getElementById('onboardModal').style.display = 'flex';
}

window._obNext = function() {
  var first = document.getElementById('obFirst').value.trim();
  var last  = document.getElementById('obLast').value.trim();
  var age   = document.getElementById('obAge').value.trim();
  var email = document.getElementById('obEmail').value.trim();
  var err   = document.getElementById('obErr1');
  if (!first || !last || !age || !email) {
    err.textContent = 'Please fill in all fields'; err.style.display = 'block'; return;
  }
  if (!email.includes('@')) {
    err.textContent = 'Please enter a valid email'; err.style.display = 'block'; return;
  }
  err.style.display = 'none';
  document.getElementById('obStep1').style.display = 'none';
  document.getElementById('obStep2').style.display = 'flex';
  document.getElementById('obProg2').style.background = 'linear-gradient(90deg,#c084fc,#f472b6)';
  document.getElementById('obTitle').textContent = 'Almost there!';
  document.getElementById('obSub').textContent = 'Your study details — step 2 of 2';
};

window._obBack = function() {
  document.getElementById('obStep2').style.display = 'none';
  document.getElementById('obStep1').style.display = 'flex';
  document.getElementById('obProg2').style.background = 'rgba(255,255,255,.12)';
  document.getElementById('obTitle').textContent = 'Welcome to StudySphere!';
  document.getElementById('obSub').textContent = "Let's set up your profile — step 1 of 2";
};

window._obFinish = async function() {
  var prog     = document.getElementById('obProg').value.trim();
  var sem      = document.getElementById('obSem').value.trim();
  var matrikel = document.getElementById('obMatrikel').value.trim();
  var err      = document.getElementById('obErr2');
  if (!prog || !sem || !matrikel) {
    err.textContent = 'Please fill in all fields'; err.style.display = 'block'; return;
  }
  err.style.display = 'none';
  var btn = document.getElementById('obFinish');
  btn.textContent = '⏳ Saving…'; btn.disabled = true;

  var first = document.getElementById('obFirst').value.trim();
  var last  = document.getElementById('obLast').value.trim();
  var age   = document.getElementById('obAge').value.trim();
  var email = document.getElementById('obEmail').value.trim();
  var fullName = first + ' ' + last;

  // Save to Supabase profiles table
  if (_currentUser) {
    try {
      await _sb.from('profiles').upsert({
        id: _currentUser.id,
        full_name: fullName,
        email: email,
        university: 'TU Braunschweig',
        programme: prog + ', ' + sem + '. Semester',
        matrikel: matrikel,
        age: parseInt(age) || null,
        updated_at: new Date().toISOString()
      });
    } catch(e) { console.warn('Profile save error:', e); }
    // Always cache profile locally so the profile page loads even if Supabase upsert failed
    try {
      localStorage.setItem('profile_cache_' + _currentUser.id, JSON.stringify({
        full_name: fullName,
        email: email,
        university: 'TU Braunschweig',
        programme: prog + ', ' + sem + '. Semester',
        matrikel: matrikel
      }));
    } catch(e) {}
  }

  // Update profile UI fields
  var pName = document.getElementById('profileName');
  var pEmail = document.getElementById('profileEmail');
  var pUni = document.getElementById('profileUniversity');
  var pProg = document.getElementById('profileProgramme');
  var pMat = document.getElementById('profileMatrikel');
  var pInit = document.getElementById('profileInitial');
  if (pName) pName.value = fullName;
  if (pEmail) pEmail.value = email;
  if (pUni) pUni.value = 'TU Braunschweig';
  if (pProg) pProg.value = prog + ', ' + sem + '. Semester';
  if (pMat) pMat.value = matrikel;
  if (pInit) pInit.textContent = fullName.charAt(0).toUpperCase();

  // Update auth indicator
  if (typeof updateAuthIndicator === 'function' && _currentUser) updateAuthIndicator(_currentUser);

  // Mark onboarding done
  localStorage.setItem('ob_done_' + (_currentUser ? _currentUser.id : 'u'), '1');

  // Hide modal and enter app
  document.getElementById('onboardModal').style.display = 'none';
};





