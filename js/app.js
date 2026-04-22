// StudySphere app.js — build 1774335018 — async fixes

var PDF_DATA = {
  'Aufgabe_1_3.pdf': 'assets/Aufgabe_1_3.pdf'
};

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';


// Pull-to-refresh (touch devices)
(function(){
  var THRESHOLD=80;
  var startY=0,curY=0,active=false;

  var ind=document.createElement('div');
  ind.id='ptr-indicator';
  ind.innerHTML='<svg id="ptr-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="4" x2="12" y2="20"/><polyline points="18 14 12 20 6 14"/></svg>';
  ind.style.cssText='position:fixed;top:-50px;left:50%;transform:translateX(-50%);width:32px;height:32px;border-radius:50%;background:rgba(20,15,40,.88);box-shadow:0 2px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:9999;transition:top .15s ease,opacity .15s ease;opacity:0;color:#fff;pointer-events:none';
  document.body.appendChild(ind);

  var arrow=ind.querySelector('#ptr-arrow');

  function setProgress(dy){
    var p=Math.min(dy/THRESHOLD,1);
    var top=Math.min(-60+dy*0.9,16);
    ind.style.top=top+'px';
    ind.style.opacity=p;
    arrow.style.transform='rotate('+(-180+180*p)+'deg)';
    arrow.style.transition='transform .1s';
  }

  function reset(){
    ind.style.top='-60px';
    ind.style.opacity='0';
    arrow.style.transform='rotate(0deg)';
  }

  document.addEventListener('touchstart',function(e){
    startY=e.touches[0].clientY;
    active=true;
  },{passive:true});

  document.addEventListener('touchmove',function(e){
    if(!active)return;
    curY=e.touches[0].clientY;
    var dy=curY-startY;
    if(dy>0) setProgress(dy);
  },{passive:true});

  document.addEventListener('touchend',function(){
    if(!active)return;
    active=false;
    var dy=curY-startY;
    if(dy>=THRESHOLD){
      arrow.style.transition='transform .4s';
      arrow.style.transform='rotate(360deg)';
      ind.style.top='16px';
      setTimeout(function(){location.reload();},400);
    } else {
      reset();
    }
  },{passive:true});
})();

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



// ── FILES VIEW HELPERS ────────────────────────────────────────────────────
function _showFilesView(){
  var portal=document.getElementById('portal');
  if(portal){portal.classList.add('show');portal.style.display='block';portal.style.opacity='1';portal.style.pointerEvents='auto';}
  var ms=document.querySelector('#portal .main-scroll');
  if(ms) ms.style.display='none';
  var app=document.getElementById('app');
  if(app) app.style.display='flex';
  var fab=document.getElementById('addWidgetFab');
  if(fab) fab.classList.remove('visible');
  var back=document.getElementById('goPortal');
  if(back) back.style.display='';
  var title=document.getElementById('topTitle');
  if(title) title.style.display='none';
  var crumb=document.getElementById('breadcrumb');
  if(crumb) crumb.style.display='';
  var stBtn=document.getElementById('studyTechBtn');
  if(stBtn) stBtn.style.display='flex';
  var stMini=document.getElementById('stMiniTimer');
  if(stMini) stMini.style.display=_stRunning?'flex':'none';
}
function _hideFilesView(){
  var ms=document.querySelector('#portal .main-scroll');
  if(ms) ms.style.display='';
  var app=document.getElementById('app');
  if(app) app.style.display='none';
  var back=document.getElementById('goPortal');
  if(back) back.style.display='none';
  var title=document.getElementById('topTitle');
  if(title) title.style.display='';
  var crumb=document.getElementById('breadcrumb');
  if(crumb) crumb.style.display='none';
  var stBtn=document.getElementById('studyTechBtn');
  if(stBtn) stBtn.style.display='none';
  var stMini=document.getElementById('stMiniTimer');
  if(stMini) stMini.style.display='none';
}

// ── FUNCTIONS HOISTED TO GLOBAL SCOPE ─────────────────────────────────────
function showStudip(){
  _hideFilesView();
  var portal=document.getElementById('portal');
  if(portal){portal.classList.add('show');portal.style.display='block';}
  setNavActive('pcStudip');
  showPortalSection('studip');
  sdRenderCourses();
  try{var _sst=JSON.parse(localStorage.getItem('ss_state')||'{}');_sst.view='studip';_sst.inApp=false;localStorage.setItem('ss_state',JSON.stringify(_sst));}catch(e){}
}

function showPortal(){
  if(typeof window._statsStopFile==='function')window._statsStopFile();
  _hideFilesView();
  var portal=document.getElementById('portal');
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
    portal.style.zIndex=''; portal.style.opacity=''; portal.style.transition=''; portal.style.transform='';
    portal.style.display='block';
    try{var st=JSON.parse(localStorage.getItem('ss_state')||'{}');st.inApp=false;st.view='';localStorage.setItem('ss_state',JSON.stringify(st));}catch(e){}
  }, 500);
}

function hideStudip(){
  // Navigate into a course from Stud.IP — show files view within portal
  _showFilesView();
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
  // Update topbar title
  var _titles = {dashboard:'Dashboard',notes:'Lecture Notes',profile:'Profile',settings:'Settings',subscription:'Subscription',studip:'Courses',chat:'Chat',notifications:'Notifications',games:'Games',lounge:'Study Lounge',aipage:'Chatbot',german:'Practice'};
  var tt = document.getElementById('topTitle');
  if (tt) tt.textContent = _titles[sec] || sec;
  // FAB only visible on dashboard
  var _fab = document.getElementById('addWidgetFab');
  if (_fab) _fab.classList.toggle('visible', sec === 'dashboard');
}

function openSB(){}
function closeSB(){}

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
    var appEl = document.getElementById('app');
    if(!appEl || appEl.style.display !== 'flex') return; // only save when files view is active
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

var _stateRestored=false;
function restoreState(){
  if(_stateRestored)return; _stateRestored=true;
  try{
    var raw=localStorage.getItem('ss_state');
    if(!raw) return;
    var st=JSON.parse(raw);
    // Only restore app state if user was in the app (not portal)
    if(!st.inApp) return;

    if(st.view === 'studip') { showStudip(); return; }

    _showFilesView();
    setNavActive('pcStudip');

    // Night mode is controlled by Supabase settings, not localStorage

    // Semester
    if(st.semId && SEMS[st.semId]){
      activeSemId=st.semId;
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
          if(!course.files)course.files=[];
          _panelHide(document.getElementById('welcomeState'));
          _panelShow(document.getElementById('courseOverview'));
          document.getElementById('breadcrumb').innerHTML='<b>'+course.name+'</b>';
          renderCourses();
          var _restSec=st.section||'files';
          var _restFile=st.fileName;
          // Load uploaded files from Supabase then restore section/file
          _ufMerge(course).then(function(){
            showCourseSection(course, _restSec);
            if(_restFile){
              var f=course.files.find(function(x){return x.name===_restFile;});
              if(f){ openFile(f, course); }
            }
          }).catch(function(){
            showCourseSection(course, _restSec);
          });
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
  var cl=document.getElementById('courseList');if(!cl)return;cl.innerHTML='';
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
        document.getElementById('breadcrumb').innerHTML='Courses';
        renderCourses();closeSB();
      } else {
        _cameFromStudip=false;
        openCourse(c);
      }
    });
    wrap.appendChild(row);cl.appendChild(wrap);
  });
}

function renderTT(){ /* removed — timetable no longer used */ }

function renderMails(){ /* removed — Stud.IP mail no longer used */ }

function sdRenderCourses(){
  var cl=document.getElementById('sdCourseList');if(!cl)return;cl.innerHTML='';
  var sem=SEMS[sdActiveSemId];if(!sem)return;
  if(!sem.courses.length){
    cl.innerHTML='<div style="padding:32px;text-align:center;opacity:.5;font-size:.9rem">No subjects added yet.<br>Use the search bar above to add your courses.</div>';
    return;
  }
  sem.courses.forEach(function(c,i){
    var col=COLORS[i%COLORS.length];
    var card=document.createElement('div');card.className='sd-course-card';
    card.style.position='relative';
    card.innerHTML='<div class="sd-course-bar" style="background:'+col+'"></div>'+
      '<div class="sd-course-name">'+c.name+'</div>'+
      '<div class="sd-course-meta">'+c.meta+'</div>'+
      '<div class="sd-course-badge">'+c.files.length+' file'+(c.files.length!==1?'s':'')+'</div>'+
      '<button class="sd-del-btn" title="Remove" style="position:absolute;top:8px;right:8px;background:rgba(255,100,100,.15);border:none;color:rgba(255,120,120,.8);border-radius:6px;padding:2px 7px;cursor:pointer;font-size:.8rem;line-height:1">✕</button>';
    card.querySelector('.sd-del-btn').addEventListener('click',function(e){
      e.stopPropagation();
      SEMS[sdActiveSemId].courses.splice(i,1);
      _saveUserCourses();
      sdRenderCourses();
    });
    card.addEventListener('click',function(){
      hideStudip();
      _cameFromStudip=true;
      activeSemId=sdActiveSemId;
      renderCourses();
      openCourse(c);
    });
    cl.appendChild(card);
  });
}

// ── Course uploaded files — Supabase Storage ─────────────────────────────
// Bucket: "course-uploads"  (create in Supabase dashboard → Storage)
// Path:   <uid>/<courseKey>/<filename>
// RLS:    authenticated users can read/write/delete their own folder only.
var _UF_BUCKET = 'course-uploads';

function _ufKey(course){return (course.id||course.short||course.name).replace(/[^a-zA-Z0-9_-]/g,'_');}

function _ufStoragePath(uid,course,name){
  var encoded=encodeURIComponent(name);
  // For non-ASCII filenames (e.g. ü, ö), Supabase rejects the decoded key.
  // Double-encode % so the encoded string itself becomes the storage key (all ASCII).
  if(/[^\x00-\x7F]/.test(name)) encoded=encoded.replace(/%/g,'%25');
  return uid+'/'+_ufKey(course)+'/'+encoded;
}

// Upload one file with XHR so we get progress events
// onProgress(pct 0-100) is called as data uploads
function _ufUpload(uid,course,file,onProgress){
  return new Promise(function(resolve,reject){
    var path=_ufStoragePath(uid,course,file.name);
    var url=SUPA_URL+'/storage/v1/object/'+_UF_BUCKET+'/'+path;
    var xhr=new XMLHttpRequest();
    xhr.open('POST',url);
    xhr.setRequestHeader('apikey',SUPA_KEY);
    xhr.setRequestHeader('Authorization','Bearer '+(_sbToken||SUPA_KEY));
    xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');
    xhr.setRequestHeader('x-upsert','true');
    if(onProgress){
      xhr.upload.addEventListener('progress',function(e){
        if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100));
      });
    }
    xhr.onload=function(){
      if(xhr.status>=200&&xhr.status<300)resolve();
      else{ console.error('Upload failed',xhr.status,xhr.responseText); reject(new Error('Upload failed: '+xhr.status+' '+xhr.responseText)); }
    };
    xhr.onerror=function(){reject(new Error('Network error'));};
    xhr.send(file);
  });
}

// List files for user+course from Supabase Storage
async function _ufList(uid,course){
  var prefix=uid+'/'+_ufKey(course)+'/';
  var r=await fetch(SUPA_URL+'/storage/v1/object/list/'+_UF_BUCKET,{
    method:'POST',
    headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+(_sbToken||SUPA_KEY),'Content-Type':'application/json'},
    body:JSON.stringify({prefix:prefix,limit:200,offset:0})
  });
  if(!r.ok)return[];
  var items=await r.json();
  return Array.isArray(items)?items:[];
}

// Fetch an uploaded file's bytes directly using the authenticated endpoint
async function _ufFetchBytes(uid,course,name){
  var path=_ufStoragePath(uid,course,name);
  var url=SUPA_URL+'/storage/v1/object/authenticated/'+_UF_BUCKET+'/'+path;
  var r=await fetch(url,{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+(_sbToken||SUPA_KEY)}});
  if(!r.ok)throw new Error('Storage fetch failed: '+r.status);
  return new Uint8Array(await r.arrayBuffer());
}

// Delete one file from Supabase Storage
async function _ufDeleteRemote(uid,course,name){
  var path=_ufStoragePath(uid,course,name);
  await fetch(SUPA_URL+'/storage/v1/object/'+_UF_BUCKET+'/'+path,{
    method:'DELETE',
    headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+(_sbToken||SUPA_KEY)}
  });
}

// Merge remote file list into course.files (called on openCourse)
async function _ufMerge(course){
  var uid=_currentUser&&(_currentUser.id||_currentUser.sub);
  if(!uid)return;
  var items=await _ufList(uid,course);
  items.forEach(function(item){
    var fname=decodeURIComponent(item.name||'');
    if(!fname||fname.endsWith('/'))return;
    var meta=item.metadata||{};
    var size=meta.size?
      (meta.size>1048576?(meta.size/1048576).toFixed(1)+' MB':meta.size>1024?(meta.size/1024).toFixed(0)+' KB':meta.size+' B')
      :'';
    var date=item.updated_at?new Date(item.updated_at).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
    if(!course.files.find(function(f){return f.name===fname&&f._uploaded;})){
      course.files.unshift({name:fname,size:size,date:date,_uploaded:true,_uid:uid,_course:course});
    }
  });
}

// Delete — removes from Supabase and from course.files in memory
function _ufDelete(course,name){
  var uid=_currentUser&&(_currentUser.id||_currentUser.sub);
  if(uid)_ufDeleteRemote(uid,course,name);
  course.files=course.files.filter(function(f){return !(f.name===name&&f._uploaded);});
}

function openCourse(course){
  if(!course.files)course.files=[];
  activeCourseId=course.id;activeFileName=null;
  var ws=document.getElementById('welcomeState');
  var pv=document.getElementById('pdfView');
  var co=document.getElementById('courseOverview');
  ws.style.display='none'; pv.style.display='none';
  document.getElementById('breadcrumb').innerHTML='<b>'+course.name+'</b>';
  co.style.display = 'block';
  showCourseSection(course,'files');
  _setAiChipsVisible(false);
  closeSB();renderCourses();
  // Load uploaded files from Supabase Storage asynchronously and refresh list
  _ufMerge(course).then(function(){
    course.files=course.files.filter(function(f){return !f._uploaded;});
    return _ufMerge(course);
  }).then(function(){
    showCourseSection(course,'files');
  }).catch(function(){});
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
  activeFileName=f.name;currentCourseShort=course.short;activeCourseRef=course;
  if(typeof window._statsTrackFile==='function')window._statsTrackFile(f.name,course.short||course.name||'');
  _panelHide(document.getElementById('welcomeState'));
  _panelHide(document.getElementById('courseOverview'));
  var pv=document.getElementById('pdfView');
  _panelShow(pv, true);
  document.getElementById('pdfFileName').textContent=f.name;
  document.getElementById('breadcrumb').innerHTML=course.short+' › <b>'+f.name+'</b>';
  document.getElementById('aiFileLabel').textContent=f.name;
  _setAiChipsVisible(true);
  renderCourses();
  if(f._uploaded){
    document.getElementById('pdfBody').innerHTML='<div class="pdf-loading"><div class="loading-dots"><span></span><span></span><span></span></div><p>Loading PDF…</p></div>';
    var uid=_currentUser&&(_currentUser.id||_currentUser.sub);
    _ufFetchBytes(uid,f._course||course,f.name).then(function(bytes){
      return pdfjsLib.getDocument({data:bytes,cMapUrl:'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',cMapPacked:true}).promise;
    }).then(function(pdf){
      pdfDoc=pdf;pdfTotal=pdf.numPages;pdfPage=1;pdfShowAll=false;pdfFullText='';
      updatePageInfo();updateZoomPct();
      document.getElementById('pdfAll').textContent='All pages';
      renderPages();
      setTimeout(function(){
        var tp=[];
        for(var pi=1;pi<=pdf.numPages;pi++){
          tp.push(pdf.getPage(pi).then(function(pg){return pg.getTextContent().then(function(tc){return tc.items.map(function(i){return i.str;}).join(' ');});}));
        }
        Promise.all(tp).then(function(pages){pdfFullText=pages.join('\n');if(typeof loadChatForFile==='function')loadChatForFile(f.name);});
      },400);
    }).catch(function(e){document.getElementById('pdfBody').innerHTML='<div style="color:#fff;padding:40px;text-align:center">❌ Could not load file: '+e.message+'</div>';});
    return;
  }
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
      updatePageInfo();updateZoomPct();
      document.getElementById('pdfAll').textContent='All pages';
      renderPages();
      // Defer text extraction until after page 1 renders to avoid overloading the pdf.js worker simultaneously
      setTimeout(function(){
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
      },800);
    })
    .catch(function(e){
      document.getElementById('pdfBody').innerHTML='<div style="color:#fff;padding:40px">Error: '+e.message+'</div>';
    });
  }, function(e){
    document.getElementById('pdfBody').innerHTML='<div style="color:#fff;padding:40px">Error loading PDF: '+e.message+'</div>';
  });
}

function showCourseSection(course,section){
  section='files'; // only section remaining
  activeCourseRef=course;activeCourseSection=section;
  activeFileName=null;
  document.getElementById('pdfView').style.display='none';
  document.getElementById('welcomeState').style.display='none';
  var co=document.getElementById('courseOverview');
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
        var icon=f._uploaded?'📎':f.name.includes('Lösung')?'✅':f.name.includes('Aufgabe')?'📋':'📊';
        var delBtn=f._uploaded?'<span class="co-del-btn" data-fname="'+f.name+'" title="Delete uploaded file" style="margin-left:6px;font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(239,68,68,.12);color:rgba(239,68,68,.85);border:1px solid rgba(239,68,68,.25);cursor:pointer;flex-shrink:0">🗑</span>':'';
        return '<div class="co-file'+(f._uploaded?' co-file-uploaded':'')+'" data-fname="'+f.name+'">'+
          '<div class="co-file-cb" data-fname="'+f.name+'"></div>'+
          '<span class="co-file-icon">'+icon+'</span>'+
          '<div style="flex:1;min-width:0"><div class="co-file-name">'+f.name+'</div>'+
          '<div class="co-file-meta">'+f.size+' · '+f.date+'</div></div>'+
          '<span class="co-open-btn" style="font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(192,132,252,.18);color:rgba(192,132,252,.9);border:1px solid rgba(192,132,252,.3);cursor:pointer;flex-shrink:0">Open</span>'+
          (f._uploaded?delBtn:'<span class="co-dl-btn" data-fname="'+f.name+'" title="Download" style="margin-left:6px;font-size:.69rem;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(6,214,160,.15);color:rgba(6,214,160,.9);border:1px solid rgba(6,214,160,.3);cursor:pointer;flex-shrink:0">⬇</span>')+
        '</div>';
      }).join('');
      return '<div class="co-files-toolbar">'+
        '<button class="co-select-toggle" id="coSelectToggle">☑ Select multiple</button>'+
        '<input type="file" id="coUploadInput" accept=".pdf,.doc,.docx,.txt,image/*" multiple style="display:none">'+
        '<label class="co-upload-btn" for="coUploadInput">'+
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>'+
          ' Upload files'+
        '</label>'+
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

  // Build content first, animate the inner card after
  co.style.display='block';
  co.innerHTML='<div class="co-inner">'+
    '<div class="co-logo">📚 StudySphere</div>'+
    '<p class="co-tag">'+course.name+' · '+course.meta+'</p>'+
    '<div class="co-card" style="margin-top:0">'+buildContent()+'</div>'+
    '</div>';
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

  // ── Delete uploaded file ───────────────────────────────────────────────
  co.querySelectorAll('.co-del-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var fname=btn.getAttribute('data-fname');
      if(!confirm('Delete "'+fname+'" from this course?'))return;
      _ufDelete(course,fname);
      showCourseSection(course,'files');
    });
  });

  // ── Upload files ───────────────────────────────────────────────────────
  var uploadInput=co.querySelector('#coUploadInput');
  if(uploadInput){
    uploadInput.addEventListener('change',function(){
      var files=Array.from(this.files||[]);
      if(!files.length)return;
      var uid=_currentUser&&(_currentUser.id||_currentUser.sub);
      if(!uid){showToast('Not signed in','Sign in to upload files.');return;}
      // Show progress bar
      var toolbar=co.querySelector('.co-files-toolbar');
      var progWrap=document.createElement('div');
      progWrap.className='co-upload-progress';
      progWrap.innerHTML='<div class="co-upload-progress-label"><span id="coProgLabel">Uploading 0 / '+files.length+'…</span><span id="coProgPct">0%</span></div>'+
        '<div class="co-upload-progress-track"><div class="co-upload-progress-bar" id="coProgBar" style="width:0%"></div></div>';
      if(toolbar)toolbar.appendChild(progWrap);
      var completed=0;
      var totalPct=new Array(files.length).fill(0);
      function updateProgress(i,pct){
        totalPct[i]=pct;
        var avg=Math.round(totalPct.reduce(function(a,b){return a+b;},0)/files.length);
        var bar=co.querySelector('#coProgBar');
        var label=co.querySelector('#coProgLabel');
        var pctEl=co.querySelector('#coProgPct');
        if(bar)bar.style.width=avg+'%';
        if(pctEl)pctEl.textContent=avg+'%';
        if(label)label.textContent='Uploading '+completed+' / '+files.length+'…';
      }
      Promise.all(files.map(function(file,i){
        return _ufUpload(uid,course,file,function(pct){updateProgress(i,pct);}).then(function(){completed++;updateProgress(i,100);});
      }))
        .then(function(){
          if(progWrap.parentNode)progWrap.parentNode.removeChild(progWrap);
          course.files=course.files.filter(function(f){return !f._uploaded;});
          return _ufMerge(course);
        })
        .then(function(){
          showCourseSection(course,'files');
          showToast('Files uploaded',''+files.length+' file'+(files.length>1?'s':'')+' added to '+course.short);
        })
        .catch(function(e){
          if(progWrap.parentNode)progWrap.parentNode.removeChild(progWrap);
          showToast('Upload failed',e.message||'Please try again.');
        });
      this.value='';
    });
  }
}

var LN_CACHE_KEY = 'ss_ln_cache';

function lnSaveToLocalCache(notes) {
  try { localStorage.setItem(LN_CACHE_KEY, JSON.stringify(notes)); } catch(e) {}
}

function lnLoadFromLocalCache() {
  try { return JSON.parse(localStorage.getItem(LN_CACHE_KEY) || '[]'); } catch(e) { return []; }
}

async function lnLoadFromSupabase(uid) {
  if (!uid) return;

  // Immediately show cached notes so the page isn't blank
  var cached = lnLoadFromLocalCache();
  if (cached.length) lnRender(cached);

  try {
    var r = await fetch(
      SUPA_URL + '/rest/v1/lecture_notes?select=*&user_id=eq.' + encodeURIComponent(uid) + '&order=date.desc',
      { headers: _sbHeaders() }
    );
    if (!r.ok) return;
    var rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) {
      // Supabase empty — persist any in-memory notes (from extension) to Supabase and cache
      if (lnSummaries.length) {
        lnSaveToLocalCache(lnSummaries);
        lnSummaries.forEach(function(n) { if (n.id) lnSaveNoteToSupabase(n); });
      }
      return;
    }
    var dbNotes = rows.map(function(row) {
      return { id: row.id, title: row.title, text: row.content, date: row.date, url: row.url || '' };
    });
    var inMemoryOnly = lnSummaries.filter(function(n) {
      return !n.id || !dbNotes.find(function(d) { return d.id === n.id; });
    });
    var merged = dbNotes.concat(inMemoryOnly);
    merged.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    lnRender(merged);
    lnSaveToLocalCache(merged);
    inMemoryOnly.forEach(function(n) { if (n.id) lnSaveNoteToSupabase(n); });
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
  ws2526:{color:'#06D6A0',courses:[]},
  ss25:{color:'#9B5DE5',courses:[]},
  ws2425:{color:'#FF6FB7',courses:[]},
  ss24:{color:'#4CC9F0',courses:[]},
  ws2324:{color:'#FF6B35',courses:[]}
};
// Load user courses from localStorage
(function(){
  try{
    var saved=JSON.parse(localStorage.getItem('ss_user_courses')||'{}');
    Object.keys(saved).forEach(function(sid){ if(SEMS[sid]) SEMS[sid].courses=saved[sid]; });
  }catch(e){}
})();
function _saveUserCourses(){
  var data={};
  Object.keys(SEMS).forEach(function(sid){ data[sid]=SEMS[sid].courses; });
  localStorage.setItem('ss_user_courses',JSON.stringify(data));
  // Also persist to Supabase so courses sync across devices
  var uid=_currentUser&&(_currentUser.id||_currentUser.sub);
  if(uid){
    fetch(SUPA_URL+'/rest/v1/profiles?id=eq.'+encodeURIComponent(uid),{
      method:'PATCH',
      headers:Object.assign(_sbHeaders(),{'Prefer':'return=minimal'}),
      body:JSON.stringify({courses:data})
    }).catch(function(e){console.warn('[courses] save failed',e);});
  }
}

function _loadUserCourses(data){
  if(!data||typeof data!=='object')return;
  Object.keys(data).forEach(function(sid){
    if(SEMS[sid]&&Array.isArray(data[sid])){
      // Ensure each course has a files array
      data[sid].forEach(function(c){if(!c.files)c.files=[];});
      SEMS[sid].courses=data[sid];
    }
  });
  // Persist to localStorage as cache
  try{localStorage.setItem('ss_user_courses',JSON.stringify(data));}catch(e){}
  sdRenderCourses();
  restoreState();
}

// Predefined subject list — TU Braunschweig BSc Maschinenbau + common subjects
// Vertiefung (Fachprofil) track names
var VERTIEFUNG_LIST=[
  'Modellierung und Simulation',
  'Mechanik und Festigkeit',
  'Werkstoffe',
  'Konstruktion',
  'Energie- und Verfahrenstechnik',
  'Fahrzeugtechnik',
  'Luft- und Raumfahrttechnik',
  'Materialwissenschaften',
  'Mechatronik',
  'Produktion, Automation und Systeme'
];

// User's chosen Vertiefung — loaded from localStorage on startup
var _userVertiefung = localStorage.getItem('ss_vertiefung') || '';

var SUBJECT_LIST=[
  // Grundlagen (always shown regardless of Vertiefung)
  {name:'Faszination Maschinenbau',short:'FaszMB',cat:'grundlagen'},
  {name:'Ingenieurmathematik A',short:'IMA',cat:'grundlagen'},
  {name:'Ingenieurmathematik B',short:'IMB',cat:'grundlagen'},
  {name:'Digitale Werkzeuge',short:'DigWZ',cat:'grundlagen'},
  {name:'Einführung in die Messtechnik',short:'EiMessT',cat:'grundlagen'},
  {name:'Regelungstechnik 1',short:'RT1',cat:'grundlagen'},
  {name:'Grundlagen der Strömungsmechanik',short:'GStröM',cat:'grundlagen'},
  {name:'Technische Mechanik 1',short:'TM1',cat:'grundlagen'},
  {name:'Technische Mechanik 2',short:'TM2',cat:'grundlagen'},
  {name:'Technische Mechanik 3',short:'TM3',cat:'grundlagen'},
  {name:'Thermodynamik 1',short:'Thermo1',cat:'grundlagen'},
  {name:'Fertigungstechnik',short:'FT',cat:'grundlagen'},
  {name:'Ganzheitliches Life Cycle Management',short:'LCM',cat:'grundlagen'},
  {name:'Grundlagen des Konstruierens',short:'GdK',cat:'grundlagen'},
  {name:'Grundlagen komplexer Maschinenelemente und Antriebe',short:'GkMA',cat:'grundlagen'},
  {name:'Werkstoffwissenschaften',short:'WerkW',cat:'grundlagen'},
  {name:'Digitalisierung im Maschinenbau',short:'DigMB',cat:'allg-mb'},
  {name:'Projektarbeit',short:'PA',cat:'grundlagen'},
  {name:'Charakterisierung von Oberflächen und Schichten',short:'CharOS',cat:'grundlagen'},
  {name:'Fügetechnik',short:'FügT',cat:'grundlagen'},
  {name:'Grundlagen der Energietechnik',short:'GEnT',cat:'grundlagen'},
  {name:'Grundlagen der Fahrzeugtechnik',short:'GFT',cat:'grundlagen'},
  {name:'Grundlagen der Mechatronik und Elektronik',short:'GME',cat:'grundlagen'},
  {name:'Grundlagen der Mikrosystemtechnik',short:'GMikro',cat:'grundlagen'},
  {name:'Raumfahrttechnische Grundlagen',short:'RaumF',cat:'grundlagen'},
  // Modellierung und Simulation
  {name:'Finite-Elemente-Methoden',short:'FEM',cat:'Modellierung und Simulation'},
  {name:'Modellierung mechatronischer Systeme',short:'ModMech',cat:'Modellierung und Simulation'},
  {name:'Numerische Methoden in der Materialwissenschaft',short:'NumMat',cat:'Modellierung und Simulation'},
  {name:'Simulation of Mechatronic Systems',short:'SimMech',cat:'Modellierung und Simulation'},
  // Mechanik und Festigkeit
  {name:'Dynamik in Fallbeispielen aus der Industrie',short:'DynFB',cat:'Mechanik und Festigkeit'},
  {name:'Höhere Festigkeitslehre',short:'HFL',cat:'Mechanik und Festigkeit'},
  {name:'Maschinendynamik',short:'MaDyn',cat:'Mechanik und Festigkeit'},
  // Werkstoffe
  {name:'Chemie für die Verfahrenstechnik und Materialwissenschaften',short:'ChemVT',cat:'Werkstoffe'},
  {name:'Funktionswerkstoffe',short:'FunkW',cat:'Werkstoffe'},
  {name:'Mechanisches Verhalten der Werkstoffe',short:'MechVW',cat:'Werkstoffe'},
  {name:'Technische Schadensfälle',short:'TechSF',cat:'Werkstoffe'},
  // Konstruktion
  {name:'Akustikgerechtes Konstruieren',short:'AkustK',cat:'Konstruktion'},
  {name:'Grundlagen der Produktentwicklung und Konstruktion',short:'GPK',cat:'Konstruktion'},
  {name:'Vertiefte Methoden des Konstruierens',short:'VMK',cat:'Konstruktion'},
  // Energie- und Verfahrenstechnik
  {name:'Anlagenbau',short:'AnlB',cat:'Energie- und Verfahrenstechnik'},
  {name:'Digitalisierung in der Energie- und Verfahrenstechnik',short:'DigEVT',cat:'Energie- und Verfahrenstechnik'},
  {name:'Einführung in numerische Methoden für Ingenieure',short:'EinNumM',cat:'Energie- und Verfahrenstechnik'},
  {name:'Grundlagen der Mechanischen Verfahrenstechnik',short:'GMechVT',cat:'Energie- und Verfahrenstechnik'},
  {name:'Thermodynamik 2',short:'Thermo2',cat:'Energie- und Verfahrenstechnik'},
  {name:'Grundlagen der Strömungsmaschinen',short:'GStrömM',cat:'Energie- und Verfahrenstechnik'},
  {name:'Grundoperationen der Fluidverfahrenstechnik',short:'GrundFVT',cat:'Energie- und Verfahrenstechnik'},
  {name:'Batterien und Brennstoffzellen',short:'BattBZ',cat:'Energie- und Verfahrenstechnik'},
  {name:'Bioreaktoren und Bioprozesse',short:'BioBP',cat:'Energie- und Verfahrenstechnik'},
  {name:'Chemische Reaktionskinetik',short:'ChemRK',cat:'Energie- und Verfahrenstechnik'},
  {name:'Chemische Verfahrenstechnik',short:'ChemVT2',cat:'Energie- und Verfahrenstechnik'},
  {name:'Electrochemical Energy Engineering',short:'EcEE',cat:'Energie- und Verfahrenstechnik'},
  {name:'Elektrische Energietechnik',short:'EET',cat:'Energie- und Verfahrenstechnik'},
  {name:'Grundlagen der Umweltschutztechnik',short:'GUT',cat:'Energie- und Verfahrenstechnik'},
  // Fahrzeugtechnik
  {name:'Digitalisierung in der Fahrzeugtechnik',short:'DigFT',cat:'Fahrzeugtechnik'},
  {name:'Grundlagen der Fahrzeugkonstruktion',short:'GFK',cat:'Fahrzeugtechnik'},
  {name:'Numerische Methoden in der Kraftfahrzeugtechnik',short:'NumKFZ',cat:'Fahrzeugtechnik'},
  {name:'Mobile Arbeitsmaschinen und Nutzfahrzeuge',short:'MAN',cat:'Fahrzeugtechnik'},
  {name:'Verbrennungskraftmaschinen und Brennstoffzellen',short:'VKM',cat:'Fahrzeugtechnik'},
  {name:'Verkehrsleittechnik',short:'VLT',cat:'Fahrzeugtechnik'},
  // Luft- und Raumfahrttechnik
  {name:'Berechnungsmethoden in der Aerodynamik',short:'BAero',cat:'Luft- und Raumfahrttechnik'},
  {name:'Digitalisierung in der Luft- und Raumfahrttechnik',short:'DigLRT',cat:'Luft- und Raumfahrttechnik'},
  {name:'Flugleistungen',short:'FL',cat:'Luft- und Raumfahrttechnik'},
  {name:'Grundlagen der Flugführung',short:'GFF',cat:'Luft- und Raumfahrttechnik'},
  {name:'Ingenieurtheorien des Leichtbaus',short:'ITL',cat:'Luft- und Raumfahrttechnik'},
  {name:'Kreisprozesse der Flugtriebwerke',short:'KPF',cat:'Luft- und Raumfahrttechnik'},
  {name:'Airfoil Aerodynamics',short:'AirAero',cat:'Luft- und Raumfahrttechnik'},
  {name:'Bauelemente von Strahltriebwerken',short:'BauST',cat:'Luft- und Raumfahrttechnik'},
  {name:'Drehflügeltechnik',short:'DrehF',cat:'Luft- und Raumfahrttechnik'},
  {name:'Elemente des Leichtbaus',short:'ELB',cat:'Luft- und Raumfahrttechnik'},
  {name:'Future Propulsion Technologies for Sustainable Aviation',short:'FPTSA',cat:'Luft- und Raumfahrttechnik'},
  {name:'Luftverkehrsimulation',short:'LVSim',cat:'Luft- und Raumfahrttechnik'},
  // Materialwissenschaften
  {name:'Herstellung und Anwendung dünner Schichten',short:'HAdS',cat:'Materialwissenschaften'},
  {name:'Numerische Methoden in der Materialwissenschaft',short:'NumMatW',cat:'Materialwissenschaften'},
  // Mechatronik
  {name:'Aktoren',short:'Akt',cat:'Mechatronik'},
  {name:'Digitalisierung in der Mechatronik',short:'DigMech',cat:'Mechatronik'},
  {name:'Aufbau- und Verbindungstechnik',short:'AVT',cat:'Mechatronik'},
  {name:'Automatisierte Montage',short:'AutoM',cat:'Mechatronik'},
  {name:'Automatisierung von industriellen Fertigungsprozessen',short:'AutoFP',cat:'Mechatronik'},
  {name:'Computational Biomechanics',short:'CompBio',cat:'Mechatronik'},
  {name:'Elektrische Signalverarbeitung',short:'ESigV',cat:'Mechatronik'},
  {name:'Fertigungsmesstechnik',short:'FMessT',cat:'Mechatronik'},
  {name:'Mechatronische Systeme',short:'MechSys',cat:'Mechatronik'},
  // Produktion, Automation und Systeme
  {name:'Betriebsorganisation',short:'BetOrg',cat:'Produktion, Automation und Systeme'},
  {name:'Industrielles Qualitätsmanagement',short:'IQM',cat:'Produktion, Automation und Systeme'},
  {name:'Praxisorientiertes Konstruktionsprojekt',short:'PKP',cat:'Produktion, Automation und Systeme'},
];

// ── STATE ──────────────────────────────────────────────────────────────────
var activeSemId='ws2526',activeCourseId=null,activeFileName=null,currentCourseShort='';
var pdfDoc=null,pdfPage=1,pdfTotal=0,pdfScale=0.9,pdfShowAll=false,pdfFullText='';
var aiOpen=false,aiPinned=false,sbOpen=false,sbHideTimer=null;
var BACKEND_URL=''; // Netlify Function at /api/ai (same origin — no CORS, no sleeping)
var activeTypeTimer=null,activeThinkTimer=null,generationStopped=false,currentGenId=0;
var activeCourseRef=null,activeCourseSection='files';
var activePortalSection='dashboard';
var ddOpen=false;
var _cameFromStudip=false;



// ── COURSES DASHBOARD ─────────────────────────────────────────────────────
var sdActiveSemId='ws2526';

// Course search / add subject logic
(function(){
  var inp=document.getElementById('courseSearchInput');
  var drop=document.getElementById('courseSearchDrop');
  var addBtn=document.getElementById('courseAddBtn');
  if(!inp||!drop||!addBtn)return;

  var _selectedSubject=null;

  function _getDropBg(){
    return document.body.classList.contains('night')?'rgba(13,20,40,.97)':'rgba(240,245,255,.98)';
  }

  function _showDrop(items){
    if(!items.length){drop.style.display='none';return;}
    drop.style.background=_getDropBg();
    drop.innerHTML='';
    items.forEach(function(s){
      var opt=document.createElement('div');
      opt.textContent=s.name;
      opt.style.cssText='padding:9px 14px;cursor:pointer;font-size:.88rem;border-bottom:1px solid rgba(37,99,235,.1);color:inherit';
      opt.addEventListener('mouseenter',function(){opt.style.background='rgba(37,99,235,.12)';});
      opt.addEventListener('mouseleave',function(){opt.style.background='';});
      opt.addEventListener('mousedown',function(e){
        e.preventDefault();
        _selectedSubject=s;
        inp.value=s.name;
        drop.style.display='none';
      });
      drop.appendChild(opt);
    });
    drop.style.display='block';
  }

  inp.addEventListener('input',function(){
    _selectedSubject=null;
    var q=inp.value.trim().toLowerCase();
    if(!q){drop.style.display='none';return;}
    var matches=SUBJECT_LIST.filter(function(s){
      var inCat=s.cat==='grundlagen'||s.cat===_userVertiefung;
      return inCat&&s.name.toLowerCase().includes(q);
    }).slice(0,8);
    _showDrop(matches);
  });

  inp.addEventListener('blur',function(){
    setTimeout(function(){drop.style.display='none';},150);
  });

  function _addCourse(){
    var name=inp.value.trim();
    if(!name)return;
    var subject=_selectedSubject||{name:name,short:name.slice(0,8)};
    var sem=SEMS[sdActiveSemId];
    if(!sem)return;
    if(sem.courses.find(function(c){return c.name.toLowerCase()===subject.name.toLowerCase();})){
      inp.value='';_selectedSubject=null;drop.style.display='none';return;
    }
    sem.courses.push({id:'uc_'+Date.now(),name:subject.name,short:subject.short,meta:'',files:[]});
    _saveUserCourses();
    sdRenderCourses();
    inp.value='';_selectedSubject=null;drop.style.display='none';
  }

  addBtn.addEventListener('click',_addCourse);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')_addCourse();});
})();










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

// Semester dropdown removed (sidebar removed)
function closeDD(){}

// ── NIGHT MODE ────────────────────────────────────────────────────────────
// nightOn is declared globally above DOMContentLoaded — sync the button here
(function(){
  var _bIcon = document.getElementById('nightIcon');
  if (_bIcon) _bIcon.textContent = nightOn ? '🌙' : '☀️';
  var _bLbl = document.getElementById('nightLabel');
  if (_bLbl) _bLbl.textContent = nightOn ? 'Night' : 'Day';
})();
// nightBtn listener moved to ss-ready

// ── COURSES ───────────────────────────────────────────────────────────────



// ── TIMETABLE ─────────────────────────────────────────────────────────────



// ── MAILS ─────────────────────────────────────────────────────────────────



// ── COURSE NAVIGATION ─────────────────────────────────────────────────────



function buildSbCourseNav(){}




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
  showToast(_t('toast_saved'), msmCurrentTitle.slice(0,50));
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
        model: 'claude-sonnet-4-6',
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
  if(!pdfPath){alert(_t('not_in_demo'));return;}
  var r=await fetch(pdfPath);
  if(!r.ok){alert(_t('download_failed'));return;}
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
  explainBtn.className='ai-sel-btn';explainBtn.textContent=_t('sel_explain');
  var formulaBtn = document.createElement('button');
  formulaBtn.className='ai-sel-btn';formulaBtn.textContent=_t('sel_formula');
  var dismissBtn = document.createElement('button');
  dismissBtn.className='ai-sel-dismiss';dismissBtn.textContent=_t('sel_dismiss');

  var preview = document.createElement('div');
  preview.innerHTML='<b>'+_t('sel_preview')+'</b><em>"'+txt.slice(0,120)+(txt.length>120?'…':'')+'"</em>';
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
        '<button class="msg-action-btn" onclick="copyBubble(this)">'+(window._t?window._t('copy_btn'):'Copy')+'</button>'+
      '</div>'+
    '</div>';
  aiMsgs.appendChild(wrap);aiMsgs.scrollTop=aiMsgs.scrollHeight;return wrap;
}

// Welcome message — deferred so _t is defined (translations live later in this file)
setTimeout(function(){ addBotMsg(window._t?window._t('ai_welcome'):'👋 Hello! Open a PDF and I\'ll help you study it.'); }, 0);

function addUserMsg(text){
  if(typeof window._statsTrackAI==='function')window._statsTrackAI();
  var wrap=document.createElement('div');wrap.className='ai-msg-wrap user';
  var t=getTime();var safe=text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  wrap.innerHTML=
    '<div class="msg-sender user-sender"><span class="msg-sender-dot"></span>'+(window._t?window._t('you_label'):'You')+'</div>'+
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

function _setAiChipsVisible(v){
  var el=document.querySelector('.ai-chips');
  if(el) el.style.display=v?'':'none';
  if(!v){
    var lbl=document.getElementById('aiFileLabel');
    if(lbl) lbl.textContent=window._t?window._t('ai_ready'):'Ready to help';
    var chip=document.getElementById('aiFileChip');
    if(chip) chip.classList.add('empty');
    var chipName=document.getElementById('aiFileChipName');
    if(chipName) chipName.textContent=window._t?window._t('no_file_open'):'No file open';
  }
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
      model:'claude-sonnet-4-6',
      max_tokens:1024,
      system:(window._userType==='learner'
        ? 'You are StudySphere, a German language tutor helping a student prepare for '+(window._germanTest||'a German exam')+(window._germanLevel?' at level '+window._germanLevel:'')+'. Always reply in '+((_lang==='de')?'German':'English')+'. The student is reading "'+activeFileName+'". ALWAYS base your answers on the actual document content below. Be thorough but concise. Use markdown: **bold**, `code`, ### headers, - bullet points.'
        : 'You are StudySphere, a friendly tutor for TU Braunschweig engineering students. Always reply in '+(_lang==='de'?'German':'English')+'. The student is reading "'+activeFileName+'" from '+currentCourseShort+'. ALWAYS base your answers on the actual document content provided below. Do not use general knowledge when the document covers the topic. Be thorough but concise. Use markdown: **bold**, `code`, ### headers, - bullet points.'
      )+'\n\nDOCUMENT CONTENT:\n'+(pdfFullText||'(document text not yet extracted — please wait a moment after opening the file)'),
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
          '<button class="msg-action-btn" onclick="copyBubble(this)">'+(window._t?window._t('copy_btn'):'Copy')+'</button>'+
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
  if(!hasDoc) addBotMsg(_t('ai_tip_no_pdf'));

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
          '<div class="msg-sender user-sender"><span class="msg-sender-dot"></span>'+(window._t?window._t('you_label'):'You')+'</div>'+
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
              '<button class="msg-action-btn" onclick="copyBubble(this)">'+(window._t?window._t('copy_btn'):'Copy')+'</button>'+
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
    addBotMsg('📄 <strong>' + f.name + '</strong> ' + (window._t?window._t('ai_file_loaded_post'):'has been loaded. Ask me anything!'));
  } else {
    // Subtle "restored" separator
    var note = document.createElement('div');
    note.className = 'chat-restore-note';
    note.style.cssText = 'text-align:center;font-size:.67rem;color:rgba(37,99,235,.45);padding:6px 0 2px;font-style:italic;letter-spacing:.02em';
    note.textContent = (window._t?window._t('chat_restored'):'— Chat history restored —');
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
  addBotMsg(_t('ai_chat_cleared_msg'));
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
  lnSaveToLocalCache(lnSummaries);
  window.postMessage({ type: 'SS_DELETE_SUMMARY', summaries: lnSummaries }, '*');
  // Delete from Supabase
  if (deleted && deleted.id) await lnDeleteNoteFromSupabase(deleted.id);
});

// Sync button
var lnSyncing = false;
(document.getElementById('lnSyncBtn')||{addEventListener:function(){}}).addEventListener('click', function() {
  if (lnSyncing) return;
  lnSyncing = true;
  document.getElementById('lnSyncLabel').textContent = _t('sync_syncing');
  document.getElementById('lnSyncDot').style.background = '#f472b6';
  window.postMessage({ type: 'SS_REQUEST_SUMMARIES' }, '*');
  // Timeout fallback
  setTimeout(function() {
    if (lnSyncing) {
      lnSyncing = false;
      document.getElementById('lnSyncLabel').textContent = _t('sync_no_ext');
      document.getElementById('lnSyncDot').style.background = '#ff6b35';
      setTimeout(function() {
        document.getElementById('lnSyncLabel').textContent = _t('ln_sync_btn');
        document.getElementById('lnSyncDot').style.background = '#c084fc';
      }, 2500);
    }
  }, 3000);
});

// ── TOAST ─────────────────────────────────────────────────────────────────
var toastTimer = null;


(document.getElementById('ss-toast-action')||{addEventListener:function(){}}).addEventListener('click', function() {
  document.getElementById('ss-toast').classList.remove('show');
  // Navigate to lecture notes section
  setNavActive('psbNotes');
  showPortalSection('notes');
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
  var isManualSync = lnSyncing;
  lnSyncing = false;
  var summaries = e.data.summaries || [];

  document.getElementById('lnSyncLabel').textContent = _t('sync_synced');
  document.getElementById('lnSyncDot').style.background = '#06D6A0';
  setTimeout(function() {
    document.getElementById('lnSyncLabel').textContent = _t('ln_sync_btn');
    document.getElementById('lnSyncDot').style.background = '#c084fc';
  }, 2000);

  // Show toast only when a genuinely new summary arrives (not on first load)
  if (lnPrevCount > 0 && summaries.length > lnPrevCount) {
    var newest = summaries[0];
    showToast(_t('toast_new_summary_pre') + newest.title.slice(0, 40) + (newest.title.length > 40 ? '…' : ''), _t('toast_tap_view'));
  } else if (isManualSync && summaries.length > 0) {
    showToast('✅ ' + summaries.length + ' ' + (summaries.length !== 1 ? _t('toast_synced_p') : _t('toast_synced_s')), summaries[0].title.slice(0, 50));
  } else if (isManualSync && summaries.length === 0) {
    showToast(_t('toast_no_notes'), _t('toast_summarize_first'));
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

  // Merge extension notes with any Supabase notes already in lnSummaries
  var mergedSummaries = summaries.slice();
  lnSummaries.forEach(function(existing) {
    if (!existing.id) return;
    var key = (existing.title || '') + '|' + (existing.date || '').slice(0, 10);
    var found = mergedSummaries.find(function(s) {
      return ((s.title || '') + '|' + (s.date || '').slice(0, 10)) === key;
    });
    if (!found) mergedSummaries.push(existing);
  });
  mergedSummaries.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  lnPrevCount = mergedSummaries.length;
  lnRender(mergedSummaries);
  lnSaveToLocalCache(mergedSummaries);
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
      _showFilesView();
      openCourse(course);
      if (state.section) showCourseSection(course, state.section);
    }
    return;
  }

  if (state.view === 'file') {
    var course = _ssFindCourseById(state.courseId) || _ssFindCourseByShort(state.courseShort);
    if (course) {
      _showFilesView();
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
  // Redirect learners away from empty dashboard to their practice section
  if (target === 'dashboard' && window._userType === 'learner' && !_pendingPortalRestore) {
    target = 'german';
    setNavActive('psbGerman');
    setTimeout(_glLoadFiles, 300);
  }
  if (target === 'dashboard' && _pendingPortalRestore) {
    target = _pendingPortalRestore;
    _pendingPortalRestore = null;
    var _nm = {profile:'psbProfile', settings:'psbSettings', subscription:'psbSubscription', notes:'psbNotes', studip:'pcStudip', chat:'psbChat', notifications:'psbNotifications', games:'psbGames', lounge:'psbLounge', aipage:'psbAIPage', german:'psbGerman'};
    setNavActive(_nm[target] || 'psbDashboard');
    if (target === 'studip') { setTimeout(sdRenderCourses, 0); }
    if (target === 'chat') { setTimeout(_chatInit, 0); }
  }

  activePortalSection = target;
  _origShowPortalSection(target);
  try { sessionStorage.setItem('ss_portal_tab', target); } catch(e) {}
  _ssPushHistory(
    { view: 'portal', section: target },
    '#portal=' + encodeURIComponent(target)
  );
};

// restoreState() is called by _loadUserCourses after SEMS is populated

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
  if (window._userType === 'learner') {
    showPortal(); setNavActive('psbGerman'); showPortalSection('german');
  } else {
    showPortal(); setNavActive('psbDashboard'); showPortalSection('dashboard');
  }
});
_bindIf('psbGerman', 'click', function(){
  showPortal(); setNavActive('psbGerman'); showPortalSection('german');
  window._glBackToHome();
});
_bindIf('psbProfile', 'click', function(){
  showPortal(); setNavActive('psbProfile'); showPortalSection('profile');
});
_bindIf('psbSettings', 'click', function(){
  showPortal(); setNavActive('psbSettings'); showPortalSection('settings');
});
_bindIf('psbSubscription', 'click', function(){
  showPortal(); setNavActive('psbSubscription'); showPortalSection('subscription');
});
_bindIf('goPortal', 'click', function(){
  if (activeFileName && activeCourseRef) {
    // Inside a PDF — check if this is a German learner skill file
    if (window._userType === 'learner' && activeCourseRef.id && activeCourseRef.id.startsWith('german-')) {
      activeFileName = null;
      pdfDoc = null;
      pdfFullText = '';
      _setAiChipsVisible(false);
      showPortal();
      setNavActive('psbGerman');
      showPortalSection('german');
      window._glOpenSkill(_glActiveSkill || activeCourseRef.id.replace('german-', ''));
    } else {
      // Inside a PDF → go back to course overview
      activeFileName = null;
      pdfDoc = null;
      pdfFullText = '';
      _setAiChipsVisible(false);
      document.getElementById('pdfView').style.display = 'none';
      document.getElementById('courseOverview').style.display = 'block';
      showCourseSection(activeCourseRef, 'files');
    }
  } else {
    // In course overview (or welcome state) → go back to Stud.IP
    activeCourseId = null;
    activeCourseRef = null;
    if (window._userType === 'learner') {
      showPortal(); setNavActive('psbGerman'); showPortalSection('german');
    } else {
      showStudip();
    }
  }
});

// Sidebar

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
    var nbIcon = document.getElementById('nightIcon');
    if (nbIcon) {
      nbIcon.textContent = toNight ? '🌙' : '☀️';
      var nbLbl = document.getElementById('nightLabel');
      if (nbLbl) nbLbl.textContent = toNight ? 'Night' : 'Day';
    }
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

// ── Mobile hamburger menu ──────────────────────────────────────
(function(){
  var ham=document.getElementById('portalHamburger');
  var scrim=document.getElementById('mobScrim');
  var sb=document.querySelector('#portal .sidebar');
  if(!ham||!scrim||!sb)return;
  function openMobSb(){sb.classList.add('mob-open');scrim.classList.add('show');}
  function closeMobSb(){sb.classList.remove('mob-open');scrim.classList.remove('show');}
  ham.addEventListener('click',openMobSb);
  scrim.addEventListener('click',closeMobSb);
  // Close when a nav item is clicked
  sb.addEventListener('click',function(e){
    if(window.innerWidth<=768&&e.target.closest('.sb-item'))closeMobSb();
  });
})();

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
  if (!_sb) { showAuthError(_t('err_connection')); return; }
  var email = authEmail.value.trim();
  var password = authPassword.value;
  if (!email || !password) { showAuthError(_t('err_fill_fields')); return; }

  authSubmit.textContent = '⏳ Please wait…';
  authSubmit.disabled = true;
  hideAuthError();

  try {
    // ── SIGN UP MODE ──────────────────────────────────────────────────────
    if (_authMode === 'signup') {
      var confirmVal = document.getElementById('authConfirm').value;
      if (!confirmVal) { showAuthError(_t('err_confirm_pw')); authSubmit.textContent=_t('auth_submit_signup'); authSubmit.disabled=false; return; }
      if (password !== confirmVal) { showAuthError(_t('err_pw_mismatch')); authSubmit.textContent=_t('auth_submit_signup'); authSubmit.disabled=false; return; }
      if (password.length < 8) { showAuthError(_t('err_pw_length')); authSubmit.textContent=_t('auth_submit_signup'); authSubmit.disabled=false; return; }

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
        showAuthError(_t('err_account_created'));
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
        showAuthError(_t('err_confirm_email'));
        authSubmit.textContent = 'Sign In';
        authSubmit.disabled = false;
        return;
      }

      // Wrong password, or account was created via Google (no password set).
      // Both produce identical errors so keep the user in sign-in mode and
      // surface both possibilities with a clear hint toward the Google button.
      showAuthError(_t('err_wrong_pw'));
      authSubmit.textContent = 'Sign In';
      authSubmit.disabled = false;
      return;
    }

    // Sign in succeeded — _enterApp handles onboarding check
  } catch(e) {
    var msg = e.message || String(e);
    if (msg.includes('fetch')) {
      showAuthError(_t('err_network'));
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
    if (profile && profile.courses) _loadUserCourses(profile.courses);
    else restoreState(); // no courses saved — still try to restore view

    // Always write auth_email so friend search works (upsert-safe, cheap PATCH)
    if (_currentUser && _currentUser.email) {
      fetch(SUPA_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(uid), {
        method: 'PATCH',
        headers: Object.assign(_sbHeaders(), { 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ auth_email: _currentUser.email })
      }).catch(function(){});
    }

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
  var pv = document.getElementById('profileVertiefung');
  var m = document.getElementById('profileMatrikel');
  var i = document.getElementById('profileInitial');
  if (n && p.full_name) n.value = p.full_name;
  if (e && p.email) e.value = p.email;
  if (u && p.university) u.value = p.university;
  if (pr && p.programme) pr.value = p.programme;
  if (pv && p.vertiefung) pv.value = p.vertiefung;
  if (m && p.matrikel) m.value = p.matrikel;
  if (i && p.full_name) i.textContent = p.full_name.charAt(0).toUpperCase();
  // Keep _userVertiefung in sync when profile loads
  if (p.vertiefung) {
    _userVertiefung = p.vertiefung;
    localStorage.setItem('ss_vertiefung', p.vertiefung);
  }
  if (p.chat_username) _chatUsername = p.chat_username;
  if (p.full_name && typeof updateAuthIndicator === 'function' && _currentUser) {
    updateAuthIndicator(_currentUser);
  }
  // DB value wins; fall back to per-user localStorage cache if column missing
  var _uid = (_currentUser && _currentUser.id) || '';
  window._userType    = p.user_type    || localStorage.getItem('ss_user_type_' + _uid) || 'enrolled';
  window._germanTest  = p.german_test  || localStorage.getItem('ss_german_test_'  + _uid) || '';
  window._germanLevel = p.german_level || localStorage.getItem('ss_german_level_' + _uid) || '';
  // Persist per-user so it survives logout/login on same browser
  if (_uid) {
    localStorage.setItem('ss_user_type_'    + _uid, window._userType);
    localStorage.setItem('ss_german_test_'  + _uid, window._germanTest);
    localStorage.setItem('ss_german_level_' + _uid, window._germanLevel);
  }
  _applyUserTypeUI();
}

var _userType    = localStorage.getItem('ss_user_type') || 'enrolled';
var _germanTest  = '';
var _germanLevel = '';

function _applyUserTypeUI() {
  var isLearner = (_userType === 'learner');

  // Sidebar subtitle
  var sub = document.getElementById('sbUserSub');
  if (sub) {
    sub.textContent = isLearner
      ? ((_germanTest || 'German Test') + (_germanLevel ? ' · ' + _germanLevel : ''))
      : 'TU Braunschweig';
  }

  // Courses nav — hide for learners; German Practice — show for learners
  var coursesNav = document.getElementById('pcStudip');
  var germanNav  = document.getElementById('psbGerman');
  if (coursesNav) coursesNav.style.display = isLearner ? 'none' : '';
  if (germanNav)  germanNav.style.display  = isLearner ? ''     : 'none';

  // Update German hero badge if section already in DOM
  var glSub   = document.getElementById('glTestBadge');
  var glChip  = document.getElementById('glLevelChip');
  if (glSub)  glSub.textContent  = (_germanTest  || 'German Test') + ' preparation';
  if (glChip) glChip.textContent = _germanLevel  || '–';

  // Profile page: show/hide enrolled vs learner fields
  document.querySelectorAll('.pf-enrolled-field').forEach(function(el) {
    el.style.display = isLearner ? 'none' : '';
  });
  document.querySelectorAll('.pf-learner-field').forEach(function(el) {
    el.style.display = isLearner ? '' : 'none';
  });
  var gt = document.getElementById('profileGermanTest');
  var gl = document.getElementById('profileGermanLevel');
  if (gt && _germanTest)  gt.value = _germanTest;
  if (gl && _germanLevel) gl.value = _germanLevel;
}

// ── GERMAN LEARNER PRACTICE ──────────────────────────────────────────────────

var _glSkillNames = {
  reading: 'Leseverstehen', listening: 'Hörverstehen',
  writing: 'Schreiben', speaking: 'Sprechen',
  vocab: 'Wortschatz', grammar: 'Grammatik'
};
var _glSkillSubs = {
  reading: 'Reading comprehension', listening: 'Listening comprehension',
  writing: 'Writing tasks', speaking: 'Speaking exercises',
  vocab: 'Vocabulary builder', grammar: 'Grammar practice'
};
var _glSkillChips = {
  reading:   ['Practice text + questions', 'Summarise a text for me', 'Explain reading strategies'],
  listening: ['Give me a listening transcript + questions', 'Explain listening strategies', 'Common listening pitfalls'],
  writing:   ['Give me a writing prompt', 'Evaluate my writing', 'Explain writing structure'],
  speaking:  ['Give me speaking prompts', 'How to structure my answer', 'Common speaking mistakes'],
  vocab:     ['Quiz me on 15 words', 'Words for my exam level', 'Explain these German words'],
  grammar:   ['Top grammar topics for my exam', 'Give me grammar exercises', 'Explain Konjunktiv II']
};
var _glActiveSkill = '';

window._glOpenSkill = function(skill) {
  _glActiveSkill = skill;
  var home = document.getElementById('glHome');
  var detail = document.getElementById('glSkillView');
  if (home) home.style.display = 'none';
  if (detail) detail.style.display = '';

  // Set title/sub
  var t = document.getElementById('glSkillTitle');
  var s = document.getElementById('glSkillSub');
  if (t) t.textContent = _glSkillNames[skill] || skill;
  if (s) s.textContent = _glSkillSubs[skill] || '';

  // Inject skill chips into the AI panel's .ai-chips div
  var aiChipsEl = document.querySelector('.ai-chips');
  if (aiChipsEl) {
    if (!aiChipsEl._originalHTML) aiChipsEl._originalHTML = aiChipsEl.innerHTML;
    aiChipsEl.innerHTML = '';
    (_glSkillChips[skill] || []).forEach(function(label) {
      var btn = document.createElement('span');
      btn.className = 'ai-tip';
      btn.textContent = label;
      btn.addEventListener('click', function() { window._glAsk(label, _glSkillNames[skill]); });
      aiChipsEl.appendChild(btn);
    });
  }

  // Reset AI panel and load files for this skill
  var panel = document.getElementById('glAIPanel');
  if (panel) panel.style.display = 'none';
  _glLoadFiles();
};

window._glBackToHome = function() {
  _glActiveSkill = '';
  var home = document.getElementById('glHome');
  var detail = document.getElementById('glSkillView');
  if (home) home.style.display = '';
  if (detail) detail.style.display = 'none';
  // Restore original AI panel chips
  var aiChipsEl = document.querySelector('.ai-chips');
  if (aiChipsEl && aiChipsEl._originalHTML) {
    aiChipsEl.innerHTML = aiChipsEl._originalHTML;
    aiChipsEl._originalHTML = null;
  }
};

window._glAsk = function(prompt, title) {
  var test  = window._germanTest  || 'German test';
  var level = window._germanLevel || 'my level';
  var skill = _glSkillNames[_glActiveSkill] || _glActiveSkill || '';
  var docCtx = (pdfFullText && pdfFullText.trim())
    ? '\n\nUse this document as context:\n"""\n' + pdfFullText.slice(0, 8000) + '\n"""'
    : '';
  var fullPrompt = prompt + ' (Context: ' + test + (level ? ', level ' + level : '') + (skill ? ', skill: ' + skill : '') + ')' + docCtx;
  // If a PDF is already open, keep it visible — just send the prompt
  var pv = document.getElementById('pdfView');
  var pdfAlreadyOpen = pv && pv.style.display !== 'none' && pdfDoc;
  if (!pdfAlreadyOpen) {
    _showFilesView();
    var ws = document.getElementById('welcomeState');
    var co = document.getElementById('courseOverview');
    if (ws) { ws.style.display = 'flex'; ws.innerHTML = '<div style="text-align:center;padding:40px 20px"><div style="font-size:3rem">🇩🇪</div><div style="font-family:\'Fredoka One\',cursive;font-size:1.3rem;color:#e2d9f3;margin-top:12px">' + (title || 'German Practice') + '</div><div style="font-size:.82rem;color:rgba(255,255,255,.4);margin-top:6px">' + test + (level ? ' · ' + level : '') + '</div></div>'; }
    if (co) co.style.display = 'none';
  }
  if (!pdfAlreadyOpen && pv) pv.style.display = 'none';
  openAI(); pinAI();
  setTimeout(function() { askAI(fullPrompt, false); }, 100);
};

function _glAppendMsg(text, role) {
  var msgs = document.getElementById('glAIMessages');
  if (!msgs) return;
  var d = document.createElement('div');
  d.className = 'gl-ai-msg ' + role;
  d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  return d;
}

function _glStream(prompt) {
  var msgs = document.getElementById('glAIMessages');
  if (!msgs) return;
  var bot = document.createElement('div');
  bot.className = 'gl-ai-msg bot';
  bot.textContent = '⏳ Thinking…';
  msgs.appendChild(bot);
  msgs.scrollTop = msgs.scrollHeight;

  var test  = window._germanTest  || '';
  var level = window._germanLevel || '';
  var systemCtx = 'You are a German language tutor helping a student prepare for ' +
    (test || 'a German language exam') + (level ? ' at level ' + level : '') +
    '. Give concise, practical answers. Use German examples with English explanations.';

  fetch(BACKEND_URL + '/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemCtx,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  .then(function(r) {
    return r.text().then(function(raw) {
      try {
        var data = JSON.parse(raw);
        return data.error
          ? ('❌ ' + (data.error.message || JSON.stringify(data.error)))
          : (data.content ? data.content.map(function(b){ return b.text || ''; }).join('') : ('⚠️ Unexpected response: ' + raw.slice(0, 200)));
      } catch(e) {
        return '⚠️ Bad response: ' + raw.slice(0, 200);
      }
    });
  })
  .then(function(text) { bot.textContent = text; msgs.scrollTop = msgs.scrollHeight; })
  .catch(function(e) { bot.textContent = '⚠️ ' + (e.message || 'Could not reach AI.'); });
}

// ── GERMAN LEARNER FILE UPLOADS ──────────────────────────────────────────────
// Reuses existing _ufUpload / _ufList / _ufFetchBytes / _ufDeleteRemote.
// All files live in the same 'course-uploads' bucket under <uid>/german-files/

// Returns a course-like object keyed to the active skill for storage paths
function _glCourse() {
  var sk = _glActiveSkill || 'general';
  return { id: 'german-' + sk, short: 'german-' + sk, name: 'German ' + (_glSkillNames[sk] || sk) };
}

function _glFmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

function _glFileIcon(name) {
  var ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return '🖼️';
  return '📎';
}

async function _glLoadFiles() {
  var uid = _currentUser && (_currentUser.id || _currentUser.sub);
  if (!uid) return;
  var list = document.getElementById('glFileList');
  var empty = document.getElementById('glFileEmpty');
  if (!list) return;
  try {
    var items = await _ufList(uid, _glCourse());
    // Remove old rows but keep the empty msg element
    Array.from(list.querySelectorAll('.gl-file-row')).forEach(function(r){ r.remove(); });
    if (!items.length) {
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    items.forEach(function(item) {
      var fname = decodeURIComponent(item.name || '');
      if (!fname) return;
      var size = (item.metadata && item.metadata.size) ? _glFmtSize(item.metadata.size) : '';
      var row = document.createElement('div');
      row.className = 'gl-file-row';
      row.innerHTML =
        '<span class="gl-file-icon">' + _glFileIcon(fname) + '</span>' +
        '<span class="gl-file-name" title="' + fname + '">' + fname + '</span>' +
        (size ? '<span class="gl-file-size">' + size + '</span>' : '') +
        '<button class="gl-file-quiz">🧠 Quiz me</button>' +
        '<button class="gl-file-explain">💡 Explain</button>' +
        '<button class="gl-file-open">Open</button>' +
        '<button class="gl-file-del">🗑</button>';
      row.querySelector('.gl-file-open').addEventListener('click', function() {
        _glOpenFile(uid, fname);
      });
      row.querySelector('.gl-file-quiz').addEventListener('click', function() {
        _glAskAboutFile(uid, fname, 'quiz');
      });
      row.querySelector('.gl-file-explain').addEventListener('click', function() {
        _glAskAboutFile(uid, fname, 'explain');
      });
      row.querySelector('.gl-file-del').addEventListener('click', function() {
        _glDeleteFile(uid, fname, row);
      });
      list.appendChild(row);
    });
  } catch(e) {
    console.warn('glLoadFiles error:', e);
  }
}

function _glOpenFile(uid, fname) {
  var ext = (fname.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') {
    // Open in the full PDF viewer with AI panel — same as enrolled student course files
    var fakeFile = { name: fname, _uploaded: true, _course: _glCourse() };
    _showFilesView();
    openFile(fakeFile, _glCourse());
  } else {
    // Non-PDF: open in new tab
    _ufFetchBytes(uid, _glCourse(), fname).then(function(bytes) {
      var blob = new Blob([bytes], { type: 'application/octet-stream' });
      window.open(URL.createObjectURL(blob), '_blank');
    }).catch(function(e) {
      showToast('Could not open file', e.message || String(e));
    });
  }
}

async function _glDeleteFile(uid, fname, rowEl) {
  if (!confirm('Delete "' + fname + '"?')) return;
  try {
    await _ufDeleteRemote(uid, _glCourse(), fname);
    rowEl.remove();
    var list = document.getElementById('glFileList');
    if (list && !list.querySelector('.gl-file-row')) {
      var empty = document.getElementById('glFileEmpty');
      if (empty) empty.style.display = '';
    }
    showToast('File deleted', fname);
  } catch(e) {
    showToast('Delete failed', e.message || String(e));
  }
}

async function _glAskAboutFile(uid, fname, mode) {
  var panel  = document.getElementById('glAIPanel');
  var msgs   = document.getElementById('glAIMessages');
  var ptitle = document.getElementById('glAIPanelTitle');
  if (!panel || !msgs) return;
  panel.style.display = '';
  if (ptitle) ptitle.textContent = (mode === 'quiz' ? '🧠 Quiz — ' : '💡 Explain — ') + fname;
  msgs.innerHTML = '';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  var loadMsg = _glAppendMsg('Loading file…', 'bot');
  var bytes;
  try {
    bytes = await _ufFetchBytes(uid, _glCourse(), fname);
  } catch(e) {
    loadMsg.textContent = '⚠️ Could not load file: ' + (e.message || String(e));
    return;
  }

  var ext = (fname.split('.').pop() || '').toLowerCase();
  var test  = window._germanTest  || 'German exam';
  var level = window._germanLevel || 'my level';
  var systemCtx = 'You are a German language tutor helping a student prepare for ' + test +
    (level ? ' at level ' + level : '') +
    '. The student has uploaded a study document. Base ALL your responses strictly on its content.';

  var userPrompt = mode === 'quiz'
    ? 'Based on this document, create a quiz with 5 questions (multiple choice or short answer) that test understanding of the key content. After each question, provide the correct answer and a brief explanation.'
    : 'Explain the key concepts in this document clearly and concisely. Highlight the most important points a student should understand and remember for their exam.';

  loadMsg.textContent = '⏳ Reading file…';

  var messageContent;
  if (ext === 'pdf') {
    // Send PDF as base64 document — backend already has anthropic-beta pdfs-2024-09-25
    var b64 = '';
    var chunkSize = 8192;
    for (var i = 0; i < bytes.length; i += chunkSize) {
      var chunk = bytes.subarray(i, i + chunkSize);
      b64 += String.fromCharCode.apply(null, chunk);
    }
    b64 = btoa(b64);
    messageContent = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
      { type: 'text', text: userPrompt }
    ];
  } else if (['txt','md'].includes(ext)) {
    var textContent = new TextDecoder().decode(bytes);
    messageContent = [{ type: 'text', text: 'DOCUMENT CONTENT:\n' + textContent + '\n\n' + userPrompt }];
  } else {
    loadMsg.textContent = '⚠️ Only PDF and text files can be analysed by the AI. Open the file to view it.';
    return;
  }

  loadMsg.textContent = '⏳ Asking AI…';

  try {
    var resp = await fetch(BACKEND_URL + '/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemCtx,
        messages: [{ role: 'user', content: messageContent }]
      })
    });
    var data = await resp.json();
    var text = data.error
      ? ('❌ ' + (data.error.message || JSON.stringify(data.error)))
      : (data.content ? data.content.map(function(b){ return b.text || ''; }).join('') : '⚠️ No response');
    loadMsg.textContent = text;
  } catch(e) {
    loadMsg.textContent = '⚠️ Could not reach AI. Check your connection.';
  }
}

window._glUploadFiles = async function(files) {
  if (!files || !files.length) return;
  var uid = _currentUser && (_currentUser.id || _currentUser.sub);
  if (!uid) { showToast('Not logged in', 'Please sign in first'); return; }
  var prog  = document.getElementById('glUploadProgress');
  var bar   = document.getElementById('glUploadBar');
  var status= document.getElementById('glUploadStatus');
  var label = document.getElementById('glUploadLabel');
  if (prog) prog.style.display = '';
  if (label) label.style.pointerEvents = 'none';

  var arr = Array.from(files);
  for (var i = 0; i < arr.length; i++) {
    var f = arr[i];
    if (status) status.textContent = 'Uploading ' + f.name + ' (' + (i+1) + '/' + arr.length + ')…';
    try {
      await _ufUpload(uid, _glCourse(), f, function(pct) {
        if (bar) bar.style.width = pct + '%';
      });
    } catch(e) {
      showToast('Upload failed', f.name + ': ' + (e.message || String(e)));
    }
  }

  if (prog) prog.style.display = 'none';
  if (bar)  bar.style.width = '0%';
  if (label) label.style.pointerEvents = '';
  // Reset file input so same file can be re-uploaded
  var inp = document.getElementById('glFileInput');
  if (inp) inp.value = '';
  showToast('Upload complete', arr.length + ' file' + (arr.length > 1 ? 's' : '') + ' saved');
  await _glLoadFiles();
};

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
    stop_btn: '⏹ Stop generating', ai_placeholder: 'Ask anything about this document…',
    ai_welcome: "Hey! 👋 Open a PDF, select any text or formula and I'll help you understand it!",
    ai_tip_no_pdf: '💡 Tip: open a PDF first so I can answer from the actual document!',
    ai_file_loaded_post: 'loaded! Ask me anything about it — I\'ll answer based on the document content. 🎓',
    ai_chat_cleared_msg: 'Chat cleared! What would you like to know? 😊',
    chat_restored: '— chat history restored —',
    no_file_open: 'No file open',
    loading_pdf: 'Loading PDF…',
    not_in_demo: 'This file is not available in the demo.',
    not_in_demo_multi: 'not available in demo',
    download_failed: 'Download failed.',
    copy_btn: 'Copy',
    you_label: 'You',
    nothing_yet: 'Nothing here yet',
    studip_subtitle: 'TU Braunschweig · Your courses & materials',
    studip_back: '← Portal',
    sd_subjects: '📚 Subjects', sd_timetable: '🗓️ Timetable', sd_mails: '✉️ Mails',
    sel_explain: 'Explain this', sel_formula: 'Break down formula', sel_dismiss: 'Dismiss',
    sel_preview: '📌 You selected:',
    sync_syncing: 'Syncing…', sync_synced: 'Synced ✓', sync_no_ext: 'Extension not detected',
    toast_saved: '💾 Saved to Lecture Notes',
    toast_new_summary_pre: '📝 New summary: ',
    toast_tap_view: 'Tap View to open your lecture notes',
    toast_synced_s: 'note synced', toast_synced_p: 'notes synced',
    toast_no_notes: '⚠️ No notes found',
    toast_summarize_first: 'Summarize a lecture in the extension first',
    toast_sign_in: '⚠️ Sign in to save',
    toast_profile_saved: '✅ Profile saved', toast_profile_saved_sub: 'Saved to your account',
    toast_save_failed: '❌ Save failed',
    toast_chat_cleared: '🗑️ Chat history cleared', toast_chat_cleared_sub: 'All saved chats have been removed',
    toast_settings_saved: '✅ Settings saved', toast_settings_saved_sub: 'Your preferences have been updated',
    toast_signed_out: '👋 Signed out', toast_signed_out_sub: 'See you next time!',
    toast_coming_soon: '🚀 Coming soon', toast_coming_soon_sub: 'Payment integration coming soon!',
    toast_inactivity: '⏰ Signed out due to inactivity', toast_inactivity_sub: 'Sign in again to continue',
    err_connection: 'Connection error — please refresh the page',
    err_fill_fields: 'Please fill in all fields',
    err_confirm_pw: 'Please confirm your password',
    err_pw_mismatch: 'Passwords do not match',
    err_pw_length: 'Password must be at least 8 characters',
    err_account_created: '✅ Account created! Check your email and click the confirmation link to get started.',
    err_confirm_email: '⚠️ Please confirm your email first — check your inbox for the link.',
    err_wrong_pw: '⚠️ Incorrect password — or did you sign up with Google? Try the Google button below, or use the link to create a new account.',
    err_network: 'Network error — check your connection.',
    aip_new_chat: 'New chat', aip_chats_label: 'Chats', aip_no_chats: 'No chats yet',
    aip_subtitle: 'Where should we start?', aip_landing_ph: 'Ask me anything…',
    aip_followup_ph: 'Ask a follow-up…', aip_upload_btn: 'Upload photos & files'
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
    stop_btn: '⏹ Stopp', ai_placeholder: 'Stelle eine Frage zu diesem Dokument…',
    ai_welcome: 'Hey! 👋 Öffne ein PDF, markiere Text oder eine Formel und ich helfe dir!',
    ai_tip_no_pdf: '💡 Tipp: Öffne zuerst ein PDF, damit ich aus dem Dokument antworten kann!',
    ai_file_loaded_post: 'geladen! Stelle mir beliebige Fragen — ich antworte anhand des Dokuments. 🎓',
    ai_chat_cleared_msg: 'Chat gelöscht! Was möchtest du wissen? 😊',
    chat_restored: '— Chatverlauf wiederhergestellt —',
    no_file_open: 'Keine Datei geöffnet',
    loading_pdf: 'PDF wird geladen…',
    not_in_demo: 'Diese Datei ist in der Demo nicht verfügbar.',
    not_in_demo_multi: 'in der Demo nicht verfügbar',
    download_failed: 'Download fehlgeschlagen.',
    copy_btn: 'Kopieren',
    you_label: 'Du',
    nothing_yet: 'Noch nichts hier',
    studip_subtitle: 'TU Braunschweig · Deine Kurse & Materialien',
    studip_back: '← Portal',
    sd_subjects: '📚 Fächer', sd_timetable: '🗓️ Stundenplan', sd_mails: '✉️ E-Mails',
    sel_explain: 'Erklären', sel_formula: 'Formel aufschlüsseln', sel_dismiss: 'Schließen',
    sel_preview: '📌 Du hast ausgewählt:',
    sync_syncing: 'Synchronisiere…', sync_synced: 'Synchronisiert ✓', sync_no_ext: 'Erweiterung nicht gefunden',
    toast_saved: '💾 In Vorlesungsnotizen gespeichert',
    toast_new_summary_pre: '📝 Neue Zusammenfassung: ',
    toast_tap_view: 'Tippe auf Ansehen um deine Notizen zu öffnen',
    toast_synced_s: 'Notiz synchronisiert', toast_synced_p: 'Notizen synchronisiert',
    toast_no_notes: '⚠️ Keine Notizen gefunden',
    toast_summarize_first: 'Fasse zuerst eine Vorlesung in der Erweiterung zusammen',
    toast_sign_in: '⚠️ Anmelden zum Speichern',
    toast_profile_saved: '✅ Profil gespeichert', toast_profile_saved_sub: 'In deinem Konto gespeichert',
    toast_save_failed: '❌ Speichern fehlgeschlagen',
    toast_chat_cleared: '🗑️ Chatverlauf gelöscht', toast_chat_cleared_sub: 'Alle gespeicherten Chats wurden entfernt',
    toast_settings_saved: '✅ Einstellungen gespeichert', toast_settings_saved_sub: 'Deine Einstellungen wurden aktualisiert',
    toast_signed_out: '👋 Abgemeldet', toast_signed_out_sub: 'Bis zum nächsten Mal!',
    toast_coming_soon: '🚀 Demnächst', toast_coming_soon_sub: 'Zahlungsintegration kommt bald!',
    toast_inactivity: '⏰ Wegen Inaktivität abgemeldet', toast_inactivity_sub: 'Melde dich erneut an um fortzufahren',
    err_connection: 'Verbindungsfehler — bitte Seite neu laden',
    err_fill_fields: 'Bitte alle Felder ausfüllen',
    err_confirm_pw: 'Bitte Passwort bestätigen',
    err_pw_mismatch: 'Passwörter stimmen nicht überein',
    err_pw_length: 'Passwort muss mindestens 8 Zeichen haben',
    err_account_created: '✅ Konto erstellt! Prüfe deine E-Mail und klicke den Bestätigungslink.',
    err_confirm_email: '⚠️ Bitte bestätige zuerst deine E-Mail — schau in deinen Posteingang.',
    err_wrong_pw: '⚠️ Falsches Passwort — oder hast du dich mit Google angemeldet? Versuche den Google-Button unten oder erstelle ein neues Konto.',
    err_network: 'Netzwerkfehler — überprüfe deine Verbindung.',
    aip_new_chat: 'Neuer Chat', aip_chats_label: 'Chats', aip_no_chats: 'Noch keine Chats',
    aip_subtitle: 'Womit fangen wir an?', aip_landing_ph: 'Frag mich alles…',
    aip_followup_ph: 'Stelle eine Folgefrage…', aip_upload_btn: 'Fotos & Dateien hochladen'
  }
};

// Global translation helper — usable from any file after app.js loads
window._t = function(key) { return (_translations[_lang] || _translations.en)[key] || key; };

function applyLanguage(lang) {
  _lang = (lang === 'de') ? 'de' : 'en';
  localStorage.setItem('ss_lang', _lang);
  window._t = function(key) { return (_translations[_lang] || _translations.en)[key] || key; };
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
  // Translate AI chip "no file" label
  var chipName = document.getElementById('aiFileChipName');
  if (chipName && chipName.textContent === (_translations.en.no_file_open) || (chipName && chipName.textContent === (_translations.de.no_file_open))) {
    chipName.textContent = t.no_file_open;
  }
  // Translate AI file label if no file is open
  var aiFileLabel = document.getElementById('aiFileLabel');
  if (aiFileLabel && (aiFileLabel.textContent === _translations.en.ai_ready || aiFileLabel.textContent === _translations.de.ai_ready)) {
    aiFileLabel.textContent = t.ai_ready;
  }
  // Translate Stud.IP overlay elements
  var studipSub = document.getElementById('studipSubtitle');
  if (studipSub) studipSub.textContent = t.studip_subtitle;
  var studipBackBtn = document.getElementById('studipBack');
  if (studipBackBtn) studipBackBtn.textContent = t.studip_back;
  var sdSubj = document.getElementById('sdSubjectsLabel');
  if (sdSubj) sdSubj.textContent = t.sd_subjects;
  var sdTT = document.getElementById('sdTimetableLabel');
  if (sdTT) sdTT.textContent = t.sd_timetable;
  var sdMail = document.getElementById('sdMailsLabel');
  if (sdMail) sdMail.textContent = t.sd_mails;
  // Sync landing page language state
  if (typeof window._toggleLandingLang !== 'undefined') {
    var landingBtn = document.getElementById('landingLangBtn');
    if (landingBtn) landingBtn.textContent = _lang === 'de' ? 'EN' : 'DE';
  }
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
  // Load user's saved YouTube playlists from DB
  if (s.yt_playlists && window._ytApplyFromDB) window._ytApplyFromDB(s.yt_playlists);
}

function applySubscription(sub) {
  var badge = document.querySelector('.sub-badge');
  var currentBtn = document.querySelector('.sub-btn-current');
  if (badge) badge.textContent = sub.plan === 'pro' ? '⭐ Pro Plan' : '🎓 Free Plan';
  if (currentBtn) currentBtn.textContent = sub.plan === 'pro' ? '✓ Current plan' : 'Current plan';
}

// ── SAVE HELPERS ─────────────────────────────────────────────────────────
async function saveProfile() {
  if (!_currentUser) { showToast(_t('toast_sign_in'), ''); return; }
  var data = {
    id: _currentUser.id,
    full_name: (document.getElementById('profileName') || {}).value || '',
    email: (document.getElementById('profileEmail') || {}).value || '',
    auth_email: _currentUser.email || '',
    university: (document.getElementById('profileUniversity') || {}).value || '',
    programme: (document.getElementById('profileProgramme') || {}).value || '',
    vertiefung: (document.getElementById('profileVertiefung') || {}).value || '',
    matrikel: (document.getElementById('profileMatrikel') || {}).value || '',
    updated_at: new Date().toISOString()
  };
  try {
    var _pr = await _sb.from('profiles').upsert(data);
    if (_pr && _pr.error) {
      var _fb = Object.assign({}, data); delete _fb.vertiefung;
      await _sb.from('profiles').upsert(_fb);
    }
    showToast(_t('toast_profile_saved'), _t('toast_profile_saved_sub'));
    if (data.vertiefung) { _userVertiefung = data.vertiefung; localStorage.setItem('ss_vertiefung', data.vertiefung); }
    // Update local cache so data persists across page loads
    try { localStorage.setItem('profile_cache_' + _currentUser.id, JSON.stringify(data)); } catch(e) {}
    var init = document.getElementById('profileInitial');
    if (init && data.full_name) init.textContent = data.full_name.charAt(0).toUpperCase();
    updateAuthIndicator(_currentUser);
  } catch(e) {
    showToast(_t('toast_save_failed'), String(e));
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
    showToast(_t('toast_chat_cleared'), _t('toast_chat_cleared_sub'));
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
    showToast(_t('toast_settings_saved'), _t('toast_settings_saved_sub'));
  });
}

// Logout button
var logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function(){
    // Clear all tokens and session flags
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_refresh');
    localStorage.removeItem('ss_user_type');
    sessionStorage.removeItem('sb_sess_token');
    sessionStorage.removeItem('ss_last_active');
    sessionStorage.removeItem('ss_logged_in');
    // Reset user type so next login starts clean
    window._userType    = 'enrolled';
    window._germanTest  = '';
    window._germanLevel = '';
    _applyUserTypeUI();
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
    showToast(_t('toast_signed_out'), _t('toast_signed_out_sub'));
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
    showToast(_t('toast_coming_soon'), _t('toast_coming_soon_sub'));
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
  // Reset state
  _obPath = ''; _obTest = ''; _obLevel = '';
  _obShowStep('1');
  document.getElementById('obTitle').textContent = 'Welcome to StudySphere!';
  document.getElementById('obSub').textContent = "Let's set up your profile — step 1 of 3";
  document.getElementById('obEmoji').textContent = '👋';
  // Pre-fill email if known
  var emailField = document.getElementById('obEmail');
  if (emailField && email) emailField.value = email;
  document.getElementById('onboardModal').style.display = 'flex';
}

// Wire Vertiefung autocomplete in onboarding step 2
(function(){
  var inp=document.getElementById('obVertiefung');
  var drop=document.getElementById('obVertDrop');
  if(!inp||!drop)return;
  function _showVertDrop(q){
    var items=q?VERTIEFUNG_LIST.filter(function(v){return v.toLowerCase().includes(q.toLowerCase());}):VERTIEFUNG_LIST;
    if(!items.length){drop.style.display='none';return;}
    drop.innerHTML='';
    items.forEach(function(v){
      var opt=document.createElement('div');
      opt.textContent=v;
      opt.style.cssText='padding:9px 14px;cursor:pointer;font-size:.85rem;color:rgba(255,255,255,.85);border-bottom:1px solid rgba(192,132,252,.1);font-family:\'Nunito\',sans-serif;font-weight:700';
      opt.addEventListener('mouseenter',function(){opt.style.background='rgba(192,132,252,.15)';});
      opt.addEventListener('mouseleave',function(){opt.style.background='';});
      opt.addEventListener('mousedown',function(e){
        e.preventDefault();
        inp.value=v;
        drop.style.display='none';
      });
      drop.appendChild(opt);
    });
    drop.style.display='block';
  }
  inp.addEventListener('focus',function(){_showVertDrop(inp.value.trim());});
  inp.addEventListener('input',function(){_showVertDrop(inp.value.trim());});
  inp.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},150);});
})();

// Wire Vertiefung autocomplete in profile page
(function(){
  var inp=document.getElementById('profileVertiefung');
  var drop=document.getElementById('pfVertDrop');
  if(!inp||!drop)return;
  function _showPfVertDrop(q){
    var items=q?VERTIEFUNG_LIST.filter(function(v){return v.toLowerCase().includes(q.toLowerCase());}):VERTIEFUNG_LIST;
    if(!items.length){drop.style.display='none';return;}
    drop.innerHTML='';
    items.forEach(function(v){
      var opt=document.createElement('div');
      opt.textContent=v;
      opt.style.cssText='padding:9px 14px;cursor:pointer;font-size:.85rem;color:rgba(255,255,255,.85);border-bottom:1px solid rgba(192,132,252,.1);font-family:\'Nunito\',sans-serif;font-weight:700';
      opt.addEventListener('mouseenter',function(){opt.style.background='rgba(192,132,252,.15)';});
      opt.addEventListener('mouseleave',function(){opt.style.background='';});
      opt.addEventListener('mousedown',function(e){
        e.preventDefault();
        inp.value=v;
        drop.style.display='none';
      });
      drop.appendChild(opt);
    });
    drop.style.display='block';
  }
  inp.addEventListener('focus',function(){_showPfVertDrop(inp.value.trim());});
  inp.addEventListener('input',function(){_showPfVertDrop(inp.value.trim());});
  inp.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},150);});
})();

var _obPath = ''; // 'enrolled' | 'learner'
var _obTest = ''; // selected German test
var _obLevel = ''; // selected level

var _obTestLevels = {
  TestDaF: ['TDN 3','TDN 4','TDN 5'],
  DSH:     ['DSH-1','DSH-2','DSH-3'],
  Goethe:  ['B1','B2','C1','C2'],
  telc:    ['B2','C1','C1 Hochschule','C2'],
  ÖSD:     ['B2','C1','C2'],
  DSD:     ['DSD I (B1/B2)','DSD II (C1)']
};

function _obShowStep(step) {
  ['obStep1','obStep2','obStep3a','obStep3b'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.style.display='none';
  });
  var target=document.getElementById('obStep'+step);
  if(target) target.style.display='flex';
  // Progress bars
  var grad='linear-gradient(90deg,#c084fc,#f472b6)', dim='rgba(255,255,255,.12)';
  var p1=document.getElementById('obProg1'),p2=document.getElementById('obProg2'),p3=document.getElementById('obProg3');
  if(step==='1'){if(p1)p1.style.background=grad;if(p2)p2.style.background=dim;if(p3)p3.style.background=dim;}
  else if(step==='2'){if(p1)p1.style.background=grad;if(p2)p2.style.background=grad;if(p3)p3.style.background=dim;}
  else{if(p1)p1.style.background=grad;if(p2)p2.style.background=grad;if(p3)p3.style.background=grad;}
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
  _obShowStep('2');
  document.getElementById('obTitle').textContent = 'Your path';
  document.getElementById('obSub').textContent = 'Tell us about yourself — step 2 of 3';
  document.getElementById('obEmoji').textContent = '🧭';
};

window._obSelectPath = function(path) {
  _obPath = path;
  document.querySelectorAll('.ob-path-card').forEach(function(c){c.classList.remove('selected');});
  var card = document.getElementById(path==='enrolled'?'obPathEnrolled':'obPathLearner');
  if(card) card.classList.add('selected');
  setTimeout(function(){
    _obShowStep(path==='enrolled'?'3a':'3b');
    document.getElementById('obTitle').textContent = path==='enrolled'?'Almost there!':'Your German journey';
    document.getElementById('obSub').textContent = 'Details — step 3 of 3';
    document.getElementById('obEmoji').textContent = path==='enrolled'?'🎓':'🇩🇪';
  }, 200);
};

window._obBack = function(fromStep) {
  if(fromStep===1||fromStep===undefined){
    _obShowStep('1');
    document.getElementById('obTitle').textContent='Welcome to StudySphere!';
    document.getElementById('obSub').textContent="Let's set up your profile — step 1 of 3";
    document.getElementById('obEmoji').textContent='👋';
  } else {
    _obShowStep('2');
    document.getElementById('obTitle').textContent='Your path';
    document.getElementById('obSub').textContent='Tell us about yourself — step 2 of 3';
    document.getElementById('obEmoji').textContent='🧭';
  }
};

window._obSelectTest = function(card) {
  document.querySelectorAll('.ob-test-card').forEach(function(c){c.classList.remove('selected');});
  card.classList.add('selected');
  _obTest = card.dataset.test;
  _obLevel = '';
  var wrap = document.getElementById('obLevelWrap');
  var grid = document.getElementById('obLevelGrid');
  if(!wrap||!grid)return;
  var levels = _obTestLevels[_obTest]||[];
  grid.innerHTML = levels.map(function(l){
    return '<button class="ob-level-btn" onclick="window._obSelectLevel(this,\''+l+'\')">' + l + '</button>';
  }).join('');
  wrap.style.display = 'flex';
};

window._obSelectLevel = function(btn, level) {
  document.querySelectorAll('.ob-level-btn').forEach(function(b){b.classList.remove('selected');});
  btn.classList.add('selected');
  _obLevel = level;
};

function _obBaseInfo() {
  return {
    first: document.getElementById('obFirst').value.trim(),
    last:  document.getElementById('obLast').value.trim(),
    age:   document.getElementById('obAge').value.trim(),
    email: document.getElementById('obEmail').value.trim()
  };
}

async function _obSaveAndClose(profilePayload, cachePayload) {
  if (_currentUser) {
    try {
      var res = await _sb.from('profiles').upsert(profilePayload);
      if (res && res.error) {
        var fallback = Object.assign({}, profilePayload);
        delete fallback.vertiefung;
        delete fallback.german_test;
        delete fallback.german_level;
        delete fallback.user_type;
        await _sb.from('profiles').upsert(fallback);
        console.warn('Profile partial save:', res.error);
      }
    } catch(e) { console.warn('Profile save error:', e); }
    try { localStorage.setItem('profile_cache_' + _currentUser.id, JSON.stringify(cachePayload)); } catch(e) {}
  }
  // Update profile UI fields
  var pName = document.getElementById('profileName');
  var pEmail = document.getElementById('profileEmail');
  var pUni = document.getElementById('profileUniversity');
  var pProg = document.getElementById('profileProgramme');
  var pInit = document.getElementById('profileInitial');
  var fullName = profilePayload.full_name;
  if (pName) pName.value = fullName;
  if (pEmail) pEmail.value = profilePayload.email;
  if (pUni && profilePayload.university) pUni.value = profilePayload.university;
  if (pProg && profilePayload.programme) pProg.value = profilePayload.programme;
  if (pInit) pInit.textContent = fullName.charAt(0).toUpperCase();
  if (typeof updateAuthIndicator === 'function' && _currentUser) updateAuthIndicator(_currentUser);
  localStorage.setItem('ob_done_' + (_currentUser ? _currentUser.id : 'u'), '1');
  document.getElementById('onboardModal').style.display = 'none';
}

window._obFinish = async function() {
  var prog       = document.getElementById('obProg').value.trim();
  var vertiefung = (document.getElementById('obVertiefung') || {}).value.trim() || '';
  var sem        = document.getElementById('obSem').value.trim();
  var matrikel   = document.getElementById('obMatrikel').value.trim();
  var err        = document.getElementById('obErr3a');
  if (!prog || !sem || !matrikel) {
    err.textContent = 'Please fill in all fields'; err.style.display = 'block'; return;
  }
  err.style.display = 'none';
  var btn = document.getElementById('obFinish');
  btn.textContent = '⏳ Saving…'; btn.disabled = true;

  var info = _obBaseInfo();
  var fullName = info.first + ' ' + info.last;
  var programmeStr = prog + ', ' + sem + '. Semester';

  if (vertiefung) { _userVertiefung = vertiefung; localStorage.setItem('ss_vertiefung', vertiefung); }
  var pVert = document.getElementById('profileVertiefung');
  var pMat  = document.getElementById('profileMatrikel');
  if (pVert) pVert.value = vertiefung;
  if (pMat)  pMat.value  = matrikel;

  var payload = {
    id: _currentUser && _currentUser.id,
    full_name: fullName, email: info.email,
    auth_email: (_currentUser && _currentUser.email) || '',
    university: 'TU Braunschweig',
    programme: programmeStr,
    vertiefung: vertiefung, matrikel: matrikel,
    user_type: 'enrolled',
    age: parseInt(info.age) || null,
    updated_at: new Date().toISOString()
  };
  await _obSaveAndClose(payload, { full_name: fullName, email: info.email, university: 'TU Braunschweig', programme: programmeStr, vertiefung: vertiefung, matrikel: matrikel, user_type: 'enrolled' });
};

window._obFinishLearner = async function() {
  var err = document.getElementById('obErr3b');
  if (!_obTest) {
    err.textContent = 'Please select a test'; err.style.display = 'block'; return;
  }
  if (!_obLevel) {
    err.textContent = 'Please select your level'; err.style.display = 'block'; return;
  }
  err.style.display = 'none';
  var btn = document.getElementById('obFinishLearner');
  btn.textContent = '⏳ Saving…'; btn.disabled = true;

  var info = _obBaseInfo();
  var fullName = info.first + ' ' + info.last;

  // Store learner data locally for portal personalisation (per-user key)
  var _uid = (_currentUser && _currentUser.id) || '';
  localStorage.setItem('ss_user_type_'    + _uid, 'learner');
  localStorage.setItem('ss_german_test_'  + _uid, _obTest);
  localStorage.setItem('ss_german_level_' + _uid, _obLevel);
  localStorage.setItem('ss_user_type',    'learner'); // legacy fallback

  var payload = {
    id: _currentUser && _currentUser.id,
    full_name: fullName, email: info.email,
    auth_email: (_currentUser && _currentUser.email) || '',
    user_type: 'learner',
    german_test: _obTest,
    german_level: _obLevel,
    age: parseInt(info.age) || null,
    updated_at: new Date().toISOString()
  };
  await _obSaveAndClose(payload, { full_name: fullName, email: info.email, user_type: 'learner', german_test: _obTest, german_level: _obLevel });
};

// ── New sidebar navigation (coming-soon + notes shortcut) ─────────────────
(function(){
  var sbNav = document.querySelector('#portal .sb-nav');
  if (!sbNav) return;
  sbNav.addEventListener('click', function(e){
    var item = e.target.closest('.sb-item');
    if (!item) return;
    if (item.dataset.comingSoon) {
      showToast('Coming soon!', 'This feature is on its way.');
      return;
    }
    if (item.id === 'psbNotes') {
      showPortal();
      setNavActive('psbNotes');
      showPortalSection('notes');
    }
    if (item.id === 'psbAIPage') {
      showPortal();
      setNavActive('psbAIPage');
      showPortalSection('aipage');
      if(typeof window._aipRefreshSidebar==='function')window._aipRefreshSidebar();
    }
    if (item.id === 'psbChat') {
      showPortal();
      setNavActive('psbChat');
      showPortalSection('chat');
      _chatInit();
    }
    if (item.id === 'psbNotifications') {
      showPortal();
      setNavActive('psbNotifications');
      showPortalSection('notifications');
    }
    if (item.id === 'psbGames') {
      showPortal();
      setNavActive('psbGames');
      showPortalSection('games');
    }
    if (item.id === 'psbLounge') {
      showPortal();
      setNavActive('psbLounge');
      showPortalSection('lounge');
      _loungeRender();
    }
  });
})();

// ── STUDY LOUNGE ──────────────────────────────────────────────────────────
(function(){
  var STATS_KEY='ss_stats';
  var _studyTimer=null; // interval while PDF is open

  function _loadStats(){
    try{return JSON.parse(localStorage.getItem(STATS_KEY))||{};}catch(e){return {};}
  }
  function _saveStats(s){try{localStorage.setItem(STATS_KEY,JSON.stringify(s));}catch(e){}}
  function _getStats(){
    var def={studyMinutes:0,filesOpened:[],coursesStudied:[],aiMessages:0,gamesPlayed:0,streak:0,lastDate:'',recentFiles:[]};
    var s=_loadStats();
    Object.keys(def).forEach(function(k){if(s[k]===undefined)s[k]=def[k];});
    return s;
  }

  // Track daily streak
  function _touchStreak(){
    var s=_getStats();
    var today=new Date().toISOString().slice(0,10);
    if(s.lastDate===today)return;
    var yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    s.streak=(s.lastDate===yesterday)?(s.streak||0)+1:1;
    s.lastDate=today;
    _saveStats(s);
  }

  // Public tracking helpers
  window._statsTrackFile=function(fname,courseName){
    var s=_getStats();
    _touchStreak();
    if(fname&&s.filesOpened.indexOf(fname)<0)s.filesOpened.push(fname);
    if(courseName&&s.coursesStudied.indexOf(courseName)<0)s.coursesStudied.push(courseName);
    // Recent files (keep last 10 unique)
    s.recentFiles=s.recentFiles||[];
    s.recentFiles=s.recentFiles.filter(function(r){return r.name!==fname;});
    s.recentFiles.unshift({name:fname,course:courseName||'',ts:Date.now()});
    if(s.recentFiles.length>10)s.recentFiles=s.recentFiles.slice(0,10);
    _saveStats(s);
    // Start study timer while file is open
    if(_studyTimer)clearInterval(_studyTimer);
    _studyTimer=setInterval(function(){
      var s2=_getStats();s2.studyMinutes=(s2.studyMinutes||0)+1;_saveStats(s2);
    },60000);
  };

  window._statsStopFile=function(){
    if(_studyTimer){clearInterval(_studyTimer);_studyTimer=null;}
  };

  window._statsTrackAI=function(){
    var s=_getStats();s.aiMessages=(s.aiMessages||0)+1;_saveStats(s);_touchStreak();
  };

  window._statsTrackGame=function(){
    var s=_getStats();s.gamesPlayed=(s.gamesPlayed||0)+1;_saveStats(s);
  };

  // Render the Study Lounge section
  window._loungeRender=function(){
    var s=_getStats();
    // Hours / minutes
    var hrs=Math.floor((s.studyMinutes||0)/60),mins=(s.studyMinutes||0)%60;
    var hoursStr=hrs>0?(hrs+'h '+mins+'m'):(mins+'m');
    var el=document.getElementById('lsHours');if(el)el.textContent=hoursStr;
    var el2=document.getElementById('lsHoursSub');if(el2)el2.textContent=hrs>0?(hrs+' hour'+(hrs!==1?'s':'')+(mins?' '+mins+'m':'')+' total'):(mins+' min total');

    // Files
    var fc=(s.filesOpened||[]).length;
    var ef=document.getElementById('lsFiles');if(ef)ef.textContent=fc;
    var efs=document.getElementById('lsFilesSub');if(efs)efs.textContent=fc+' unique PDF'+(fc!==1?'s':'');

    // Courses
    var cc=(s.coursesStudied||[]).length;
    var ec=document.getElementById('lsCourses');if(ec)ec.textContent=cc;
    var ecs=document.getElementById('lsCoursesSub');if(ecs)ecs.textContent=cc+' subject'+(cc!==1?'s':'');

    // AI
    var ea=document.getElementById('lsAI');if(ea)ea.textContent=(s.aiMessages||0);

    // Notes (count from DOM if available)
    var noteCards=document.querySelectorAll('#lnContent .ln-card');
    var en=document.getElementById('lsNotes');if(en)en.textContent=noteCards.length;

    // Games
    var eg=document.getElementById('lsGames');if(eg)eg.textContent=(s.gamesPlayed||0);

    // Streak
    var ev=document.getElementById('loungeStreakVal');if(ev)ev.textContent=(s.streak||0);
    var em=document.getElementById('loungeStreakMsg');
    if(em){
      var streak=s.streak||0;
      em.textContent=streak===0?'Start studying today to begin your streak!':streak===1?'Great start — come back tomorrow!':streak<7?'Keep it up, '+streak+' days strong!':'Amazing! '+streak+' day streak 🏆';
    }

    // Course chips
    var chips=document.getElementById('loungeCourseChips');
    if(chips){
      if(!s.coursesStudied||!s.coursesStudied.length){
        chips.innerHTML='<div class="lounge-empty-msg">No courses yet — open a subject to get started</div>';
      } else {
        chips.innerHTML=s.coursesStudied.map(function(c){return '<div class="lounge-course-chip">'+c+'</div>';}).join('');
      }
    }

    // Recent files
    var rl=document.getElementById('loungeRecentList');
    if(rl){
      if(!s.recentFiles||!s.recentFiles.length){
        rl.innerHTML='<div class="lounge-empty-msg">No files opened yet</div>';
      } else {
        rl.innerHTML=s.recentFiles.map(function(r){
          var ago=_timeAgo(r.ts);
          return '<div class="lounge-recent-item"><div class="lounge-recent-item-icon">&#x1F4C4;</div><div class="lounge-recent-item-name">'+r.name+'</div><div class="lounge-recent-item-course">'+r.course+(ago?' &middot; '+ago:'')+'</div></div>';
        }).join('');
      }
    }

    // Reset button
    var rb=document.getElementById('loungeResetBtn');
    if(rb&&!rb._wired){rb._wired=true;rb.addEventListener('click',function(){
      if(confirm('Reset all study stats? This cannot be undone.')){localStorage.removeItem(STATS_KEY);window._loungeRender();}
    });}
  };

  function _timeAgo(ts){
    if(!ts)return '';
    var diff=Date.now()-ts;
    var m=Math.floor(diff/60000);
    if(m<1)return 'just now';
    if(m<60)return m+'m ago';
    var h=Math.floor(m/60);if(h<24)return h+'h ago';
    var d=Math.floor(h/24);return d+'d ago';
  }
})();

// ── CHATBOT PAGE ───────────────────────────────────────────────────────────
(function(){
  var _history=[];   // current conversation [{role,content}]
  var _currentId=null; // id of the chat being shown (null = new unsaved)
  var _busy=false;
  var _inChat=false;
  var _stopTyping=false;
  var _typeTimer=null;
  var _userScrolledUp=false; // true when user manually scrolled away from bottom

  // ── Storage helpers ────────────────────────────────────────────────────
  function _storageKey(){
    // Use window._currentUser (set by supabase.js) — fall back to authName text
    var cu=window._currentUser;
    if(cu&&cu.id)return 'ss_chatbot_'+cu.id;
    var nameEl=document.getElementById('authName');
    var nm=nameEl?nameEl.textContent.trim():'';
    if(nm&&nm!=='Loading…'&&nm!=='Loading...')return 'ss_chatbot_name_'+nm;
    return 'ss_chatbot_default';
  }
  function _loadAll(){try{return JSON.parse(localStorage.getItem(_storageKey())||'[]');}catch(e){return[];}}
  function _saveAll(arr){try{localStorage.setItem(_storageKey(),JSON.stringify(arr));}catch(e){}}

  // Save / update the current conversation
  function _persistCurrent(){
    if(!_history.length)return;
    var all=_loadAll();
    var title=_history[0].content.slice(0,48)+(_history[0].content.length>48?'…':'');
    if(_currentId){
      var idx=all.findIndex(function(c){return c.id===_currentId;});
      if(idx>-1){all[idx].history=_history.slice();all[idx].title=title;}
      else{all.unshift({id:_currentId,title:title,history:_history.slice(),ts:Date.now()});}
    } else {
      _currentId='cb_'+Date.now();
      all.unshift({id:_currentId,title:title,history:_history.slice(),ts:Date.now()});
    }
    // Keep max 50 chats
    if(all.length>50)all=all.slice(0,50);
    _saveAll(all);
    _renderSidebar();
  }

  // ── Sidebar ───────────────────────────────────────────────────────────
  function _renderSidebar(){
    var list=document.getElementById('aipHistoryList');if(!list)return;
    var all=_loadAll();
    if(!all.length){list.innerHTML='<div class="aip-history-empty">'+_t('aip_no_chats')+'</div>';return;}
    list.innerHTML='';
    all.forEach(function(chat){
      var item=document.createElement('div');
      item.className='aip-history-item'+(chat.id===_currentId?' active':'');
      item.innerHTML='<span class="aip-history-item-title">'+_esc2(chat.title||'Chat')+'</span>'+
        '<button class="aip-history-del" data-id="'+chat.id+'" title="Delete">&#x2715;</button>';
      item.querySelector('.aip-history-item-title').addEventListener('click',function(){_openChat(chat.id);});
      item.querySelector('.aip-history-del').addEventListener('click',function(e){
        e.stopPropagation();_deleteChat(chat.id);
      });
      list.appendChild(item);
    });
  }

  function _openChat(id){
    var all=_loadAll();
    var chat=all.find(function(c){return c.id===id;});
    if(!chat)return;
    _currentId=id;
    _history=chat.history.slice();
    _busy=false;
    // Show chat view
    var landing=document.getElementById('aipLanding');
    var chatView=document.getElementById('aipChatView');
    if(landing)landing.style.display='none';
    if(chatView)chatView.style.display='flex';
    _inChat=true;
    // Render messages
    var msgs=document.getElementById('aipMsgs');
    if(msgs){
      msgs.innerHTML='';
      _history.forEach(function(m){
        var row=document.createElement('div');
        row.className='aip-msg-row '+(m.role==='user'?'user':'bot');
        row.innerHTML='<div class="aip-sender">'+(m.role==='user'?'You':'StudySphere AI')+'</div>'+
          '<div class="aip-bubble '+(m.role==='user'?'user':'bot')+'">'+(m.role==='user'?_esc(m.content):_rm(m.content))+'</div>';
        msgs.appendChild(row);
      });
      msgs.scrollTop=msgs.scrollHeight;
    }
    var titleEl=document.getElementById('aipChatTitle');
    if(titleEl)titleEl.textContent=chat.title||'Chat';
    // Re-enable send
    _stopTyping=true;if(_typeTimer){clearTimeout(_typeTimer);_typeTimer=null;}
    _stopTyping=false;_busy=false;
    _setStopMode(false);
    _renderSidebar();
  }

  function _deleteChat(id){
    var all=_loadAll().filter(function(c){return c.id!==id;});
    _saveAll(all);
    if(_currentId===id){_startNew();}
    else{_renderSidebar();}
  }

  // ── Markdown / escape ─────────────────────────────────────────────────
  function _rm(txt){
    if(typeof renderMarkdown==='function')return renderMarkdown(txt);
    return txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\n/g,'<br>');
  }
  function _esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}
  function _esc2(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // ── Views ─────────────────────────────────────────────────────────────
  function _enterChat(title){
    if(_inChat)return;
    _inChat=true;
    var landing=document.getElementById('aipLanding');
    var chatView=document.getElementById('aipChatView');
    if(landing)landing.style.display='none';
    if(chatView)chatView.style.display='flex';
    var titleEl=document.getElementById('aipChatTitle');
    if(titleEl)titleEl.textContent=title||'Chat';
  }

  function _startNew(){
    _stopTyping=true;if(_typeTimer){clearTimeout(_typeTimer);_typeTimer=null;}
    _history=[];_currentId=null;_busy=false;_inChat=false;_stopTyping=false;
    var msgs=document.getElementById('aipMsgs');if(msgs)msgs.innerHTML='';
    var landing=document.getElementById('aipLanding');
    var chatView=document.getElementById('aipChatView');
    if(landing)landing.style.display='';
    if(chatView)chatView.style.display='none';
    var sb=document.getElementById('aipSend');if(sb)sb.disabled=false;
    _setGreeting();
    _renderSidebar();
  }

  // ── Message helpers ───────────────────────────────────────────────────
  function _appendMsg(role,html){
    var msgs=document.getElementById('aipMsgs');if(!msgs)return null;
    var row=document.createElement('div');
    row.className='aip-msg-row '+role;
    row.innerHTML='<div class="aip-sender">'+(role==='user'?'You':'StudySphere AI')+'</div>'+
      '<div class="aip-bubble '+role+'">'+html+'</div>';
    msgs.appendChild(row);msgs.scrollTop=msgs.scrollHeight;
    return row;
  }

  function _appendThinking(){
    var msgs=document.getElementById('aipMsgs');if(!msgs)return null;
    var row=document.createElement('div');
    row.className='aip-msg-row bot';
    row.innerHTML='<div class="aip-sender">StudySphere AI</div>'+
      '<div class="aip-thinking"><span></span><span></span><span></span></div>';
    msgs.appendChild(row);msgs.scrollTop=msgs.scrollHeight;
    return row;
  }

  // ── Send ──────────────────────────────────────────────────────────────
  // ── Send button state ─────────────────────────────────────────────────
  var SEND_SVG='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var STOP_SVG='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>';

  function _setStopMode(on){
    var btn=document.getElementById('aipSend');
    if(!btn)return;
    if(on){
      btn.innerHTML=STOP_SVG;
      btn.classList.add('is-stop');
      btn.disabled=false;
      btn.title='Stop generating';
    } else {
      btn.innerHTML=SEND_SVG;
      btn.classList.remove('is-stop');
      btn.disabled=false;
      btn.title='';
    }
  }

  function _stopGeneration(bubble,raw){
    _stopTyping=true;
    if(_typeTimer){clearTimeout(_typeTimer);_typeTimer=null;}
    if(bubble)bubble.innerHTML=_rm(raw);
    _busy=false;
    _setStopMode(false);
  }

  // ── Greeting ──────────────────────────────────────────────────────────
  function _setGreeting(){
    var el=document.getElementById('aipGreeting');if(!el)return;
    var nameEl=document.getElementById('authName');
    var name=nameEl?nameEl.textContent.trim():'';
    if(name&&name!=='Loading…'&&name!=='Loading...')el.textContent='Hi '+name+' 👋';
    else el.textContent='Hi there 👋';
  }

  // ── Wire controls ─────────────────────────────────────────────────────
  // Detect manual scroll: stop auto-scroll while user is scrolled up
  var msgsEl2=document.getElementById('aipMsgs');
  if(msgsEl2){
    msgsEl2.addEventListener('scroll',function(){
      var distFromBottom=this.scrollHeight-this.scrollTop-this.clientHeight;
      _userScrolledUp=distFromBottom>60;
    });
  }

  var landingInput=document.getElementById('aipLandingInput');
  if(landingInput){
    landingInput.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();_send(this.value);}});
    landingInput.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,140)+'px';});
  }
  var landingSend=document.getElementById('aipLandingSend');
  if(landingSend)landingSend.addEventListener('click',function(){var inp=document.getElementById('aipLandingInput');if(inp)_send(inp.value);});

  var chatInput=document.getElementById('aipInput');
  if(chatInput){
    chatInput.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();_send(this.value);}});
    chatInput.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,140)+'px';});
  }
  var chatSend=document.getElementById('aipSend');
  if(chatSend)chatSend.addEventListener('click',function(){
    if(this.classList.contains('is-stop')){_stopTyping=true;return;}
    var inp=document.getElementById('aipInput');if(inp)_send(inp.value);
  });

  var clearBtn=document.getElementById('aipClearBtn');
  if(clearBtn)clearBtn.addEventListener('click',_startNew);

  var newChatBtn=document.getElementById('aipNewChatBtn');
  if(newChatBtn)newChatBtn.addEventListener('click',_startNew);

  var sugg=document.getElementById('aipSuggestions');
  if(sugg)sugg.addEventListener('click',function(e){
    var chip=e.target.closest('.aip-chip');if(!chip)return;
    var prompt=chip.getAttribute('data-prompt');if(prompt)_send(prompt);
  });

  // Sidebar toggle
  var sbToggle=document.getElementById('aipSbToggle');
  if(sbToggle)sbToggle.addEventListener('click',function(){
    var sb=document.getElementById('aipSidebar');
    if(sb)sb.classList.toggle('collapsed');
  });

  // ── File upload ───────────────────────────────────────────────────────
  // Each entry: {name, kind:'image'|'text'|'file', data:base64orText, mediaType}
  var _pendingFiles=[];

  function _renderFilePreview(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    el.innerHTML='';
    _pendingFiles.forEach(function(f,idx){
      var item=document.createElement('div');
      if(f.kind==='image'){
        item.className='aip-file-thumb-wrap';
        item.innerHTML='<img class="aip-file-thumb" src="data:'+f.mediaType+';base64,'+f.data+'" alt="'+_esc2(f.name)+'">'+
          '<button class="aip-file-chip-del" data-idx="'+idx+'" title="Remove">&#x2715;</button>';
      } else {
        item.className='aip-file-chip'+(f.loading?' aip-file-chip-loading':'');
        var label=f.loading?'Reading PDF…':_esc2(f.name.length>24?f.name.slice(0,22)+'…':f.name);
        item.innerHTML='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'+
          '<span title="'+_esc2(f.name)+'">'+label+'</span>'+
          (f.loading?'':'<button class="aip-file-chip-del" data-idx="'+idx+'" title="Remove">&#x2715;</button>');
      }
      var delBtn=item.querySelector('.aip-file-chip-del');
      if(delBtn)delBtn.addEventListener('click',function(){
        _pendingFiles.splice(+this.getAttribute('data-idx'),1);
        _renderFilePreview('aipLandingFilePreview');_renderFilePreview('aipChatFilePreview');
      });
      el.appendChild(item);
    });
  }

  function _refreshPreviews(){_renderFilePreview('aipLandingFilePreview');_renderFilePreview('aipChatFilePreview');}

  var PDF_PAGE_LIMIT=80;   // max pages to extract
  var PDF_CHAR_LIMIT=60000; // max characters sent to AI (~15k tokens)

  function _extractPdfText(arrayBuffer){
    return pdfjsLib.getDocument({
      data:new Uint8Array(arrayBuffer),
      cMapUrl:'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked:true
    }).promise.then(function(pdf){
      var total=pdf.numPages;
      var pagesToRead=Math.min(total,PDF_PAGE_LIMIT);
      var pageNums=[];for(var p=1;p<=pagesToRead;p++)pageNums.push(p);
      return pageNums.reduce(function(chain,pageNum){
        return chain.then(function(acc){
          return pdf.getPage(pageNum).then(function(page){
            return page.getTextContent().then(function(tc){
              var str=tc.items.map(function(it){return it.str;}).join(' ').replace(/\s+/g,' ').trim();
              if(str)acc.push('--- Page '+pageNum+' ---\n'+str);
              return acc;
            });
          });
        });
      },Promise.resolve([]));
    }).then(function(pages){
      var full=pages.join('\n\n');
      var truncated=full.length>PDF_CHAR_LIMIT;
      if(truncated)full=full.slice(0,PDF_CHAR_LIMIT);
      console.log('[PDF extract] pages extracted:',pages.length,'chars:',full.length,'truncated:',truncated);
      return full+(truncated?'\n\n[Content truncated — document is very large]':'');
    });
  }

  function _handleFileSelect(e){
    var files=Array.from(e.target.files||[]);
    var canAdd=10-_pendingFiles.length;
    var pending=files.filter(function(f){
      return !_pendingFiles.find(function(x){return x.name===f.name;});
    }).slice(0,canAdd>0?canAdd:0);
    var done=0;
    if(!pending.length){e.target.value='';return;}
    function tick(){if(++done===pending.length){e.target.value='';_refreshPreviews();}}
    pending.forEach(function(f){
      var reader=new FileReader();
      if(f.type.startsWith('image/')){
        reader.onload=function(ev){
          _pendingFiles.push({name:f.name,kind:'image',data:ev.target.result.split(',')[1],mediaType:f.type});
          tick();
        };
        reader.readAsDataURL(f);
      } else if(f.type==='text/plain'||f.name.endsWith('.txt')){
        reader.onload=function(ev){
          _pendingFiles.push({name:f.name,kind:'text',data:ev.target.result});
          tick();
        };
        reader.readAsText(f);
      } else if(f.type==='application/pdf'||f.name.toLowerCase().endsWith('.pdf')){
        // Show placeholder while reading
        var placeholder={name:f.name,kind:'file',data:null,loading:true};
        _pendingFiles.push(placeholder);
        _refreshPreviews();
        reader.onload=function(ev){
          _extractPdfText(ev.target.result).then(function(text){
            var idx=_pendingFiles.indexOf(placeholder);
            if(idx>-1)_pendingFiles[idx]={name:f.name,kind:'text',data:text||'(no text content extracted)'};
            tick();
          }).catch(function(err){
            console.error('[PDF extract error]',err);
            var idx=_pendingFiles.indexOf(placeholder);
            if(idx>-1)_pendingFiles[idx]={name:f.name,kind:'text',data:'(could not extract text from this PDF)'};
            tick();
          });
        };
        reader.readAsArrayBuffer(f);
      } else {
        _pendingFiles.push({name:f.name,kind:'file',data:null});
        tick();
      }
    });
  }

  var lfi=document.getElementById('aipLandingFileInput');if(lfi)lfi.addEventListener('change',_handleFileSelect);
  var cfi=document.getElementById('aipChatFileInput');if(cfi)cfi.addEventListener('change',_handleFileSelect);

  // Append user message with file attachments shown above bubble
  function _appendUserMsgWithFiles(text,files){
    var msgs=document.getElementById('aipMsgs');if(!msgs)return null;
    var row=document.createElement('div');row.className='aip-msg-row user';
    var attachHtml='';
    files.forEach(function(f){
      if(f.kind==='image'){
        attachHtml+='<img class="aip-msg-thumb" src="data:'+f.mediaType+';base64,'+f.data+'" alt="'+_esc2(f.name)+'">';
      } else {
        attachHtml+='<div class="aip-msg-file-chip">'+
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'+
          _esc2(f.name)+'</div>';
      }
    });
    row.innerHTML='<div class="aip-sender">You</div>'+
      (attachHtml?'<div class="aip-msg-attachments">'+attachHtml+'</div>':'')+
      (text?'<div class="aip-bubble user">'+_esc(text)+'</div>':'');
    msgs.appendChild(row);msgs.scrollTop=msgs.scrollHeight;
    return row;
  }

  function _send(text){
    text=(text||'').trim();
    var filesToSend=_pendingFiles.slice();
    if(!text&&!filesToSend.length)return;
    if(_busy)return;
    if(filesToSend.some(function(f){return f.loading;})){showToast('PDF still reading','Wait a moment then try again.');return;}
    _pendingFiles=[];
    _renderFilePreview('aipLandingFilePreview');_renderFilePreview('aipChatFilePreview');

    var isFirst=!_history.length;
    var displayText=text||(filesToSend.length?'['+filesToSend.map(function(f){return f.name;}).join(', ')+']':'');
    var title=displayText.slice(0,48)+(displayText.length>48?'…':'');
    _enterChat(title);

    // Build Claude content array for API
    var apiContent=[];
    filesToSend.forEach(function(f){
      if(f.kind==='image'){
        apiContent.push({type:'image',source:{type:'base64',media_type:f.mediaType,data:f.data}});
      } else if(f.kind==='text'){
        apiContent.push({type:'text',text:'<document filename="'+f.name+'">\n'+f.data+'\n</document>'});
      } else {
        apiContent.push({type:'text',text:'(The file "'+f.name+'" is a binary format that could not be read as text.)'});
      }
    });
    if(text)apiContent.push({type:'text',text:text});

    // Store in history as text (no base64 — too large for localStorage)
    var historyText=filesToSend.map(function(f){
      if(f.kind==='image')return '[Image: '+f.name+']';
      if(f.kind==='text')return '<document filename="'+f.name+'">\n'+f.data+'\n</document>';
      return '(The file "'+f.name+'" is a binary format that could not be read as text.)';
    }).join('\n')+(text?'\n'+text:'');
    _history.push({role:'user',content:historyText.trim()});

    // Show in DOM
    if(filesToSend.length){
      _appendUserMsgWithFiles(text,filesToSend);
    } else {
      _appendMsg('user',_esc(text));
    }

    // Update title + save immediately
    var te=document.getElementById('aipChatTitle');if(te)te.textContent=title;
    _persistCurrent();

    var li=document.getElementById('aipLandingInput');if(li){li.value='';li.style.height='auto';}
    var ci=document.getElementById('aipInput');if(ci){ci.value='';ci.style.height='auto';}
    var sb2=document.getElementById('aipLandingSend');if(sb2)sb2.disabled=true;
    _busy=true;_stopTyping=false;_userScrolledUp=false;_setStopMode(true);

    var thinkRow=_appendThinking();

    // Build messages for API — previous history as text, current as content array
    var apiMessages=_history.slice(-20,-1).map(function(m){return {role:m.role,content:m.content};});
    apiMessages.push({role:'user',content:apiContent.length===1&&apiContent[0].type==='text'?apiContent[0].text:apiContent});

    // DEBUG — open DevTools Console to see this
    console.log('[AIP] files in this message:', filesToSend.map(function(f){return {name:f.name,kind:f.kind,chars:f.data?f.data.length:0,preview:f.data?f.data.slice(0,120):null};}));
    console.log('[AIP] last user content (first 300 chars):', JSON.stringify(apiMessages[apiMessages.length-1].content).slice(0,300));

    fetch(BACKEND_URL+'/api/ai',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:1024,
        system:'You are StudySphere AI, a friendly and knowledgeable assistant for university students. Always reply in '+(window._lang==='de'?'German':'English')+'. Answer any question clearly and helpfully. Use markdown: **bold**, `code`, ### headers, - lists. Be concise but thorough.\n\nIMPORTANT: When the user\'s message contains <document> tags, those tags contain the FULL extracted text of an uploaded file. You CAN read and answer questions about this content — treat it as the complete document. Never say you cannot read a file when its content is provided inside <document> tags.',
        messages:apiMessages
      })
    })
    .then(function(r){
      if(!r.ok){return r.text().then(function(t){throw new Error('Server '+r.status+': '+t.slice(0,200));});}
      return r.json();
    })
    .then(function(data){
      if(thinkRow)thinkRow.remove();
      var raw=data.error?('❌ Error: '+(data.error.message||JSON.stringify(data.error))):(data.content?data.content.map(function(b){return b.text||'';}).join(''):'No response.');
      _history.push({role:'assistant',content:raw});
      _persistCurrent();
      var row=document.createElement('div');
      row.className='aip-msg-row bot';
      row.innerHTML='<div class="aip-sender">StudySphere AI</div><div class="aip-bubble bot"></div>';
      var msgsEl=document.getElementById('aipMsgs');if(msgsEl){msgsEl.appendChild(row);msgsEl.scrollTop=msgsEl.scrollHeight;}
      var bubble=row.querySelector('.aip-bubble.bot');
      var i=0;
      function typeNext(){
        if(_stopTyping){var partial=raw.slice(0,i);bubble.innerHTML=_rm(partial);_history[_history.length-1].content=partial;_persistCurrent();_busy=false;_setStopMode(false);if(sb2)sb2.disabled=false;var m=document.getElementById('aipMsgs');if(m)m.scrollTop=m.scrollHeight;return;}
        if(i>=raw.length){bubble.innerHTML=_rm(raw);_busy=false;_setStopMode(false);if(sb2)sb2.disabled=false;var m=document.getElementById('aipMsgs');if(m)m.scrollTop=m.scrollHeight;return;}
        bubble.innerHTML=_rm(raw.slice(0,i+1));i++;
        var m=document.getElementById('aipMsgs');if(m&&!_userScrolledUp)m.scrollTop=m.scrollHeight;
        _typeTimer=setTimeout(typeNext,14+(Math.random()>0.93?50:0));
      }
      typeNext();
    })
    .catch(function(e){
      if(thinkRow)thinkRow.remove();
      _appendMsg('bot','❌ Error: '+e.message);
      _busy=false;_setStopMode(false);if(sb2)sb2.disabled=false;
    });
  }

  // Expose for external calls (e.g. when section is opened)
  window._aipRefreshSidebar=function(){
    _setGreeting();
    _renderSidebar();
  };

  // Init — sidebar will be refreshed properly when section is opened
  _setGreeting();
  setTimeout(function(){_setGreeting();_renderSidebar();},800);
})();

// ── CHAT ──────────────────────────────────────────────────────────────────
var _chatRoomId = null;
var _chatPollTimer = null;
var _chatLastTs = null;
var _chatFriends = []; // [{id, otherId, status, isSender, profile:{id,full_name,programme}}]
var _chatUsername = null;

function _chatEsc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _chatDmRoomId(uid1, uid2) {
  return 'dm_' + [uid1, uid2].sort().join('_');
}

// ── Friends loading ────────────────────────────────────────────────────────
async function _chatLoadFriends() {
  if (!_currentUser) return;
  try {
    var url = SUPA_URL + '/rest/v1/friendships?or=(user_id.eq.' + _currentUser.id + ',friend_id.eq.' + _currentUser.id + ')&select=id,user_id,friend_id,status';
    var res = await fetch(url, { headers: _sbHeaders() });
    var rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) { _chatFriends = []; return; }

    var otherIds = rows.map(function(r) {
      return r.user_id === _currentUser.id ? r.friend_id : r.user_id;
    });
    var profUrl = SUPA_URL + '/rest/v1/profiles?id=in.(' + otherIds.map(encodeURIComponent).join(',') + ')&select=id,full_name,programme';
    var pRes = await fetch(profUrl, { headers: _sbHeaders() });
    var profiles = await pRes.json();
    var profMap = {};
    if (Array.isArray(profiles)) profiles.forEach(function(p) { profMap[p.id] = p; });

    _chatFriends = rows.map(function(r) {
      var otherId = r.user_id === _currentUser.id ? r.friend_id : r.user_id;
      return { id: r.id, otherId: otherId, status: r.status, isSender: r.user_id === _currentUser.id, profile: profMap[otherId] || { id: otherId, full_name: 'Unknown' } };
    });
  } catch(e) { console.warn('Load friends error:', e); _chatFriends = []; }
}

async function _chatAcceptFriend(friendshipId) {
  try {
    await fetch(SUPA_URL + '/rest/v1/friendships?id=eq.' + encodeURIComponent(friendshipId), {
      method: 'PATCH',
      headers: Object.assign(_sbHeaders(), { 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ status: 'accepted' })
    });
    await _chatLoadFriends();
    _chatRenderRooms();
  } catch(e) { console.warn('Accept friend error:', e); }
}

// ── Rooms + friends render ─────────────────────────────────────────────────
function _chatGetRooms() {
  var rooms = [{ id: 'general', name: '# General', icon: '&#x1F310;' }];
  var seen = {};
  Object.keys(SEMS).forEach(function(sid) {
    var sem = SEMS[sid];
    if (!sem.courses || !sem.courses.length) return;
    sem.courses.forEach(function(c) {
      if (seen[c.id]) return;
      seen[c.id] = true;
      rooms.push({ id: 'course_' + c.id, name: c.short || c.name, icon: '&#x1F4DA;', fullName: c.name });
    });
  });
  return rooms;
}

function _chatRenderRooms() {
  var list = document.getElementById('chatRoomsList');
  if (!list) return;
  var rooms = _chatGetRooms();
  list.innerHTML = '';

  // ── Rooms section ──
  var genLabel = document.createElement('div');
  genLabel.className = 'chat-rooms-section-label';
  genLabel.textContent = 'General';
  list.appendChild(genLabel);

  rooms.forEach(function(r, i) {
    if (i === 1) {
      var courseLabel = document.createElement('div');
      courseLabel.className = 'chat-rooms-section-label';
      courseLabel.textContent = 'Courses';
      list.appendChild(courseLabel);
    }
    var div = document.createElement('div');
    div.className = 'chat-room-item' + (r.id === _chatRoomId ? ' active' : '');
    div.dataset.rid = r.id;
    div.innerHTML = '<span class="chat-room-icon">' + r.icon + '</span><span class="chat-room-label" title="' + _chatEsc(r.fullName || r.name) + '">' + _chatEsc(r.name) + '</span>';
    div.addEventListener('click', function() { _chatOpenRoom(r.id, r.fullName || r.name); });
    list.appendChild(div);
  });

  if (rooms.length === 1) {
    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:.72rem;color:var(--on-glass-faint);padding:8px 10px;font-weight:700';
    hint.textContent = 'Add courses to see course rooms';
    list.appendChild(hint);
  }

  // ── Direct Messages section ──
  var dmLabel = document.createElement('div');
  dmLabel.className = 'chat-rooms-section-label';
  dmLabel.style.marginTop = '8px';
  dmLabel.textContent = 'Direct Messages';
  list.appendChild(dmLabel);

  var accepted = _chatFriends.filter(function(f) { return f.status === 'accepted'; });
  var pending  = _chatFriends.filter(function(f) { return f.status === 'pending' && !f.isSender; }); // received requests

  if (!accepted.length && !pending.length) {
    var dm0 = document.createElement('div');
    dm0.style.cssText = 'font-size:.72rem;color:var(--on-glass-faint);padding:6px 10px 4px;font-weight:700';
    dm0.textContent = 'No friends yet — use + to add one';
    list.appendChild(dm0);
  }

  // Pending incoming requests — show with Accept button
  pending.forEach(function(f) {
    var name = f.profile.full_name || 'Student';
    var row = document.createElement('div');
    row.className = 'chat-friend-pending';
    row.innerHTML = '<span class="chat-friend-pending-name" title="' + _chatEsc(name) + '">&#x23F3; ' + _chatEsc(name) + '</span>' +
      '<button class="chat-friend-accept-btn">Accept</button>';
    row.querySelector('button').addEventListener('click', function(e) {
      e.stopPropagation();
      _chatAcceptFriend(f.id);
    });
    list.appendChild(row);
  });

  // Accepted friends — DM rooms
  accepted.forEach(function(f) {
    var name = f.profile.full_name || 'Student';
    var initial = name.charAt(0).toUpperCase();
    var dmId = _chatDmRoomId(_currentUser.id, f.otherId);
    var row = document.createElement('div');
    row.className = 'chat-friend-item' + (dmId === _chatRoomId ? ' active' : '');
    row.dataset.rid = dmId;
    row.innerHTML = '<div class="chat-friend-avatar">' + _chatEsc(initial) + '</div>' +
      '<span class="chat-friend-name" title="' + _chatEsc(name) + '">' + _chatEsc(name) + '</span>';
    row.addEventListener('click', function() { _chatOpenRoom(dmId, name); });
    list.appendChild(row);
  });
}

// ── Room open / messages ───────────────────────────────────────────────────
async function _chatOpenRoom(roomId, roomName) {
  if (_chatRoomId === roomId) return;
  clearInterval(_chatPollTimer);
  _chatRoomId = roomId;
  _chatLastTs = null;

  var nameEl = document.getElementById('chatRoomName');
  if (nameEl) nameEl.textContent = roomName;

  document.querySelectorAll('.chat-room-item, .chat-friend-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.rid === roomId);
  });

  var inp = document.getElementById('chatInput');
  var btn = document.getElementById('chatSendBtn');
  if (inp) { inp.disabled = false; inp.placeholder = 'Type a message...'; }
  if (btn) btn.disabled = false;

  var msgs = document.getElementById('chatMsgs');
  if (msgs) msgs.innerHTML = '<div class="chat-loading">Loading&#x2026;</div>';

  await _chatLoad(true);
  _chatPollTimer = setInterval(function() { _chatLoad(false); }, 3000);
}

async function _chatLoad(initial) {
  if (!_chatRoomId || !_currentUser) return;
  try {
    var url = SUPA_URL + '/rest/v1/messages?room_id=eq.' + encodeURIComponent(_chatRoomId);
    if (!initial && _chatLastTs) {
      url += '&created_at=gt.' + encodeURIComponent(_chatLastTs);
    }
    url += '&order=created_at.asc&limit=' + (initial ? '60' : '30');

    var res = await fetch(url, { headers: _sbHeaders() });
    var data = await res.json();
    if (!Array.isArray(data)) return;

    var msgs = document.getElementById('chatMsgs');
    if (!msgs) return;

    if (initial) {
      msgs.innerHTML = '';
      if (!data.length) {
        msgs.innerHTML = '<div class="chat-empty">No messages yet &#x1F44B; Say hello!</div>';
        return;
      }
    }
    if (!data.length) return;

    _chatLastTs = data[data.length - 1].created_at;
    var atBottom = msgs.scrollHeight - msgs.scrollTop <= msgs.clientHeight + 80;

    var lastDate = null;
    data.forEach(function(m) {
      var d = new Date(m.created_at);
      var dateStr = d.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });
      if (dateStr !== lastDate) {
        lastDate = dateStr;
        var div = document.createElement('div');
        div.className = 'chat-date-divider';
        div.textContent = dateStr;
        msgs.appendChild(div);
      }
      var isMe = m.user_id === _currentUser.id;
      var wrap = document.createElement('div');
      wrap.className = 'chat-msg' + (isMe ? ' chat-msg-me' : '');
      var time = d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      wrap.innerHTML =
        (isMe ? '' : '<div class="chat-msg-name">' + _chatEsc(m.display_name || 'Student') + '</div>') +
        '<div class="chat-msg-bubble">' + _chatEsc(m.content) + '</div>' +
        '<div class="chat-msg-time">' + time + '</div>';
      msgs.appendChild(wrap);
    });

    if (initial || atBottom) msgs.scrollTop = msgs.scrollHeight;
  } catch(e) { console.warn('Chat load error:', e); }
}

async function _chatSend() {
  if (!_currentUser || !_chatRoomId) return;
  var inp = document.getElementById('chatInput');
  if (!inp) return;
  var content = inp.value.trim();
  if (!content) return;
  inp.value = '';

  var displayName = (document.getElementById('authName') || {}).textContent || 'Student';
  try {
    await fetch(SUPA_URL + '/rest/v1/messages', {
      method: 'POST',
      headers: Object.assign(_sbHeaders(), { 'Prefer': 'return=minimal' }),
      body: JSON.stringify({
        room_id: _chatRoomId,
        user_id: _currentUser.id,
        display_name: displayName,
        content: content
      })
    });
    await _chatLoad(false);
  } catch(e) { console.warn('Chat send error:', e); }
}

// ── Add Friend modal ───────────────────────────────────────────────────────
(function(){
  var modal = document.getElementById('chatFriendModal');
  var openBtn = document.getElementById('chatAddFriendBtn');
  var closeBtn = document.getElementById('chatFriendModalClose');
  var searchInp = document.getElementById('chatFriendSearchInput');
  var results = document.getElementById('chatFriendResults');
  if (!modal || !openBtn) return;

  openBtn.addEventListener('click', function() { modal.classList.add('open'); if(searchInp){searchInp.value='';searchInp.focus();} if(results) results.innerHTML='<div class="chat-friend-hint">Type a name to search for students</div>'; });
  if (closeBtn) closeBtn.addEventListener('click', function() { modal.classList.remove('open'); });
  modal.addEventListener('click', function(e) { if(e.target===modal) modal.classList.remove('open'); });

  var _searchTimer = null;
  if (searchInp) {
    searchInp.addEventListener('input', function() {
      clearTimeout(_searchTimer);
      var q = searchInp.value.trim();
      if (!q) { results.innerHTML='<div class="chat-friend-hint">Type a name to search for students</div>'; return; }
      _searchTimer = setTimeout(function() { _chatDoSearch(q, results); }, 350);
    });
  }
})();

async function _chatDoSearch(q, resultsEl) {
  if (!resultsEl) return;
  resultsEl.innerHTML = '<div class="chat-friend-hint">Searching&#x2026;</div>';
  try {
    var qEnc = encodeURIComponent(q).replace(/%40/g, '@');
    var sel = 'select=id,full_name,email,auth_email,chat_username,programme&limit=8';
    var seen = {};
    var data = [];

    // Search by full_name
    var r1 = await fetch(SUPA_URL + '/rest/v1/profiles?full_name=ilike.*' + qEnc + '*&' + sel, { headers: _sbHeaders() });
    var d1 = await r1.json();
    if (Array.isArray(d1)) d1.forEach(function(p){ if(!seen[p.id]){seen[p.id]=true;data.push(p);} });

    // Search by auth_email (Google/login email)
    var r2 = await fetch(SUPA_URL + '/rest/v1/profiles?auth_email=ilike.*' + qEnc + '*&' + sel, { headers: _sbHeaders() });
    var d2 = await r2.json();
    if (Array.isArray(d2)) d2.forEach(function(p){ if(!seen[p.id]){seen[p.id]=true;data.push(p);} });

    // Search by TU-Mail email field
    var r3 = await fetch(SUPA_URL + '/rest/v1/profiles?email=ilike.*' + qEnc + '*&' + sel, { headers: _sbHeaders() });
    var d3 = await r3.json();
    if (Array.isArray(d3)) d3.forEach(function(p){ if(!seen[p.id]){seen[p.id]=true;data.push(p);} });

    // Search by chat_username
    var r4 = await fetch(SUPA_URL + '/rest/v1/profiles?chat_username=ilike.*' + qEnc + '*&' + sel, { headers: _sbHeaders() });
    var d4 = await r4.json();
    if (Array.isArray(d4)) d4.forEach(function(p){ if(!seen[p.id]){seen[p.id]=true;data.push(p);} });

    var filtered = data.filter(function(p) { return p.id !== (_currentUser && _currentUser.id); });
    if (!filtered.length) { resultsEl.innerHTML='<div class="chat-friend-hint">No students found</div>'; return; }

    resultsEl.innerHTML = '';
    filtered.forEach(function(p) {
      var existing = _chatFriends.find(function(f) { return f.otherId === p.id; });
      var initial = (p.full_name || '?').charAt(0).toUpperCase();
      var row = document.createElement('div');
      row.className = 'chat-friend-result-row';
      var btnHtml;
      if (existing && existing.status === 'accepted') {
        btnHtml = '<button class="chat-friend-req-btn" disabled>Friends &#x2713;</button>';
      } else if (existing && existing.isSender) {
        btnHtml = '<button class="chat-friend-req-btn" disabled>Pending&#x2026;</button>';
      } else if (existing && !existing.isSender) {
        btnHtml = '<button class="chat-friend-req-btn" data-fid="' + _chatEsc(existing.id) + '" data-action="accept">Accept</button>';
      } else {
        btnHtml = '<button class="chat-friend-req-btn" data-uid="' + _chatEsc(p.id) + '" data-action="add">Add Friend</button>';
      }
      row.innerHTML =
        '<div class="chat-friend-result-avatar">' + _chatEsc(initial) + '</div>' +
        '<div class="chat-friend-result-info"><div class="chat-friend-result-name">' + _chatEsc(p.full_name || 'Student') + '</div>' +
        '<div class="chat-friend-result-prog">' + _chatEsc((p.chat_username ? '@' + p.chat_username + ' · ' : '') + (p.auth_email || p.email || p.programme || '')) + '</div></div>' + btnHtml;

      var btn = row.querySelector('button[data-action]');
      if (btn) {
        btn.addEventListener('click', async function() {
          btn.disabled = true;
          if (btn.dataset.action === 'add') {
            await _chatSendFriendReq(btn.dataset.uid);
            btn.textContent = 'Pending\u2026';
          } else if (btn.dataset.action === 'accept') {
            await _chatAcceptFriend(btn.dataset.fid);
            btn.textContent = 'Friends \u2713';
          }
        });
      }
      resultsEl.appendChild(row);
    });
  } catch(e) { resultsEl.innerHTML='<div class="chat-friend-hint">Search failed</div>'; }
}

async function _chatSendFriendReq(friendId) {
  if (!_currentUser) return;
  try {
    await fetch(SUPA_URL + '/rest/v1/friendships', {
      method: 'POST',
      headers: Object.assign(_sbHeaders(), { 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ user_id: _currentUser.id, friend_id: friendId, status: 'pending' })
    });
    await _chatLoadFriends();
    _chatRenderRooms();
  } catch(e) { console.warn('Send friend req error:', e); }
}

// ── Username setup modal ───────────────────────────────────────────────────
function _chatShowUsernameModal() {
  var modal = document.getElementById('chatUsernameModal');
  if (modal) { modal.style.display = 'flex'; }
}

function _chatHideUsernameModal() {
  var modal = document.getElementById('chatUsernameModal');
  if (modal) { modal.style.display = 'none'; }
}

async function _chatSaveUsername() {
  var inp = document.getElementById('chatUsernameInput');
  var err = document.getElementById('chatUsernameErr');
  var btn = document.getElementById('chatUsernameSaveBtn');
  if (!inp) return;
  var val = inp.value.trim().replace(/\s+/g, '_').toLowerCase();
  if (!val || val.length < 3) { if(err){err.textContent='Username must be at least 3 characters.';err.style.display='block';} return; }
  if (!/^[a-z0-9_]+$/.test(val)) { if(err){err.textContent='Only letters, numbers, and underscores allowed.';err.style.display='block';} return; }
  if (err) err.style.display = 'none';
  if (btn) btn.disabled = true;
  try {
    // Check uniqueness
    var chk = await fetch(SUPA_URL + '/rest/v1/profiles?chat_username=eq.' + encodeURIComponent(val) + '&select=id', { headers: _sbHeaders() });
    var chkData = await chk.json();
    if (Array.isArray(chkData) && chkData.length && chkData[0].id !== _currentUser.id) {
      if(err){err.textContent='That username is already taken.';err.style.display='block';}
      if(btn) btn.disabled = false;
      return;
    }
    await fetch(SUPA_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(_currentUser.id), {
      method: 'PATCH',
      headers: Object.assign(_sbHeaders(), { 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ chat_username: val })
    });
    _chatUsername = val;
    _chatHideUsernameModal();
    _chatRenderRooms();
    _chatLoadFriends().then(function() { _chatRenderRooms(); });
    if (!_chatRoomId) _chatOpenRoom('general', '# General');
  } catch(e) {
    if(err){err.textContent='Something went wrong. Try again.';err.style.display='block';}
  }
  if(btn) btn.disabled = false;
}

(function() {
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'chatUsernameSaveBtn') _chatSaveUsername();
  });
  document.addEventListener('keydown', function(e) {
    var modal = document.getElementById('chatUsernameModal');
    if (modal && modal.style.display === 'flex' && e.key === 'Enter') _chatSaveUsername();
  });
})();

// ── Init ───────────────────────────────────────────────────────────────────
function _chatInit() {
  if (!_chatUsername) {
    // Fetch fresh from DB to be sure (profile may not have loaded yet)
    if (_currentUser) {
      fetch(SUPA_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(_currentUser.id) + '&select=chat_username', { headers: _sbHeaders() })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (Array.isArray(d) && d[0] && d[0].chat_username) {
            _chatUsername = d[0].chat_username;
            _chatRenderRooms();
            _chatLoadFriends().then(function() { _chatRenderRooms(); });
            if (!_chatRoomId) _chatOpenRoom('general', '# General');
          } else {
            _chatShowUsernameModal();
          }
        }).catch(function() { _chatShowUsernameModal(); });
    }
  } else {
    _chatRenderRooms();
    _chatLoadFriends().then(function() { _chatRenderRooms(); });
    if (!_chatRoomId) _chatOpenRoom('general', '# General');
  }
}

// Chat input wiring
(function(){
  var inp = document.getElementById('chatInput');
  var btn = document.getElementById('chatSendBtn');
  if (!inp || !btn) return;
  btn.addEventListener('click', _chatSend);
  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _chatSend(); }
  });
})();

// Stop polling when leaving chat section
var _origShowPortalSectionForChat = showPortalSection;
showPortalSection = function(sec) {
  if (sec !== 'chat' && _chatPollTimer) {
    clearInterval(_chatPollTimer);
    _chatPollTimer = null;
  }
  _origShowPortalSectionForChat(sec);
};

// ── Widget Dashboard ──────────────────────────────────────────────────────
(function(){
  var COLS=4, ROW_H=160, GAP=14;

  var DEFS=[
    {type:'today',    icon:'📅',name:"Today's Calendar",cols:2,rows:2,desc:'Your schedule for today'},
    {type:'courses',  icon:'📚',name:'Course Shortcuts', cols:2,rows:1,desc:'Jump into any course'},
    {type:'mail',     icon:'✉️', name:'New Mails',        cols:2,rows:2,desc:'Unread messages only'},
    {type:'notes',    icon:'📝',name:'Quick Notes',       cols:2,rows:2,desc:'Personal scratch pad'},
    {type:'stats',    icon:'📊',name:'Study Stats',       cols:2,rows:1,desc:'Weekly progress'},
    {type:'deadlines',icon:'⏰',name:'Deadlines',         cols:2,rows:2,desc:'Upcoming due dates'},
    {type:'weather',  icon:'🌤️',name:'Campus Weather',   cols:1,rows:1,desc:'Braunschweig forecast'},
    {type:'ai',       icon:'🤖',name:'AI Quick Chat',     cols:2,rows:1,desc:'Ask anything instantly'},
  ];

  var now=new Date();
  var DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MONS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var SCHEDULE={
    0:[{time:'10:00',name:'Study session',color:'#7C3AED'},{time:'14:00',name:'Lab report prep',color:'#F59E0B'}],
    1:[{time:'08:00',name:'Mathematik III',room:'PK 2.2',color:'#2563EB'},{time:'10:00',name:'Algorithmen & DS',room:'IZ 160',color:'#7C3AED'},{time:'14:00',name:'Softwaretechnik',room:'SN 19.2',color:'#22C55E'}],
    2:[{time:'09:00',name:'Analysis I',room:'SN 19.1',color:'#F59E0B'},{time:'13:00',name:'Physik Praktikum',room:'PK 4.4',color:'#2563EB'}],
    3:[{time:'08:00',name:'Mathematik III',room:'PK 2.2',color:'#2563EB'},{time:'11:00',name:'Informatik II',room:'IZ 305',color:'#7C3AED'},{time:'16:00',name:'Tutorium Analysis',room:'PK 3.3',color:'#22C55E'}],
    4:[{time:'10:00',name:'Algorithmen & DS',room:'IZ 160',color:'#7C3AED'},{time:'14:00',name:'Softwaretechnik',room:'SN 19.2',color:'#22C55E'}],
    5:[{time:'08:00',name:'Analysis I',room:'SN 19.1',color:'#F59E0B'},{time:'12:00',name:'Seminar',room:'IZ 105',color:'#2563EB'}],
    6:[]
  };

  function widgetBody(type){
    var day=now.getDay(),evs=SCHEDULE[day]||[];
    if(type==='today'){
      var evHtml=evs.length?evs.map(function(e){
        return '<div class="tw-event"><span class="tw-dot" style="background:'+e.color+'"></span>'+
               '<span class="tw-time">'+e.time+'</span><span class="tw-name">'+e.name+'</span>'+
               (e.room?'<span class="tw-room">'+e.room+'</span>':'')+
               '</div>';}).join(''):'<div class="tw-none">No classes today \uD83C\uDF89</div>';
      return '<div class="tw-date">'+DAYS[day]+', '+MONS[now.getMonth()]+' '+now.getDate()+'</div>'+evHtml;
    }
    if(type==='courses')
      return '<div class="cw-pills">'+['Mathematik III','Algorithmen & DS','Softwaretechnik','Analysis I','Physik','Informatik II'].map(function(c){return '<span class="cw-pill">'+c+'</span>';}).join('')+'</div>';
    if(type==='mail')
      return '<div class="mw-badge">3 unread</div>'+
        [{av:'P',from:'Prof. M\xFCller',subj:'\xDCbungsblatt 5 \u2014 Abgabe Freitag',t:'10:34',g:'linear-gradient(135deg,#2563EB,#7C3AED)'},
         {av:'S',from:'Stud.IP System',subj:'New material in Mathematik III',t:'09:12',g:'linear-gradient(135deg,#7C3AED,#22C55E)'},
         {av:'T',from:'TU Braunschweig',subj:'Semesterticket Verl\xE4ngerung',t:'Ges.',g:'linear-gradient(135deg,#F59E0B,#2563EB)'}
        ].map(function(m){return '<div class="mw-row"><div class="mw-av" style="background:'+m.g+'">'+m.av+'</div>'+
          '<div class="mw-info"><div class="mw-from">'+m.from+'</div><div class="mw-subj">'+m.subj+'</div></div>'+
          '<div class="mw-t">'+m.t+'</div></div>';}).join('');
    if(type==='notes')
      return '<textarea class="nw-ta" placeholder="Start typing your notes\u2026" spellcheck="false"></textarea>';
    if(type==='stats')
      return '<div class="sw-chips"><div class="sw-chip"><div class="sw-val">12</div><div class="sw-lbl">PDFs</div></div>'+
             '<div class="sw-chip"><div class="sw-val">28</div><div class="sw-lbl">AI chats</div></div>'+
             '<div class="sw-chip"><div class="sw-val">14h</div><div class="sw-lbl">This week</div></div></div>'+
             '<div class="sw-bar-row"><span>Weekly goal</span><span>70%</span></div>'+
             '<div class="sw-bar"><div class="sw-bar-fill" style="width:70%"></div></div>';
    if(type==='deadlines')
      return [{c:'#ef4444',n:'\xDCbungsblatt 5 Abgabe',d:'Fri 28 Mar'},{c:'#F59E0B',n:'Praktikumsbericht',d:'2 Apr'},
              {c:'#22C55E',n:'Klausur Anmeldung',d:'15 Apr'},{c:'#7C3AED',n:'Seminararbeit',d:'30 Apr'}
             ].map(function(x){return '<div class="dlw-row"><span class="dlw-dot" style="background:'+x.c+'"></span>'+
               '<span class="dlw-name">'+x.n+'</span><span class="dlw-date">'+x.d+'</span></div>';}).join('');
    if(type==='weather')
      return '<div class="ww-temp">12\xB0</div><div class="ww-desc">\u26C5 Partly cloudy</div><div class="ww-loc">Braunschweig</div>';
    if(type==='ai')
      return '<div class="aw-row"><input class="aw-in" placeholder="Ask AI anything\u2026"/><button class="aw-btn">\u2192</button></div>'+
             '<div class="aw-hint">Powered by StudySphere AI</div>';
    return '';
  }

  var state=[],uid=1;
  var canvas=document.getElementById('dashCanvas');
  var empty=document.getElementById('dashEmpty');
  var fab=document.getElementById('addWidgetFab');
  var panel=document.getElementById('widgetPanel');
  var overlay=document.getElementById('wpOverlay');
  var wpGrid=document.getElementById('wpGrid');
  var ghost=document.getElementById('dragGhost');
  if(!canvas||!fab||!panel||!overlay||!wpGrid||!ghost){return;}
  var dragging=null,resizing=null;

  function overlap(a,b){return !(a.col+a.cs<=b.col||b.col+b.cs<=a.col||a.row+a.rs<=b.row||b.row+b.rs<=a.row);}
  function isFree(col,row,cs,rs){var t={col:col,row:row,cs:cs,rs:rs};return !state.some(function(w){return overlap(w,t);});}
  function findFree(cs,rs){for(var r=1;r<=20;r++)for(var c=1;c<=COLS-cs+1;c++)if(isFree(c,r,cs,rs))return {col:c,row:r};return {col:1,row:1};}

  function compact(){
    state.sort(function(a,b){return a.row!==b.row?a.row-b.row:a.col-b.col;});
    state.forEach(function(w){
      for(var r=1;r<w.row;r++){
        var cand={col:w.col,row:r,cs:w.cs,rs:w.rs};
        if(!state.some(function(x){return x.uid!==w.uid&&overlap(x,cand);})){w.row=r;break;}
      }
    });
  }

  function renderAnimated(){
    var snap={};
    canvas.querySelectorAll('.dash-widget').forEach(function(el){snap[el.dataset.uid]=el.getBoundingClientRect();});
    compact();render();
    canvas.querySelectorAll('.dash-widget').forEach(function(el){
      var prev=snap[el.dataset.uid];if(!prev)return;
      var cur=el.getBoundingClientRect();
      var dx=prev.left-cur.left,dy=prev.top-cur.top;
      if(Math.abs(dx)<1&&Math.abs(dy)<1)return;
      el.style.transition='none';el.style.transform='translate('+dx+'px,'+dy+'px)';
      requestAnimationFrame(function(){requestAnimationFrame(function(){el.style.transition='';el.style.transform='';});});
    });
  }

  function computeDrop(w,col,row){
    var newPos={col:col,row:row,cs:w.cs,rs:w.rs};
    var displaced=state.filter(function(x){return x.uid!==w.uid&&overlap(x,newPos);});
    if(!displaced.length)return [];
    var tempUsed=state.filter(function(x){return x.uid!==w.uid&&!displaced.some(function(d){return d.uid===x.uid;});})
      .map(function(x){return {col:x.col,row:x.row,cs:x.cs,rs:x.rs};});
    tempUsed.push({col:col,row:row,cs:w.cs,rs:w.rs});
    var moves=[];
    displaced.forEach(function(d){
      var preferred={col:w.col,row:w.row,cs:d.cs,rs:d.rs};
      var fits=w.col+d.cs-1<=COLS&&!tempUsed.some(function(t){return overlap(t,preferred);});
      var dest;
      if(fits){dest={col:w.col,row:w.row};}
      else{
        dest=null;
        scan:for(var r=1;r<=20;r++){for(var c=1;c<=COLS-d.cs+1;c++){var cand={col:c,row:r,cs:d.cs,rs:d.rs};if(!tempUsed.some(function(t){return overlap(t,cand);})){dest={col:c,row:r};break scan;}}}
        if(!dest)dest={col:w.col,row:w.row};
      }
      moves.push({uid:d.uid,col:dest.col,row:dest.row,cs:d.cs,rs:d.rs});
      tempUsed.push({col:dest.col,row:dest.row,cs:d.cs,rs:d.rs});
    });
    return moves;
  }

  function render(){
    canvas.innerHTML='';
    state.forEach(function(w){
      var def=DEFS.find(function(d){return d.type===w.type;});
      var el=document.createElement('div');
      el.className='dash-widget';el.dataset.uid=w.uid;
      var mCols=window.innerWidth<=768?2:COLS;
      var mCs=Math.min(w.cs,mCols),mCol=Math.min(w.col,mCols-mCs+1);
      el.style.gridColumn=mCol+' / span '+mCs;
      el.style.gridRow=w.row+' / span '+w.rs;
      el.innerHTML='<div class="dw-header"><span class="dw-icon">'+(def?def.icon:'')+
        '</span><span class="dw-title">'+(def?def.name:'')+
        '</span><button class="dw-remove">\xD7</button></div>'+
        '<div class="dw-body">'+widgetBody(w.type)+'</div>'+
        '<div class="dw-resize"></div>';
      canvas.appendChild(el);
    });
    if(empty)empty.style.display=state.length?'none':'flex';
    canvas.querySelectorAll('.dw-header').forEach(bindDrag);
    canvas.querySelectorAll('.dw-resize').forEach(bindResize);
    canvas.querySelectorAll('.dw-remove').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var u=+btn.closest('.dash-widget').dataset.uid;
        state=state.filter(function(w){return w.uid!==u;});
        renderAnimated();
      });
    });
    updateCards();
  }

  function getCellAt(ax,ay){
    var r=canvas.getBoundingClientRect();
    var cw=(r.width+GAP)/COLS,ch=ROW_H+GAP;
    return {col:Math.max(1,Math.min(Math.floor((ax-r.left)/cw)+1,COLS)),row:Math.max(1,Math.floor((ay-r.top)/ch)+1)};
  }

  function bindDrag(hdr){
    hdr.addEventListener('pointerdown',function(e){
      if(e.button!==0)return;
      if(e.target.closest('.dw-remove'))return;
      var el=hdr.closest('.dash-widget'),u=+el.dataset.uid;
      var w=state.find(function(x){return x.uid===u;});if(!w)return;
      e.preventDefault();
      var rect=el.getBoundingClientRect();
      dragging={uid:u,offX:e.clientX-rect.left,offY:e.clientY-rect.top,cs:w.cs,rs:w.rs,lastCell:null};
      el.classList.add('is-dragging');
      ghost.style.cssText='display:block;width:'+rect.width+'px;height:'+rect.height+'px;left:'+(e.clientX-dragging.offX)+'px;top:'+(e.clientY-dragging.offY)+'px';
      hdr.setPointerCapture(e.pointerId);
    });
    hdr.addEventListener('pointermove',function(e){
      if(!dragging)return;
      ghost.style.left=(e.clientX-dragging.offX)+'px';ghost.style.top=(e.clientY-dragging.offY)+'px';
      var cell=getCellAt(e.clientX-dragging.offX,e.clientY-dragging.offY);
      var col=Math.min(cell.col,COLS-dragging.cs+1),row=Math.max(1,cell.row);
      var lc=dragging.lastCell;if(lc&&lc.col===col&&lc.row===row)return;
      dragging.lastCell={col:col,row:row};
      var w=state.find(function(x){return x.uid===dragging.uid;});if(!w)return;
      canvas.querySelectorAll('.dash-widget:not(.is-dragging)').forEach(function(el){el.style.transform='';});
      var canvasRect=canvas.getBoundingClientRect();
      var cw=(canvasRect.width+GAP)/COLS,ch=ROW_H+GAP;
      computeDrop(w,col,row).forEach(function(move){
        var el=canvas.querySelector('[data-uid="'+move.uid+'"]');if(!el)return;
        var cur=el.getBoundingClientRect();
        el.style.transform='translate('+(canvasRect.left+(move.col-1)*cw-cur.left)+'px,'+(canvasRect.top+(move.row-1)*ch-cur.top)+'px)';
      });
    });
    hdr.addEventListener('pointercancel',function(){
      if(!dragging)return;
      ghost.style.display='none';
      var el2=canvas.querySelector('[data-uid="'+dragging.uid+'"]');if(el2)el2.classList.remove('is-dragging');
      dragging=null;renderAnimated();
    });
    hdr.addEventListener('pointerup',function(e){
      if(!dragging)return;
      var cell=getCellAt(e.clientX-dragging.offX,e.clientY-dragging.offY);
      var w=state.find(function(x){return x.uid===dragging.uid;});
      if(w){
        var newCol=Math.min(cell.col,COLS-w.cs+1),newRow=Math.max(1,cell.row);
        computeDrop(w,newCol,newRow).forEach(function(move){var d=state.find(function(x){return x.uid===move.uid;});if(d){d.col=move.col;d.row=move.row;}});
        w.col=newCol;w.row=newRow;
      }
      ghost.style.display='none';dragging=null;renderAnimated();
    });
  }

  function bindResize(handle){
    handle.addEventListener('pointerdown',function(e){
      e.stopPropagation();
      var el=handle.closest('.dash-widget'),u=+el.dataset.uid;
      var w=state.find(function(x){return x.uid===u;});if(!w)return;
      e.preventDefault();
      resizing={uid:u,sx:e.clientX,sy:e.clientY,sc:w.cs,sr:w.rs};
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove',function(e){
      if(!resizing)return;
      var r=canvas.getBoundingClientRect(),cw=(r.width+GAP)/COLS,ch=ROW_H+GAP;
      var w=state.find(function(x){return x.uid===resizing.uid;});if(!w)return;
      var wantCs=Math.max(1,Math.min(resizing.sc+Math.round((e.clientX-resizing.sx)/cw),COLS-w.col+1));
      var wantRs=Math.max(1,resizing.sr+Math.round((e.clientY-resizing.sy)/ch));
      var others=state.filter(function(x){return x.uid!==w.uid;});
      while(wantCs>1||wantRs>1){
        var cand={col:w.col,row:w.row,cs:wantCs,rs:wantRs};
        if(!others.some(function(x){return overlap(x,cand);}))break;
        if(wantCs-resizing.sc>=wantRs-resizing.sr&&wantCs>1)wantCs--;
        else if(wantRs>1)wantRs--;
        else if(wantCs>1)wantCs--;
        else break;
      }
      w.cs=wantCs;w.rs=wantRs;
      var elW=canvas.querySelector('[data-uid="'+w.uid+'"]');
      if(elW){elW.style.gridColumn=w.col+' / span '+w.cs;elW.style.gridRow=w.row+' / span '+w.rs;}
    });
    handle.addEventListener('pointerup',function(){if(resizing)renderAnimated();resizing=null;});
  }

  function openPanel(){panel.classList.add('open');overlay.classList.add('show');fab.classList.add('open');}
  function closePanel(){panel.classList.remove('open');overlay.classList.remove('show');fab.classList.remove('open');}

  function buildPicker(){
    wpGrid.innerHTML='';
    DEFS.forEach(function(def){
      var card=document.createElement('div');
      card.className='wp-card';card.dataset.type=def.type;
      card.innerHTML='<div class="wp-icon">'+def.icon+'</div><div class="wp-name">'+def.name+'</div><div class="wp-size">'+def.cols+'\xD7'+def.rows+' \xB7 '+def.desc+'</div>';
      card.addEventListener('click',function(){
        if(card.classList.contains('added'))return;
        var pos=findFree(def.cols,def.rows);
        state.push({uid:uid++,type:def.type,col:pos.col,row:pos.row,cs:def.cols,rs:def.rows});
        renderAnimated();
      });
      wpGrid.appendChild(card);
    });
  }

  function updateCards(){
    var active=state.map(function(w){return w.type;});
    wpGrid.querySelectorAll('.wp-card').forEach(function(c){c.classList.toggle('added',active.indexOf(c.dataset.type)!==-1);});
  }

  fab.addEventListener('click',function(){panel.classList.contains('open')?closePanel():openPanel();});
  overlay.addEventListener('click',closePanel);
  document.getElementById('wpClose').addEventListener('click',closePanel);

  // FAB visibility is now managed by showPortalSection() and _showFilesView()

  buildPicker();render();
})();

// ════════════════════════════════════════════════════════════════
// GAMES
// ════════════════════════════════════════════════════════════════
(function(){
  function showHub(){ ['gamesHub','gamesTetrisLevels','gamesPlayTetris','gamesPlaySolitaire','gamesPlayBird','gamesPlayChess','gamesPlayGD'].forEach(function(id,i){ var el=document.getElementById(id); if(el) el.style.display = i===0 ? '' : 'none'; }); }
  function showLevels(){ document.getElementById('gamesHub').style.display='none'; document.getElementById('gamesTetrisLevels').style.display=''; buildLevelGrid(); }
  function showTetris(lvl){ document.getElementById('gamesTetrisLevels').style.display='none'; document.getElementById('gamesPlayTetris').style.display=''; _tetrisStart(lvl); }
  function showSolitaire(){ document.getElementById('gamesHub').style.display='none'; document.getElementById('gamesPlaySolitaire').style.display=''; if(typeof _solShowPicker==='function') _solShowPicker(); }
  function showBird(){ document.getElementById('gamesHub').style.display='none'; document.getElementById('gamesPlayBird').style.display=''; _birdInit(); }
  function showChess(){ document.getElementById('gamesHub').style.display='none'; document.getElementById('gamesPlayChess').style.display=''; _chessInit(); }
  function showGD(){
    document.getElementById('gamesHub').style.display='none';
    document.getElementById('gamesPlayGD').style.display='';
    var frame=document.getElementById('gdGameFrame');
    if(frame&&!frame.dataset.loaded){
      frame.dataset.loaded='1';
      var ref=encodeURIComponent(window.location.origin+window.location.pathname);
      frame.src='https://html5.gamedistribution.com/c6eb54e8432a480bab89a517bd1a897e/?gd_sdk_referrer_url='+ref;
    }
  }

  function buildLevelGrid(){
    var grid = document.getElementById('tetrisLevelGrid');
    if(!grid || grid.dataset.built) return;
    grid.dataset.built = '1';

    // Update best stats
    var best = localStorage.getItem('ss_tetris_best')||'—';
    var bestLvl = localStorage.getItem('ss_tetris_best_level')||'—';
    var bs = document.getElementById('lvlBestScore'); if(bs) bs.textContent = best !== '—' ? parseInt(best).toLocaleString() : '—';
    var bl = document.getElementById('lvlBestLevel'); if(bl) bl.textContent = bestLvl !== '—' ? 'Lvl '+bestLvl : '—';

    var tiers = [
      { label: '🟣 Casual', color:'rgba(192,132,252,.7)', levels:[
        {n:1, label:'Beginner', speed:'Relaxed'},
        {n:2, label:'Easy',     speed:'Slow'}
      ]},
      { label: '🔴 Challenging', color:'rgba(244,114,182,.7)', levels:[
        {n:3, label:'Normal',  speed:'Medium'},
        {n:4, label:'Steady',  speed:'Picking up'},
        {n:5, label:'Hard',    speed:'Fast'}
      ]},
      { label: '🟠 Expert', color:'rgba(251,146,60,.7)', levels:[
        {n:6, label:'Intense', speed:'Very fast'},
        {n:7, label:'Brutal',  speed:'Blazing'},
        {n:8, label:'Merciless',speed:'Extreme'}
      ]},
      { label: '💀 Insane', color:'rgba(248,113,113,.7)', levels:[
        {n:9,  label:'Nightmare', speed:'Inhuman'},
        {n:10, label:'INSANE',    speed:'MAX SPEED'}
      ]}
    ];

    tiers.forEach(function(tier){
      var tierEl = document.createElement('div'); tierEl.className = 'lvl-tier';
      var labelEl = document.createElement('div'); labelEl.className = 'lvl-tier-label';
      labelEl.style.color = tier.color; labelEl.textContent = tier.label;
      tierEl.appendChild(labelEl);
      var row = document.createElement('div'); row.className = 'lvl-tier-row';
      tier.levels.forEach(function(lvl){
        var btn = document.createElement('div');
        btn.className = 'level-btn lvl-btn-'+lvl.n;
        btn.innerHTML = '<div class="level-btn-shine"></div><div class="level-btn-num">'+lvl.n+'</div><div class="level-btn-label">'+lvl.label+'</div><div class="level-btn-speed">'+lvl.speed+'</div>';
        (function(l){ btn.addEventListener('click', function(){ showTetris(l); }); })(lvl.n);
        row.appendChild(btn);
      });
      tierEl.appendChild(row);
      grid.appendChild(tierEl);
    });
  }

  function wire(id, fn){ var el=document.getElementById(id); if(el) el.addEventListener('click',fn); else console.warn('Games: missing #'+id); }
  function trackAndRun(fn){return function(){if(typeof window._statsTrackGame==='function')window._statsTrackGame();fn();};}
  wire('gameCardTetris', trackAndRun(showLevels));
  wire('gameCardSolitaire', trackAndRun(showSolitaire));
  wire('gameCardBird', trackAndRun(showBird));
  wire('gameCardChess', trackAndRun(showChess));
  wire('gameCardGD', showGD);
  wire('tetrisLevelBack', showHub);
  wire('tetrisBack', function(){ if(typeof _tetrisStop==='function') _tetrisStop(); document.getElementById('gamesPlayTetris').style.display='none'; var g=document.getElementById('tetrisLevelGrid'); if(g) g.dataset.built=''; showLevels(); });
  wire('solitaireBack', function(){ if(typeof _solStop==='function') _solStop(); if(typeof _solShowPicker==='function') _solShowPicker(); else showHub(); });
  wire('birdBack', function(){ if(typeof _birdStop==='function') _birdStop(); showHub(); });
  wire('chessBack', function(){ if(typeof _chessStop==='function') _chessStop(); showHub(); });
  wire('gdBack', showHub);
})();

// ── TETRIS ────────────────────────────────────────────────────────────────
(function(){
  var COLS=10, ROWS=20, SZ=22;
  var COLORS = ['','#c084fc','#f472b6','#a78bfa','#34d399','#f87171','#60a5fa','#fb923c'];
  var BASE_SHAPES = [null,
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[2,2],[2,2]],
    [[0,3,0],[3,3,3],[0,0,0]],
    [[0,4,4],[4,4,0],[0,0,0]],
    [[5,5,0],[0,5,5],[0,0,0]],
    [[6,0,0],[6,6,6],[0,0,0]],
    [[0,0,7],[7,7,7],[0,0,0]]
  ];
  var SHAPES;
  var canvas, ctx, nextCanvas, nextCtx;
  var board, piece, pieceX, pieceY, nextPiece, score, level, startLevel, lines, timer, running;

  function cloneShapes(){ return BASE_SHAPES.map(function(s){ return s ? s.map(function(r){ return r.slice(); }) : null; }); }
  function newBoard(){ return Array.from({length:ROWS}, function(){ return new Array(COLS).fill(0); }); }
  function rand(){ return Math.floor(Math.random()*7)+1; }

  function initCanvas(){
    canvas = document.getElementById('tetrisCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    nextCanvas = document.getElementById('tetrisNext');
    nextCtx = nextCanvas ? nextCanvas.getContext('2d') : null;
    // Responsive: shrink cell size on narrow screens
    var maxW = Math.min(window.innerWidth - 60, 220); // 60px for stats + next cols
    SZ = Math.floor(Math.min(22, maxW / COLS));
    if(canvas){ canvas.width = COLS*SZ; canvas.height = ROWS*SZ; }
    var nsz = Math.max(14, Math.round(SZ * 0.82));
    var nw = nsz * 4 + 4;
    if(nextCanvas){ nextCanvas.width = nw; nextCanvas.height = nw; }
  }

  function spawn(){
    piece = nextPiece || rand();
    nextPiece = rand();
    pieceX = Math.floor((COLS - SHAPES[piece][0].length) / 2);
    pieceY = 0;
    if(collide(piece, pieceX, pieceY)){ endGame(); return; }
    drawNext();
  }

  function collide(p, px, py){
    var s = SHAPES[p];
    for(var r=0; r<s.length; r++) for(var c=0; c<s[r].length; c++){
      if(!s[r][c]) continue;
      var nx=px+c, ny=py+r;
      if(nx<0 || nx>=COLS || ny>=ROWS) return true;
      if(ny>=0 && board[ny][nx]) return true;
    }
    return false;
  }

  function merge(){ var s=SHAPES[piece]; for(var r=0;r<s.length;r++) for(var c=0;c<s[r].length;c++) if(s[r][c]&&pieceY+r>=0) board[pieceY+r][pieceX+c]=piece; }

  function clearLines(){
    var cleared=0;
    for(var r=ROWS-1; r>=0;){ if(board[r].every(function(v){ return v!==0; })){ board.splice(r,1); board.unshift(new Array(COLS).fill(0)); cleared++; } else r--; }
    if(!cleared) return;
    var pts=[0,100,300,500,800];
    score += (pts[cleared]||800) * level;
    lines += cleared;
    level = startLevel + Math.floor(lines/10);
    updateStats();
    clearInterval(timer);
    timer = setInterval(drop, Math.max(50, 800 - level*65));
  }

  function updateStats(){
    document.getElementById('tetrisScore').textContent = score;
    document.getElementById('tetrisLevel').textContent = level;
    document.getElementById('tetrisLines').textContent = lines;
    var best = parseInt(localStorage.getItem('ss_tetris_best')||'0');
    if(score > best){ best = score; localStorage.setItem('ss_tetris_best', score); localStorage.setItem('ss_tetris_best_level', level); }
    document.getElementById('tetrisBest').textContent = best;
  }

  function drawBoard(){
    if(!ctx) return;
    ctx.fillStyle = '#08060f';
    ctx.fillRect(0, 0, COLS*SZ, ROWS*SZ);
    ctx.strokeStyle = 'rgba(255,255,255,.03)';
    ctx.lineWidth = 0.5;
    for(var c=0; c<=COLS; c++){ ctx.beginPath(); ctx.moveTo(c*SZ,0); ctx.lineTo(c*SZ,ROWS*SZ); ctx.stroke(); }
    for(var r=0; r<=ROWS; r++){ ctx.beginPath(); ctx.moveTo(0,r*SZ); ctx.lineTo(COLS*SZ,r*SZ); ctx.stroke(); }
    for(var rr=0; rr<ROWS; rr++) for(var cc=0; cc<COLS; cc++) if(board[rr][cc]) drawCell(ctx, cc, rr, COLORS[board[rr][cc]], 1);
    if(piece){
      var gy = pieceY; while(!collide(piece, pieceX, gy+1)) gy++;
      var gs = SHAPES[piece];
      for(var gr=0; gr<gs.length; gr++) for(var gc=0; gc<gs[gr].length; gc++) if(gs[gr][gc]) drawCell(ctx, pieceX+gc, gy+gr, COLORS[piece], 0.18);
      for(var r2=0; r2<gs.length; r2++) for(var c2=0; c2<gs[r2].length; c2++) if(gs[r2][c2]) drawCell(ctx, pieceX+c2, pieceY+r2, COLORS[piece], 1);
    }
  }

  function drawCell(c, x, y, color, alpha){
    if(y < 0) return;
    c.globalAlpha = alpha;
    c.fillStyle = color; c.fillRect(x*SZ+1, y*SZ+1, SZ-2, SZ-2);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x*SZ+2, y*SZ+2, SZ-4, 5);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x*SZ+1, y*SZ+SZ-5, SZ-2, 4);
    c.globalAlpha = 1;
  }

  function drawNext(){
    if(!nextCtx || !nextPiece) return;
    var nsz = Math.max(14, Math.round(SZ * 0.82));
    var nw = nextCanvas ? nextCanvas.width : 88;
    nextCtx.fillStyle = '#08060f'; nextCtx.fillRect(0, 0, nw, nw);
    var s = SHAPES[nextPiece], ox = Math.floor((nw-s[0].length*nsz)/2), oy = Math.floor((nw-s.length*nsz)/2);
    for(var r=0; r<s.length; r++) for(var c=0; c<s[r].length; c++) if(s[r][c]){
      nextCtx.fillStyle = COLORS[nextPiece]; nextCtx.fillRect(ox+c*nsz+1, oy+r*nsz+1, nsz-2, nsz-2);
      nextCtx.fillStyle = 'rgba(255,255,255,.2)'; nextCtx.fillRect(ox+c*nsz+2, oy+r*nsz+2, nsz-4, 4);
    }
  }

  function tryRotate(){
    var old = SHAPES[piece].map(function(r){ return r.slice(); });
    var n = old[0].length, m = old.length;
    var rot = Array.from({length:n}, function(){ return new Array(m).fill(0); });
    for(var r=0; r<m; r++) for(var c=0; c<n; c++) rot[c][m-1-r] = old[r][c];
    SHAPES[piece] = rot;
    if(!collide(piece, pieceX, pieceY)){ drawBoard(); return; }
    var kicks = [1,-1,2,-2];
    for(var i=0; i<kicks.length; i++) if(!collide(piece, pieceX+kicks[i], pieceY)){ pieceX+=kicks[i]; drawBoard(); return; }
    SHAPES[piece] = old;
  }

  function drop(){
    if(!running) return;
    if(!collide(piece, pieceX, pieceY+1)) pieceY++;
    else { merge(); clearLines(); spawn(); }
    drawBoard();
  }

  function hardDrop(){ if(!running) return; while(!collide(piece, pieceX, pieceY+1)) pieceY++; merge(); clearLines(); spawn(); drawBoard(); }

  function endGame(){
    running = false; clearInterval(timer);
    document.getElementById('tetrisOverlayTitle').textContent = 'Game Over';
    document.getElementById('tetrisOverlaySub').textContent = 'Score: '+score+' — Level: '+level;
    document.getElementById('tetrisStartBtn').textContent = 'Play Again';
    document.getElementById('tetrisOverlay').style.display = 'flex';
  }

  window._tetrisStart = function(lvl){
    initCanvas();
    SHAPES = cloneShapes();
    startLevel = lvl || 1; level = startLevel; score = 0; lines = 0; running = true;
    board = newBoard(); nextPiece = rand(); spawn(); updateStats();
    document.getElementById('tetrisOverlay').style.display = 'none';
    document.getElementById('tetrisLevelBadge').textContent = 'Level ' + startLevel;
    clearInterval(timer);
    timer = setInterval(drop, Math.max(50, 800 - level*65));
  };
  window._tetrisStop = function(){ clearInterval(timer); running = false; };

  function tw(id,fn){ var el=document.getElementById(id); if(el) el.addEventListener('click',fn); }
  tw('tetrisStartBtn', function(){ _tetrisStart(startLevel||1); });
  tw('tCtrlLeft',  function(){ if(running&&!collide(piece,pieceX-1,pieceY)){pieceX--;drawBoard();} });
  tw('tCtrlRight', function(){ if(running&&!collide(piece,pieceX+1,pieceY)){pieceX++;drawBoard();} });
  tw('tCtrlDown',  function(){ drop(); });
  tw('tCtrlUp',    function(){ if(running) tryRotate(); });
  tw('tCtrlDrop',  function(){ hardDrop(); });

  document.addEventListener('keydown', function(e){
    if(!document.getElementById('gamesPlayTetris') || document.getElementById('gamesPlayTetris').style.display==='none') return;
    if(!running) return;
    if(e.key==='ArrowLeft'){ e.preventDefault(); if(!collide(piece,pieceX-1,pieceY)){pieceX--;drawBoard();} }
    if(e.key==='ArrowRight'){ e.preventDefault(); if(!collide(piece,pieceX+1,pieceY)){pieceX++;drawBoard();} }
    if(e.key==='ArrowDown'){ e.preventDefault(); drop(); }
    if(e.key==='ArrowUp'){ e.preventDefault(); tryRotate(); }
    if(e.key===' '){ e.preventDefault(); hardDrop(); }
  });
})();

// ── SOLITAIRE (Klondike) ──────────────────────────────────────────────────
(function(){
  var SUITS=['\u2660','\u2665','\u2666','\u2663']; // ♠♥♦♣
  var RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  var stock=[], waste=[], foundations=[[],[],[],[]], tableau=[[],[],[],[],[],[],[]];
  var selected=null, selectedFrom=null, moves=0, solTimer=null, solSecs=0;
  var touchGhost=null, touchInfo=null, touchDragging=false, touchStartX=0, touchStartY=0, touchHandled=false;
  var hintTimer=null, hintSeq=[], hintSeqIdx=0;
  var history=[]; // undo stack

  function isRed(s){ return s==='\u2665'||s==='\u2666'; }

  // ── Sound ──
  function playCardSound(type){
    try{
      var ac=new(window.AudioContext||window.webkitAudioContext)();
      if(type==='shuffle'){
        for(var b=0;b<8;b++)(function(bi){
          setTimeout(function(){
            var buf=ac.createBuffer(1,ac.sampleRate*.06,ac.sampleRate),d=buf.getChannelData(0);
            for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*.4;
            var src=ac.createBufferSource();src.buffer=buf;
            var f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=3000+Math.random()*2000;f.Q.value=.5;
            var g=ac.createGain();g.gain.value=.35;
            src.connect(f);f.connect(g);g.connect(ac.destination);src.start();
          },bi*80);
        })(b);
      } else if(type==='place'){
        var buf=ac.createBuffer(1,ac.sampleRate*.04,ac.sampleRate),d=buf.getChannelData(0);
        for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3)*.5;
        var src=ac.createBufferSource();src.buffer=buf;
        var f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=1800;
        var g=ac.createGain();g.gain.value=.4;
        src.connect(f);f.connect(g);g.connect(ac.destination);src.start();
      } else if(type==='flip'){
        var buf=ac.createBuffer(1,ac.sampleRate*.03,ac.sampleRate),d=buf.getChannelData(0);
        for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*.3;
        var src=ac.createBufferSource();src.buffer=buf;
        var g=ac.createGain();g.gain.value=.3;
        src.connect(g);g.connect(ac.destination);src.start();
      } else if(type==='win'){
        // Rising chime: 4 ascending tones
        var notes=[523,659,784,1047];
        notes.forEach(function(freq,ni){
          setTimeout(function(){
            var osc=ac.createOscillator(),g=ac.createGain();
            osc.type='sine';osc.frequency.value=freq;
            g.gain.setValueAtTime(0,ac.currentTime);
            g.gain.linearRampToValueAtTime(.35,ac.currentTime+.04);
            g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.45);
            osc.connect(g);g.connect(ac.destination);
            osc.start();osc.stop(ac.currentTime+.5);
          },ni*130);
        });
      }
    }catch(e){}
  }

  // ── Deck / Deal ──
  function shuffle(d){ for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;} return d; }

  function buildDeck(){
    var d=[];
    SUITS.forEach(function(s){ RANKS.forEach(function(r,i){ d.push({suit:s,rank:r,value:i+1,faceUp:false}); }); });
    return shuffle(d);
  }

  // ── Omniscient solver: checks if a deal is winnable with full card knowledge ──
  function quickSolvable(tab0, stk0){
    try {
      // Encode cards as integers 0-51 (suit*13 + value-1)
      function sv(e){ return Math.floor(e/13); }
      function vv(e){ return (e%13)+1; }
      function rv(e){ var s=sv(e); return s===1||s===2; } // red: ♥=1,♦=2

      var tab=tab0.map(function(p){ return p.map(function(c){ return SUITS.indexOf(c.suit)*13+(c.value-1); }); });
      var stk=stk0.map(function(c){ return SUITS.indexOf(c.suit)*13+(c.value-1); });
      var wst=[];
      var fnd=[0,0,0,0];

      var visited=new Set();
      var nodes=0;
      var LIMIT=60000;   // per-attempt cap — fast enough, still catches most solvable deals
      var MAXDEPTH=160;  // prevent call-stack overflow

      function key(){
        // Lightweight key: foundation counts + tableau sizes/tops + stock length + waste top
        var k=fnd[0]+''+fnd[1]+''+fnd[2]+''+fnd[3];
        for(var i=0;i<7;i++){
          var p=tab[i];
          k+='|'+(p.length?p[p.length-1]:'-');
          // include buried cards' count so different hidden layouts aren't conflated
          k+=':'+p.length;
        }
        k+='|s'+stk.length+'w'+(wst.length?wst[wst.length-1]:'-');
        return k;
      }

      function dfs(depth){
        if(nodes++>LIMIT||depth>MAXDEPTH) return false;
        if(fnd[0]+fnd[1]+fnd[2]+fnd[3]===52) return true;
        var k=key(); if(visited.has(k)) return false; visited.add(k);

        // Auto-play safe foundations first (deterministic, no branching needed)
        var changed=true;
        while(changed){
          changed=false;
          if(wst.length){ var wc=wst[wst.length-1]; if(vv(wc)===fnd[sv(wc)]+1){ wst.pop();fnd[sv(wc)]++;changed=true; } }
          for(var t=0;t<7;t++){ if(!tab[t].length) continue; var tc=tab[t][tab[t].length-1]; if(vv(tc)===fnd[sv(tc)]+1){ tab[t].pop();fnd[sv(tc)]++;changed=true; } }
        }
        if(fnd[0]+fnd[1]+fnd[2]+fnd[3]===52) return true;

        var mvs=[];

        // Tableau → tableau
        for(var fr=0;fr<7;fr++){
          if(!tab[fr].length) continue;
          var cs=tab[fr].length-1;
          while(cs>0){ var aa=tab[fr][cs-1],bb=tab[fr][cs]; if(vv(bb)===vv(aa)-1&&rv(bb)!==rv(aa)) cs--; else break; }
          for(var ci2=cs;ci2<tab[fr].length;ci2++){
            var card=tab[fr][ci2];
            for(var to2=0;to2<7;to2++){
              if(fr===to2) continue;
              var ok=false;
              if(!tab[to2].length) ok=(vv(card)===13&&ci2>0);
              else{ var tt2=tab[to2][tab[to2].length-1]; ok=(vv(card)===vv(tt2)-1&&rv(card)!==rv(tt2)); }
              if(ok){ var pr=(ci2>0?40:15)+(tab[to2].length?10:0); mvs.push([pr,2,fr,ci2,to2]); }
            }
          }
        }

        // Waste → tableau
        if(wst.length){
          var wc2=wst[wst.length-1];
          for(var to3=0;to3<7;to3++){
            var ok=false;
            if(!tab[to3].length) ok=(vv(wc2)===13);
            else{ var tt3=tab[to3][tab[to3].length-1]; ok=(vv(wc2)===vv(tt3)-1&&rv(wc2)!==rv(tt3)); }
            if(ok) mvs.push([tab[to3].length?25:4,3,to3]);
          }
        }

        // Draw / recycle
        if(stk.length) mvs.push([2,4]);
        else if(wst.length>1) mvs.push([1,5]);

        mvs.sort(function(a,b){ return b[0]-a[0]; });

        for(var mi=0;mi<mvs.length;mi++){
          var mv=mvs[mi],type=mv[1];
          // Save/restore state for each branch
          var fndSnap=fnd.slice();
          var tabSnap=tab.map(function(p){ return p.slice(); });
          var stkSnap=stk.slice();
          var wstSnap=wst.slice();

          if(type===2){
            var seq=tab[mv[2]].splice(mv[3]);
            tab[mv[4]]=tab[mv[4]].concat(seq);
          } else if(type===3){
            var c3=wst.pop(); tab[mv[2]].push(c3);
          } else if(type===4){
            wst.push(stk.pop());
          } else if(type===5){
            // recycle: waste→stock (draw-1: waste reversed becomes new stock)
            while(wst.length) stk.push(wst.pop());
          }

          if(dfs(depth+1)) return true;

          // Restore
          fnd=fndSnap; tab=tabSnap; stk=stkSnap; wst=wstSnap;
        }
        return false;
      }
      return dfs(0);
    } catch(e){ return false; }
  }

  function deal(){
    // Try up to 50 shuffles; use first one the solver confirms is winnable
    var chosenTab=null, chosenStk=null;
    var deadline=Date.now()+1800; // 1800 ms total budget
    for(var attempt=0;attempt<200;attempt++){
      if(Date.now()>deadline) break;
      var deckD=buildDeck();
      var tabD=[[],[],[],[],[],[],[]];
      var copyD=deckD.slice();
      for(var tD=0;tD<7;tD++) for(var cD=0;cD<=tD;cD++){ var cardD=copyD.pop(); cardD.faceUp=(cD===tD); tabD[tD].push(cardD); }
      var stkD=copyD.slice();
      if(quickSolvable(tabD,stkD)){ chosenTab=tabD; chosenStk=stkD; break; }
    }
    if(!chosenTab){
      var deckD=buildDeck(); var tabD=[[],[],[],[],[],[],[]]; var copyD=deckD.slice();
      for(var tD=0;tD<7;tD++) for(var cD=0;cD<=tD;cD++){ var cardD=copyD.pop(); cardD.faceUp=(cD===tD); tabD[tD].push(cardD); }
      chosenTab=tabD; chosenStk=copyD.slice();
    }
    stock=chosenStk; waste=[]; foundations=[[],[],[],[]]; tableau=chosenTab;
    selected=null; selectedFrom=null; moves=0; solSecs=0; hintSeq=[]; hintSeqIdx=0; history=[];
    var nb=document.getElementById('solNoMovesBanner'); if(nb) nb.style.display='none';
    document.getElementById('solMoves').textContent='0';
    document.getElementById('solTime').textContent='0:00';
    clearInterval(solTimer);
    solTimer=setInterval(function(){ solSecs++; var m=Math.floor(solSecs/60),s=solSecs%60; document.getElementById('solTime').textContent=m+':'+(s<10?'0':'')+s; },1000);
  }

  // ── Rules ──
  function canPlaceTab(card,pile){ if(!pile.length) return card.rank==='K'; var top=pile[pile.length-1]; return top.faceUp&&card.value===top.value-1&&isRed(card.suit)!==isRed(top.suit); }
  function canPlaceAnyFound(card){ for(var f=0;f<4;f++) if(canPlaceFound(card,foundations[f],f)) return f; return -1; }
  function canPlaceFound(card,pile,si){ if(card.suit!==SUITS[si]) return false; return pile.length===0?card.rank==='A':card.value===pile[pile.length-1].value+1; }

  function checkWin(){
    if(foundations.every(function(f){return f.length===13;})){
      clearInterval(solTimer);history=[];updateUndoBtn();
      setTimeout(function(){_solWinOverlay(moves,'window._klondikeNewGame');},300);
    }
  }

  // ── Undo ──
  function cloneCard(c){ return {suit:c.suit,rank:c.rank,value:c.value,faceUp:c.faceUp}; }
  function captureState(){
    return {
      stock:stock.map(cloneCard), waste:waste.map(cloneCard),
      foundations:foundations.map(function(f){return f.map(cloneCard);}),
      tableau:tableau.map(function(p){return p.map(cloneCard);}),
      moves:moves, solSecs:solSecs
    };
  }
  function saveHistory(){
    history.push(captureState());
    if(history.length>200) history.shift();
    updateUndoBtn();
  }
  function updateUndoBtn(){
    var btn=document.getElementById('solitaireUndo');
    if(btn){ btn.disabled=!history.length; btn.style.opacity=history.length?'1':'.4'; }
  }
  function undo(){
    if(!history.length) return;
    var prev=history.pop();
    stock=prev.stock; waste=prev.waste; foundations=prev.foundations; tableau=prev.tableau;
    moves=prev.moves; solSecs=prev.solSecs;
    selected=null; selectedFrom=null;
    document.getElementById('solMoves').textContent=moves;
    var m=Math.floor(solSecs/60),s=solSecs%60;
    document.getElementById('solTime').textContent=m+':'+(s<10?'0':'')+s;
    updateUndoBtn(); clearHints(); render();
  }

  // ── Auto-play safe cards to foundation ──
  // A card is "safe" when both opposite-color suits of value-1 are already on foundation
  // (meaning it can never be needed as a stepping stone on the tableau)
  function isSafeToFoundation(card){
    if(card.value<=2) return true; // Aces and 2s are always safe
    var needed=card.value-1;
    var opposites=isRed(card.suit)?['\u2660','\u2663']:['\u2665','\u2666'];
    return opposites.every(function(os){
      var fi=SUITS.indexOf(os); return fi>=0&&foundations[fi].length>=needed;
    });
  }
  function autoPlaySafe(){
    var changed=true;
    while(changed){
      changed=false;
      // Check waste
      if(waste.length&&isSafeToFoundation(waste[waste.length-1])){
        var fi=canPlaceAnyFound(waste[waste.length-1]);
        if(fi>=0){foundations[fi].push(waste.pop());moves++;changed=true;continue;}
      }
      // Check tableau tops
      for(var t=0;t<7;t++){
        if(!tableau[t].length) continue;
        var top=tableau[t][tableau[t].length-1];
        if(top.faceUp&&isSafeToFoundation(top)){
          var fi=canPlaceAnyFound(top);
          if(fi>=0){
            foundations[fi].push(tableau[t].pop());
            var tp=tableau[t]; if(tp.length&&!tp[tp.length-1].faceUp){tp[tp.length-1].faceUp=true;playCardSound('flip');}
            moves++;changed=true;break;
          }
        }
      }
    }
  }

  // Auto-complete: when stock empty, waste empty, and all tableau face-up → animate cards to foundations
  var _acRunning=false;
  function canAutoComplete(){
    if(_acRunning) return false;
    if(stock.length||waste.length) return false;
    var hasCard=false;
    for(var t=0;t<7;t++){
      for(var c=0;c<tableau[t].length;c++){
        var card=tableau[t][c];
        if(!card.faceUp) return false;       // hidden card → not ready
        if(card.value<10) return false;      // card below 10 still on board → not ready
        hasCard=true;
      }
    }
    return hasCard;
  }
  function tryAutoComplete(){
    if(_acRunning||!canAutoComplete()) return;
    _acRunning=true;
    function step(){
      // Find lowest-value moveable card across all tableau tops
      var best=null,bestT=-1,bestFi=-1;
      for(var t=0;t<7;t++){
        if(!tableau[t].length) continue;
        var top=tableau[t][tableau[t].length-1];
        var fi=canPlaceAnyFound(top);
        if(fi>=0&&(!best||top.value<best.value)){best=top;bestT=t;bestFi=fi;}
      }
      if(!best){_acRunning=false;render();checkWin();return;}
      // Snap source card before removing
      var cols=document.querySelectorAll('#solTable .sol-tab-pile');
      var srcEl=cols[bestT]?cols[bestT].querySelector('.sol-card:last-child')||cols[bestT].querySelectorAll('.sol-card')[cols[bestT].querySelectorAll('.sol-card').length-1]||null:null;
      var srcRect=srcEl?srcEl.getBoundingClientRect():null;
      // Move card to foundation
      foundations[bestFi].push(tableau[bestT].pop());
      moves++;
      document.getElementById('solMoves').textContent=moves;
      playCardSound('place');
      render();
      // Fly animation to foundation slot
      if(srcRect){
        var fndEls=document.querySelectorAll('#solTable .sol-pile-foundation');
        var dstEl=fndEls[bestFi]||null;
        if(dstEl)_solFly(srcRect,best.rank+' '+best.suit,'sol-card '+(isRed(best.suit)?'red':'black'),'#solTable .sol-pile-foundation[data-idx="'+bestFi+'"]',260);
      }
      setTimeout(step,180);
    }
    setTimeout(step,200);
  }

  function hasAnyMove(){
    // Any stock card to draw or waste to recycle?
    if(stock.length||waste.length>1) return true;
    // Any waste→foundation or waste→tableau?
    if(waste.length){
      var wc=waste[waste.length-1];
      if(canPlaceAnyFound(wc)>=0) return true;
      for(var t=0;t<7;t++) if(canPlaceTab(wc,tableau[t])) return true;
    }
    // Any tableau move?
    for(var ti=0;ti<7;ti++){
      var pile=tableau[ti]; if(!pile.length) continue;
      var top=pile[pile.length-1]; if(!top.faceUp) continue;
      if(canPlaceAnyFound(top)>=0) return true;
      for(var ci=pile.length-1;ci>=0;ci--){
        if(!pile[ci].faceUp) break;
        for(var tj=0;tj<7;tj++){
          if(ti===tj) continue;
          if(canPlaceTab(pile[ci],tableau[tj])) return true;
        }
      }
    }
    return false;
  }

  function checkNoMoves(){
    if(foundations.every(function(f){return f.length===13;})) return; // already won
    if(hasAnyMove()) return;
    clearInterval(solTimer);
    var banner=document.getElementById('solNoMovesBanner');
    if(banner) banner.style.display='flex';
  }

  function afterMove(){
    document.getElementById('solMoves').textContent=moves;
    render(); checkWin(); checkNoMoves();
    tryAutoComplete();
  }

  function removeSelected(){
    if(!selectedFrom) return;
    if(selectedFrom.type==='waste') waste.pop();
    else if(selectedFrom.type==='tableau'){
      tableau[selectedFrom.idx].splice(selectedFrom.cardIdx);
      var tp=tableau[selectedFrom.idx];
      if(tp.length&&!tp[tp.length-1].faceUp){tp[tp.length-1].faceUp=true;playCardSound('flip');}
    }
  }

  function tryPlace(dstType,dstIdx){
    if(!selected||!selected.length) return false;
    if(dstType==='tableau'){
      if(canPlaceTab(selected[0],tableau[dstIdx])){
        saveHistory();
        removeSelected(); selected.forEach(function(c){tableau[dstIdx].push(c);}); moves++;
        playCardSound('place'); selected=null; selectedFrom=null; afterMove(); return true;
      }
    } else if(dstType==='foundation'&&selected.length===1){
      if(canPlaceFound(selected[0],foundations[dstIdx],dstIdx)){
        saveHistory();
        removeSelected(); foundations[dstIdx].push(selected[0]); moves++;
        playCardSound('place'); selected=null; selectedFrom=null; afterMove(); return true;
      }
    }
    return false;
  }

  // ── Click handler ──
  function handleClick(type,idx,cardIdx){
    clearHints();
    if(type==='stock'){
      saveHistory();
      if(stock.length){var c=stock.pop();c.faceUp=true;waste.push(c);playCardSound('place');}
      else{while(waste.length){var wc=waste.pop();wc.faceUp=false;stock.push(wc);}}
      selected=null;selectedFrom=null;render();updateUndoBtn();return;
    }
    if(type==='waste'){
      if(!waste.length) return;
      if(selected&&selectedFrom&&selectedFrom.type==='waste'){selected=null;selectedFrom=null;render();return;}
      selected=[waste[waste.length-1]];selectedFrom={type:'waste'};render();return;
    }
    if(type==='foundation'){
      if(selected&&selected.length===1){if(tryPlace('foundation',idx)) return;}
      selected=null;selectedFrom=null;render();return;
    }
    if(type==='tableau'){
      var pile=tableau[idx];
      if(selected){
        if(selectedFrom.type==='tableau'&&selectedFrom.idx===idx){selected=null;selectedFrom=null;render();return;}
        if(tryPlace('tableau',idx)) return;
        if(cardIdx!==undefined&&pile[cardIdx]&&pile[cardIdx].faceUp){selected=pile.slice(cardIdx);selectedFrom={type:'tableau',idx:idx,cardIdx:cardIdx};render();return;}
        selected=null;selectedFrom=null;render();return;
      }
      if(cardIdx===undefined||!pile[cardIdx]||!pile[cardIdx].faceUp) return;
      selected=pile.slice(cardIdx);selectedFrom={type:'tableau',idx:idx,cardIdx:cardIdx};render();
    }
  }

  // ── Double-click: auto-move to foundation ──
  function handleDblClick(type,idx,cardIdx){
    clearHints();
    var card=null;
    if(type==='waste'&&waste.length) card=waste[waste.length-1];
    if(type==='tableau'&&tableau[idx].length){var p=tableau[idx];if(cardIdx===p.length-1&&p[cardIdx].faceUp) card=p[cardIdx];}
    if(!card) return;
    var fi=canPlaceAnyFound(card); if(fi<0) return;
    saveHistory();
    if(type==='waste') waste.pop();
    else{tableau[idx].pop();var tp=tableau[idx];if(tp.length&&!tp[tp.length-1].faceUp) tp[tp.length-1].faceUp=true;}
    foundations[fi].push(card); moves++;
    playCardSound('place'); selected=null; selectedFrom=null; afterMove();
  }

  // ── Smart Hint System ──────────────────────────────────────────────────────
  // Returns all playable moves from the current live state, scored by priority.
  // Scores:  foundation=100, reveals face-down=60+, tableau move=20, stock draw=5
  function getAllMoves(stk, wst, fnd, tab){
    var moves=[];

    // Waste top card
    if(wst.length){
      var wc=wst[wst.length-1];
      var fi=canPlaceAnyFoundS(wc,fnd);
      if(fi>=0) moves.push({type:'move',srcType:'waste',dstType:'foundation',dstIdx:fi,score:100});
      for(var t=0;t<7;t++) if(canPlaceTabS(wc,tab[t])) moves.push({type:'move',srcType:'waste',dstType:'tableau',dstIdx:t,score:30});
    }

    // Tableau
    for(var ti=0;ti<7;ti++){
      var pile=tab[ti]; if(!pile.length) continue;
      // Top card → foundation
      var top=pile[pile.length-1];
      if(top.faceUp){
        var fi=canPlaceAnyFoundS(top,fnd);
        if(fi>=0) moves.push({type:'move',srcType:'tableau',srcIdx:ti,srcCardIdx:pile.length-1,dstType:'foundation',dstIdx:fi,score:100});
      }
      // Sequences → other tableau piles
      for(var ci=0;ci<pile.length;ci++){
        if(!pile[ci].faceUp) continue;
        var seq=pile.slice(ci);
        for(var tj=0;tj<7;tj++){
          if(ti===tj) continue;
          if(canPlaceTabS(seq[0],tab[tj])){
            // Ignore moving a lone King to another empty pile — never helps
            if(seq[0].rank==='K'&&ci===0&&!tab[tj].length) continue;
            // Bonus if this reveals a face-down card
            var revealsHidden=(ci>0&&!pile[ci-1].faceUp)?60:0;
            // Bonus if clearing the pile entirely (makes empty col)
            var clearsCol=(ci===0&&tab[tj].length>0)?10:0;
            moves.push({type:'move',srcType:'tableau',srcIdx:ti,srcCardIdx:ci,dstType:'tableau',dstIdx:tj,score:20+revealsHidden+clearsCol});
          }
        }
      }
    }

    // Sort best first
    moves.sort(function(a,b){return b.score-a.score;});
    return moves;
  }

  function canPlaceTabS(card,pile){ if(!pile.length) return card.rank==='K'; var top=pile[pile.length-1]; return top.faceUp&&card.value===top.value-1&&isRed(card.suit)!==isRed(top.suit); }
  function canPlaceAnyFoundS(card,fnd){ for(var f=0;f<4;f++){ var p=fnd[f]; if(card.suit!==SUITS[f]) continue; if(p.length===0?card.rank==='A':card.value===p[p.length-1].value+1) return f; } return -1; }

  // Simulate cycling the stock to find the next playable card — returns draw-count or -1
  function stockSearchHint(){
    // Build a combined list: current waste (top=end) + stock (bottom-first)
    var combined=waste.slice().reverse().concat(stock.slice().reverse());
    // We'll simulate: each draw puts the top of combined into waste
    var simWaste=waste.slice(), simStock=stock.slice();
    var drawn=0, maxDraws=combined.length+1;
    while(drawn<=maxDraws){
      // Check waste top
      if(simWaste.length){
        var wc=simWaste[simWaste.length-1];
        var fi=canPlaceAnyFoundS(wc,foundations);
        if(fi>=0) return {draws:drawn,card:wc,targetType:'foundation',targetIdx:fi};
        for(var t=0;t<7;t++) if(canPlaceTabS(wc,tableau[t])) return {draws:drawn,card:wc,targetType:'tableau',targetIdx:t};
      }
      // Draw next from stock (or recycle)
      if(simStock.length){ var c=simStock.pop();c=Object.assign({},c,{faceUp:true});simWaste.push(c);drawn++; }
      else if(simWaste.length){ simStock=simWaste.slice().reverse().map(function(x){return Object.assign({},x,{faceUp:false});}); simWaste=[]; drawn++; }
      else break;
    }
    return null; // truly no solution through stock
  }

  function clearHints(){
    clearTimeout(hintTimer);
    var table=document.getElementById('solTable');
    if(table) table.querySelectorAll('.sol-hint-src,.sol-hint-dst').forEach(function(x){x.classList.remove('sol-hint-src','sol-hint-dst');});
  }

  function applyHintHighlight(hint){
    if(!hint) return;
    var table=document.getElementById('solTable'); if(!table) return;
    var srcEl=null, dstEl=null;
    if(hint.srcType==='waste') srcEl=table.querySelector('[data-type="waste"] .sol-card');
    else if(hint.srcType==='tableau') srcEl=table.querySelector('[data-type="tableau"][data-idx="'+hint.srcIdx+'"][data-ci="'+hint.srcCardIdx+'"]');
    if(hint.dstType==='foundation') dstEl=table.querySelector('[data-type="foundation"][data-idx="'+hint.dstIdx+'"]');
    else if(hint.dstType==='tableau'){
      var tp=tableau[hint.dstIdx];
      dstEl=tp.length?table.querySelector('[data-type="tableau"][data-idx="'+hint.dstIdx+'"][data-ci="'+(tp.length-1)+'"]'):table.querySelector('.sol-tab-pile[data-idx="'+hint.dstIdx+'"]');
    }
    if(srcEl) srcEl.classList.add('sol-hint-src');
    if(dstEl) dstEl.classList.add('sol-hint-dst');
    hintTimer=setTimeout(clearHints,2500);
  }

  function showHint(){
    clearHints();
    var moves=getAllMoves(stock,waste,foundations,tableau);
    if(moves.length){
      // Cycle through all available hints so repeated presses show different options
      var hint=moves[hintSeqIdx % moves.length]; hintSeqIdx++;
      applyHintHighlight(hint);
      return;
    }
    // No direct moves — search through stock
    var stockHint=stockSearchHint();
    if(!stockHint){
      // Truly stuck
      showToast('No moves left','No solution found \u2014 try a New Game');
      return;
    }
    if(stockHint.draws===0){
      // Waste top is playable — just highlight it
      var fi=canPlaceAnyFoundS(stockHint.card,foundations);
      var t=-1; if(fi<0) for(var tj=0;tj<7;tj++) if(canPlaceTabS(stockHint.card,tableau[tj])){t=tj;break;}
      applyHintHighlight({srcType:'waste',dstType:fi>=0?'foundation':'tableau',dstIdx:fi>=0?fi:t,srcIdx:0,srcCardIdx:waste.length-1});
      return;
    }
    // Need to draw from stock N times — auto-draw one step and re-highlight stock
    showToast('Draw from stock','Click the stock pile \u2014 '+stockHint.draws+' draw'+(stockHint.draws>1?'s':'')+' needed');
    var stockEl=document.querySelector('#solTable [data-type="stock"]');
    if(stockEl){ stockEl.classList.add('sol-hint-src'); hintTimer=setTimeout(clearHints,2500); }
  }

  // ── HTML5 Drag & Drop ──
  function onDragStart(e){
    var el=e.target.closest('[data-type]'); if(!el) return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0,ci=el.dataset.ci;
    var cardIdx=(ci==='empty'||ci===undefined)?undefined:parseInt(ci);
    if(type==='waste'&&waste.length){selected=[waste[waste.length-1]];selectedFrom={type:'waste'};}
    else if(type==='tableau'&&cardIdx!==undefined){
      var pile=tableau[idx];
      if(!pile[cardIdx]||!pile[cardIdx].faceUp){e.preventDefault();return;}
      selected=pile.slice(cardIdx);selectedFrom={type:'tableau',idx:idx,cardIdx:cardIdx};
    } else {e.preventDefault();return;}
    e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','sol');
    setTimeout(function(){el.style.opacity='.4';},0);
  }

  function onDragOver(e){
    e.preventDefault();
    var el=e.target.closest('[data-type]'); if(!el||!selected) return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0;
    var valid=(type==='tableau'&&canPlaceTab(selected[0],tableau[idx]))||(type==='foundation'&&selected.length===1&&canPlaceFound(selected[0],foundations[idx],idx));
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    if(valid){el.classList.add('sol-drop-hover');e.dataTransfer.dropEffect='move';}else e.dataTransfer.dropEffect='none';
  }

  function onDragLeave(e){var el=e.target.closest('[data-type]');if(el) el.classList.remove('sol-drop-hover');}

  function onDrop(e){
    e.preventDefault();
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type]'); if(!el||!selected) return;
    tryPlace(el.dataset.type,parseInt(el.dataset.idx)||0);
  }

  function onDragEnd(e){
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    selected=null;selectedFrom=null;render();
  }

  // ── Touch Drag ──
  function removeTouchGhost(){if(touchGhost){touchGhost.remove();touchGhost=null;}}

  function onTouchStart(e){
    var el=e.target.closest('[data-type]'); if(!el) return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0,ci=el.dataset.ci;
    var cardIdx=(ci==='empty'||ci===undefined)?undefined:parseInt(ci);
    if(type==='stock') return;
    touchInfo={type:type,idx:idx,cardIdx:cardIdx};touchDragging=false;
    var t=e.touches[0];touchStartX=t.clientX;touchStartY=t.clientY;
  }

  function onTouchMove(e){
    if(!touchInfo) return;
    var t=e.touches[0];
    var dx=t.clientX-touchStartX,dy=t.clientY-touchStartY;
    if(!touchDragging&&Math.sqrt(dx*dx+dy*dy)<10) return;
    if(!touchDragging){
      touchDragging=true;
      var ti=touchInfo;
      if(ti.type==='waste'&&waste.length){selected=[waste[waste.length-1]];selectedFrom={type:'waste'};}
      else if(ti.type==='tableau'&&ti.cardIdx!==undefined){
        var pile=tableau[ti.idx];
        if(!pile[ti.cardIdx]||!pile[ti.cardIdx].faceUp){touchInfo=null;touchDragging=false;return;}
        selected=pile.slice(ti.cardIdx);selectedFrom={type:'tableau',idx:ti.idx,cardIdx:ti.cardIdx};
      } else {touchInfo=null;touchDragging=false;return;}
      var orig=e.target.closest('.sol-card');
      if(orig){touchGhost=orig.cloneNode(true);touchGhost.style.cssText='position:fixed;z-index:9999;pointer-events:none;opacity:.82;transform:rotate(4deg) scale(1.08);transition:none;width:62px;height:88px;border-radius:8px;';document.body.appendChild(touchGhost);}
      render();
    }
    e.preventDefault();
    if(touchGhost){touchGhost.style.left=(t.clientX-31)+'px';touchGhost.style.top=(t.clientY-50)+'px';}
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    if(touchGhost) touchGhost.style.display='none';
    var under=document.elementFromPoint(t.clientX,t.clientY);
    if(touchGhost) touchGhost.style.display='';
    if(under&&selected){
      var tEl=under.closest('[data-type]');
      if(tEl){
        var tt=tEl.dataset.type,ti2=parseInt(tEl.dataset.idx)||0;
        var valid=(tt==='tableau'&&canPlaceTab(selected[0],tableau[ti2]))||(tt==='foundation'&&selected.length===1&&canPlaceFound(selected[0],foundations[ti2],ti2));
        if(valid) tEl.classList.add('sol-drop-hover');
      }
    }
  }

  function onTouchEnd(e){
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    if(touchDragging){
      var t=e.changedTouches[0];removeTouchGhost();
      var under=document.elementFromPoint(t.clientX,t.clientY);var placed=false;
      if(under&&selected){var tEl=under.closest('[data-type]');if(tEl) placed=tryPlace(tEl.dataset.type,parseInt(tEl.dataset.idx)||0);}
      if(!placed){selected=null;selectedFrom=null;render();}
    } else if(touchInfo&&!touchDragging){
      touchHandled=true;setTimeout(function(){touchHandled=false;},400);
      handleClick(touchInfo.type,touchInfo.idx,touchInfo.cardIdx);
    }
    touchInfo=null;touchDragging=false;
  }

  // ── Render ──
  function render(animate){
    var table=document.getElementById('solTable'); if(!table) return;
    table.innerHTML='';
    var topRow=document.createElement('div');topRow.className='sol-top-row';

    // Stock
    var stockEl=makeEmpty();stockEl.style.cursor='pointer';
    stockEl.dataset.type='stock';stockEl.dataset.idx='0';
    if(stock.length){var fd=makeFaceDown();fd.dataset.type='stock';fd.dataset.idx='0';stockEl.appendChild(fd);}
    else stockEl.innerHTML='<div style="font-size:1.6rem;color:rgba(192,132,252,.35);line-height:88px;text-align:center">\u21BA</div>';
    topRow.appendChild(stockEl);

    // Waste
    var wasteEl=makeEmpty();wasteEl.dataset.type='waste';wasteEl.dataset.idx='0';wasteEl.style.position='relative';
    var showCount=Math.min(3,waste.length);
    for(var wi=waste.length-showCount;wi<waste.length;wi++){
      (function(wii,offset){
        var wcard=waste[wii];
        var wel=makeCard(wcard);
        wel.style.position='absolute';wel.style.left=(offset*14)+'px';wel.style.top='0';wel.style.zIndex=offset+1;
        if(wii===waste.length-1){
          wel.dataset.type='waste';wel.dataset.idx='0';wel.dataset.ci=wii;
          if(selected&&selectedFrom&&selectedFrom.type==='waste') wel.classList.add('selected');
        } else { wel.style.pointerEvents='none'; }
        wasteEl.appendChild(wel);
      })(wi, wi-(waste.length-showCount));
    }
    wasteEl.style.width=(showCount>1?(28+62)+'px':'62px');
    topRow.appendChild(wasteEl);

    var sp=document.createElement('div');sp.style.flex='1';topRow.appendChild(sp);

    // Foundations
    for(var f=0;f<4;f++)(function(fi){
      var fEl=makeEmpty();fEl.classList.add('sol-pile-foundation');fEl.dataset.type='foundation';fEl.dataset.idx=fi;
      if(foundations[fi].length){
        fEl.innerHTML='';var fc=makeCard(foundations[fi][foundations[fi].length-1]);
        fc.dataset.type='foundation';fc.dataset.idx=fi;
        fEl.appendChild(fc);
      } else {
        var sl=document.createElement('div');sl.style.cssText='font-size:1.8rem;color:rgba(192,132,252,.22);line-height:88px;text-align:center;width:100%';sl.textContent=SUITS[fi];fEl.appendChild(sl);
      }
      topRow.appendChild(fEl);
    })(f);
    table.appendChild(topRow);

    // Tableau
    var tabRow=document.createElement('div');tabRow.className='sol-tableau';
    for(var t=0;t<7;t++)(function(ti){
      var pileEl=document.createElement('div');pileEl.className='sol-tab-pile sol-pile';
      pileEl.dataset.type='tableau';pileEl.dataset.idx=ti;pileEl.dataset.ci='empty';
      var klTop=0;
      tableau[ti].forEach(function(card,ci){
        var cel=card.faceUp?makeCard(card):makeFaceDown();
        cel.dataset.type='tableau';cel.dataset.idx=ti;cel.dataset.ci=ci;
        cel.style.position='absolute';cel.style.top=klTop+'px';cel.style.zIndex=ci+1;
        if(animate){cel.style.animation='solDeal .25s ease both';cel.style.animationDelay=(ti*3+ci)*.04+'s';}
        if(card.faceUp&&selected&&selectedFrom&&selectedFrom.type==='tableau'&&selectedFrom.idx===ti&&ci>=selectedFrom.cardIdx) cel.classList.add('selected');
        pileEl.appendChild(cel);
        klTop+=card.faceUp?28:14;
      });
      pileEl.style.height=Math.max(88,klTop+62)+'px';
      tabRow.appendChild(pileEl);
    })(t);
    table.appendChild(tabRow);
  }

  function makeCard(card){
    var el=document.createElement('div');
    el.className='sol-card '+(isRed(card.suit)?'red':'black');
    el.draggable=true;
    el.innerHTML='<div class="sol-card-rank">'+card.rank+'</div><div class="sol-card-suit">'+card.suit+'</div><div class="sol-card-center">'+card.suit+'</div>';
    return el;
  }
  function makeFaceDown(){var el=document.createElement('div');el.className='sol-card face-down';return el;}
  function makeEmpty(){var el=document.createElement('div');el.className='sol-pile-empty';return el;}

  function startWithShuffle(){
    deal(); playCardSound('shuffle');
    var table=document.getElementById('solTable');
    if(table) table.innerHTML='<div class="sol-shuffle-anim"><div class="sol-shuffle-deck"></div><div class="sol-shuffle-label">Shuffling\u2026</div></div>';
    setTimeout(function(){render(true);},700);
  }

  function klondikeTC(){removeTouchGhost();selected=null;selectedFrom=null;touchInfo=null;touchDragging=false;render();}
  window._klondikeCleanup=function(){var t=document.getElementById('solTable');if(!t)return;t.removeEventListener('dragstart',onDragStart);t.removeEventListener('dragover',onDragOver);t.removeEventListener('dragleave',onDragLeave);t.removeEventListener('drop',onDrop);t.removeEventListener('dragend',onDragEnd);t.removeEventListener('touchstart',onTouchStart);t.removeEventListener('touchmove',onTouchMove);t.removeEventListener('touchend',onTouchEnd);t.removeEventListener('touchcancel',klondikeTC);};
  window._klondikeHC=function(type,idx,ci){if(!touchDragging)handleClick(type,idx,ci);};
  window._klondikeDC=function(type,idx,ci){handleDblClick(type,idx,ci);};
  window._klondikeStart=function(){
    var table=document.getElementById('solTable'); if(!table) return;
    document.getElementById('solGameTitle').textContent='Klondike';
    var hintBtn=document.getElementById('solitaireHint'); if(hintBtn) hintBtn.style.display='';
    window._klondikeCleanup();
    table.addEventListener('dragstart',onDragStart);
    table.addEventListener('dragover',onDragOver);
    table.addEventListener('dragleave',onDragLeave);
    table.addEventListener('drop',onDrop);
    table.addEventListener('dragend',onDragEnd);
    table.addEventListener('touchstart',onTouchStart,{passive:true});
    table.addEventListener('touchmove',onTouchMove,{passive:false});
    table.addEventListener('touchend',onTouchEnd,{passive:true});
    table.addEventListener('touchcancel',klondikeTC,{passive:true});
    startWithShuffle();
  };
  window._klondikeStop=function(){clearInterval(solTimer);removeTouchGhost();};
  window._klondikeUndo=undo;
  window._klondikeNewGame=function(){startWithShuffle();};
  window._klondikeHint=showHint;
})();

// ── SPIDER SOLITAIRE ─────────────────────────────────────────────────────
(function(){
  var ALL_SUITS=['\u2660','\u2665','\u2666','\u2663'];
  var RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  var tableau=[],stock=[],foundations=[];
  var selected=null,selectedFrom=null,moves=0,solTimer=null,solSecs=0,history=[];
  var touchGhost=null,touchInfo=null,touchDragging=false,touchStartX=0,touchStartY=0,touchHandled=false;
  var suitMode=1; // 1, 2, or 4 suits
  function isRed(s){return s==='\u2665'||s==='\u2666';}
  function shuf(d){for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;}return d;}
  function mk(s,r,i){return {suit:s,rank:r,value:i+1,faceUp:false};}
  function buildDeck(){
    var suits=suitMode===1?['\u2660','\u2660','\u2660','\u2660']:suitMode===2?['\u2660','\u2665','\u2660','\u2665']:ALL_SUITS;
    var d=[];
    for(var k=0;k<2;k++)suits.forEach(function(s){RANKS.forEach(function(r,i){d.push(mk(s,r,i));});});
    return shuf(d);
  }
  function deal(){
    var d=buildDeck();tableau=[[],[],[],[],[],[],[],[],[],[]];stock=[];foundations=[];
    var idx=0;
    for(var c=0;c<10;c++){var n=c<4?6:5;for(var i=0;i<n;i++){var card=d[idx++];card.faceUp=(i===n-1);tableau[c].push(card);}}
    while(idx<d.length)stock.push(d[idx++]);
    selected=null;selectedFrom=null;moves=0;solSecs=0;history=[];
    var nb=document.getElementById('solNoMovesBanner');if(nb)nb.style.display='none';
  }
  function isMoveSeq(col,ci){
    var p=tableau[col];if(ci>=p.length||!p[ci].faceUp)return false;
    for(var i=ci;i<p.length-1;i++){if(p[i].suit!==p[i+1].suit||p[i].value!==p[i+1].value+1)return false;}
    return true;
  }
  function canPlace(card,pile){return !pile.length||( pile[pile.length-1].faceUp&&card.value===pile[pile.length-1].value-1);}
  function checkRuns(){
    for(var t=0;t<10;t++){
      var p=tableau[t];if(p.length<13)continue;
      var top=p.length-1,s=p[top-12];if(s.value!==13)continue;
      var suit=s.suit,ok=true;
      for(var i=0;i<13;i++){if(!p[top-12+i].faceUp||p[top-12+i].suit!==suit||p[top-12+i].value!==13-i){ok=false;break;}}
      if(ok){foundations.push(suit);tableau[t]=p.slice(0,top-12);if(tableau[t].length&&!tableau[t][tableau[t].length-1].faceUp)tableau[t][tableau[t].length-1].faceUp=true;t--;}
    }
  }
  function clone(c){return {suit:c.suit,rank:c.rank,value:c.value,faceUp:c.faceUp};}
  function save(){history.push({tab:tableau.map(function(p){return p.map(clone);}),stk:stock.map(clone),fnd:foundations.slice(),mv:moves,sc:solSecs});if(history.length>80)history.shift();updUndo();}
  function updUndo(){var b=document.getElementById('solitaireUndo');if(b){b.disabled=!history.length;b.style.opacity=history.length?'1':'.4';}}
  function undo(){if(!history.length)return;var h=history.pop();tableau=h.tab;stock=h.stk;foundations=h.fnd;moves=h.mv;solSecs=h.sc;selected=null;selectedFrom=null;document.getElementById('solMoves').textContent=moves;updUndo();render();}
  function dealStock(){
    if(!stock.length)return;
    save();
    for(var t=0;t<10;t++){if(!stock.length)break;var c=stock.pop();c.faceUp=true;tableau[t].push(c);}
    checkRuns();moves++;
    document.getElementById('solMoves').textContent=moves;render();checkWin();
  }
  function checkWin(){if(foundations.length===8){clearInterval(solTimer);history=[];updUndo();setTimeout(function(){_solWinOverlay(moves,'window._spiderNewGame');},300);}}
  function tryPlace(di){
    if(!selected||!selected.length)return false;
    if(!canPlace(selected[0],tableau[di]))return false;
    save();
    tableau[selectedFrom.idx].splice(selectedFrom.ci);
    var sp2=tableau[selectedFrom.idx];if(sp2.length&&!sp2[sp2.length-1].faceUp)sp2[sp2.length-1].faceUp=true;
    selected.forEach(function(c){tableau[di].push(c);});
    checkRuns();moves++;selected=null;selectedFrom=null;
    document.getElementById('solMoves').textContent=moves;render();checkWin();return true;
  }
  function handleClick(type,idx,ci){
    if(type==='stock'){dealStock();return;}
    if(type!=='tableau')return;
    if(ci===undefined){if(selected){tryPlace(idx);return;}selected=null;selectedFrom=null;render();return;}
    ci=parseInt(ci);var pile=tableau[idx];
    if(!pile[ci]||!pile[ci].faceUp){selected=null;selectedFrom=null;render();return;}
    if(selected){
      if(selectedFrom.idx===idx&&selectedFrom.ci===ci){render();return;} // same card: keep selected
      if(tryPlace(idx))return;
      if(isMoveSeq(idx,ci)){selected=pile.slice(ci);selectedFrom={idx:idx,ci:ci};render();return;}
      selected=null;selectedFrom=null;render();return;
    }
    if(isMoveSeq(idx,ci)){selected=pile.slice(ci);selectedFrom={idx:idx,ci:ci};render();}
  }
  function makeCard(card){var el=document.createElement('div');el.className='sol-card '+(isRed(card.suit)?'red':'black');el.draggable=true;el.innerHTML='<div class="sol-card-rank">'+card.rank+'</div><div class="sol-card-suit">'+card.suit+'</div><div class="sol-card-center">'+card.suit+'</div>';return el;}
  function makeFD(){var el=document.createElement('div');el.className='sol-card face-down';return el;}
  function render(){
    var table=document.getElementById('solTable');if(!table)return;
    table.innerHTML='';table.className='sol-table';
    var topRow=document.createElement('div');topRow.className='sol-top-row';
    var se=document.createElement('div');se.className='sol-pile-empty';se.style.cursor=stock.length?'pointer':'default';se.style.position='relative';
    se.dataset.type='stock';se.dataset.idx='0';
    if(stock.length){var fd=makeFD();fd.dataset.type='stock';fd.dataset.idx='0';se.appendChild(fd);var lb=document.createElement('div');lb.style.cssText='position:absolute;bottom:3px;right:5px;font-size:.6rem;color:rgba(192,132,252,.7);font-weight:700';lb.textContent=Math.ceil(stock.length/10)+'x';se.appendChild(lb);}
    else{se.innerHTML='<div style="font-size:1rem;color:rgba(192,132,252,.3);line-height:88px;text-align:center">\u2713</div>';}
    topRow.appendChild(se);
    var sp=document.createElement('div');sp.style.flex='1';topRow.appendChild(sp);
    for(var f=0;f<8;f++){var fe=document.createElement('div');fe.className='sol-pile-empty sol-pile-foundation';if(foundations[f]!==undefined){var kc=document.createElement('div');kc.className='sol-card '+(isRed(foundations[f])?'red':'black');kc.innerHTML='<div class="sol-card-rank">K</div><div class="sol-card-suit">'+foundations[f]+'</div><div class="sol-card-center">'+foundations[f]+'</div>';fe.appendChild(kc);}else{fe.innerHTML='<div style="font-size:.9rem;color:rgba(192,132,252,.15);line-height:88px;text-align:center">\u2606</div>';}topRow.appendChild(fe);}
    table.appendChild(topRow);
    var tabRow=document.createElement('div');tabRow.className='sol-tableau';tabRow.style.gap='6px';
    for(var t=0;t<10;t++)(function(ti){
      var pe=document.createElement('div');pe.className='sol-tab-pile sol-pile';pe.style.width='58px';
      pe.dataset.type='tableau';pe.dataset.idx=ti;pe.dataset.ci='empty';
      var spTop=0;
      tableau[ti].forEach(function(card,ci2){
        var cel=card.faceUp?makeCard(card):makeFD();
        cel.dataset.type='tableau';cel.dataset.idx=ti;cel.dataset.ci=ci2;
        cel.style.cssText='position:absolute;top:'+spTop+'px;z-index:'+(ci2+1)+';width:58px';
        if(selected&&selectedFrom&&selectedFrom.idx===ti&&ci2>=selectedFrom.ci)cel.classList.add('selected');
        pe.appendChild(cel);
        spTop+=card.faceUp?28:14;
      });
      pe.style.height=Math.max(88,spTop+62)+'px';
      tabRow.appendChild(pe);
    })(t);
    table.appendChild(tabRow);
  }
  // ── Drag & Drop ──
  function onDragStart(e){
    var el=e.target.closest('[data-type]');if(!el||el.dataset.type!=='tableau')return;
    var idx=parseInt(el.dataset.idx)||0,ci=el.dataset.ci;
    if(!ci||ci==='empty'){e.preventDefault();return;}
    ci=parseInt(ci);
    if(!isMoveSeq(idx,ci)){e.preventDefault();return;}
    selected=tableau[idx].slice(ci);selectedFrom={idx:idx,ci:ci};
    e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','sol');
    setTimeout(function(){render();},0);
  }
  function onDragOver(e){
    e.preventDefault();if(!selected)return;
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type="tableau"]');
    if(el){var di=parseInt(el.dataset.idx)||0;if(canPlace(selected[0],tableau[di])){el.classList.add('sol-drop-hover');e.dataTransfer.dropEffect='move';}else e.dataTransfer.dropEffect='none';}
  }
  function onDragLeave(e){if(!e.relatedTarget||!e.currentTarget.contains(e.relatedTarget))document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});}
  function onDrop(e){
    e.preventDefault();
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type="tableau"]');if(!el||!selected)return;
    tryPlace(parseInt(el.dataset.idx)||0);
  }
  function onDragEnd(e){
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    selected=null;selectedFrom=null;render();
  }
  // ── Touch Drag ──
  function removeTG(){if(touchGhost){touchGhost.remove();touchGhost=null;}}
  function onTS(e){var el=e.target.closest('[data-type]');if(!el||el.dataset.type==='stock')return;touchInfo={type:el.dataset.type,idx:parseInt(el.dataset.idx)||0,ci:el.dataset.ci==='empty'?undefined:el.dataset.ci};touchDragging=false;var t=e.touches[0];touchStartX=t.clientX;touchStartY=t.clientY;}
  function onTM(e){
    if(!touchInfo)return;var t=e.touches[0];
    if(!touchDragging&&Math.sqrt(Math.pow(t.clientX-touchStartX,2)+Math.pow(t.clientY-touchStartY,2))<10)return;
    if(!touchDragging){
      touchDragging=true;var ti=touchInfo;
      if(ti.type==='tableau'&&ti.ci!==undefined){var ci=parseInt(ti.ci);if(!isMoveSeq(ti.idx,ci)){touchInfo=null;touchDragging=false;return;}selected=tableau[ti.idx].slice(ci);selectedFrom={idx:ti.idx,ci:ci};}
      else{touchInfo=null;touchDragging=false;return;}
      var orig=e.target.closest('.sol-card');if(orig){touchGhost=orig.cloneNode(true);touchGhost.style.cssText='position:fixed;z-index:9999;pointer-events:none;opacity:.82;transform:rotate(4deg) scale(1.08);transition:none;width:58px;height:88px;border-radius:8px;';document.body.appendChild(touchGhost);}render();
    }
    e.preventDefault();if(touchGhost){touchGhost.style.left=(t.clientX-29)+'px';touchGhost.style.top=(t.clientY-50)+'px';}
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    if(touchGhost)touchGhost.style.display='none';var under=document.elementFromPoint(t.clientX,t.clientY);if(touchGhost)touchGhost.style.display='';
    if(under&&selected){var tEl=under.closest('[data-type="tableau"]');if(tEl&&canPlace(selected[0],tableau[parseInt(tEl.dataset.idx)||0]))tEl.classList.add('sol-drop-hover');}
  }
  function onTE(e){
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    if(touchDragging){var t=e.changedTouches[0];removeTG();var under=document.elementFromPoint(t.clientX,t.clientY);var placed=false;if(under&&selected){var tEl=under.closest('[data-type="tableau"]');if(tEl)placed=tryPlace(parseInt(tEl.dataset.idx)||0);}if(!placed){selected=null;selectedFrom=null;render();}}
    else if(touchInfo&&!touchDragging){touchHandled=true;setTimeout(function(){touchHandled=false;},400);handleClick(touchInfo.type,touchInfo.idx,touchInfo.ci);}
    touchInfo=null;touchDragging=false;
  }
  function spiderTC(){removeTG();selected=null;selectedFrom=null;touchInfo=null;touchDragging=false;render();}

  // ── Hint System ──
  var spHintTimer=null,spHintIdx=0;
  function spClearHints(){
    clearTimeout(spHintTimer);
    var t=document.getElementById('solTable');
    if(t)t.querySelectorAll('.sol-hint-src,.sol-hint-dst').forEach(function(x){x.classList.remove('sol-hint-src','sol-hint-dst');});
  }
  function spApplyHint(h){
    var t=document.getElementById('solTable');if(!t)return;
    var srcEl=t.querySelector('[data-type="tableau"][data-idx="'+h.si+'"][data-ci="'+h.sci+'"]');
    var dstPile=tableau[h.di];
    var dstEl=dstPile.length?t.querySelector('[data-type="tableau"][data-idx="'+h.di+'"][data-ci="'+(dstPile.length-1)+'"]'):t.querySelector('.sol-tab-pile[data-idx="'+h.di+'"]');
    if(srcEl)srcEl.classList.add('sol-hint-src');
    if(dstEl)dstEl.classList.add('sol-hint-dst');
    spHintTimer=setTimeout(spClearHints,2500);
  }
  function spGetMoves(){
    var result=[];
    for(var si=0;si<10;si++){
      var sp=tableau[si];
      // Find the highest face-up card that starts a valid moveable sequence
      for(var sci=0;sci<sp.length;sci++){
        if(!sp[sci].faceUp)continue;
        // Verify sequence from sci to end is a valid run (consecutive same suit or just consecutive)
        var seq=sp.slice(sci);
        var seqOk=true;
        for(var k=1;k<seq.length;k++){if(seq[k].value!==seq[k-1].value-1){seqOk=false;break;}}
        if(!seqOk)continue;
        // Check each destination
        for(var di=0;di<10;di++){
          if(di===si)continue;
          if(!canPlace(seq[0],tableau[di]))continue;
          // --- Score this move ---
          var score=0;
          // 1. Does this complete a K→A same-suit run?
          var destAfter=tableau[di].concat(seq);
          if(destAfter.length>=13){
            var base=destAfter.length-13;
            if(destAfter[base].value===13){
              var runSuit=destAfter[base].suit,runOk=true;
              for(var r=0;r<13;r++){if(destAfter[base+r].suit!==runSuit||destAfter[base+r].value!==13-r){runOk=false;break;}}
              if(runOk)score+=200;
            }
          }
          // 2. Reveals a face-down card?
          if(sci>0&&!sp[sci-1].faceUp)score+=80;
          else if(sci===0&&sp.length>0)score+=40; // clears whole column
          // 3. Entire moved sequence is same suit (keeps suits pure)
          var seqSameSuit=seq.every(function(c){return c.suit===seq[0].suit;});
          if(seqSameSuit)score+=30;
          // 4. Destination top is same suit as seq bottom (extends same-suit run)
          if(tableau[di].length&&tableau[di][tableau[di].length-1].suit===seq[seq.length-1].suit)score+=20;
          // 5. Moving to empty column — only worth it for long sequences or kings
          if(!tableau[di].length){
            if(seq[0].value===13)score+=15;
            else score-=20; // wasting empty column
          }
          // 6. Penalise breaking an existing same-suit run at source
          if(sci>0&&sp[sci-1].faceUp&&sp[sci-1].suit===sp[sci].suit&&sp[sci-1].value===sp[sci].value+1)score-=25;
          // 7. Longer sequences are more valuable to place
          score+=seq.length*2;
          result.push({si:si,sci:sci,di:di,score:score,seq:seq});
        }
      }
    }
    result.sort(function(a,b){return b.score-a.score;});
    return result;
  }
  function spShowHint(){
    spClearHints();
    var hints=spGetMoves();
    if(hints.length){
      spApplyHint(hints[spHintIdx%hints.length]);
      spHintIdx++;
      return;
    }
    // No tableau moves — suggest dealing from stock
    if(stock.length){
      showToast('Deal from stock','No tableau moves \u2014 click the stock pile');
      var se=document.querySelector('#solTable [data-type="stock"]');
      if(se){se.classList.add('sol-hint-src');spHintTimer=setTimeout(spClearHints,2500);}
    } else {
      showToast('No moves','Stock is empty and no moves found \u2014 try New Game');
    }
  }
  window._spiderCleanup=function(){var t=document.getElementById('solTable');if(!t)return;t.removeEventListener('dragstart',onDragStart);t.removeEventListener('dragover',onDragOver);t.removeEventListener('dragleave',onDragLeave);t.removeEventListener('drop',onDrop);t.removeEventListener('dragend',onDragEnd);t.removeEventListener('touchstart',onTS);t.removeEventListener('touchmove',onTM);t.removeEventListener('touchend',onTE);t.removeEventListener('touchcancel',spiderTC);};
  window._spiderHC=function(type,idx,ci){if(!touchHandled)handleClick(type,idx,ci);};
  window._spiderSetMode=function(n){suitMode=n;};
  window._spiderStart=function(){
    var table=document.getElementById('solTable');if(!table)return;
    var titles={1:'Spider — One Suit',2:'Spider — Two Suits',4:'Spider — Four Suits'};
    document.getElementById('solGameTitle').textContent=titles[suitMode]||'Spider';
    var hb=document.getElementById('solitaireHint');if(hb)hb.style.display='';
    spHintIdx=0;
    window._spiderCleanup();
    table.addEventListener('dragstart',onDragStart);table.addEventListener('dragover',onDragOver);table.addEventListener('dragleave',onDragLeave);table.addEventListener('drop',onDrop);table.addEventListener('dragend',onDragEnd);
    table.addEventListener('touchstart',onTS,{passive:true});table.addEventListener('touchmove',onTM,{passive:false});table.addEventListener('touchend',onTE,{passive:true});table.addEventListener('touchcancel',spiderTC,{passive:true});
    deal();
    var tbl=document.getElementById('solTable');if(tbl)tbl.innerHTML='<div class="sol-shuffle-anim"><div class="sol-shuffle-deck"></div><div class="sol-shuffle-label">Shuffling\u2026</div></div>';
    document.getElementById('solMoves').textContent='0';var et=document.getElementById('solTime');if(et)et.textContent='0:00';
    clearInterval(solTimer);solTimer=setInterval(function(){solSecs++;var m=Math.floor(solSecs/60),s=solSecs%60;var el=document.getElementById('solTime');if(el)el.textContent=m+':'+(s<10?'0':'')+s;},1000);
    setTimeout(function(){render();},700);
  };
  window._spiderStop=function(){clearInterval(solTimer);removeTG();spClearHints();};
  window._spiderUndo=undo;
  window._spiderHint=spShowHint;
  window._spiderNewGame=function(){spHintIdx=0;window._spiderStart();};
})();

// ── SCORPION SOLITAIRE ───────────────────────────────────────────────────
(function(){
  var SUITS=['\u2660','\u2665','\u2666','\u2663'];
  var RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  var tableau=[],stock=[],foundations=[];
  var selected=null,selectedFrom=null,moves=0,solTimer=null,solSecs=0,history=[];
  function isRed(s){return s==='\u2665'||s==='\u2666';}
  function shuf(d){for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;}return d;}
  function mk(s,r,i){return{suit:s,rank:r,value:i+1,faceUp:false};}
  function deal(){
    var d=[];SUITS.forEach(function(s){RANKS.forEach(function(r,i){d.push(mk(s,r,i));});});shuf(d);
    tableau=[];
    var idx=0;
    // 7 columns: cols 0-3 have 7 cards (first 3 face-down), cols 4-6 have 7 cards (all face-up)
    for(var c=0;c<7;c++){
      tableau.push([]);
      for(var i=0;i<7;i++){
        var card=d[idx++];
        card.faceUp=(c>=4||i>=3);
        tableau[c].push(card);
      }
    }
    // remaining 3 cards go to stock
    stock=[];while(idx<d.length)stock.push(d[idx++]);
    foundations=[];selected=null;selectedFrom=null;moves=0;solSecs=0;history=[];
  }
  // In Scorpion, you can move a face-up card (and all cards on top of it)
  // onto a card of the same suit that is one rank higher
  function canPlace(card,pile){
    if(!pile.length)return card.value===13; // King to empty
    var top=pile[pile.length-1];
    return top.faceUp&&card.suit===top.suit&&card.value===top.value-1;
  }
  function checkRuns(){
    for(var t=0;t<7;t++){
      var p=tableau[t];if(p.length<13)continue;
      var base=p.length-13;
      if(p[base].value!==13)continue;
      var suit=p[base].suit,ok=true;
      for(var i=0;i<13;i++){if(!p[base+i].faceUp||p[base+i].suit!==suit||p[base+i].value!==13-i){ok=false;break;}}
      if(ok){foundations.push(suit);tableau[t]=p.slice(0,base);if(tableau[t].length&&!tableau[t][tableau[t].length-1].faceUp)tableau[t][tableau[t].length-1].faceUp=true;t--;}
    }
  }
  function clone(c){return{suit:c.suit,rank:c.rank,value:c.value,faceUp:c.faceUp};}
  function save(){history.push({tab:tableau.map(function(p){return p.map(clone);}),stk:stock.map(clone),fnd:foundations.slice(),mv:moves,sc:solSecs});if(history.length>80)history.shift();updUndo();}
  function updUndo(){var b=document.getElementById('solitaireUndo');if(b){b.disabled=!history.length;b.style.opacity=history.length?'1':'.4';}}
  function undo(){if(!history.length)return;var h=history.pop();tableau=h.tab;stock=h.stk;foundations=h.fnd;moves=h.mv;solSecs=h.sc;selected=null;selectedFrom=null;document.getElementById('solMoves').textContent=moves;updUndo();render();}
  function dealStock(){
    if(!stock.length)return;
    save();
    for(var t=0;t<3&&stock.length;t++){var c=stock.pop();c.faceUp=true;tableau[t].push(c);}
    checkRuns();moves++;document.getElementById('solMoves').textContent=moves;render();checkWin();
  }
  function checkWin(){if(foundations.length===4){clearInterval(solTimer);history=[];updUndo();setTimeout(function(){_solWinOverlay(moves,'window._scorpionNewGame');},300);}}
  function tryPlace(di){
    if(!selected||!selected.length)return false;
    if(!canPlace(selected[0],tableau[di]))return false;
    save();
    tableau[selectedFrom.idx].splice(selectedFrom.ci);
    var sp=tableau[selectedFrom.idx];if(sp.length&&!sp[sp.length-1].faceUp)sp[sp.length-1].faceUp=true;
    selected.forEach(function(c){tableau[di].push(c);});
    checkRuns();moves++;selected=null;selectedFrom=null;
    document.getElementById('solMoves').textContent=moves;render();checkWin();return true;
  }
  function handleClick(type,idx,ci){
    if(type==='stock'){dealStock();return;}
    if(type!=='tableau')return;
    if(ci===undefined){if(selected){tryPlace(idx);return;}selected=null;selectedFrom=null;render();return;}
    ci=parseInt(ci);var pile=tableau[idx];
    if(!pile[ci]||!pile[ci].faceUp){selected=null;selectedFrom=null;render();return;}
    if(selected){
      if(selectedFrom.idx===idx&&selectedFrom.ci===ci){render();return;}
      if(tryPlace(idx))return;
      // pick new sequence
      selected=pile.slice(ci);selectedFrom={idx:idx,ci:ci};render();return;
    }
    selected=pile.slice(ci);selectedFrom={idx:idx,ci:ci};render();
  }
  function makeCard(card){var el=document.createElement('div');el.className='sol-card '+(isRed(card.suit)?'red':'black');el.draggable=true;el.innerHTML='<div class="sol-card-rank">'+card.rank+'</div><div class="sol-card-suit">'+card.suit+'</div><div class="sol-card-center">'+card.suit+'</div>';return el;}
  function makeFD(){var el=document.createElement('div');el.className='sol-card face-down';return el;}
  function render(){
    var table=document.getElementById('solTable');if(!table)return;
    table.innerHTML='';table.className='sol-table';
    var topRow=document.createElement('div');topRow.className='sol-top-row';
    var se=document.createElement('div');se.className='sol-pile-empty';se.style.cursor=stock.length?'pointer':'default';se.style.position='relative';
    se.dataset.type='stock';se.dataset.idx='0';
    if(stock.length){var fd=makeFD();fd.dataset.type='stock';fd.dataset.idx='0';se.appendChild(fd);var lb=document.createElement('div');lb.style.cssText='position:absolute;bottom:3px;right:5px;font-size:.6rem;color:rgba(192,132,252,.7);font-weight:700';lb.textContent=stock.length;se.appendChild(lb);}
    else{se.innerHTML='<div style="font-size:1rem;color:rgba(192,132,252,.3);line-height:88px;text-align:center">\u2713</div>';}
    topRow.appendChild(se);
    var sp2=document.createElement('div');sp2.style.flex='1';topRow.appendChild(sp2);
    for(var f=0;f<4;f++){var fe=document.createElement('div');fe.className='sol-pile-empty sol-pile-foundation';if(foundations[f]!==undefined){var kc=document.createElement('div');kc.className='sol-card '+(isRed(foundations[f])?'red':'black');kc.innerHTML='<div class="sol-card-rank">K</div><div class="sol-card-suit">'+foundations[f]+'</div><div class="sol-card-center">'+foundations[f]+'</div>';fe.appendChild(kc);}else{fe.innerHTML='<div style="font-size:.9rem;color:rgba(192,132,252,.15);line-height:88px;text-align:center">\u2606</div>';}topRow.appendChild(fe);}
    table.appendChild(topRow);
    var tabRow=document.createElement('div');tabRow.className='sol-tableau';tabRow.style.gap='6px';
    for(var t=0;t<7;t++)(function(ti){
      var pe=document.createElement('div');pe.className='sol-tab-pile sol-pile';pe.style.width='58px';
      pe.dataset.type='tableau';pe.dataset.idx=ti;pe.dataset.ci='empty';
      var scoTop=0;
      tableau[ti].forEach(function(card,ci2){
        var cel=card.faceUp?makeCard(card):makeFD();
        cel.dataset.type='tableau';cel.dataset.idx=ti;cel.dataset.ci=ci2;
        cel.style.cssText='position:absolute;top:'+scoTop+'px;z-index:'+(ci2+1)+';width:58px';
        if(selected&&selectedFrom&&selectedFrom.idx===ti&&ci2>=selectedFrom.ci)cel.classList.add('selected');
        pe.appendChild(cel);
        scoTop+=card.faceUp?28:14;
      });
      pe.style.height=Math.max(88,scoTop+62)+'px';
      tabRow.appendChild(pe);
    })(t);
    table.appendChild(tabRow);
  }
  // Drag & Drop
  function scoDragStart(e){
    var el=e.target.closest('[data-type]');if(!el||el.dataset.type!=='tableau')return;
    var idx=parseInt(el.dataset.idx)||0,ci=el.dataset.ci;
    if(!ci||ci==='empty'){e.preventDefault();return;}
    ci=parseInt(ci);
    if(!tableau[idx][ci]||!tableau[idx][ci].faceUp){e.preventDefault();return;}
    selected=tableau[idx].slice(ci);selectedFrom={idx:idx,ci:ci};
    e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','sol');
    setTimeout(function(){render();},0);
  }
  function scoDragOver(e){
    e.preventDefault();if(!selected)return;
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type="tableau"]');
    if(el){var di=parseInt(el.dataset.idx)||0;if(canPlace(selected[0],tableau[di])){el.classList.add('sol-drop-hover');e.dataTransfer.dropEffect='move';}else e.dataTransfer.dropEffect='none';}
  }
  function scoDragLeave(e){if(!e.relatedTarget||!e.currentTarget.contains(e.relatedTarget))document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});}
  function scoDrop(e){
    e.preventDefault();
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type="tableau"]');if(!el||!selected)return;
    tryPlace(parseInt(el.dataset.idx)||0);
  }
  function scoDragEnd(e){document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});selected=null;selectedFrom=null;render();}
  // ── Scorpion Hint System ──
  var scoHintTimer=null,scoHintIdx=0;
  function scoClearHints(){
    clearTimeout(scoHintTimer);
    var t=document.getElementById('solTable');
    if(t)t.querySelectorAll('.sol-hint-src,.sol-hint-dst').forEach(function(x){x.classList.remove('sol-hint-src','sol-hint-dst');});
  }
  function scoApplyHint(h){
    var t=document.getElementById('solTable');if(!t)return;
    var srcEl=t.querySelector('[data-type="tableau"][data-idx="'+h.si+'"][data-ci="'+h.sci+'"]');
    var dstPile=tableau[h.di];
    var dstEl=dstPile.length?t.querySelector('[data-type="tableau"][data-idx="'+h.di+'"][data-ci="'+(dstPile.length-1)+'"]'):t.querySelector('.sol-tab-pile[data-idx="'+h.di+'"]');
    if(srcEl)srcEl.classList.add('sol-hint-src');
    if(dstEl)dstEl.classList.add('sol-hint-dst');
    scoHintTimer=setTimeout(scoClearHints,2500);
  }
  function scoGetMoves(){
    var result=[];
    for(var si=0;si<7;si++){
      var sp=tableau[si];
      for(var sci=0;sci<sp.length;sci++){
        if(!sp[sci].faceUp)continue;
        var seq=sp.slice(sci);
        for(var di=0;di<7;di++){
          if(di===si)continue;
          if(!canPlace(seq[0],tableau[di]))continue;
          var score=0;
          // Reveals face-down card
          if(sci>0&&!sp[sci-1].faceUp)score+=80;
          else if(sci===0&&sp.length>0)score+=40;
          // Entire sequence is same suit
          var sameSuit=seq.every(function(c){return c.suit===seq[0].suit;});
          if(sameSuit)score+=30;
          // Destination is same suit (extending a run)
          if(tableau[di].length&&tableau[di][tableau[di].length-1].suit===seq[0].suit)score+=25;
          // Complete a K→A run?
          var destAfter=tableau[di].concat(seq);
          if(destAfter.length>=13){
            var base=destAfter.length-13;
            if(destAfter[base].value===13){
              var rs=destAfter[base].suit,rok=true;
              for(var r=0;r<13;r++){if(destAfter[base+r].suit!==rs||destAfter[base+r].value!==13-r){rok=false;break;}}
              if(rok)score+=200;
            }
          }
          // Empty column: only worth it for kings
          if(!tableau[di].length){if(seq[0].value===13)score+=15;else score-=20;}
          // Penalise breaking a same-suit run
          if(sci>0&&sp[sci-1].faceUp&&sp[sci-1].suit===sp[sci].suit&&sp[sci-1].value===sp[sci].value+1)score-=25;
          score+=seq.length*2;
          result.push({si:si,sci:sci,di:di,score:score});
        }
      }
    }
    result.sort(function(a,b){return b.score-a.score;});
    return result;
  }
  function scoShowHint(){
    scoClearHints();
    var hints=scoGetMoves();
    if(hints.length){scoApplyHint(hints[scoHintIdx%hints.length]);scoHintIdx++;return;}
    if(stock.length){
      showToast('Deal from stock','No tableau moves \u2014 click the stock pile');
      var se=document.querySelector('#solTable [data-type="stock"]');
      if(se){se.classList.add('sol-hint-src');scoHintTimer=setTimeout(scoClearHints,2500);}
    } else {showToast('No moves','Stock empty and no moves \u2014 try New Game');}
  }
  window._scorpionCleanup=function(){var t=document.getElementById('solTable');if(!t)return;t.removeEventListener('dragstart',scoDragStart);t.removeEventListener('dragover',scoDragOver);t.removeEventListener('dragleave',scoDragLeave);t.removeEventListener('drop',scoDrop);t.removeEventListener('dragend',scoDragEnd);scoClearHints();};
  window._scorpionHC=function(type,idx,ci){handleClick(type,idx,ci);};
  window._scorpionStart=function(){
    var table=document.getElementById('solTable');if(!table)return;
    document.getElementById('solGameTitle').textContent='Scorpion';
    var hb=document.getElementById('solitaireHint');if(hb)hb.style.display='';
    scoHintIdx=0;
    window._scorpionCleanup();
    table.addEventListener('dragstart',scoDragStart);table.addEventListener('dragover',scoDragOver);table.addEventListener('dragleave',scoDragLeave);table.addEventListener('drop',scoDrop);table.addEventListener('dragend',scoDragEnd);
    deal();
    var tbl=document.getElementById('solTable');if(tbl)tbl.innerHTML='<div class="sol-shuffle-anim"><div class="sol-shuffle-deck"></div><div class="sol-shuffle-label">Shuffling\u2026</div></div>';
    document.getElementById('solMoves').textContent='0';var et=document.getElementById('solTime');if(et)et.textContent='0:00';
    clearInterval(solTimer);solTimer=setInterval(function(){solSecs++;var m=Math.floor(solSecs/60),s=solSecs%60;var el=document.getElementById('solTime');if(el)el.textContent=m+':'+(s<10?'0':'')+s;},1000);
    setTimeout(function(){render();},700);
  };
  window._scorpionStop=function(){clearInterval(solTimer);scoClearHints();};
  window._scorpionUndo=undo;
  window._scorpionHint=scoShowHint;
  window._scorpionNewGame=function(){scoHintIdx=0;window._scorpionStart();};
})();

// ── FREECELL SOLITAIRE ───────────────────────────────────────────────────
(function(){
  var SUITS=['\u2660','\u2665','\u2666','\u2663'];
  var RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  var tableau=[],freecells=[null,null,null,null],foundations=[[],[],[],[]];
  var selected=null,selectedFrom=null,moves=0,solTimer=null,solSecs=0,history=[];
  function isRed(s){return s==='\u2665'||s==='\u2666';}
  function shuf(d){for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;}return d;}
  function deal(){
    var d=[];SUITS.forEach(function(s){RANKS.forEach(function(r,i){d.push({suit:s,rank:r,value:i+1,faceUp:true});});});shuf(d);
    tableau=[[],[],[],[],[],[],[],[]];freecells=[null,null,null,null];foundations=[[],[],[],[]];
    for(var i=0;i<d.length;i++)tableau[i%8].push(d[i]);
    selected=null;selectedFrom=null;moves=0;solSecs=0;history=[];
    var nb=document.getElementById('solNoMovesBanner');if(nb)nb.style.display='none';
  }
  function canTab(card,pile){if(!pile.length)return true;var top=pile[pile.length-1];return card.value===top.value-1&&isRed(card.suit)!==isRed(top.suit);}
  function canFound(card,fi){var p=foundations[fi];if(card.suit!==SUITS[fi])return false;return p.length===0?card.value===1:card.value===p[p.length-1].value+1;}
  function canFoundAny(card){for(var f=0;f<4;f++)if(canFound(card,f))return f;return -1;}
  // Supermove: max cards moveable = (freeCells+1)*2^emptyColumns
  function maxMove(dstIsEmpty){
    var fc=freecells.filter(function(x){return x===null;}).length;
    var ec=tableau.filter(function(p){return !p.length;}).length;
    if(dstIsEmpty)ec=Math.max(0,ec-1);
    return (fc+1)*Math.pow(2,ec);
  }
  // Get the valid moveable sequence from bottom of pile
  function getMoveSeq(col){
    var p=tableau[col];if(!p.length)return [];
    var seq=[p[p.length-1]];
    for(var i=p.length-2;i>=0;i--){
      var top=seq[seq.length-1],cur=p[i];
      if(cur.value===top.value+1&&isRed(cur.suit)!==isRed(top.suit))seq.push(cur);
      else break;
    }
    return seq.reverse();
  }
  function clone(c){return c?{suit:c.suit,rank:c.rank,value:c.value,faceUp:c.faceUp}:null;}
  function save(){history.push({tab:tableau.map(function(p){return p.map(clone);}),fc:freecells.map(clone),fnd:foundations.map(function(p){return p.map(clone);}),mv:moves,sc:solSecs});if(history.length>80)history.shift();updUndo();}
  function updUndo(){var b=document.getElementById('solitaireUndo');if(b){b.disabled=!history.length;b.style.opacity=history.length?'1':'.4';}}
  function undo(){if(!history.length)return;var h=history.pop();tableau=h.tab;freecells=h.fc;foundations=h.fnd;moves=h.mv;solSecs=h.sc;selected=null;selectedFrom=null;document.getElementById('solMoves').textContent=moves;updUndo();render();}
  function afterMove(){document.getElementById('solMoves').textContent=moves;render();checkWin();}
  function checkWin(){if(foundations.every(function(f){return f.length===13;})){clearInterval(solTimer);history=[];updUndo();setTimeout(function(){_solWinOverlay(moves,'window._freecellNewGame');},300);}}
  function _fcSnap(sel){var e=document.querySelector(sel);return e?{r:e.getBoundingClientRect(),h:e.innerHTML,c:e.className}:null;}
  function tryPlace(dstType,dstIdx){
    if(!selected)return false;
    var card=selected;
    var srcSel=selectedFrom.type==='freecell'
      ?'#solTable [data-type="freecell"][data-idx="'+selectedFrom.idx+'"]'
      :'#solTable [data-type="tableau"][data-idx="'+selectedFrom.idx+'"] [data-ci="'+(tableau[selectedFrom.idx].length-1)+'"]';
    var dstSel=dstType==='foundation'?'#solTable [data-type="foundation"][data-idx="'+dstIdx+'"]'
      :dstType==='freecell'?'#solTable [data-type="freecell"][data-idx="'+dstIdx+'"]'
      :'#solTable [data-type="tableau"][data-idx="'+dstIdx+'"]';
    var ss=_fcSnap(srcSel);
    if(dstType==='foundation'){
      if(canFound(card,dstIdx)){
        save();if(selectedFrom.type==='tableau')tableau[selectedFrom.idx].pop();else freecells[selectedFrom.idx]=null;
        foundations[dstIdx].push(card);moves++;selected=null;selectedFrom=null;afterMove();
        if(ss)_solFly(ss.r,ss.h,ss.c,dstSel,200);
        return true;
      }
    } else if(dstType==='freecell'){
      if(freecells[dstIdx]===null&&selectedFrom.type==='tableau'){
        if(tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1]===card){
          save();tableau[selectedFrom.idx].pop();freecells[dstIdx]=card;moves++;selected=null;selectedFrom=null;afterMove();
          if(ss)_solFly(ss.r,ss.h,ss.c,dstSel,200);
          return true;
        }
      }
    } else if(dstType==='tableau'){
      var pile=tableau[dstIdx];
      if(selectedFrom.type==='freecell'){
        if(canTab(card,pile)){
          save();freecells[selectedFrom.idx]=null;pile.push(card);moves++;selected=null;selectedFrom=null;afterMove();
          if(ss)_solFly(ss.r,ss.h,ss.c,dstSel,200);
          return true;
        }
      } else if(selectedFrom.type==='tableau'){
        var seq=getMoveSeq(selectedFrom.idx);
        var moveCard=seq.length?seq[0]:card;
        if(canTab(moveCard,pile)){
          var limit=maxMove(!pile.length);
          var seqToMove=seq.length<=limit?seq:[card];
          var srcStart=tableau[selectedFrom.idx].length-seqToMove.length;
          save();tableau[selectedFrom.idx].splice(srcStart);seqToMove.forEach(function(c){pile.push(c);});moves++;selected=null;selectedFrom=null;afterMove();
          if(ss)_solFly(ss.r,ss.h,ss.c,dstSel,200);
          return true;
        }
      }
    }
    return false;
  }
  function handleClick(type,idx,ci){
    if(selected){
      // Try to place
      if(tryPlace(type,idx))return;
      // Re-select if clicking new card
      if(type==='tableau'&&ci!==undefined){var p=tableau[idx];if(p.length&&p[p.length-1].faceUp){selected=p[p.length-1];selectedFrom={type:'tableau',idx:idx};render();return;}}
      if(type==='freecell'&&freecells[idx]){selected=freecells[idx];selectedFrom={type:'freecell',idx:idx};render();return;}
      selected=null;selectedFrom=null;render();return;
    }
    if(type==='tableau'){var p2=tableau[idx];if(!p2.length)return;selected=p2[p2.length-1];selectedFrom={type:'tableau',idx:idx};render();}
    else if(type==='freecell'){if(!freecells[idx])return;selected=freecells[idx];selectedFrom={type:'freecell',idx:idx};render();}
    else if(type==='foundation'){return;}
  }
  function handleDbl(type,idx){
    var card=null;
    if(type==='tableau'&&tableau[idx].length)card=tableau[idx][tableau[idx].length-1];
    else if(type==='freecell'&&freecells[idx])card=freecells[idx];
    if(!card)return;
    var fi=canFoundAny(card);if(fi<0)return;
    save();
    if(type==='tableau')tableau[idx].pop();else freecells[idx]=null;
    foundations[fi].push(card);moves++;selected=null;selectedFrom=null;afterMove();
  }
  function makeCard(card,sel){var el=document.createElement('div');el.className='sol-card '+(isRed(card.suit)?'red':'black')+(sel?' selected':'');el.draggable=true;el.innerHTML='<div class="sol-card-rank">'+card.rank+'</div><div class="sol-card-suit">'+card.suit+'</div><div class="sol-card-center">'+card.suit+'</div>';return el;}
  function makeEmpty(cls){var el=document.createElement('div');el.className='sol-pile-empty'+(cls?' '+cls:'');return el;}
  function render(){
    var table=document.getElementById('solTable');if(!table)return;
    table.innerHTML='';table.className='sol-table';
    var topRow=document.createElement('div');topRow.className='sol-top-row';
    // 4 freecells
    for(var f=0;f<4;f++)(function(fi){
      var fe=makeEmpty('sol-fc-cell');
      fe.dataset.type='freecell';fe.dataset.idx=fi;
      if(freecells[fi]){
        var isSel=selected&&selectedFrom&&selectedFrom.type==='freecell'&&selectedFrom.idx===fi;
        var c=makeCard(freecells[fi],isSel);
        c.dataset.type='freecell';c.dataset.idx=fi;
        fe.appendChild(c);
      } else {fe.innerHTML='<div style="font-size:.7rem;color:rgba(192,132,252,.25);text-align:center;line-height:88px">Free</div>';}
      topRow.appendChild(fe);
    })(f);
    var sp=document.createElement('div');sp.style.flex='1';topRow.appendChild(sp);
    // 4 foundations
    for(var ff=0;ff<4;ff++)(function(fi){
      var fe=makeEmpty('sol-pile-foundation');
      fe.dataset.type='foundation';fe.dataset.idx=fi;
      if(foundations[fi].length){
        var top=foundations[fi][foundations[fi].length-1];
        var c=makeCard(top,false);
        c.dataset.type='foundation';c.dataset.idx=fi;
        fe.appendChild(c);
      } else {fe.innerHTML='<div style="font-size:1.6rem;color:rgba(192,132,252,.2);line-height:88px;text-align:center">'+SUITS[fi]+'</div>';}
      topRow.appendChild(fe);
    })(ff);
    table.appendChild(topRow);
    var tabRow=document.createElement('div');tabRow.className='sol-tableau';
    for(var t=0;t<8;t++)(function(ti){
      var pe=document.createElement('div');pe.className='sol-tab-pile sol-pile';
      pe.dataset.type='tableau';pe.dataset.idx=ti;pe.dataset.ci='empty';
      var fcTop=0;
      tableau[ti].forEach(function(card,ci){
        var isSel=selected&&selectedFrom&&selectedFrom.type==='tableau'&&selectedFrom.idx===ti&&ci===tableau[ti].length-1;
        var cel=makeCard(card,isSel);
        cel.dataset.type='tableau';cel.dataset.idx=ti;cel.dataset.ci=ci;
        cel.style.cssText='position:absolute;top:'+fcTop+'px;z-index:'+(ci+1);
        pe.appendChild(cel);
        fcTop+=card.faceUp?28:14;
      });
      pe.style.height=Math.max(88,fcTop+62)+'px';
      tabRow.appendChild(pe);
    })(t);
    table.appendChild(tabRow);
  }
  // ── FreeCell Drag & Drop ──
  function fcDragStart(e){
    var el=e.target.closest('[data-type]');if(!el)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0,ci=el.dataset.ci;
    if(type==='freecell'){if(!freecells[idx]){e.preventDefault();return;}selected=freecells[idx];selectedFrom={type:'freecell',idx:idx};}
    else if(type==='tableau'){if(!ci||ci==='empty'){e.preventDefault();return;}ci=parseInt(ci);var p=tableau[idx];if(!p[ci]||!p[ci].faceUp){e.preventDefault();return;}selected=p[p.length-1];selectedFrom={type:'tableau',idx:idx};}
    else{e.preventDefault();return;}
    e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','sol');
    setTimeout(function(){render();},0);
  }
  function fcDragOver(e){
    e.preventDefault();if(!selected)return;
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type]');if(!el)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0;
    var ok=(type==='tableau'&&canTab(selected,tableau[idx]))||(type==='freecell'&&freecells[idx]===null&&selectedFrom.type==='tableau')||(type==='foundation'&&canFound(selected,idx));
    if(ok){el.classList.add('sol-drop-hover');e.dataTransfer.dropEffect='move';}else e.dataTransfer.dropEffect='none';
  }
  function fcDragLeave(e){if(!e.relatedTarget||!e.currentTarget.contains(e.relatedTarget))document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});}
  function fcDrop(e){
    e.preventDefault();
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type]');if(!el||!selected)return;
    tryPlace(el.dataset.type,parseInt(el.dataset.idx)||0);
    selected=null;selectedFrom=null;
  }
  function fcDragEnd(e){
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    selected=null;selectedFrom=null;render();
  }
  function fcTableClick(e){
    var el=e.target.closest('[data-type]');if(!el)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0,ci=el.dataset.ci;
    var cardIdx=(ci===undefined||ci==='empty')?undefined:parseInt(ci);
    handleClick(type,idx,isNaN(cardIdx)?undefined:cardIdx);
  }
  function fcTableDbl(e){
    var el=e.target.closest('[data-type]');if(!el)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0;
    handleDbl(type,idx);
  }
  window._freecellCleanup=function(){var t=document.getElementById('solTable');if(!t)return;t.removeEventListener('dragstart',fcDragStart);t.removeEventListener('dragover',fcDragOver);t.removeEventListener('dragleave',fcDragLeave);t.removeEventListener('drop',fcDrop);t.removeEventListener('dragend',fcDragEnd);t.removeEventListener('click',fcTableClick);t.removeEventListener('dblclick',fcTableDbl);};
  window._freecellHC=function(){}; // handled by fcTableClick direct listener
  window._freecellDC=function(){}; // handled by fcTableDbl direct listener
  window._freecellStart=function(){
    var table=document.getElementById('solTable');if(!table)return;
    window._freecellCleanup();
    table.addEventListener('dragstart',fcDragStart);table.addEventListener('dragover',fcDragOver);table.addEventListener('dragleave',fcDragLeave);table.addEventListener('drop',fcDrop);table.addEventListener('dragend',fcDragEnd);
    table.addEventListener('click',fcTableClick);table.addEventListener('dblclick',fcTableDbl);
    document.getElementById('solGameTitle').textContent='FreeCell';
    var hb=document.getElementById('solitaireHint');if(hb)hb.style.display='none';
    deal();
    var tbl=document.getElementById('solTable');if(tbl)tbl.innerHTML='<div class="sol-shuffle-anim"><div class="sol-shuffle-deck"></div><div class="sol-shuffle-label">Shuffling\u2026</div></div>';
    document.getElementById('solMoves').textContent='0';var et=document.getElementById('solTime');if(et)et.textContent='0:00';
    clearInterval(solTimer);solTimer=setInterval(function(){solSecs++;var m=Math.floor(solSecs/60),s=solSecs%60;var el=document.getElementById('solTime');if(el)el.textContent=m+':'+(s<10?'0':'')+s;},1000);
    setTimeout(function(){render();},700);
  };
  window._freecellStop=function(){clearInterval(solTimer);};
  window._freecellUndo=undo;
  window._freecellNewGame=function(){window._freecellStart();};
})();

// ── Shared solitaire card-flight animator ────────────────────────────────
// fromRect : DOMRect of the source card (snapshot BEFORE render destroys it)
// html     : innerHTML of source card (to display rank/suit on the flying clone)
// cls      : className of source card
// destSel  : CSS selector to find destination element AFTER render (queried inside rAF)
//            Pass null to make the card shrink-and-fade (for removals)
// dur      : animation duration ms
function _solFly(fromRect, html, cls, destSel, dur){
  if(!fromRect) return;
  dur = dur||200;
  var fly=document.createElement('div');
  fly.className=cls||'sol-card';
  fly.innerHTML=html||'';
  fly.style.cssText='position:fixed;left:'+fromRect.left+'px;top:'+fromRect.top+'px;width:'+fromRect.width+'px;height:'+fromRect.height+'px;margin:0;z-index:9999;pointer-events:none;transition:left '+dur+'ms cubic-bezier(.22,1,.36,1),top '+dur+'ms cubic-bezier(.22,1,.36,1),width '+dur+'ms,height '+dur+'ms,opacity '+dur+'ms,transform '+dur+'ms;';
  document.body.appendChild(fly);
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      if(destSel){
        var dst=document.querySelector(destSel);
        if(dst){var r=dst.getBoundingClientRect();fly.style.left=r.left+'px';fly.style.top=r.top+'px';fly.style.width=r.width+'px';fly.style.height=r.height+'px';}
      } else {
        fly.style.opacity='0';
        fly.style.transform='scale(0.25) rotate(12deg)';
      }
    });
  });
  setTimeout(function(){fly.remove();},dur+80);
}

function _solPlayWinSound(){
  try{
    var ac=new(window.AudioContext||window.webkitAudioContext)();
    var notes=[523,659,784,1047];
    notes.forEach(function(freq,ni){
      setTimeout(function(){
        var osc=ac.createOscillator(),g=ac.createGain();
        osc.type='sine';osc.frequency.value=freq;
        g.gain.setValueAtTime(0,ac.currentTime);
        g.gain.linearRampToValueAtTime(.35,ac.currentTime+.04);
        g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.45);
        osc.connect(g);g.connect(ac.destination);
        osc.start();osc.stop(ac.currentTime+.5);
      },ni*130);
    });
  }catch(e){}
}

function _solWinOverlay(moves, newGameFn){
  var table=document.getElementById('solTable');if(!table)return;
  if(table.querySelector('.sol-gameover-overlay'))return;
  table.style.position='relative';
  var ov=document.createElement('div');ov.className='sol-gameover-overlay';
  ov.innerHTML='<div class="sol-gameover-title" style="color:#4ade80;font-size:2.8rem">\uD83C\uDF89 You Win!</div><div class="sol-gameover-sub">Completed in '+moves+' moves</div><button class="sol-gameover-btn" onclick="('+newGameFn+')()">Play Again</button>';
  table.appendChild(ov);
  _solPlayWinSound();
  for(var i=0;i<32;i++){(function(i2){setTimeout(function(){var c=document.createElement('div');c.style.cssText='position:fixed;left:'+Math.random()*100+'vw;top:-20px;width:'+(8+Math.random()*8)+'px;height:'+(8+Math.random()*8)+'px;background:hsl('+(Math.random()*360)+',80%,60%);border-radius:2px;pointer-events:none;z-index:9999;animation:confettiDrop '+(1.2+Math.random()*1.2)+'s ease forwards';document.body.appendChild(c);setTimeout(function(){c.remove();},2600);},i2*55);})(i);}
}

// ── PYRAMID SOLITAIRE ────────────────────────────────────────────────────
(function(){
  var SUITS=['\u2660','\u2665','\u2666','\u2663'];
  var RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  // pyramid[i] = card or null; 28 slots, row r has indices sum(0..r-1) to sum(0..r)-1
  var pyramid=[],stock=[],waste=[],removed=[];
  var sel1=null,moves=0,solTimer=null,solSecs=0,history=[];
  // Row r starts at index r*(r+1)/2... wait, row r has r+1 cards, starts at r*(r+1)/2 - no
  // Row 0: 1 card (index 0), row 1: 2 cards (1-2), row 2: 3 (3-5), ..., row 6: 7 (21-27)
  // Index in row r, col c: r*(r+1)/2 + c... wait r*(r+1)/2 for row r starting index
  // Row 0 start = 0, row 1 start = 1, row 2 start = 3, row 3 start = 6, row 4 = 10, row 5 = 15, row 6 = 21
  function rowStart(r){return r*(r+1)/2;}
  // Card at (r,c) is covered by (r+1,c) and (r+1,c+1)
  function isCovered(idx){
    // Find row and col
    var r=0;while(rowStart(r+1)<=idx)r++;
    var c=idx-rowStart(r);
    if(r===6)return false; // bottom row, never covered
    var i1=rowStart(r+1)+c, i2=rowStart(r+1)+c+1;
    return (pyramid[i1]!==null)||( pyramid[i2]!==null);
  }
  function isUncovered(idx){return pyramid[idx]!==null&&!isCovered(idx);}
  function cardValue(card){return card.value;}
  function shuf(d){for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;}return d;}

  // Greedy solver: returns number of moves to clear pyramid, or Infinity if stuck within limit
  function solverCanWin(pyr,stk){
    var p=pyr.slice(),s=stk.slice().reverse(),w=[],m=0,limit=69;
    function rowStart2(r){return r*(r+1)/2;}
    function isCov(idx,arr){
      var r=0;while(rowStart2(r+1)<=idx)r++;
      var c=idx-rowStart2(r);if(r===6)return false;
      var i1=rowStart2(r+1)+c,i2=rowStart2(r+1)+c+1;
      return (arr[i1]!==null)||(arr[i2]!==null);
    }
    function isUncov(idx,arr){return arr[idx]!==null&&!isCov(idx,arr);}
    function getUncov(arr){var u=[];for(var i=0;i<28;i++){if(isUncov(i,arr))u.push(i);}return u;}
    function allGone(arr){return arr.every(function(c){return c===null;});}
    // Up to limit steps
    var cycleCheck=0;
    while(m<=limit){
      if(allGone(p))return m;
      var u=getUncov(p);
      var moved=false;
      // Remove kings
      for(var i=0;i<u.length;i++){if(p[u[i]].value===13){p[u[i]]=null;m++;moved=true;break;}}
      if(moved)continue;
      // Remove waste king
      if(w.length&&w[w.length-1].value===13){w.pop();m++;continue;}
      // Find uncovered pair
      var uvals={};
      for(var i=0;i<u.length;i++){var v=p[u[i]].value;if(uvals[13-v]!==undefined){p[u[i]]=null;p[uvals[13-v]]=null;m++;moved=true;break;}uvals[v]=u[i];}
      if(moved)continue;
      // Waste + uncovered pair
      if(w.length){var wv=w[w.length-1].value;for(var i=0;i<u.length;i++){if(p[u[i]].value+wv===13){p[u[i]]=null;w.pop();m++;moved=true;break;}}}
      if(moved)continue;
      // Deal from stock
      if(s.length){var c=s.pop();c.faceUp=true;w.push(c);m++;}
      else if(w.length){// recycle once
        if(cycleCheck>0)break;
        cycleCheck++;s=w.slice().reverse();w=[];}
      else break;
    }
    return allGone(p)?m:Infinity;
  }

  function deal(){
    var d=[];SUITS.forEach(function(s){RANKS.forEach(function(r,i){d.push({suit:s,rank:r,value:i+1,faceUp:true});});});
    var attempts=0;
    do{shuf(d);attempts++;}while(solverCanWin(d.slice(0,28),d.slice(28))>MAX_MOVES-1&&attempts<200);
    pyramid=d.slice(0,28);stock=d.slice(28).reverse();waste=[];removed=[];sel1=null;moves=0;solSecs=0;history=[];
    var nb=document.getElementById('solNoMovesBanner');if(nb)nb.style.display='none';
  }
  function isRed(s){return s==='\u2665'||s==='\u2666';}
  function cloneCard(c){return c?{suit:c.suit,rank:c.rank,value:c.value,faceUp:c.faceUp}:null;}
  function save(){history.push({pyr:pyramid.map(cloneCard),stk:stock.map(cloneCard),wst:waste.map(cloneCard),rem:removed.slice(),mv:moves,sc:solSecs,s1:sel1});if(history.length>80)history.shift();updUndo();}
  function updUndo(){var b=document.getElementById('solitaireUndo');if(b){b.disabled=!history.length;b.style.opacity=history.length?'1':'.4';}}
  function undo(){if(!history.length)return;var h=history.pop();pyramid=h.pyr;stock=h.stk;waste=h.wst;removed=h.rem;moves=h.mv;solSecs=h.sc;sel1=h.s1;document.getElementById('solMoves').textContent=moves;updUndo();render();}
  var MAX_MOVES=70;
  function hasAnyMove(){
    if(stock.length||waste.length)return true;
    var uncov=[];
    for(var i=0;i<28;i++){if(pyramid[i]&&isUncovered(i))uncov.push(pyramid[i].value);}
    var wv=waste.length?waste[waste.length-1].value:null;
    for(var i=0;i<uncov.length;i++){if(uncov[i]===13)return true;}
    if(wv===13)return true;
    var seen={};
    for(var i=0;i<uncov.length;i++){if(seen[13-uncov[i]])return true;seen[uncov[i]]=true;}
    if(wv!==null){for(var i=0;i<uncov.length;i++){if(uncov[i]+wv===13)return true;}}
    return false;
  }
  function afterMove(){
    document.getElementById('solMoves').textContent=moves;
    render();
    if(checkWin())return;
    if(moves>=MAX_MOVES){showGameOver('70-move limit reached');return;}
    if(!hasAnyMove()){showGameOver('No moves remaining');}
  }
  function showGameOver(reason){
    clearInterval(solTimer);
    var table=document.getElementById('solTable');if(!table)return;
    if(table.querySelector('.sol-gameover-overlay'))return;
    table.style.position='relative';
    var ov=document.createElement('div');ov.className='sol-gameover-overlay';
    ov.innerHTML='<div class="sol-gameover-title">Game Over</div><div class="sol-gameover-sub">'+(reason||'')+'</div><button class="sol-gameover-btn" onclick="window._pyramidNewGame()">New Game</button>';
    table.appendChild(ov);
  }
  function checkWin(){
    if(pyramid.every(function(c){return c===null;})){
      clearInterval(solTimer);history=[];updUndo();
      setTimeout(function(){_solWinOverlay(moves,'window._pyramidNewGame');},300);
      return true;
    }
    return false;
  }
  function _pyrSnap(sel){var e=document.querySelector(sel);return e?{r:e.getBoundingClientRect(),h:e.innerHTML,c:e.className}:null;}
  function tryRemovePair(i1,i2){
    var c1=pyramid[i1],c2=pyramid[i2];
    if(!c1||!c2)return false;
    if(c1.value+c2.value!==13)return false;
    if(i1===i2)return false;
    // i1 (first selected) must have been uncovered; i2 may be covered by i1 only
    if(!isUncovered(i1))return false;
    var s1=_pyrSnap('#solTable [data-type="pyramid"][data-idx="'+i1+'"]');
    var s2=_pyrSnap('#solTable [data-type="pyramid"][data-idx="'+i2+'"]');
    save();pyramid[i1]=null;pyramid[i2]=null;moves++;sel1=null;afterMove();
    if(s1)_solFly(s1.r,s1.h,s1.c,null,220);
    if(s2)_solFly(s2.r,s2.h,s2.c,null,220);
    return true;
  }
  function tryRemoveKing(idx){
    var c=pyramid[idx];if(!c||c.value!==13||!isUncovered(idx))return false;
    var s=_pyrSnap('#solTable [data-type="pyramid"][data-idx="'+idx+'"]');
    save();pyramid[idx]=null;moves++;sel1=null;afterMove();
    if(s)_solFly(s.r,s.h,s.c,null,220);
    return true;
  }
  function tryRemoveWithWaste(pyrIdx){
    var pc=pyramid[pyrIdx],wc=waste.length?waste[waste.length-1]:null;
    if(!pc||!wc)return false;
    if(pc.value+wc.value!==13)return false;
    if(!isUncovered(pyrIdx))return false;
    var sp=_pyrSnap('#solTable [data-type="pyramid"][data-idx="'+pyrIdx+'"]');
    var sw=_pyrSnap('#solTable [data-type="waste"]');
    save();pyramid[pyrIdx]=null;waste.pop();moves++;sel1=null;afterMove();
    if(sp)_solFly(sp.r,sp.h,sp.c,null,220);
    if(sw)_solFly(sw.r,sw.h,sw.c,null,220);
    return true;
  }
  function tryRemoveWasteKing(){
    var wc=waste.length?waste[waste.length-1]:null;
    if(!wc||wc.value!==13)return false;
    var sw=_pyrSnap('#solTable [data-type="waste"]');
    save();waste.pop();moves++;sel1=null;afterMove();
    if(sw)_solFly(sw.r,sw.h,sw.c,null,220);
    return true;
  }
  function handleClick(type,idx){
    if(type==='stock'){
      if(stock.length){
        var ss=_pyrSnap('#solTable [data-type="stock"]');
        save();var c=stock.pop();c.faceUp=true;waste.push(c);sel1=null;moves++;
        document.getElementById('solMoves').textContent=moves;render();
        if(moves>=MAX_MOVES){showGameOver('70-move limit reached');return;}
        if(!hasAnyMove()){showGameOver('No moves remaining');return;}
        if(ss)_solFly(ss.r,'','sol-card face-down','#solTable [data-type="waste"]',200);
        // Flip animation on the newly dealt waste card
        setTimeout(function(){var we2=document.querySelector('#solTable [data-type="waste"] .sol-card');if(we2){we2.classList.add('sol-flip-anim');setTimeout(function(){we2.classList.remove('sol-flip-anim');},400);}},50);
      } else if(waste.length){save();while(waste.length){var wc2=waste.pop();wc2.faceUp=false;stock.push(wc2);}sel1=null;document.getElementById('solMoves').textContent=moves;render();}
      return;
    }
    if(type==='waste'){
      var wc=waste.length?waste[waste.length-1]:null;if(!wc)return;
      if(wc.value===13){tryRemoveWasteKing();return;}
      if(sel1!==null&&sel1.type==='pyramid'){
        var pc=pyramid[sel1.idx];if(pc&&pc.value+wc.value===13&&isUncovered(sel1.idx)){
          var sp2=_pyrSnap('#solTable [data-type="pyramid"][data-idx="'+sel1.idx+'"]');
          var sw2=_pyrSnap('#solTable [data-type="waste"]');
          save();pyramid[sel1.idx]=null;waste.pop();moves++;sel1=null;afterMove();
          if(sp2)_solFly(sp2.r,sp2.h,sp2.c,null,220);
          if(sw2)_solFly(sw2.r,sw2.h,sw2.c,null,220);
          return;
        }
      }
      sel1={type:'waste'};render();return;
    }
    if(type==='pyramid'){
      var pc2=pyramid[idx];if(!pc2)return;
      var uncovIdx=isUncovered(idx);
      // First selection: must be uncovered; Kings remove immediately
      if(sel1===null){
        if(!uncovIdx)return;
        if(pc2.value===13){tryRemoveKing(idx);return;}
        sel1={type:'pyramid',idx:idx};render();return;
      }
      if(sel1.type==='pyramid'){
        if(sel1.idx===idx){sel1=null;render();return;}
        // Try to pair — second card may be covered (relaxed rule for end-game)
        if(tryRemovePair(sel1.idx,idx))return;
        // Not a valid pair — if uncovered, select it instead
        if(uncovIdx){sel1={type:'pyramid',idx:idx};render();}
        return;
      }
      if(sel1.type==='waste'){
        var wc3=waste.length?waste[waste.length-1]:null;
        if(wc3&&pc2.value+wc3.value===13){
          var sp3=_pyrSnap('#solTable [data-type="pyramid"][data-idx="'+idx+'"]');
          var sw3=_pyrSnap('#solTable [data-type="waste"]');
          save();pyramid[idx]=null;waste.pop();moves++;sel1=null;afterMove();
          if(sp3)_solFly(sp3.r,sp3.h,sp3.c,null,220);
          if(sw3)_solFly(sw3.r,sw3.h,sw3.c,null,220);
          return;
        }
        if(uncovIdx){sel1={type:'pyramid',idx:idx};render();}
        return;
      }
    }
  }
  function isRed2(s){return s==='\u2665'||s==='\u2666';}
  function makeCardEl(card,extraCls){
    var el=document.createElement('div');
    el.className='sol-card '+(isRed2(card.suit)?'red':'black')+(extraCls?' '+extraCls:'');
    el.innerHTML='<div class="sol-card-rank">'+card.rank+'</div><div class="sol-card-suit">'+card.suit+'</div><div class="sol-card-center">'+card.suit+'</div>';
    return el;
  }
  function render(){
    var table=document.getElementById('solTable');if(!table)return;
    table.innerHTML='';table.className='sol-table sol-pyramid-table';

    // ── Outer layout: left panel + pyramid area ──
    var layout=document.createElement('div');
    layout.style.cssText='display:flex;gap:16px;align-items:flex-start;justify-content:center';

    // ── Left panel: selected-card holder + removed count ──
    var leftPanel=document.createElement('div');
    leftPanel.style.cssText='display:flex;flex-direction:column;align-items:center;gap:8px;min-width:70px;padding-top:4px';
    var holderLabel=document.createElement('div');
    holderLabel.style.cssText='font-size:.65rem;color:rgba(192,132,252,.5);text-align:center;letter-spacing:.04em';
    holderLabel.textContent='HELD';
    var holder=document.createElement('div');
    holder.className='sol-pile-empty';
    holder.style.cssText='width:62px;height:88px;position:relative;';
    if(sel1&&sel1.type==='pyramid'&&pyramid[sel1.idx]){
      var hc=makeCardEl(pyramid[sel1.idx],'selected');
      hc.style.cssText='width:100%;cursor:pointer;';
      hc.onclick=function(){sel1=null;render();};
      holder.appendChild(hc);
    } else if(sel1&&sel1.type==='waste'&&waste.length){
      var hc2=makeCardEl(waste[waste.length-1],'selected');
      hc2.style.cssText='width:100%;cursor:pointer;';
      hc2.onclick=function(){sel1=null;render();};
      holder.appendChild(hc2);
    } else {
      holder.innerHTML='<div style="font-size:1.4rem;line-height:88px;text-align:center;color:rgba(192,132,252,.15)">?</div>';
    }
    var removedCount=document.createElement('div');
    removedCount.style.cssText='font-size:.65rem;color:rgba(192,132,252,.4);text-align:center';
    var gone=28-pyramid.filter(function(c){return c!==null;}).length;
    removedCount.textContent=gone+' removed';
    leftPanel.appendChild(holderLabel);leftPanel.appendChild(holder);leftPanel.appendChild(removedCount);
    layout.appendChild(leftPanel);

    // ── Right: pyramid + bottom row ──
    var rightCol=document.createElement('div');
    rightCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:16px';

    var wrap=document.createElement('div');wrap.className='sol-pyramid-wrap';
    var CARD_W=58,CARD_H=82,COL_W=62,ROW_H=50;
    var totalW=7*COL_W;
    for(var r=0;r<7;r++){
      var rowCards=r+1;
      var rowLeft=Math.floor((totalW-rowCards*COL_W)/2);
      for(var c=0;c<rowCards;c++){
        var idx2=rowStart(r)+c;
        var card=pyramid[idx2];
        var el=document.createElement('div');
        el.style.cssText='position:absolute;left:'+(rowLeft+c*COL_W)+'px;top:'+(r*ROW_H)+'px;width:'+CARD_W+'px';
        if(card){
          var uncov=isUncovered(idx2);
          el.className='sol-card '+(isRed2(card.suit)?'red':'black');
          var isSelected=sel1&&sel1.type==='pyramid'&&sel1.idx===idx2;
          var selCard=sel1&&sel1.type==='pyramid'?pyramid[sel1.idx]:null;
          var isPairWithSel=selCard&&selCard.value+card.value===13&&sel1.idx!==idx2;
          var wasteCard=sel1&&sel1.type==='waste'&&waste.length?waste[waste.length-1]:null;
          var isPairWithWaste=wasteCard&&wasteCard.value+card.value===13;
          if(isSelected){el.classList.add('selected');el.style.transform='translateY(-6px)';}
          else if(isPairWithSel||isPairWithWaste){el.classList.add('selected');el.style.opacity='1';}
          else if(!uncov){el.style.opacity='.45';el.style.cursor='default';}
          // Clickable: always uncovered, OR covered but pairs with current selection
          if(uncov||(sel1&&(isPairWithSel||isPairWithWaste))){
            (function(i2){el.onclick=function(){handleClick('pyramid',i2);};})(idx2);
          }
          el.innerHTML='<div class="sol-card-rank">'+card.rank+'</div><div class="sol-card-suit">'+card.suit+'</div><div class="sol-card-center">'+card.suit+'</div>';
          el.dataset.type='pyramid';el.dataset.idx=idx2;
        } else {
          el.className='sol-pyramid-empty';
        }
        wrap.appendChild(el);
      }
    }
    wrap.style.cssText='position:relative;width:'+totalW+'px;height:'+(7*ROW_H+CARD_H)+'px';
    rightCol.appendChild(wrap);

    // Stock + waste row
    var botRow=document.createElement('div');botRow.style.cssText='display:flex;gap:10px;align-items:flex-start';
    var se=document.createElement('div');se.className='sol-pile-empty';se.style.cursor='pointer';
    se.dataset.type='stock';se.dataset.idx='0';
    se.onclick=function(){handleClick('stock',0);};
    if(stock.length){
      var fd=document.createElement('div');fd.className='sol-card face-down';se.appendChild(fd);
      var slbl=document.createElement('div');slbl.style.cssText='text-align:center;font-size:.62rem;color:rgba(192,132,252,.45);margin-top:2px';slbl.textContent=stock.length+' left';se.appendChild(slbl);
    } else {
      se.innerHTML='<div style="font-size:1rem;color:rgba(192,132,252,.3);line-height:88px;text-align:center">\u21BA</div>';
    }
    botRow.appendChild(se);
    var we=document.createElement('div');we.className='sol-pile-empty';we.dataset.type='waste';we.dataset.idx='0';
    we.onclick=function(){handleClick('waste',0);};
    if(waste.length){
      var wc4=waste[waste.length-1];
      var wcel=makeCardEl(wc4,sel1&&sel1.type==='waste'?'selected':'');
      if(sel1&&sel1.type==='waste')wcel.style.transform='translateY(-6px)';
      wcel.dataset.type='waste';wcel.dataset.idx='0';
      we.appendChild(wcel);
    } else {
      we.innerHTML='<div style="font-size:.8rem;color:rgba(192,132,252,.2);line-height:88px;text-align:center">Waste</div>';
    }
    botRow.appendChild(we);
    rightCol.appendChild(botRow);
    layout.appendChild(rightCol);
    table.appendChild(layout);
  }
  window._pyramidCleanup=function(){};
  window._pyramidHC=function(){};
  window._pyramidStart=function(){
    var table=document.getElementById('solTable');if(!table)return;
    document.getElementById('solGameTitle').textContent='Pyramid';
    var hb=document.getElementById('solitaireHint');if(hb)hb.style.display='none';
    deal();
    table.innerHTML='<div class="sol-shuffle-anim"><div class="sol-shuffle-deck"></div><div class="sol-shuffle-label">Shuffling\u2026</div></div>';
    document.getElementById('solMoves').textContent='0';var et=document.getElementById('solTime');if(et)et.textContent='0:00';
    clearInterval(solTimer);solTimer=setInterval(function(){solSecs++;var m=Math.floor(solSecs/60),s=solSecs%60;var el=document.getElementById('solTime');if(el)el.textContent=m+':'+(s<10?'0':'')+s;},1000);
    setTimeout(function(){render();},700);
  };
  window._pyramidStop=function(){clearInterval(solTimer);};
  window._pyramidUndo=undo;
  window._pyramidNewGame=function(){window._pyramidStart();};
})();

// ── TRI-PEAKS SOLITAIRE ──────────────────────────────────────────────────
(function(){
  var SUITS=['\u2660','\u2665','\u2666','\u2663'];
  var RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  // 28 peak cards + 24 stock
  // Indices 0-27, layout:
  // Row0: 0,1,2  (peak tops)
  // Row1: 3,4,5,6,7,8  (2 per peak)
  // Row2: 9,10,11,12,13,14,15,16,17  (3 per peak)
  // Row3 (base): 18,19,20,21,22,23,24,25,26,27  (10)
  // Coverage: card at idx is covered by cards below it (higher row indices)
  var COVERS={
    0:[3,4], 1:[5,6], 2:[7,8],
    3:[9,10], 4:[10,11], 5:[12,13], 6:[13,14], 7:[15,16], 8:[16,17],
    9:[18,19], 10:[19,20], 11:[20,21], 12:[21,22], 13:[22,23], 14:[23,24], 15:[24,25], 16:[25,26], 17:[26,27]
  };
  // Position (col-offset) for rendering — each unit = card width (60px) + gap
  // Row3 has 10 cards spanning full width; peaks are centered above
  var COLS=10; // base width in card units
  var POS=[
    // Row 0: peak tops — peak1 at col1.5, peak2 at col4.5, peak3 at col7.5 (0-indexed center)
    {r:0,c:1.5},{r:0,c:4.5},{r:0,c:7.5},
    // Row 1
    {r:1,c:1},{r:1,c:2},{r:1,c:4},{r:1,c:5},{r:1,c:7},{r:1,c:8},
    // Row 2
    {r:2,c:0.5},{r:2,c:1.5},{r:2,c:2.5},{r:2,c:3.5},{r:2,c:4.5},{r:2,c:5.5},{r:2,c:6.5},{r:2,c:7.5},{r:2,c:8.5},
    // Row 3 (base)
    {r:3,c:0},{r:3,c:1},{r:3,c:2},{r:3,c:3},{r:3,c:4},{r:3,c:5},{r:3,c:6},{r:3,c:7},{r:3,c:8},{r:3,c:9}
  ];
  var peaks=[],stock=[],waste=[];
  var moves=0,solTimer=null,solSecs=0,history=[];
  function shuf(d){for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;}return d;}
  function deal(){
    var d=[];SUITS.forEach(function(s){RANKS.forEach(function(r,i){d.push({suit:s,rank:r,value:i+1});});});shuf(d);
    peaks=d.slice(0,28).map(function(c,i){return {suit:c.suit,rank:c.rank,value:c.value,removed:false,faceUp:true};});
    stock=d.slice(28).map(function(c){return {suit:c.suit,rank:c.rank,value:c.value,removed:false,faceUp:false};});
    waste=[];moves=0;solSecs=0;history=[];
    var nb=document.getElementById('solNoMovesBanner');if(nb)nb.style.display='none';
  }
  function isRed(s){return s==='\u2665'||s==='\u2666';}
  function isCov(idx){
    var coverers=COVERS[idx];if(!coverers)return false;
    return coverers.some(function(ci){return !peaks[ci].removed;});
  }
  function isUncov(idx){return !peaks[idx].removed&&!isCov(idx);}
  function seq(v1,v2){var diff=Math.abs(v1-v2);return diff===1||(diff===12);}// A-K wrapping
  function wasteTop(){return waste.length?waste[waste.length-1]:null;}
  function clone2(c){return {suit:c.suit,rank:c.rank,value:c.value,removed:c.removed,faceUp:c.faceUp};}
  function save(){history.push({pk:peaks.map(clone2),stk:stock.map(clone2),wst:waste.map(clone2),mv:moves,sc:solSecs});if(history.length>80)history.shift();updUndo();}
  function updUndo(){var b=document.getElementById('solitaireUndo');if(b){b.disabled=!history.length;b.style.opacity=history.length?'1':'.4';}}
  function undo(){if(!history.length)return;var h=history.pop();peaks=h.pk;stock=h.stk;waste=h.wst;moves=h.mv;solSecs=h.sc;document.getElementById('solMoves').textContent=moves;updUndo();render();}
  function afterMove(){
    // Reveal newly uncovered cards
    for(var i=0;i<28;i++){if(!peaks[i].removed&&!isCov(i))peaks[i].faceUp=true;}
    document.getElementById('solMoves').textContent=moves;render();checkWin();
  }
  function checkWin(){
    if(peaks.every(function(c){return c.removed;})){clearInterval(solTimer);history=[];updUndo();setTimeout(function(){_solWinOverlay(moves,'window._tripeaksNewGame');},300);}
  }
  function _triSnap(sel){var e=document.querySelector(sel);return e?{r:e.getBoundingClientRect(),h:e.innerHTML,c:e.className}:null;}
  function handleClick(type,idx){
    if(type==='stock'){
      if(stock.length){
        var ss=_triSnap('#solTable [data-type="stock"]');
        save();var c=stock.pop();c.faceUp=true;waste.push(c);
        document.getElementById('solMoves').textContent=moves;render();
        if(ss)_solFly(ss.r,'','sol-card face-down','#solTable [data-type="waste-display"]',180);
      }
      return;
    }
    if(type==='peak'){
      if(peaks[idx].removed||!isUncov(idx))return;
      var sp=_triSnap('#solTable [data-type="peak"][data-idx="'+idx+'"]');
      var wt=wasteTop();
      if(!wt){
        save();waste.push(peaks[idx]);peaks[idx].removed=true;moves++;afterMove();
        if(sp)_solFly(sp.r,sp.h,sp.c,'#solTable [data-type="waste-display"]',180);
        return;
      }
      if(seq(peaks[idx].value,wt.value)){
        save();waste.push(peaks[idx]);peaks[idx].removed=true;moves++;afterMove();
        if(sp)_solFly(sp.r,sp.h,sp.c,'#solTable [data-type="waste-display"]',180);
      }
    }
  }
  function render(){
    var table=document.getElementById('solTable');if(!table)return;
    table.innerHTML='';table.className='sol-table';
    var CW=58,CH=82,GAP=4,ROW_H=56;
    var totalW=COLS*(CW+GAP)-GAP;
    var wrap=document.createElement('div');wrap.style.cssText='position:relative;width:'+totalW+'px;height:'+(4*ROW_H+CH)+'px;margin:0 auto';
    for(var i=0;i<28;i++){
      if(peaks[i].removed)continue;
      var pos=POS[i];var left=pos.c*(CW+GAP),top=pos.r*ROW_H;
      var el=document.createElement('div');
      el.style.cssText='position:absolute;left:'+left+'px;top:'+top+'px;width:'+CW+'px;height:'+CH+'px';
      var uncov=isUncov(i);
      el.className='sol-card '+(isRed(peaks[i].suit)?'red':'black');
      if(!uncov){el.style.opacity='.55';el.style.cursor='default';}
      else{
        var wt2=wasteTop();
        el.dataset.type='peak';el.dataset.idx=i;
        (function(pi){el.onclick=function(){handleClick('peak',pi);};})(i);
      }
      el.innerHTML='<div class="sol-card-rank">'+peaks[i].rank+'</div><div class="sol-card-suit">'+peaks[i].suit+'</div><div class="sol-card-center">'+peaks[i].suit+'</div>';
      wrap.appendChild(el);
    }
    table.appendChild(wrap);
    var botRow=document.createElement('div');botRow.style.cssText='display:flex;gap:10px;margin-top:12px;align-items:flex-start';
    var se=document.createElement('div');se.className='sol-pile-empty';se.dataset.type='stock';se.dataset.idx='0';se.style.cursor='pointer';
    se.onclick=function(){handleClick('stock',0);};
    if(stock.length){var fd=document.createElement('div');fd.className='sol-card face-down';fd.dataset.type='stock';fd.dataset.idx='0';se.appendChild(fd);var lb=document.createElement('div');lb.style.cssText='text-align:center;font-size:.65rem;color:rgba(192,132,252,.5);margin-top:2px';lb.textContent=stock.length+' left';se.appendChild(lb);}
    else{se.innerHTML='<div style="font-size:1rem;color:rgba(192,132,252,.3);line-height:88px;text-align:center">\u2205</div>';}
    botRow.appendChild(se);
    var we=document.createElement('div');we.className='sol-pile-empty';we.dataset.type='waste-display';
    var wt3=wasteTop();
    if(wt3){var wcel=document.createElement('div');wcel.className='sol-card '+(isRed(wt3.suit)?'red':'black');wcel.innerHTML='<div class="sol-card-rank">'+wt3.rank+'</div><div class="sol-card-suit">'+wt3.suit+'</div><div class="sol-card-center">'+wt3.suit+'</div>';we.appendChild(wcel);}
    else{we.innerHTML='<div style="font-size:.8rem;color:rgba(192,132,252,.2);line-height:88px;text-align:center">Waste</div>';}
    botRow.appendChild(we);
    var rem=document.createElement('span');rem.style.cssText='color:rgba(192,132,252,.5);font-size:.8rem;align-self:center;margin-left:8px';rem.textContent=peaks.filter(function(c){return !c.removed;}).length+' peak cards left';
    botRow.appendChild(rem);
    table.appendChild(botRow);
  }
  window._tripeaksCleanup=function(){};
  window._tripeaksHC=function(){};
  window._tripeaksStart=function(){
    var table=document.getElementById('solTable');if(!table)return;
    document.getElementById('solGameTitle').textContent='Tri-Peaks';
    var hb=document.getElementById('solitaireHint');if(hb)hb.style.display='none';
    deal();
    table.innerHTML='<div class="sol-shuffle-anim"><div class="sol-shuffle-deck"></div><div class="sol-shuffle-label">Shuffling\u2026</div></div>';
    document.getElementById('solMoves').textContent='0';var et=document.getElementById('solTime');if(et)et.textContent='0:00';
    clearInterval(solTimer);solTimer=setInterval(function(){solSecs++;var m=Math.floor(solSecs/60),s=solSecs%60;var el=document.getElementById('solTime');if(el)el.textContent=m+':'+(s<10?'0':'')+s;},1000);
    setTimeout(function(){render();},700);
  };
  window._tripeaksStop=function(){clearInterval(solTimer);};
  window._tripeaksUndo=undo;
  window._tripeaksNewGame=function(){window._tripeaksStart();};
})();

// ── VEGAS SOLITAIRE (Draw-3 Klondike) ────────────────────────────────────
(function(){
  var SUITS=['\u2660','\u2665','\u2666','\u2663'];
  var RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  var tableau=[],stock=[],waste=[],foundations=[[],[],[],[]];
  var selected=null,selectedFrom=null,moves=0,solTimer=null,solSecs=0,history=[];
  var redeals=0,MAX_REDEALS=2; // Vegas: 3 passes through deck total
  function isRed(s){return s==='\u2665'||s==='\u2666';}
  function shuf(d){for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;}return d;}
  function deal(){
    var d=[];SUITS.forEach(function(s){RANKS.forEach(function(r,i){d.push({suit:s,rank:r,value:i+1,faceUp:false});});});shuf(d);
    tableau=[[],[],[],[],[],[],[]];stock=[];waste=[];foundations=[[],[],[],[]];
    var idx=0;
    for(var c=0;c<7;c++){for(var i=0;i<=c;i++){var card=d[idx++];card.faceUp=(i===c);tableau[c].push(card);}}
    while(idx<d.length)stock.push(d[idx++]);
    selected=null;selectedFrom=null;moves=0;solSecs=0;history=[];redeals=0;
    var nb=document.getElementById('solNoMovesBanner');if(nb)nb.style.display='none';
  }
  function canTab(card,pile){if(!pile.length)return card.value===13;var top=pile[pile.length-1];return top.faceUp&&card.value===top.value-1&&isRed(card.suit)!==isRed(top.suit);}
  function canFound(card,fi){var p=foundations[fi];if(card.suit!==SUITS[fi])return false;return p.length===0?card.value===1:card.value===p[p.length-1].value+1;}
  function canFoundAny(card){for(var f=0;f<4;f++)if(canFound(card,f))return f;return -1;}
  function cloneCard(c){return c?{suit:c.suit,rank:c.rank,value:c.value,faceUp:c.faceUp}:null;}
  function save(){history.push({tab:tableau.map(function(p){return p.map(cloneCard);}),stk:stock.map(cloneCard),wst:waste.map(cloneCard),fnd:foundations.map(function(p){return p.map(cloneCard);}),mv:moves,sc:solSecs,sel:selected?cloneCard(selected):null,selF:selectedFrom?JSON.parse(JSON.stringify(selectedFrom)):null,rd:redeals});if(history.length>80)history.shift();updUndo();}
  function updUndo(){var b=document.getElementById('solitaireUndo');if(b){b.disabled=!history.length;b.style.opacity=history.length?'1':'.4';}}
  function undo(){if(!history.length)return;var h=history.pop();tableau=h.tab;stock=h.stk;waste=h.wst;foundations=h.fnd;moves=h.mv;solSecs=h.sc;selected=h.sel;selectedFrom=h.selF;redeals=h.rd;document.getElementById('solMoves').textContent=moves;updUndo();render();}
  function afterMove(){document.getElementById('solMoves').textContent=moves;render();checkWin();}
  function checkWin(){if(foundations.every(function(f){return f.length===13;})){clearInterval(solTimer);history=[];updUndo();setTimeout(function(){_solWinOverlay(moves,'window._vegasNewGame');},300);}}
  function handleClick(type,idx,ci){
    if(type==='stock'){
      // Draw 3 from stock to waste
      if(stock.length){
        save();var drawn=Math.min(3,stock.length);
        for(var i=0;i<drawn;i++){var c=stock.pop();c.faceUp=true;waste.push(c);}
        selected=null;selectedFrom=null;document.getElementById('solMoves').textContent=moves;render();
      } else if(redeals<MAX_REDEALS){
        save();redeals++;while(waste.length){var wc=waste.pop();wc.faceUp=false;stock.push(wc);}
        selected=null;document.getElementById('solMoves').textContent=moves;render();
      }
      return;
    }
    if(type==='waste'){
      if(!waste.length)return;
      var wtop=waste[waste.length-1];
      if(selected){
        // try to place selected onto waste? No — waste is source only
        selected=null;selectedFrom=null;render();return;
      }
      selected=wtop;selectedFrom={type:'waste',idx:0};render();return;
    }
    if(type==='foundation'){
      if(selected){
        if(canFound(selected,idx)){
          save();
          if(selectedFrom.type==='waste')waste.pop();
          else if(selectedFrom.type==='tableau'){tableau[selectedFrom.idx].pop();if(tableau[selectedFrom.idx].length&&!tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1].faceUp)tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1].faceUp=true;}
          foundations[idx].push(selected);moves++;selected=null;selectedFrom=null;afterMove();
        } else {selected=null;selectedFrom=null;render();}
      } else {
        if(foundations[idx].length){selected=foundations[idx][foundations[idx].length-1];selectedFrom={type:'foundation',idx:idx};render();}
      }
      return;
    }
    if(type==='tableau'){
      var pile=tableau[idx];
      if(selected){
        // Try to place
        var seq=selected._seq||[selected];
        // Same card clicked again — keep selected
        if(selectedFrom.type==='tableau'&&selectedFrom.idx===idx&&selectedFrom.cardIdx===ci){render();return;}
        if(canTab(seq[0],pile)){
          save();
          if(selectedFrom.type==='waste'){waste.pop();}
          else if(selectedFrom.type==='foundation'){foundations[selectedFrom.idx].pop();}
          else if(selectedFrom.type==='tableau'){
            var src=tableau[selectedFrom.idx];
            var seqLen=seq.length;
            tableau[selectedFrom.idx]=src.slice(0,src.length-seqLen);
            if(tableau[selectedFrom.idx].length&&!tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1].faceUp)
              tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1].faceUp=true;
          }
          seq.forEach(function(card){pile.push(card);});
          moves++;selected=null;selectedFrom=null;afterMove();
        } else {selected=null;selectedFrom=null;render();}
      } else {
        if(!pile.length||ci===undefined)return;
        var clickedCard=pile[ci];if(!clickedCard||!clickedCard.faceUp)return;
        // Build sequence from ci to end
        var seqCards=pile.slice(ci);
        var valid=true;
        for(var j=1;j<seqCards.length;j++){
          if(seqCards[j].value!==seqCards[j-1].value-1||isRed(seqCards[j].suit)===isRed(seqCards[j-1].suit)){valid=false;break;}
        }
        if(!valid&&ci!==pile.length-1){return;}
        selected=seqCards[0];selected._seq=seqCards;selectedFrom={type:'tableau',idx:idx,cardIdx:ci};render();
      }
      return;
    }
  }
  function handleDblClick(type,idx,ci){
    var card=null;
    if(type==='waste'&&waste.length)card=waste[waste.length-1];
    else if(type==='tableau'&&tableau[idx].length){var p=tableau[idx];card=p[p.length-1];}
    if(!card)return;
    var fi=canFoundAny(card);if(fi<0)return;
    save();
    if(type==='waste')waste.pop();
    else tableau[idx].pop();
    if(type==='tableau'&&tableau[idx].length&&!tableau[idx][tableau[idx].length-1].faceUp)tableau[idx][tableau[idx].length-1].faceUp=true;
    foundations[fi].push(card);moves++;selected=null;selectedFrom=null;afterMove();
  }
  function makeCard(card){var el=document.createElement('div');el.className='sol-card '+(isRed(card.suit)?'red':'black');el.draggable=true;el.innerHTML='<div class="sol-card-rank">'+card.rank+'</div><div class="sol-card-suit">'+card.suit+'</div><div class="sol-card-center">'+card.suit+'</div>';return el;}
  function makeFD(){var el=document.createElement('div');el.className='sol-card face-down';return el;}
  function makeEmpty(){var el=document.createElement('div');el.className='sol-pile-empty';return el;}
  function render(){
    var table=document.getElementById('solTable');if(!table)return;
    table.innerHTML='';table.className='sol-table';
    var topRow=document.createElement('div');topRow.className='sol-top-row';
    // Stock
    var stockEl=makeEmpty();stockEl.style.cursor='pointer';stockEl.dataset.type='stock';stockEl.dataset.idx='0';
    if(stock.length){var sfd=makeFD();sfd.dataset.type='stock';sfd.dataset.idx='0';stockEl.appendChild(sfd);}
    else if(redeals<MAX_REDEALS){stockEl.innerHTML='<div style="font-size:1.6rem;color:rgba(192,132,252,.35);line-height:88px;text-align:center">\u21BA</div>';stockEl.dataset.type='stock';stockEl.dataset.idx='0';}
    else{stockEl.innerHTML='<div style="font-size:.7rem;color:rgba(239,68,68,.5);line-height:88px;text-align:center">No<br>redeals</div>';}
    var rdLabel=document.createElement('div');rdLabel.style.cssText='text-align:center;font-size:.6rem;color:rgba(192,132,252,.4);margin-top:2px';rdLabel.textContent='Redeals: '+(MAX_REDEALS-redeals);stockEl.appendChild(rdLabel);
    topRow.appendChild(stockEl);
    // Waste — show top 3 fanned
    var wasteEl=makeEmpty();wasteEl.dataset.type='waste';wasteEl.dataset.idx='0';wasteEl.style.position='relative';
    var showCount=Math.min(3,waste.length);
    for(var wi=waste.length-showCount;wi<waste.length;wi++){
      (function(wii,offset){
        var wel=makeCard(waste[wii]);
        wel.style.position='absolute';wel.style.left=(offset*14)+'px';wel.style.top='0';wel.style.zIndex=offset+1;
        if(wii===waste.length-1){
          wel.dataset.type='waste';wel.dataset.idx='0';wel.dataset.ci=wii;
          if(selected&&selectedFrom&&selectedFrom.type==='waste')wel.classList.add('selected');
        } else {wel.style.pointerEvents='none';}
        wasteEl.appendChild(wel);
      })(wi,wi-(waste.length-showCount));
    }
    wasteEl.style.width=(showCount>1?(28+62)+'px':'62px');
    topRow.appendChild(wasteEl);
    var sp=document.createElement('div');sp.style.flex='1';topRow.appendChild(sp);
    // Foundations
    for(var f=0;f<4;f++)(function(fi){
      var fEl=makeEmpty();fEl.classList.add('sol-pile-foundation');fEl.dataset.type='foundation';fEl.dataset.idx=fi;
      if(foundations[fi].length){var fc=makeCard(foundations[fi][foundations[fi].length-1]);fc.dataset.type='foundation';fc.dataset.idx=fi;fEl.appendChild(fc);}
      else{var sl=document.createElement('div');sl.style.cssText='font-size:1.8rem;color:rgba(192,132,252,.22);line-height:88px;text-align:center;width:100%';sl.textContent=SUITS[fi];fEl.appendChild(sl);}
      topRow.appendChild(fEl);
    })(f);
    table.appendChild(topRow);
    // Tableau
    var tabRow=document.createElement('div');tabRow.className='sol-tableau';
    for(var t=0;t<7;t++)(function(ti){
      var pileEl=document.createElement('div');pileEl.className='sol-tab-pile sol-pile';
      pileEl.dataset.type='tableau';pileEl.dataset.idx=ti;pileEl.dataset.ci='empty';
      var vTop=0;
      tableau[ti].forEach(function(card,ci){
        var cel=card.faceUp?makeCard(card):makeFD();
        cel.dataset.type='tableau';cel.dataset.idx=ti;cel.dataset.ci=ci;
        cel.style.position='absolute';cel.style.top=vTop+'px';cel.style.zIndex=ci+1;
        if(card.faceUp&&selected&&selectedFrom&&selectedFrom.type==='tableau'&&selectedFrom.idx===ti&&ci>=selectedFrom.cardIdx)cel.classList.add('selected');
        pileEl.appendChild(cel);
        vTop+=card.faceUp?28:14;
      });
      pileEl.style.height=Math.max(88,vTop+62)+'px';
      tabRow.appendChild(pileEl);
    })(t);
    table.appendChild(tabRow);
  }
  // ── Drag & Drop ──
  function vegDragStart(e){
    var el=e.target.closest('[data-type]');if(!el)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0,ci=el.dataset.ci;
    if(type==='waste'){
      if(!waste.length){e.preventDefault();return;}
      var wtop=waste[waste.length-1];
      selected=wtop;selected._seq=[wtop];selectedFrom={type:'waste',idx:0};
    } else if(type==='tableau'){
      if(ci===undefined||ci==='empty'){e.preventDefault();return;}
      ci=parseInt(ci);var pile=tableau[idx];
      if(!pile[ci]||!pile[ci].faceUp){e.preventDefault();return;}
      var seqCards=pile.slice(ci);
      var valid=true;for(var j=1;j<seqCards.length;j++){if(seqCards[j].value!==seqCards[j-1].value-1||isRed(seqCards[j].suit)===isRed(seqCards[j-1].suit)){valid=false;break;}}
      if(!valid&&ci!==pile.length-1){e.preventDefault();return;}
      selected=seqCards[0];selected._seq=seqCards;selectedFrom={type:'tableau',idx:idx,cardIdx:ci};
    } else {e.preventDefault();return;}
    e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','sol');
    setTimeout(function(){render();},0);
  }
  function vegDragOver(e){
    e.preventDefault();if(!selected)return;
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type]');if(!el)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0;
    var seq=selected._seq||[selected];
    var valid=(type==='tableau'&&canTab(seq[0],tableau[idx]))||(type==='foundation'&&seq.length===1&&canFound(seq[0],idx));
    if(valid){el.classList.add('sol-drop-hover');e.dataTransfer.dropEffect='move';}else e.dataTransfer.dropEffect='none';
  }
  function vegDragLeave(e){var el=e.target.closest('[data-type]');if(el)el.classList.remove('sol-drop-hover');}
  function vegDrop(e){
    e.preventDefault();
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    var el=e.target.closest('[data-type]');if(!el||!selected)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0;
    var seq=selected._seq||[selected];
    if(type==='tableau'&&canTab(seq[0],tableau[idx])){
      save();
      if(selectedFrom.type==='waste')waste.pop();
      else if(selectedFrom.type==='tableau'){var src=tableau[selectedFrom.idx];tableau[selectedFrom.idx]=src.slice(0,src.length-seq.length);if(tableau[selectedFrom.idx].length&&!tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1].faceUp)tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1].faceUp=true;}
      seq.forEach(function(card){tableau[idx].push(card);});
      moves++;selected=null;selectedFrom=null;afterMove();
    } else if(type==='foundation'&&seq.length===1&&canFound(seq[0],idx)){
      save();
      if(selectedFrom.type==='waste')waste.pop();
      else if(selectedFrom.type==='tableau'){var src2=tableau[selectedFrom.idx];tableau[selectedFrom.idx]=src2.slice(0,src2.length-1);if(tableau[selectedFrom.idx].length&&!tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1].faceUp)tableau[selectedFrom.idx][tableau[selectedFrom.idx].length-1].faceUp=true;}
      foundations[idx].push(seq[0]);moves++;selected=null;selectedFrom=null;afterMove();
    } else {selected=null;selectedFrom=null;render();}
  }
  function vegDragEnd(e){
    document.querySelectorAll('.sol-drop-hover').forEach(function(x){x.classList.remove('sol-drop-hover');});
    selected=null;selectedFrom=null;render();
  }
  window._vegasCleanup=function(){var t=document.getElementById('solTable');if(!t)return;t.removeEventListener('dragstart',vegDragStart);t.removeEventListener('dragover',vegDragOver);t.removeEventListener('dragleave',vegDragLeave);t.removeEventListener('drop',vegDrop);t.removeEventListener('dragend',vegDragEnd);};
  window._vegasHC=function(type,idx,ci){handleClick(type,idx,ci);};
  window._vegasDC=function(type,idx,ci){handleDblClick(type,idx,ci);};
  window._vegasStart=function(){
    var table=document.getElementById('solTable');if(!table)return;
    document.getElementById('solGameTitle').textContent='Vegas';
    window._vegasCleanup();
    table.addEventListener('dragstart',vegDragStart);table.addEventListener('dragover',vegDragOver);table.addEventListener('dragleave',vegDragLeave);table.addEventListener('drop',vegDrop);table.addEventListener('dragend',vegDragEnd);
    var hb=document.getElementById('solitaireHint');if(hb)hb.style.display='none';
    deal();
    var tbl=document.getElementById('solTable');if(tbl)tbl.innerHTML='<div class="sol-shuffle-anim"><div class="sol-shuffle-deck"></div><div class="sol-shuffle-label">Shuffling\u2026</div></div>';
    document.getElementById('solMoves').textContent='0';var et=document.getElementById('solTime');if(et)et.textContent='0:00';
    clearInterval(solTimer);solTimer=setInterval(function(){solSecs++;var m=Math.floor(solSecs/60),s=solSecs%60;var el=document.getElementById('solTime');if(el)el.textContent=m+':'+(s<10?'0':'')+s;},1000);
    setTimeout(function(){render();},700);
  };
  window._vegasStop=function(){clearInterval(solTimer);};
  window._vegasUndo=undo;
  window._vegasNewGame=function(){window._vegasStart();};
})();

// ── SOLITAIRE VARIANT DISPATCHER ─────────────────────────────────────────
(function(){
  var currentVariant=null;
  var VARIANTS={
    klondike:{start:function(){window._klondikeStart&&_klondikeStart();},stop:function(){window._klondikeStop&&_klondikeStop();},newGame:function(){window._klondikeNewGame&&_klondikeNewGame();},undo:function(){window._klondikeUndo&&_klondikeUndo();}},
    spider:{start:function(){window._spiderSetMode&&_spiderSetMode(1);window._spiderStart&&_spiderStart();},stop:function(){window._spiderStop&&_spiderStop();},newGame:function(){window._spiderNewGame&&_spiderNewGame();},undo:function(){window._spiderUndo&&_spiderUndo();}},
    spider1:{start:function(){window._spiderSetMode&&_spiderSetMode(1);window._spiderStart&&_spiderStart();},stop:function(){window._spiderStop&&_spiderStop();},newGame:function(){window._spiderNewGame&&_spiderNewGame();},undo:function(){window._spiderUndo&&_spiderUndo();}},
    spider2:{start:function(){window._spiderSetMode&&_spiderSetMode(2);window._spiderStart&&_spiderStart();},stop:function(){window._spiderStop&&_spiderStop();},newGame:function(){window._spiderNewGame&&_spiderNewGame();},undo:function(){window._spiderUndo&&_spiderUndo();}},
    spider4:{start:function(){window._spiderSetMode&&_spiderSetMode(4);window._spiderStart&&_spiderStart();},stop:function(){window._spiderStop&&_spiderStop();},newGame:function(){window._spiderNewGame&&_spiderNewGame();},undo:function(){window._spiderUndo&&_spiderUndo();}},
    scorpion:{start:function(){window._scorpionStart&&_scorpionStart();},stop:function(){window._scorpionStop&&_scorpionStop();},newGame:function(){window._scorpionNewGame&&_scorpionNewGame();},undo:function(){window._scorpionUndo&&_scorpionUndo();}},
    freecell:{start:function(){window._freecellStart&&_freecellStart();},stop:function(){window._freecellStop&&_freecellStop();},newGame:function(){window._freecellNewGame&&_freecellNewGame();},undo:function(){window._freecellUndo&&_freecellUndo();}},
    pyramid:{start:function(){window._pyramidStart&&_pyramidStart();},stop:function(){window._pyramidStop&&_pyramidStop();},newGame:function(){window._pyramidNewGame&&_pyramidNewGame();},undo:function(){window._pyramidUndo&&_pyramidUndo();}},
    tripeaks:{start:function(){window._tripeaksStart&&_tripeaksStart();},stop:function(){window._tripeaksStop&&_tripeaksStop();},newGame:function(){window._tripeaksNewGame&&_tripeaksNewGame();},undo:function(){window._tripeaksUndo&&_tripeaksUndo();}},
    vegas:{start:function(){window._vegasStart&&_vegasStart();},stop:function(){window._vegasStop&&_vegasStop();},newGame:function(){window._vegasNewGame&&_vegasNewGame();},undo:function(){window._vegasUndo&&_vegasUndo();}}
  };
  function stopCurrent(){if(currentVariant&&VARIANTS[currentVariant])VARIANTS[currentVariant].stop();}
  function hideAllPickers(){
    var ids=['solVariantPicker','solSpiderPicker'];
    ids.forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
  }
  window._solShowPicker=function(){
    stopCurrent();currentVariant=null;
    hideAllPickers();
    var picker=document.getElementById('solVariantPicker'),area=document.getElementById('solGameArea');
    if(picker)picker.style.display='';if(area)area.style.display='none';
    var table=document.getElementById('solTable');if(table)table.innerHTML='';
  };
  window._solShowSpiderPicker=function(){
    hideAllPickers();
    var sp=document.getElementById('solSpiderPicker');if(sp)sp.style.display='';
    var area=document.getElementById('solGameArea');if(area)area.style.display='none';
  };
  window._solStartVariant=function(v){
    if(!VARIANTS[v])return;
    stopCurrent();
    [window._klondikeCleanup,window._spiderCleanup,window._freecellCleanup,window._pyramidCleanup,window._tripeaksCleanup,window._scorpionCleanup,window._vegasCleanup].forEach(function(fn){if(typeof fn==='function')fn();});
    currentVariant=v;
    hideAllPickers();
    var area=document.getElementById('solGameArea');if(area)area.style.display='';
    VARIANTS[v].start();
  };
  window._solStart=function(){if(currentVariant)VARIANTS[currentVariant].start();else window._solShowPicker();};
  window._solStop=function(){stopCurrent();};
  // Wire variant picker cards
  var grid=document.getElementById('solVariantPicker');
  if(grid){
    grid.querySelectorAll('.sol-vc').forEach(function(el){
      el.addEventListener('click',function(){
        if(el.id==='solSpiderMenuBtn'){window._solShowSpiderPicker();}
        else{window._solStartVariant(el.dataset.variant);}
      });
    });
  }
  // Spider sub-picker
  var spGrid=document.getElementById('solSpiderPicker');
  if(spGrid){
    spGrid.querySelectorAll('.sol-spc').forEach(function(el){
      el.addEventListener('click',function(){window._solStartVariant(el.dataset.variant);});
    });
    var spBack=document.getElementById('solSpiderPickerBack');
    if(spBack)spBack.addEventListener('click',function(){window._solShowPicker();});
  }
  // Back button in picker → hub
  var pb=document.getElementById('solPickerBack');
  if(pb)pb.addEventListener('click',function(){
    var sga=document.getElementById('gamesPlaySolitaire');if(sga)sga.style.display='none';
    var hub=document.getElementById('gamesHub');if(hub)hub.style.display='';
  });
  // Game area buttons
  var sng=document.getElementById('solitaireNewGame');if(sng)sng.addEventListener('click',function(){if(currentVariant&&VARIANTS[currentVariant])VARIANTS[currentVariant].newGame();});
  var snmb=document.getElementById('solNoMovesNewGame');if(snmb)snmb.addEventListener('click',function(){if(currentVariant&&VARIANTS[currentVariant])VARIANTS[currentVariant].newGame();});
  var sub=document.getElementById('solitaireUndo');if(sub){sub.addEventListener('click',function(){if(currentVariant&&VARIANTS[currentVariant])VARIANTS[currentVariant].undo();});sub.disabled=true;sub.style.opacity='.4';}
  var shb=document.getElementById('solitaireHint');if(shb)shb.addEventListener('click',function(){
    var hintFns={klondike:window._klondikeHint,spider:window._spiderHint,spider1:window._spiderHint,spider2:window._spiderHint,spider4:window._spiderHint,scorpion:window._scorpionHint};
    var fn=hintFns[currentVariant];if(typeof fn==='function')fn();
  });
  // Single capture-phase click dispatcher — fires before any element handlers, can't be double-called
  var _solLastClick=0;
  document.addEventListener('click',function(e){
    if(!currentVariant)return;
    var now=Date.now();if(now-_solLastClick<50){return;}_solLastClick=now;
    var area=document.getElementById('solGameArea');
    if(!area||area.style.display==='none')return;
    var table=document.getElementById('solTable');
    if(!table||!table.contains(e.target))return;
    var el=e.target.closest('[data-type]');if(!el)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0,ci=el.dataset.ci;
    var cardIdx=(ci===undefined||ci==='empty')?undefined:parseInt(ci);
    var fn={klondike:window._klondikeHC,spider:window._spiderHC,spider1:window._spiderHC,spider2:window._spiderHC,spider4:window._spiderHC,scorpion:window._scorpionHC,freecell:window._freecellHC,pyramid:window._pyramidHC,tripeaks:window._tripeaksHC,vegas:window._vegasHC}[currentVariant];
    if(fn)fn(type,idx,isNaN(cardIdx)?undefined:cardIdx);
  },true);
  document.addEventListener('dblclick',function(e){
    if(!currentVariant)return;
    var area=document.getElementById('solGameArea');
    if(!area||area.style.display==='none')return;
    var table=document.getElementById('solTable');
    if(!table||!table.contains(e.target))return;
    var el=e.target.closest('[data-type]');if(!el)return;
    var type=el.dataset.type,idx=parseInt(el.dataset.idx)||0;
    var fn={klondike:window._klondikeDC,freecell:window._freecellDC,vegas:window._vegasDC}[currentVariant];
    if(fn)fn(type,idx);
  },true);
})();

// ── FLAPPY BIRD ────────────────────────────────────────────────────────────
(function(){
  var W=360, H=540;
  var GRAVITY=0.45, JUMP=-8.5, PIPE_W=52, PIPE_GAP=145, PIPE_SPEED=2.4, PIPE_INTERVAL=90;
  var canvas, ctx, raf, running, started, dead;
  var bird, pipes, score, bestScore, frame, particles;

  // ── Sound ──
  function beep(freq, dur, vol, type){
    try{
      var ac=new(window.AudioContext||window.webkitAudioContext)();
      var o=ac.createOscillator(), g=ac.createGain();
      o.type=type||'sine'; o.frequency.value=freq;
      g.gain.setValueAtTime(vol||0.15,ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+dur);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime+dur);
    }catch(e){}
  }
  function sfxFlap(){ beep(520,0.08,0.12,'square'); }
  function sfxScore(){ beep(880,0.1,0.12,'sine'); setTimeout(function(){ beep(1100,0.1,0.1,'sine'); },80); }
  function sfxDie(){ beep(200,0.3,0.2,'sawtooth'); beep(150,0.4,0.15,'sawtooth'); }

  // ── Stars background ──
  var stars=[];
  function initStars(){
    stars=[];
    for(var i=0;i<60;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.3,s:Math.random()*0.5+0.3});
  }

  function initBird(){
    bird={x:80,y:H/2,vy:0,r:14,rot:0,trail:[]};
  }

  function initGame(){
    pipes=[]; score=0; frame=0; particles=[];
    bestScore=parseInt(localStorage.getItem('ss_bird_best')||'0');
    initBird();
    running=true; started=false; dead=false;
    document.getElementById('birdScore').textContent='0';
    document.getElementById('birdBest').textContent=bestScore;
  }

  // ── Particles ──
  function spawnParticles(x,y,color){
    for(var i=0;i<12;i++) particles.push({x:x,y:y,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6,life:1,color:color||'#c084fc'});
  }

  function updateParticles(){
    particles=particles.filter(function(p){ p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=0.04; return p.life>0; });
  }

  function drawParticles(){
    particles.forEach(function(p){
      ctx.globalAlpha=p.life;
      ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
  }

  // ── Draw helpers ──
  function drawBg(){
    // Sky gradient
    var grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#06020f');
    grad.addColorStop(0.5,'#100830');
    grad.addColorStop(1,'#0a0520');
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
    // Stars
    stars.forEach(function(s){
      ctx.globalAlpha=0.4+0.3*Math.sin(frame*s.s*0.05);
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
    // Ground
    var gGrad=ctx.createLinearGradient(0,H-40,0,H);
    gGrad.addColorStop(0,'#1a0d40'); gGrad.addColorStop(1,'#0d0820');
    ctx.fillStyle=gGrad; ctx.fillRect(0,H-40,W,40);
    ctx.strokeStyle='rgba(192,132,252,.3)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(0,H-40); ctx.lineTo(W,H-40); ctx.stroke();
  }

  function drawPipe(pipe){
    var topH=pipe.topH, botY=topH+PIPE_GAP;
    // Top pipe
    var tGrad=ctx.createLinearGradient(pipe.x,0,pipe.x+PIPE_W,0);
    tGrad.addColorStop(0,'#1a0d3e'); tGrad.addColorStop(0.4,'#2d1a5c'); tGrad.addColorStop(1,'#180b32');
    ctx.fillStyle=tGrad; ctx.fillRect(pipe.x,0,PIPE_W,topH);
    // Top cap
    ctx.fillStyle='#3d2070'; ctx.fillRect(pipe.x-4,topH-16,PIPE_W+8,16);
    // Bottom pipe
    ctx.fillStyle=tGrad; ctx.fillRect(pipe.x,botY,PIPE_W,H-botY-40);
    // Bottom cap
    ctx.fillStyle='#3d2070'; ctx.fillRect(pipe.x-4,botY,PIPE_W+8,16);
    // Edge highlight
    ctx.strokeStyle='rgba(192,132,252,.25)'; ctx.lineWidth=1;
    ctx.strokeRect(pipe.x,0,PIPE_W,topH);
    ctx.strokeRect(pipe.x,botY,PIPE_W,H-botY-40);
  }

  function drawBird(){
    var b=bird;
    // Trail
    b.trail.forEach(function(t,i){
      var a=(i/b.trail.length)*0.3;
      ctx.globalAlpha=a;
      ctx.fillStyle='#f472b6';
      ctx.beginPath(); ctx.arc(t.x,t.y,b.r*(i/b.trail.length)*0.7,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;

    ctx.save();
    ctx.translate(b.x,b.y);
    ctx.rotate(Math.max(-0.5,Math.min(Math.PI/2, b.rot)));

    // Glow
    ctx.shadowColor='rgba(192,132,252,.8)'; ctx.shadowBlur=18;

    // Body gradient
    var bg=ctx.createRadialGradient(-3,-3,2,0,0,b.r);
    bg.addColorStop(0,'#e0aaff'); bg.addColorStop(0.5,'#c084fc'); bg.addColorStop(1,'#7c3aed');
    ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(0,0,b.r,0,Math.PI*2); ctx.fill();

    ctx.shadowBlur=0;

    // Eye
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(5,-3,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a0a2e'; ctx.beginPath(); ctx.arc(6,-3,2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(7,-4,0.8,0,Math.PI*2); ctx.fill();

    // Beak
    ctx.fillStyle='#fb923c';
    ctx.beginPath(); ctx.moveTo(10,-1); ctx.lineTo(18,1); ctx.lineTo(10,4); ctx.closePath(); ctx.fill();

    // Wing
    ctx.fillStyle='rgba(167,139,250,.7)';
    ctx.beginPath(); ctx.ellipse(-2,5,8,4,0.3,0,Math.PI*2); ctx.fill();

    ctx.restore();
  }

  function drawScore(){
    ctx.save();
    ctx.textAlign='center';
    if(started&&!dead){
      ctx.font='bold 36px "Fredoka One", cursive';
      ctx.shadowColor='rgba(192,132,252,.6)'; ctx.shadowBlur=12;
      ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillText(score,W/2,60);
      ctx.shadowBlur=0;
    }
    ctx.restore();
  }

  function drawOverlay(){
    // Semi-dark bg
    ctx.fillStyle='rgba(6,2,15,.75)'; ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';

    if(dead){
      ctx.font='bold 42px "Fredoka One", cursive';
      var grad=ctx.createLinearGradient(0,H/2-60,0,H/2-20);
      grad.addColorStop(0,'#f472b6'); grad.addColorStop(1,'#c084fc');
      ctx.fillStyle=grad; ctx.fillText('Game Over',W/2,H/2-30);

      ctx.font='bold 18px Nunito, sans-serif';
      ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fillText('Score: '+score+'   Best: '+bestScore,W/2,H/2+10);
    } else {
      ctx.font='bold 40px "Fredoka One", cursive';
      var grad2=ctx.createLinearGradient(0,H/2-80,0,H/2-30);
      grad2.addColorStop(0,'#c084fc'); grad2.addColorStop(1,'#f472b6');
      ctx.fillStyle=grad2; ctx.fillText('Flappy Bird',W/2,H/2-30);

      ctx.font='bold 16px Nunito, sans-serif';
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillText('Best: '+bestScore,W/2,H/2+5);
    }

    // Play button
    var bx=W/2, by=dead?H/2+70:H/2+55;
    var btnGrad=ctx.createLinearGradient(bx-60,by-22,bx+60,by+22);
    btnGrad.addColorStop(0,'#c084fc'); btnGrad.addColorStop(1,'#f472b6');
    ctx.fillStyle=btnGrad;
    ctx.beginPath(); ctx.roundRect(bx-60,by-22,120,44,22); ctx.fill();
    ctx.font='bold 16px Nunito, sans-serif';
    ctx.fillStyle='#fff'; ctx.fillText(dead?'Play Again \u25B6':'Start \u25B6',bx,by+6);
  }

  // ── Game loop ──
  function update(){
    frame++;
    if(!started||dead) return;

    // Bird physics
    bird.vy+=GRAVITY;
    bird.y+=bird.vy;
    bird.rot=bird.vy*0.06;
    bird.trail.push({x:bird.x,y:bird.y});
    if(bird.trail.length>8) bird.trail.shift();

    // Spawn pipes
    if(frame%PIPE_INTERVAL===0){
      var minTop=60, maxTop=H-40-PIPE_GAP-60;
      pipes.push({x:W+10,topH:minTop+Math.random()*(maxTop-minTop),scored:false});
    }

    // Move pipes
    pipes.forEach(function(p){ p.x-=PIPE_SPEED*(1+score*0.02); });
    pipes=pipes.filter(function(p){ return p.x>-PIPE_W-10; });

    // Score
    pipes.forEach(function(p){
      if(!p.scored&&p.x+PIPE_W<bird.x){
        p.scored=true; score++;
        document.getElementById('birdScore').textContent=score;
        sfxScore();
        spawnParticles(bird.x,bird.y,'#f472b6');
        if(score>bestScore){ bestScore=score; localStorage.setItem('ss_bird_best',score); document.getElementById('birdBest').textContent=bestScore; }
      }
    });

    updateParticles();

    // Collisions
    if(bird.y+bird.r>H-40||bird.y-bird.r<0){ die(); return; }
    for(var i=0;i<pipes.length;i++){
      var p=pipes[i];
      if(bird.x+bird.r-4>p.x&&bird.x-bird.r+4<p.x+PIPE_W){
        if(bird.y-bird.r+4<p.topH||bird.y+bird.r-4>p.topH+PIPE_GAP){ die(); return; }
      }
    }
  }

  function die(){
    dead=true; running=false;
    sfxDie();
    spawnParticles(bird.x,bird.y,'#ef4444');
    spawnParticles(bird.x,bird.y,'#f472b6');
    if(score>bestScore){ bestScore=score; localStorage.setItem('ss_bird_best',score); document.getElementById('birdBest').textContent=bestScore; }
  }

  function draw(){
    drawBg();
    pipes.forEach(drawPipe);
    drawParticles();
    drawBird();
    drawScore();
    if(!started||dead) drawOverlay();
  }

  function loop(){
    if(!canvas) return;
    update(); draw();
    raf=requestAnimationFrame(loop);
  }

  function flap(){
    if(dead){ initGame(); started=true; sfxFlap(); return; }
    if(!started){ started=true; }
    bird.vy=JUMP; bird.rot=-0.4;
    sfxFlap();
    spawnParticles(bird.x,bird.y+bird.r,'#a78bfa');
  }

  window._birdInit=function(){
    canvas=document.getElementById('birdCanvas');
    if(!canvas) return;
    ctx=canvas.getContext('2d');
    initStars();
    initGame();
    if(raf) cancelAnimationFrame(raf);
    loop();
    if(!canvas._birdWired){
      canvas._birdWired=true;
      canvas.addEventListener('click', flap);
      canvas.addEventListener('touchstart', function(e){ e.preventDefault(); flap(); },{passive:false});
    }
  };

  window._birdStop=function(){
    if(raf) cancelAnimationFrame(raf);
    raf=null; running=false;
  };

  document.addEventListener('keydown',function(e){
    if(e.code==='Space'){
      var screen=document.getElementById('gamesPlayBird');
      if(screen&&screen.style.display!=='none'){ e.preventDefault(); flap(); }
    }
  });
})();

// ── CHESS ─────────────────────────────────────────────────────────────────
(function(){
  // ── Glyphs & constants ────────────────────────────────────────────────
  var G={wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'};
  var PV={P:100,N:320,B:330,R:500,Q:900,K:20000};
  var FILES='abcdefgh';
  var PST={
    P:[[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],
    N:[[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
    B:[[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
    R:[[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
    Q:[[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
    K:[[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]]
  };
  var DIFFS=[
    {id:1,name:'Beginner',sub:'~400',elo:400,depth:0,color:'#34d399',border:'rgba(52,211,153,.3)'},
    {id:2,name:'Easy',sub:'~800',elo:800,depth:1,color:'#60a5fa',border:'rgba(96,165,250,.3)'},
    {id:3,name:'Medium',sub:'~1200',elo:1200,depth:2,color:'#a78bfa',border:'rgba(167,139,250,.3)'},
    {id:4,name:'Hard',sub:'~1600',elo:1600,depth:3,color:'#f472b6',border:'rgba(244,114,182,.3)'},
    {id:5,name:'Expert',sub:'~2000',elo:2000,depth:4,color:'#fb923c',border:'rgba(251,146,60,.3)'}
  ];

  // ── Game state ────────────────────────────────────────────────────────
  var board,turn,sel,validMvs,ep,castling,gameOver,aiThinking;
  var playerColor,gameMode,botDepth,botElo;
  var capW,capB,lastFr,lastTo,moveHistory,halfMove,fullMove;
  var premoveSel,premove; // premove: {fr,fc,tr,tc,sp} queued while opponent thinks
  var onlineWs,onlineRoom,onlineColor,onlineConnected;
  var chessStats; // {rating,wins,draws,losses,botRecords:{1:..,2:..,3:..,4:..,5:..}}

  // ── Stats persistence ─────────────────────────────────────────────────
  function loadStats(){
    try{
      var s=JSON.parse(localStorage.getItem('ss_chess_stats')||'{}');
      chessStats={
        rating:s.rating||1200, wins:s.wins||0, draws:s.draws||0, losses:s.losses||0,
        botRecords:s.botRecords||{1:{w:0,d:0,l:0},2:{w:0,d:0,l:0},3:{w:0,d:0,l:0},4:{w:0,d:0,l:0},5:{w:0,d:0,l:0}}
      };
    }catch(e){ chessStats={rating:1200,wins:0,draws:0,losses:0,botRecords:{1:{w:0,d:0,l:0},2:{w:0,d:0,l:0},3:{w:0,d:0,l:0},4:{w:0,d:0,l:0},5:{w:0,d:0,l:0}}}; }
  }
  function saveStats(){ try{ localStorage.setItem('ss_chess_stats',JSON.stringify(chessStats)); }catch(e){} }
  function calcElo(myRating,oppRating,result,k){
    var exp=1/(1+Math.pow(10,(oppRating-myRating)/400));
    return Math.round(myRating+k*(result-exp));
  }
  function recordResult(result,oppElo,isBot,diffId){ // result: 1=win,0.5=draw,0=loss
    var k=isBot?24:20;
    var newRating=calcElo(chessStats.rating,oppElo,result,k);
    chessStats.rating=Math.max(100,newRating);
    if(result===1){chessStats.wins++; if(isBot&&diffId) chessStats.botRecords[diffId].w++;}
    else if(result===0.5){chessStats.draws++; if(isBot&&diffId) chessStats.botRecords[diffId].d++;}
    else{chessStats.losses++; if(isBot&&diffId) chessStats.botRecords[diffId].l++;}
    saveStats(); renderRatings();
  }

  // ── Board logic ───────────────────────────────────────────────────────
  function np(color,type){return {color:color,type:type};}
  function cloneBoard(b){return b.map(function(r){return r.map(function(c){return c?{color:c.color,type:c.type}:null;});});}
  function cloneCs(cs){return {wK:cs.wK,wQ:cs.wQ,bK:cs.bK,bQ:cs.bQ};}

  function initBoard(){
    board=[];
    for(var r=0;r<8;r++){board.push([]);for(var c=0;c<8;c++)board[r].push(null);}
    var bk=['R','N','B','Q','K','B','N','R'];
    for(var c2=0;c2<8;c2++){
      board[0][c2]=np('b',bk[c2]);board[1][c2]=np('b','P');
      board[6][c2]=np('w','P');board[7][c2]=np('w',bk[c2]);
    }
    turn='w';sel=null;validMvs=[];ep=null;
    castling={wK:true,wQ:true,bK:true,bQ:true};
    gameOver=false;aiThinking=false;
    capW=[];capB=[];lastFr=null;lastTo=null;moveHistory=[];halfMove=0;fullMove=1;
    premoveSel=null;premove=null;
  }

  function pMoves(r,c,brd,ep2){
    var p=brd[r][c];if(!p)return[];
    var ms=[],col=p.color,opp=col==='w'?'b':'w';
    function add(tr,tc,sp){
      if(tr<0||tr>7||tc<0||tc>7)return false;
      var t=brd[tr][tc];if(t&&t.color===col)return false;
      ms.push({r:tr,c:tc,sp:sp||null});return!t;
    }
    function slide(dr,dc){var nr=r+dr,nc=c+dc;while(nr>=0&&nr<=7&&nc>=0&&nc<=7){var t=brd[nr][nc];if(t){if(t.color!==col)ms.push({r:nr,c:nc,sp:null});break;}ms.push({r:nr,c:nc,sp:null});nr+=dr;nc+=dc;}}
    if(p.type==='P'){
      var d=col==='w'?-1:1,sr=col==='w'?6:1;
      if(r+d>=0&&r+d<=7&&!brd[r+d][c]){
        ms.push({r:r+d,c:c,sp:(r+d===0||r+d===7)?'promo':null});
        if(r===sr&&!brd[r+2*d][c])ms.push({r:r+2*d,c:c,sp:'double'});
      }
      [-1,1].forEach(function(dc2){var nc2=c+dc2;if(nc2<0||nc2>7)return;if(r+d>=0&&r+d<=7&&brd[r+d][nc2]&&brd[r+d][nc2].color===opp)ms.push({r:r+d,c:nc2,sp:(r+d===0||r+d===7)?'promo':null});if(ep2&&r+d===ep2.r&&nc2===ep2.c)ms.push({r:r+d,c:nc2,sp:'ep'});});
    }else if(p.type==='N'){[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(function(m){add(r+m[0],c+m[1]);});}
    else if(p.type==='B'){[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(d){slide(d[0],d[1]);});}
    else if(p.type==='R'){[[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d){slide(d[0],d[1]);});}
    else if(p.type==='Q'){[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function(d){slide(d[0],d[1]);});}
    else if(p.type==='K'){
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function(d){add(r+d[0],c+d[1]);});
      var kr=col==='w'?7:0;
      if(r===kr&&c===4){
        if(castling[col+'K']&&!brd[kr][5]&&!brd[kr][6]&&brd[kr][7]&&brd[kr][7].type==='R')ms.push({r:kr,c:6,sp:'ck'});
        if(castling[col+'Q']&&!brd[kr][3]&&!brd[kr][2]&&!brd[kr][1]&&brd[kr][0]&&brd[kr][0].type==='R')ms.push({r:kr,c:2,sp:'cq'});
      }
    }
    return ms;
  }

  function applyMv(brd,fr,fc,tr,tc,sp,ep2,cs){
    var nb=cloneBoard(brd),nc=cloneCs(cs),nep=null;
    var p=nb[fr][fc];nb[tr][tc]=p;nb[fr][fc]=null;
    if(sp==='promo')nb[tr][tc]={color:p.color,type:'Q'};
    if(sp==='ep'){var cr=p.color==='w'?tr+1:tr-1;nb[cr][tc]=null;}
    if(sp==='double')nep={r:(fr+tr)/2,c:fc};
    if(sp==='ck'){nb[fr][5]=nb[fr][7];nb[fr][7]=null;}
    if(sp==='cq'){nb[fr][3]=nb[fr][0];nb[fr][0]=null;}
    if(p.type==='K'){if(p.color==='w'){nc.wK=false;nc.wQ=false;}else{nc.bK=false;nc.bQ=false;}}
    if(p.type==='R'){if(fr===7&&fc===7)nc.wK=false;if(fr===7&&fc===0)nc.wQ=false;if(fr===0&&fc===7)nc.bK=false;if(fr===0&&fc===0)nc.bQ=false;}
    return{b:nb,ep:nep,cs:nc};
  }

  function inCheck(brd,color,ep2){
    var kr=-1,kc=-1;
    for(var r=0;r<8;r++)for(var c=0;c<8;c++)if(brd[r][c]&&brd[r][c].color===color&&brd[r][c].type==='K'){kr=r;kc=c;}
    if(kr<0)return true;
    var opp=color==='w'?'b':'w';
    for(var r2=0;r2<8;r2++)for(var c2=0;c2<8;c2++){
      if(!brd[r2][c2]||brd[r2][c2].color!==opp)continue;
      var ms=pMoves(r2,c2,brd,ep2);
      for(var i=0;i<ms.length;i++)if(ms[i].r===kr&&ms[i].c===kc)return true;
    }
    return false;
  }

  function legalMvs(r,c,brd,ep2,cs){
    var col=brd[r][c].color;
    return pMoves(r,c,brd,ep2).filter(function(mv){
      if(mv.sp==='ck'||mv.sp==='cq'){
        if(inCheck(brd,col,ep2))return false;
        var mid=mv.sp==='ck'?5:3;
        var res=applyMv(brd,r,c,r,mid,null,ep2,cs);
        if(inCheck(res.b,col,res.ep))return false;
      }
      var res=applyMv(brd,r,c,mv.r,mv.c,mv.sp,ep2,cs);
      return!inCheck(res.b,col,res.ep);
    });
  }

  function allLegal(color,brd,ep2,cs){
    var ms=[];
    for(var r=0;r<8;r++)for(var c=0;c<8;c++){
      if(!brd[r][c]||brd[r][c].color!==color)continue;
      var pm=legalMvs(r,c,brd,ep2,cs);
      pm.forEach(function(mv){ms.push({fr:r,fc:c,tr:mv.r,tc:mv.c,sp:mv.sp});});
    }
    return ms;
  }

  // ── Algebraic notation ────────────────────────────────────────────────
  function toAlg(fr,fc,tr,tc,sp,brd){
    var p=brd[fr][fc];if(!p)return'';
    if(sp==='ck')return'O-O';
    if(sp==='cq')return'O-O-O';
    var from=FILES[fc]+(8-fr);
    var to=FILES[tc]+(8-tr);
    var cap=brd[tr][tc]||(sp==='ep')?'x':'';
    var suffix=sp==='promo'?'=Q':'';
    if(p.type==='P')return(cap?FILES[fc]+'x':'')+to+suffix;
    return p.type+cap+to+suffix;
  }

  // ── Evaluation & AI ───────────────────────────────────────────────────
  function evalBoard(brd){
    var s=0;
    for(var r=0;r<8;r++)for(var c=0;c<8;c++){
      var p=brd[r][c];if(!p)continue;
      var pr=p.color==='w'?r:7-r;
      var v=PV[p.type]+(PST[p.type]?PST[p.type][pr][c]:0);
      s+=p.color==='w'?v:-v;
    }
    return s;
  }

  function minimax(brd,depth,alpha,beta,isMax,ep2,cs){
    if(depth===0)return evalBoard(brd);
    var color=isMax?'w':'b';
    var ms=allLegal(color,brd,ep2,cs);
    if(!ms.length)return inCheck(brd,color,ep2)?(isMax?-90000:90000):0;
    if(isMax){
      var best=-Infinity;
      for(var i=0;i<ms.length;i++){var m=ms[i];var res=applyMv(brd,m.fr,m.fc,m.tr,m.tc,m.sp,ep2,cs);var s=minimax(res.b,depth-1,alpha,beta,false,res.ep,res.cs);if(s>best)best=s;if(s>alpha)alpha=s;if(beta<=alpha)break;}
      return best;
    }else{
      var best=Infinity;
      for(var i=0;i<ms.length;i++){var m=ms[i];var res=applyMv(brd,m.fr,m.fc,m.tr,m.tc,m.sp,ep2,cs);var s=minimax(res.b,depth-1,alpha,beta,true,res.ep,res.cs);if(s<best)best=s;if(s<beta)beta=s;if(beta<=alpha)break;}
      return best;
    }
  }

  function bestAI(brd,ep2,cs,depth,color){
    var ms=allLegal(color,brd,ep2,cs);
    if(!ms.length)return null;
    if(depth===0){return ms[Math.floor(Math.random()*ms.length)];} // beginner: random
    ms.sort(function(a,b){return(brd[b.tr][b.tc]?1:0)-(brd[a.tr][a.tc]?1:0);});
    var isMax=color==='w';
    var bestScore=isMax?-Infinity:Infinity,bestMv=ms[0];
    for(var i=0;i<ms.length;i++){
      var m=ms[i],res=applyMv(brd,m.fr,m.fc,m.tr,m.tc,m.sp,ep2,cs);
      var s=minimax(res.b,depth-1,-Infinity,Infinity,!isMax,res.ep,res.cs);
      if(isMax?s>bestScore:s<bestScore){bestScore=s;bestMv=m;}
    }
    return bestMv;
  }

  // ── Piece images (cburnett set — same quality as chess.com) ──────────
  var pImgs={};
  var pImgsReady=false;
  var pImgKeys=['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'];
  function loadPieceImgs(){
    var done=0;
    pImgKeys.forEach(function(k){
      var img=new Image();
      img.crossOrigin='anonymous';
      // Lichess open CDN — cburnett piece set (GPL, beautiful quality)
      img.src='https://lichess1.org/assets/piece/cburnett/'+k+'.svg';
      img.onload=function(){pImgs[k]=img;done++;if(done===12){pImgsReady=true;render();}};
      img.onerror=function(){done++;if(done===12){pImgsReady=true;render();}};
    });
  }

  // ── Canvas render ─────────────────────────────────────────────────────
  function render(){
    var canvas=document.getElementById('chessBoard');
    if(!canvas||!canvas.getContext)return;
    var ctx=canvas.getContext('2d');
    var SIZE=canvas.width; // 480 — internal resolution
    var SQ=SIZE/8;         // 60px per square
    var flip=playerColor==='b';
    // Find king in check
    var checkSq=null;
    if(!gameOver){for(var r=0;r<8;r++)for(var c=0;c<8;c++)if(board[r][c]&&board[r][c].color===turn&&board[r][c].type==='K'&&inCheck(board,turn,ep)){checkSq={r:r,c:c};}}
    // Precompute premove legal hints (outside loop for performance)
    var pmHints=[];
    if(premoveSel&&!premove&&board[premoveSel.r]&&board[premoveSel.r][premoveSel.c]){
      pmHints=legalMvs(premoveSel.r,premoveSel.c,board,ep,castling);
    }
    ctx.clearRect(0,0,SIZE,SIZE);
    for(var ri=0;ri<8;ri++){
      for(var ci=0;ci<8;ci++){
        var row=flip?7-ri:ri,col=flip?7-ci:ci;
        var x=ci*SQ,y=ri*SQ;
        var light=(row+col)%2===0;
        // Base square — chess.com green theme
        ctx.fillStyle=light?'#EEEED2':'#769656';
        ctx.fillRect(x,y,SQ,SQ);
        // Selected highlight
        var isSel=sel&&sel.r===row&&sel.c===col;
        var isMoved=(lastFr&&lastFr.r===row&&lastFr.c===col)||(lastTo&&lastTo.r===row&&lastTo.c===col);
        if(isSel){ctx.fillStyle='rgba(246,246,105,0.78)';ctx.fillRect(x,y,SQ,SQ);}
        else if(isMoved){ctx.fillStyle=light?'rgba(205,210,106,0.7)':'rgba(170,162,58,0.72)';ctx.fillRect(x,y,SQ,SQ);}
        // Check — radial red glow
        if(checkSq&&checkSq.r===row&&checkSq.c===col){
          var cg=ctx.createRadialGradient(x+SQ/2,y+SQ/2,SQ*.1,x+SQ/2,y+SQ/2,SQ*.62);
          cg.addColorStop(0,'rgba(255,0,0,.93)');cg.addColorStop(.55,'rgba(231,0,0,.6)');cg.addColorStop(1,'transparent');
          ctx.fillStyle=cg;ctx.fillRect(x,y,SQ,SQ);
        }
        // Premove highlights (blue)
        var isPmSel=premoveSel&&premoveSel.r===row&&premoveSel.c===col;
        var isPmDst=premove&&(premove.fr===row&&premove.fc===col||premove.tr===row&&premove.tc===col);
        if(isPmSel||isPmDst){ctx.fillStyle='rgba(80,110,255,0.65)';ctx.fillRect(x,y,SQ,SQ);}
        // Valid-move indicators (current turn) + premove hints (blue dots when premove source selected)
        var isValid=validMvs.some(function(m){return m.r===row&&m.c===col;});
        var isPmHint=pmHints.some(function(m){return m.r===row&&m.c===col;});
        if(isValid||isPmHint){
          var alpha=isValid?0.38:0.5,dotAlpha=isValid?0.22:0.45,dotColor=isValid?'#000':'rgba(80,110,255,1)';
          if(board[row][col]){
            // Capture ring
            ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=isValid?'#000':'rgba(80,110,255,1)';ctx.lineWidth=SQ*.115;
            ctx.beginPath();ctx.arc(x+SQ/2,y+SQ/2,SQ*.465,0,Math.PI*2);ctx.stroke();ctx.restore();
          }else{
            // Dot
            ctx.save();ctx.globalAlpha=dotAlpha;ctx.fillStyle=dotColor;
            ctx.beginPath();ctx.arc(x+SQ/2,y+SQ/2,SQ*.16,0,Math.PI*2);ctx.fill();ctx.restore();
          }
        }
        // Piece
        var piece=board[row][col];
        if(piece)drawPiece(ctx,piece,x,y,SQ);
        // Board coordinates (chess.com style — inside squares)
        ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
        ctx.font='bold '+Math.round(SQ*.185)+'px "Nunito",sans-serif';
        if(ci===0){ctx.fillStyle=light?'#769656':'#EEEED2';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(String(8-row),x+SQ*.05,y+SQ*.04);}
        if(ri===7){ctx.fillStyle=light?'#769656':'#EEEED2';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText(FILES[col],x+SQ*.95,y+SQ*.97);}
      }
    }
    renderCaps();
  }

  function drawPiece(ctx,piece,x,y,SQ){
    var key=piece.color+piece.type;
    if(pImgs[key]){
      // SVG piece from Lichess CDN — beautiful quality
      ctx.drawImage(pImgs[key],x+SQ*.03,y+SQ*.03,SQ*.94,SQ*.94);
      return;
    }
    // Fallback: Unicode glyph with canvas shadows (used until images load)
    var glyph=G[key];
    var fs=Math.round(SQ*.72);
    ctx.font=fs+'px "Segoe UI Symbol","Apple Color Emoji","Noto Emoji",serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    if(piece.color==='w'){
      ctx.shadowColor='rgba(0,0,0,.98)';ctx.shadowBlur=SQ*.1;ctx.shadowOffsetY=SQ*.035;
      ctx.fillStyle='#fff';ctx.fillText(glyph,x+SQ/2,y+SQ/2+SQ*.03);
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=SQ*.038;ctx.strokeText(glyph,x+SQ/2,y+SQ/2+SQ*.03);
    }else{
      ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=SQ*.08;ctx.shadowOffsetY=SQ*.025;
      ctx.fillStyle='#1a0a2e';ctx.fillText(glyph,x+SQ/2,y+SQ/2+SQ*.03);
    }
    ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  }

  function renderCaps(){
    function show(elId,caps,color){
      var el=document.getElementById(elId);if(!el)return;
      var sorted=caps.slice().sort(function(a,b){return PV[b]-PV[a];});
      el.innerHTML=sorted.map(function(t){return'<span>'+G[color+t]+'</span>';}).join('');
    }
    // capW = pieces white captured (black pieces), show above board (opponent side)
    // capB = pieces black captured (white pieces), show below board (player side area)
    if(playerColor==='w'){show('chessCapsTop',capW,'b');show('chessCapsBottom',capB,'w');}
    else{show('chessCapsTop',capB,'w');show('chessCapsBottom',capW,'b');}
  }

  function renderRatings(){
    var el=document.getElementById('chessRatingBig');if(el)el.textContent=chessStats.rating;
    var ew=document.getElementById('chessWins');if(ew)ew.textContent=chessStats.wins;
    var ed=document.getElementById('chessDraws');if(ed)ed.textContent=chessStats.draws;
    var el2=document.getElementById('chessLosses');if(el2)el2.textContent=chessStats.losses;
    var ebr=document.getElementById('chessBotRecords');
    if(ebr){
      ebr.innerHTML=DIFFS.map(function(d){
        var rec=chessStats.botRecords[d.id]||{w:0,d:0,l:0};
        return'<div class="chess-bot-record"><span class="chess-bot-record-name" style="color:'+d.color+'">'+d.name+'</span><span class="chess-bot-record-stats">'+rec.w+'W / '+rec.d+'D / '+rec.l+'L</span></div>';
      }).join('');
    }
    var eb=document.getElementById('chessEloBottom');if(eb)eb.textContent='Rating: '+chessStats.rating;
  }

  function renderMoves(){
    var el=document.getElementById('chessMovesList');if(!el)return;
    el.innerHTML='';
    for(var i=0;i<moveHistory.length;i+=2){
      var num=document.createElement('div');num.className='chess-mv-num';num.textContent=(i/2+1)+'.';el.appendChild(num);
      var mw=document.createElement('div');mw.className='chess-mv-w';mw.textContent=moveHistory[i]||'';el.appendChild(mw);
      var mb=document.createElement('div');mb.className='chess-mv-b';mb.textContent=moveHistory[i+1]||'';el.appendChild(mb);
    }
    el.scrollTop=el.scrollHeight;
  }

  function setStatus(txt,color){
    var el=document.getElementById('chessGameStatus');if(el){el.textContent=txt;if(color)el.style.color=color;else el.style.color='';}
  }

  function showOverlay(title,sub,showNewGame){
    var ov=document.getElementById('chessBoardOverlay');
    var ot=document.getElementById('chessOverlayTitle');
    var os=document.getElementById('chessOverlaySub');
    var ng=document.getElementById('chessOverlayNewGame');
    if(ov)ov.style.display='flex';if(ot)ot.textContent=title;if(os)os.textContent=sub;
    if(ng)ng.style.display=(showNewGame===false)?'none':'';
  }
  function hideOverlay(){var ov=document.getElementById('chessBoardOverlay');if(ov)ov.style.display='none';}

  function checkGameEnd(){
    var ms=allLegal(turn,board,ep,castling);
    if(!ms.length){
      gameOver=true;
      var resign=document.getElementById('chessResignBtn');if(resign)resign.style.display='none';
      if(inCheck(board,turn,ep)){
        var winner=turn!==playerColor;
        var title=winner?'You Win! 🎉':'You Lost';
        var sub=(turn==='w'?'Black':'White')+' wins by checkmate';
        showOverlay(title,sub,false);
        setStatus(title,winner?'#34d399':'#ef4444');
        recordResult(winner?1:0,botElo||(chessStats.rating),gameMode==='bot',botDepth?DIFFS.find(function(d){return d.depth===botDepth-1;})||null:null);
        if(gameMode==='bot'){var diffObj=DIFFS.find(function(d){return d.depth===(botDepth||1)-1;});recordResult(winner?1:0,diffObj?diffObj.elo:1200,true,diffObj?diffObj.id:1);}
      }else{
        showOverlay("Stalemate","It's a draw!");
        setStatus("Draw",'rgba(255,255,255,.5)');
        if(gameMode==='bot'){var diffObj=DIFFS.find(function(d){return d.depth===(botDepth||1)-1;});recordResult(0.5,diffObj?diffObj.elo:1200,true,diffObj?diffObj.id:1);}
      }
      return true;
    }
    if(inCheck(board,turn,ep)){setStatus(turn===playerColor?'⚠️ Check! Your move':'Check!','#fb923c');}
    else{setStatus(turn===playerColor?'Your turn':'Opponent\'s turn','');}
    return false;
  }

  // ── Move execution ────────────────────────────────────────────────────
  function execMove(fr,fc,tr,tc,sp,byPlayer){
    var alg=toAlg(fr,fc,tr,tc,sp,board);
    var cap=board[tr][tc];
    if(sp==='ep'){var cr=board[fr][fc].color==='w'?tr+1:tr-1;cap=board[cr][tc];}
    if(cap){if(board[fr][fc].color==='w')capW.push(cap.type);else capB.push(cap.type);}
    var res=applyMv(board,fr,fc,tr,tc,sp,ep,castling);
    board=res.b;ep=res.ep;castling=res.cs;
    lastFr={r:fr,c:fc};lastTo={r:tr,c:tc};
    sel=null;validMvs=[];
    moveHistory.push(alg);
    turn=turn==='w'?'b':'w';
    render();renderMoves();
    // Online: broadcast
    if(gameMode==='online'&&byPlayer&&onlineWs&&onlineConnected){
      wsBroadcast({type:'move',fr:fr,fc:fc,tr:tr,tc:tc,sp:sp});
    }
    if(!checkGameEnd()&&gameMode==='bot'&&turn!==playerColor&&!gameOver){
      aiThinking=true;setStatus('AI thinking…','rgba(192,132,252,.8)');
      setTimeout(function(){
        var depth=botDepth||1;
        var aiColor=playerColor==='w'?'b':'w';
        var mv=bestAI(board,ep,castling,depth,aiColor);
        aiThinking=false;
        if(mv){execMove(mv.fr,mv.fc,mv.tr,mv.tc,mv.sp,false);if(!gameOver)tryPremove();}
        else{gameOver=true;showOverlay('You Win! 🎉','No moves for opponent',false);}
      },120+(botDepth||1)*60);
    }
  }

  // ── Click handler ─────────────────────────────────────────────────────
  function handleSqClick(row,col){
    if(gameOver)return;
    var myColor=gameMode==='online'?onlineColor:playerColor;
    var isMyTurn=(gameMode==='online'?turn===onlineColor:turn===playerColor);
    // Not my turn — handle premove queue
    if(!isMyTurn){
      if(gameMode==='bot'||gameMode==='online'){
        var piece2=board[row][col];
        // Clicking own piece: set premove source
        if(piece2&&piece2.color===myColor){
          premoveSel={r:row,c:col};premove=null;render();return;
        }
        // Clicking destination after selecting a premove source
        if(premoveSel){
          // Store premove (validation happens when turn arrives)
          premove={fr:premoveSel.r,fc:premoveSel.c,tr:row,tc:col};
          render();return;
        }
      }
      return;
    }
    if(aiThinking)return;
    var piece=board[row][col];
    if(sel&&validMvs.length){
      var mv=null;for(var i=0;i<validMvs.length;i++)if(validMvs[i].r===row&&validMvs[i].c===col){mv=validMvs[i];break;}
      if(mv){execMove(sel.r,sel.c,row,col,mv.sp,true);return;}
    }
    if(piece&&piece.color===turn){
      sel={r:row,c:col};
      validMvs=legalMvs(row,col,board,ep,castling);
      render();return;
    }
    sel=null;validMvs=[];render();
  }

  // ── Try queued premove ────────────────────────────────────────────────
  function tryPremove(){
    if(!premove||gameOver)return;
    var pm=premove;premoveSel=null;premove=null;
    var myColor=gameMode==='online'?onlineColor:playerColor;
    // Premove source piece must still belong to player
    var p=board[pm.fr]&&board[pm.fr][pm.fc];
    if(!p||p.color!==myColor){render();return;}
    // Check if the move is legal in the new position
    var legal=legalMvs(pm.fr,pm.fc,board,ep,castling);
    var mv=null;for(var i=0;i<legal.length;i++)if(legal[i].r===pm.tr&&legal[i].c===pm.tc){mv=legal[i];break;}
    if(mv){execMove(pm.fr,pm.fc,pm.tr,pm.tc,mv.sp,true);}
    else{render();} // premove was illegal — silently discard
  }

  // ── UI tabs ───────────────────────────────────────────────────────────
  function showTab(name){
    ['Play','Moves','Ratings'].forEach(function(t){
      var tab=document.getElementById('chessTab'+t);
      var body=document.getElementById('chessBody'+t);
      var active=t.toLowerCase()===name.toLowerCase();
      if(tab){if(active)tab.classList.add('chess-ptab-active');else tab.classList.remove('chess-ptab-active');}
      if(body)body.style.display=active?'':'none';
    });
    if(name==='Ratings')renderRatings();
    if(name==='Moves')renderMoves();
  }

  function showPlaySubPanel(name){
    // name: null=show mode btns, 'bot', 'online', 'waiting'
    var modeEl=document.querySelector('.chess-mode-btns');
    var botEl=document.getElementById('chessBotPanel');
    var onlEl=document.getElementById('chessOnlinePanel');
    var waitEl=document.getElementById('chessWaitingPanel');
    if(modeEl)modeEl.style.display=(!name)?'flex':'none';
    if(botEl)botEl.style.display=(name==='bot')?'':'none';
    if(onlEl)onlEl.style.display=(name==='online')?'':'none';
    if(waitEl)waitEl.style.display=(name==='waiting')?'':'none';
  }

  function buildDiffGrid(){
    var grid=document.getElementById('chessDiffGrid');if(!grid||grid._built)return;grid._built=true;
    DIFFS.forEach(function(d){
      var btn=document.createElement('button');
      btn.className='chess-diff-btn';
      btn.style.color=d.color;btn.style.borderColor=d.border;
      btn.innerHTML='<span style="font-size:1.1rem">'+('⭐'.repeat(Math.min(d.id,3)))+'</span><div style="flex:1"><div>'+d.name+'</div><div style="font-size:.65rem;opacity:.6;font-weight:700">'+d.sub+' Elo</div></div>';
      btn.addEventListener('click',function(){startBotGame(d);});
      grid.appendChild(btn);
    });
  }

  // ── Game start helpers ────────────────────────────────────────────────
  function setPlayerBars(youName,youElo,oppName,oppElo){
    var nb=document.getElementById('chessNameBottom');if(nb)nb.textContent=youName;
    var eb=document.getElementById('chessEloBottom');if(eb)eb.textContent='Rating: '+youElo;
    var nt=document.getElementById('chessNameTop');if(nt)nt.textContent=oppName;
    var et=document.getElementById('chessEloTop');if(et)et.textContent='Rating: '+oppElo;
    var ab=document.getElementById('chessAvBottom');if(ab)ab.textContent=playerColor==='w'?'♔':'♚';
    var at=document.getElementById('chessAvTop');if(at)at.textContent=playerColor==='w'?'♚':'♔';
  }

  function startBotGame(diff){
    initBoard();
    playerColor='w';gameMode='bot';
    botDepth=diff.depth+1;botElo=diff.elo;
    hideOverlay();showPlaySubPanel(null);showTab('Moves');
    var resign=document.getElementById('chessResignBtn');if(resign)resign.style.display='';
    setPlayerBars('You',chessStats.rating,diff.name+' Bot',diff.elo);
    render();setStatus('Your turn','');
  }

  // ── Online play (Supabase Realtime broadcast) ─────────────────────────
  function genCode(){return Math.random().toString(36).substr(2,6).toUpperCase();}

  function wsConnect(roomCode,asColor){
    onlineRoom=roomCode;onlineColor=asColor;onlineConnected=false;
    var wsUrl='wss://wprfkjeiawxlcnitsfdr.supabase.co/realtime/v1/websocket?apikey='+
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcmZramVpYXd4bGNuaXRzZmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjAyMzUsImV4cCI6MjA4OTc5NjIzNX0.LbJKG8J_jd2oKYAmQg0ycb-LBnQM1ItlseOLMT_24jc'+'&vsn=1.0.0';
    try{onlineWs=new WebSocket(wsUrl);}catch(e){showToast('Connection failed','Could not connect to online server');return;}
    var hbInterval;
    var joinRef=''+Date.now();
    onlineWs.onopen=function(){
      // Join broadcast channel
      onlineWs.send(JSON.stringify({event:'phx_join',topic:'realtime:chess:'+roomCode,payload:{config:{broadcast:{self:false}}},ref:joinRef,join_ref:joinRef}));
      hbInterval=setInterval(function(){if(onlineWs&&onlineWs.readyState===1)onlineWs.send(JSON.stringify({event:'heartbeat',topic:'phoenix',payload:{},ref:'hb'}));},25000);
    };
    onlineWs.onmessage=function(e){
      try{
        var msg=JSON.parse(e.data);
        if(msg.event==='phx_reply'&&msg.payload&&msg.payload.status==='ok'){
          onlineConnected=true;
          if(asColor==='w'){
            // Host: signal ready, start game immediately
            wsBroadcast({type:'start',hostColor:'w'});
            startOnlineGame('w',roomCode);
          }
        }
        if(msg.event==='broadcast'&&msg.payload&&msg.payload.payload){
          var data=msg.payload.payload;
          if(data.type==='start'&&asColor==='b'){
            // Guest receives start signal
            startOnlineGame('b',roomCode);
          }
          if(data.type==='move'&&!gameOver){
            var m=data;
            execMove(m.fr,m.fc,m.tr,m.tc,m.sp,false);
            if(!gameOver)tryPremove();
          }
          if(data.type==='resign'){
            if(!gameOver){gameOver=true;showOverlay('You Win! 🎉','Opponent resigned');recordResult(1,chessStats.rating,false,null);}
          }
        }
        if(msg.event==='phx_error'||msg.event==='phx_close'){wsDisconnect();}
      }catch(err){}
    };
    onlineWs.onclose=function(){
      clearInterval(hbInterval);onlineConnected=false;
      if(!gameOver&&gameMode==='online'){showToast('Disconnected','Opponent left the game');}
    };
    onlineWs.onerror=function(){showToast('Connection error','Could not reach online server');};
  }

  function wsBroadcast(data){
    if(!onlineWs||onlineWs.readyState!==1)return;
    onlineWs.send(JSON.stringify({event:'broadcast',topic:'realtime:chess:'+onlineRoom,payload:data,ref:''+Date.now()}));
  }

  function wsDisconnect(){
    if(onlineWs){try{onlineWs.close();}catch(e){}onlineWs=null;}
    onlineConnected=false;
  }

  function startOnlineGame(color,roomCode){
    initBoard();
    playerColor=color;gameMode='online';botDepth=null;botElo=null;
    hideOverlay();showPlaySubPanel(null);showTab('Moves');
    var resign=document.getElementById('chessResignBtn');if(resign)resign.style.display='';
    setPlayerBars('You ('+( color==='w'?'White':'Black')+')',chessStats.rating,'Opponent','?');
    render();setStatus(color==='w'?'Your turn':'Waiting for white…','');
    var wc=document.getElementById('chessRoomCodeDisplay');if(wc)wc.textContent='';
    showPlaySubPanel(null);
  }

  // ── Wire everything ───────────────────────────────────────────────────
  window._chessInit=function(){
    loadStats();
    initBoard();
    var boardEl=document.getElementById('chessBoard');
    if(boardEl&&!boardEl._cw){
      boardEl._cw=true;
      boardEl.addEventListener('click',function(e){
        var rect=boardEl.getBoundingClientRect();
        var scaleX=boardEl.width/rect.width,scaleY=boardEl.height/rect.height;
        var px=(e.clientX-rect.left)*scaleX,py=(e.clientY-rect.top)*scaleY;
        var SQ=boardEl.width/8;
        var flip=playerColor==='b';
        var ci=Math.floor(px/SQ),ri=Math.floor(py/SQ);
        if(ci<0||ci>7||ri<0||ri>7)return;
        var col=flip?7-ci:ci,row=flip?7-ri:ri;
        handleSqClick(row,col);
      });
    }
    loadPieceImgs();
    // Tabs
    function wireTab(id,name){var el=document.getElementById(id);if(el&&!el._cw){el._cw=true;el.addEventListener('click',function(){showTab(name);});}}
    wireTab('chessTabPlay','Play');wireTab('chessTabMoves','Moves');wireTab('chessTabRatings','Ratings');
    // Mode buttons
    var mb=document.getElementById('chessModeBot');
    if(mb&&!mb._cw){mb._cw=true;mb.addEventListener('click',function(){buildDiffGrid();showPlaySubPanel('bot');});}
    var mo=document.getElementById('chessModeOnline');
    if(mo&&!mo._cw){mo._cw=true;mo.addEventListener('click',function(){showPlaySubPanel('online');});}
    // Bot back
    var bb=document.getElementById('chessBotBack');
    if(bb&&!bb._cw){bb._cw=true;bb.addEventListener('click',function(){showPlaySubPanel(null);});}
    // Online back
    var ob=document.getElementById('chessOnlineBack');
    if(ob&&!ob._cw){ob._cw=true;ob.addEventListener('click',function(){showPlaySubPanel(null);});}
    // Create game
    var cg=document.getElementById('chessCreateBtn');
    if(cg&&!cg._cw){cg._cw=true;cg.addEventListener('click',function(){
      var code=genCode();
      var cd=document.getElementById('chessRoomCodeDisplay');if(cd)cd.textContent=code;
      showPlaySubPanel('waiting');
      wsConnect(code,'w');
    });}
    // Join game
    var jg=document.getElementById('chessJoinBtn');
    if(jg&&!jg._cw){jg._cw=true;jg.addEventListener('click',function(){
      var inp=document.getElementById('chessJoinInput');
      var code=(inp&&inp.value.trim().toUpperCase())||'';
      if(code.length<4){showToast('Invalid code','Please enter a valid room code');return;}
      wsConnect(code,'b');
    });}
    // Cancel waiting
    var cw=document.getElementById('chessCancelWait');
    if(cw&&!cw._cw){cw._cw=true;cw.addEventListener('click',function(){wsDisconnect();showPlaySubPanel(null);});}
    // Resign
    var rg=document.getElementById('chessResignBtn');
    if(rg&&!rg._cw){rg._cw=true;rg.addEventListener('click',function(){
      if(!gameOver){
        if(gameMode==='online')wsBroadcast({type:'resign'});
        gameOver=true;showOverlay('Game Over','You resigned');rg.style.display='none';
        if(gameMode==='bot'){var diffObj=DIFFS.find(function(d){return d.depth===(botDepth||1)-1;});recordResult(0,diffObj?diffObj.elo:1200,true,diffObj?diffObj.id:1);}
        else if(gameMode==='online')recordResult(0,chessStats.rating,false,null);
      }
    });}
    // New game from overlay
    var ong=document.getElementById('chessOverlayNewGame');
    if(ong&&!ong._cw){ong._cw=true;ong.addEventListener('click',function(){hideOverlay();wsDisconnect();initBoard();showPlaySubPanel(null);showTab('Play');var resign2=document.getElementById('chessResignBtn');if(resign2)resign2.style.display='none';render();setStatus('','');});}
    // Show default state
    showPlaySubPanel(null);showTab('Play');
    render();renderRatings();
  };

  window._chessStop=function(){
    wsDisconnect();gameOver=true;aiThinking=false;
  };
})();

// ── Music Services ────────────────────────────────────────────────────────
(function(){
  // ── Spotify PKCE ──────────────────────────────────────────────────────
  var SPOTIFY_CLIENT_ID=''; // user fills in via prompt if empty
  var SPOTIFY_SCOPES='user-read-playback-state user-modify-playback-state user-read-currently-playing';
  var SPOTIFY_REDIRECT=window.location.origin+window.location.pathname;
  var _spToken=null,_spRefresh=null,_spPollTimer=null;

  function _spChallenge(verifier){
    return crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))
      .then(function(buf){
        return btoa(String.fromCharCode.apply(null,new Uint8Array(buf)))
          .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
      });
  }
  function _spRandom(len){
    var arr=new Uint8Array(len);crypto.getRandomValues(arr);
    return btoa(String.fromCharCode.apply(null,arr)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'').slice(0,len);
  }

  function _spConnect(){
    var cid=localStorage.getItem('ss_spotify_cid')||SPOTIFY_CLIENT_ID;
    if(!cid){
      cid=prompt('Enter your Spotify App Client ID (get one free at developer.spotify.com):');
      if(!cid)return;
      localStorage.setItem('ss_spotify_cid',cid.trim());
    }
    var verifier=_spRandom(64);
    localStorage.setItem('ss_sp_verifier',verifier);
    _spChallenge(verifier).then(function(challenge){
      var params=new URLSearchParams({
        response_type:'code',client_id:cid,scope:SPOTIFY_SCOPES,
        redirect_uri:SPOTIFY_REDIRECT,code_challenge_method:'S256',
        code_challenge:challenge,state:'spotify_pkce'
      });
      window.location.href='https://accounts.spotify.com/authorize?'+params.toString();
    });
  }

  function _spExchangeCode(code,cid){
    var verifier=localStorage.getItem('ss_sp_verifier')||'';
    fetch('https://accounts.spotify.com/api/token',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'authorization_code',code:code,redirect_uri:SPOTIFY_REDIRECT,client_id:cid,code_verifier:verifier})
    }).then(function(r){return r.json();}).then(function(d){
      if(d.access_token){
        _spToken=d.access_token;
        localStorage.setItem('ss_sp_token',_spToken);
        if(d.refresh_token){_spRefresh=d.refresh_token;localStorage.setItem('ss_sp_refresh',_spRefresh);}
        localStorage.removeItem('ss_sp_verifier');
        // Clean URL
        history.replaceState(null,'',window.location.pathname);
        _spUpdateUI(true);
        _spPollPlayback();
      }
    }).catch(function(e){console.error('Spotify token exchange failed',e);});
  }

  function _spApi(path,method,body){
    if(!_spToken)return Promise.reject('no token');
    return fetch('https://api.spotify.com/v1/'+path,{
      method:method||'GET',
      headers:{'Authorization':'Bearer '+_spToken,'Content-Type':'application/json'},
      body:body?JSON.stringify(body):undefined
    }).then(function(r){
      if(r.status===401){_spToken=null;localStorage.removeItem('ss_sp_token');_spUpdateUI(false);return null;}
      if(r.status===204||r.status===202)return null;
      return r.json();
    });
  }

  function _spPollPlayback(){
    clearInterval(_spPollTimer);
    _spPollTimer=setInterval(function(){
      _spApi('me/player/currently-playing').then(function(d){
        if(!d||!d.item)return;
        var name=document.getElementById('spotifyTrackName');
        var artist=document.getElementById('spotifyArtist');
        var thumb=document.getElementById('spotifyThumb');
        var ppBtn=document.getElementById('spotifyPlayPause');
        if(name)name.textContent=d.item.name||'—';
        if(artist)artist.textContent=(d.item.artists||[]).map(function(a){return a.name;}).join(', ')||'—';
        if(thumb&&d.item.album&&d.item.album.images&&d.item.album.images[0])thumb.src=d.item.album.images[0].url;
        if(ppBtn)ppBtn.textContent=d.is_playing?'⏸':'▶';
      });
    },5000);
    // Fire immediately
    _spApi('me/player/currently-playing').then(function(d){
      if(!d||!d.item)return;
      var name=document.getElementById('spotifyTrackName');
      var artist=document.getElementById('spotifyArtist');
      var thumb=document.getElementById('spotifyThumb');
      if(name)name.textContent=d.item.name||'—';
      if(artist)artist.textContent=(d.item.artists||[]).map(function(a){return a.name;}).join(', ')||'—';
      if(thumb&&d.item.album&&d.item.album.images&&d.item.album.images[0])thumb.src=d.item.album.images[0].url;
    });
  }

  function _spUpdateUI(connected){
    var statusEl=document.getElementById('spotifyStatus');
    var btn=document.getElementById('spotifyConnectBtn');
    var player=document.getElementById('spotifyPlayer');
    if(statusEl)statusEl.textContent=connected?'Connected ✓':'Not connected';
    if(statusEl)statusEl.className='music-service-status'+(connected?' connected':'');
    if(btn){btn.textContent=connected?'Reconnect':'Connect';btn.className='music-connect-btn'+(connected?' connected':'');}
    if(player)player.style.display=connected?'flex':'none';
  }

  function _spDisconnect(){
    clearInterval(_spPollTimer);
    _spToken=null;_spRefresh=null;
    localStorage.removeItem('ss_sp_token');localStorage.removeItem('ss_sp_refresh');localStorage.removeItem('ss_spotify_cid');
    _spUpdateUI(false);
  }

  // ── YouTube Playlists (multi) — stored in Supabase settings.yt_playlists ──
  var _ytPlaylistsCache=null; // populated by applySettings on login

  function _ytGetPlaylists(){
    if(_ytPlaylistsCache)return _ytPlaylistsCache;
    // Fallback to localStorage (offline / not yet loaded)
    try{return JSON.parse(localStorage.getItem('ss_yt_playlists')||'[]');}catch(e){return [];}
  }

  async function _ytSavePlaylists(arr){
    _ytPlaylistsCache=arr;
    localStorage.setItem('ss_yt_playlists',JSON.stringify(arr));
    var uid=_currentUser&&(_currentUser.id||_currentUser.sub);
    if(!uid){console.warn('[Playlists] No user id — saved locally only');return;}
    try{
      var result=await _sb.from('settings').upsert({id:uid,yt_playlists:arr,updated_at:new Date().toISOString()});
      if(result&&result.error){
        console.error('[Playlists] DB save error:',JSON.stringify(result.error));
        showToast('Playlist save failed',result.error.message||'Check console for details');
      }
    }catch(e){
      console.error('[Playlists] DB save exception:',e);
      showToast('Playlist save failed','Network error — saved locally only');
    }
  }

  // Called by applySettings when user logs in
  window._ytApplyFromDB=function(playlists){
    if(!Array.isArray(playlists))return;
    _ytPlaylistsCache=playlists;
    localStorage.setItem('ss_yt_playlists',JSON.stringify(playlists));
    _ytRenderList();
    _ytRenderSelect();
  };

  function _ytExtractId(url){
    var m=url.match(/[?&]list=([^&]+)/);
    return m?m[1]:null;
  }

  function _ytRenderList(){
    var list=document.getElementById('ytPlaylistList');
    if(!list)return;
    var playlists=_ytGetPlaylists();
    list.innerHTML='';
    playlists.forEach(function(pl,i){
      var row=document.createElement('div');row.className='yt-pl-item';
      row.innerHTML=
        '<div><div class="yt-pl-name">'+pl.name+'</div>'+
        '<div class="yt-pl-id">'+pl.id.slice(0,20)+'…</div></div>'+
        '<button class="yt-pl-remove" data-idx="'+i+'" title="Remove">✕</button>';
      list.appendChild(row);
    });
    // Status
    var st=document.getElementById('youtubeStatus');
    if(st){
      if(playlists.length){st.textContent=playlists.length+' playlist'+(playlists.length>1?'s':'')+' saved';st.className='music-service-status connected';}
      else{st.textContent='No playlists saved';st.className='music-service-status';}
    }
    // Sync study popup select
    _ytRenderSelect();
  }

  function _ytRenderSelect(){
    var sel=document.getElementById('stPlaylistSelect');
    if(!sel)return;
    var playlists=_ytGetPlaylists();
    var prev=sel.value;
    sel.innerHTML='';
    playlists.forEach(function(pl){
      var opt=document.createElement('option');opt.value=pl.id;opt.textContent=pl.name;sel.appendChild(opt);
    });
    if(prev)sel.value=prev;
  }

  function _ytAdd(){
    var nameEl=document.getElementById('ytPlaylistName');
    var urlEl=document.getElementById('ytPlaylistUrl');
    if(!nameEl||!urlEl)return;
    var name=nameEl.value.trim()||'Playlist';
    var id=_ytExtractId(urlEl.value.trim());
    if(!id){showToast('Invalid URL','Paste a YouTube playlist URL with ?list=...');return;}
    var playlists=_ytGetPlaylists();
    if(playlists.find(function(p){return p.id===id;})){showToast('Already saved','This playlist is already in your list');return;}
    playlists.push({name:name,id:id});
    _ytSavePlaylists(playlists);
    nameEl.value='';urlEl.value='';
    _ytRenderList();
    showToast('Playlist added','Saved: '+name);
  }

  function _ytRemove(idx){
    var playlists=_ytGetPlaylists();
    playlists.splice(idx,1);
    _ytSavePlaylists(playlists);
    _ytRenderList();
  }

  // ── Init: check for stored tokens / OAuth callback ─────────────────────
  window.addEventListener('ss-ready',function(){
    // Apply user type UI — DB profile (via applyProfile) will override this shortly
    // Use per-user key if we already know the user ID, else legacy key
    var _earlyUid = (_currentUser && _currentUser.id) || '';
    if (_earlyUid) {
      var _earlyType = localStorage.getItem('ss_user_type_' + _earlyUid);
      if (_earlyType) {
        window._userType    = _earlyType;
        window._germanTest  = localStorage.getItem('ss_german_test_'  + _earlyUid) || '';
        window._germanLevel = localStorage.getItem('ss_german_level_' + _earlyUid) || '';
      }
    }
    _applyUserTypeUI();

    // Spotify: check stored token
    var storedToken=localStorage.getItem('ss_sp_token');
    if(storedToken){_spToken=storedToken;_spRefresh=localStorage.getItem('ss_sp_refresh');_spUpdateUI(true);_spPollPlayback();}

    // Spotify: handle OAuth redirect
    var params=new URLSearchParams(window.location.search);
    if(params.get('state')==='spotify_pkce'&&params.get('code')){
      var cid=localStorage.getItem('ss_spotify_cid')||SPOTIFY_CLIENT_ID;
      if(cid)_spExchangeCode(params.get('code'),cid);
    }

    // YouTube: render saved playlists
    _ytRenderList();

    // Wire buttons
    var spBtn=document.getElementById('spotifyConnectBtn');
    if(spBtn)spBtn.addEventListener('click',_spConnect);
    var spDisc=document.getElementById('spotifyDisconnect');
    if(spDisc)spDisc.addEventListener('click',_spDisconnect);
    var spPrev=document.getElementById('spotifyPrev');
    if(spPrev)spPrev.addEventListener('click',function(){_spApi('me/player/previous','POST');setTimeout(_spPollPlayback,500);});
    var spNext=document.getElementById('spotifyNext');
    if(spNext)spNext.addEventListener('click',function(){_spApi('me/player/next','POST');setTimeout(_spPollPlayback,500);});
    var spPP=document.getElementById('spotifyPlayPause');
    if(spPP)spPP.addEventListener('click',function(){
      _spApi('me/player').then(function(d){
        if(d&&d.is_playing)_spApi('me/player/pause','PUT');
        else _spApi('me/player/play','PUT');
        setTimeout(_spPollPlayback,600);
      });
    });
    var ytAdd=document.getElementById('ytSaveBtn');
    if(ytAdd)ytAdd.addEventListener('click',_ytAdd);
    // Remove playlist via delegation
    var ytList=document.getElementById('ytPlaylistList');
    if(ytList)ytList.addEventListener('click',function(e){
      var btn=e.target.closest('.yt-pl-remove');
      if(btn)_ytRemove(parseInt(btn.dataset.idx));
    });
  });

  // Expose so study timer can read the selected playlist
  window._getMusicPlaylistId=function(){
    var sel=document.getElementById('stPlaylistSelect');
    if(sel&&sel.value)return sel.value;
    var playlists=_ytGetPlaylists();
    return playlists.length?playlists[0].id:null;
  };
  window._ytRenderSelect=_ytRenderSelect;
  // Switch playlist immediately when user picks from dropdown
  document.addEventListener('change',function(e){
    if(e.target.id==='stPlaylistSelect'&&_stRunning&&_stMusicSrc==='youtube'){
      _stPlayMusic();
    }
  });
  window._spIsConnected=function(){return !!_spToken;};
  window._spPlayResume=function(){_spApi('me/player/play','PUT').catch(function(){});setTimeout(_spPollPlayback,800);};
})();

// ── Study Techniques ──────────────────────────────────────────────────────
var _stRunning=false;
var _stTimer=null;
var _stSecondsLeft=0;
var _stPhase='focus'; // 'focus' | 'short' | 'long'
var _stCycle=0;
var _stSettings={focus:25,shortBreak:5,longBreak:15,cycles:4};
var _stTech='pomodoro';
var _stMusicEnabled=true;
var _stMusicMuted=false;
var _stYT=null; // YouTube iframe player
var _stMusicSrc='lofi'; // 'lofi' | 'youtube' | 'spotify' | 'none'

var _stPresets={
  pomodoro:{focus:25,shortBreak:5,longBreak:15,cycles:4},
  '5217':{focus:52,shortBreak:17,longBreak:30,cycles:3},
  '9020':{focus:90,shortBreak:20,longBreak:30,cycles:2},
  custom:null
};

function _stFmt(s){var m=Math.floor(s/60),sec=s%60;return(m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;}

function _stLockGames(lock){
  var g=document.getElementById('psbGames');
  if(!g)return;
  if(lock)g.classList.add('st-locked');
  else g.classList.remove('st-locked');
}

var _ytPlayer=null;
var _ytPlayerReady=false;
var _ytPendingList=null;
var _ytProgressInterval=null;

function _stEnsureYTApi(cb){
  if(window.YT&&window.YT.Player){cb();return;}
  // Queue callback — handle multiple callers before API loads
  if(!window._ytCallbacks) window._ytCallbacks=[];
  window._ytCallbacks.push(cb);
  if(document.getElementById('ytApiScript'))return; // already loading
  var prevReady=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=function(){
    if(prevReady)prevReady();
    var cbs=window._ytCallbacks||[];
    window._ytCallbacks=[];
    cbs.forEach(function(f){try{f();}catch(e){}});
  };
  var tag=document.createElement('script');
  tag.id='ytApiScript';
  tag.src='https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

function _stCreatePlayer(customList){
  var old=document.getElementById('stYTHolder');
  if(old)old.remove();
  _ytPlayer=null;
  _ytPlayerReady=false;

  // Floating music card — must stay IN the viewport or browser suspends the iframe
  var holder=document.createElement('div');
  holder.id='stYTHolder';
  holder.innerHTML=
    // Hidden YT iframe (1×1px keeps browser from suspending it)
    '<div id="stYTDiv" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden"></div>'+
    // Expanded card (hidden until player ready)
    '<div id="stMusicCard" class="st-music-card" style="display:none">'+
      '<div class="smc-header">'+
        '<button class="smc-btn smc-close" id="smcClose" title="Close">&#x2715;</button>'+
        '<div class="smc-art">&#x266B;</div>'+
        '<button class="smc-btn smc-min" id="smcMinimise" title="Minimise">&#x2012;</button>'+
      '</div>'+
      '<div class="smc-track">'+
        '<div class="smc-title" id="smcTitle">Study Music</div>'+
        '<div class="smc-artist" id="smcArtist"></div>'+
      '</div>'+
      '<div class="smc-progress-wrap">'+
        '<input type="range" id="smcProgress" class="smc-progress-range" min="0" max="100" value="0" step="0.1">'+
        '<div class="smc-time-row"><span id="smcCurrent">0:00</span><span id="smcDuration">0:00</span></div>'+
      '</div>'+
      '<div class="smc-controls">'+
        '<button class="smc-ctrl" id="stMiniPrev" title="Previous">&#x23EE;</button>'+
        '<button class="smc-ctrl smc-play" id="stMiniPlayPause" title="Play/Pause">&#x25B6;</button>'+
        '<button class="smc-ctrl" id="stMiniNext" title="Next">&#x23ED;</button>'+
      '</div>'+
    '</div>'+
    // Collapsed pill (left edge)
    '<button class="st-music-pill" id="stMusicPill" title="Show music player" style="display:none">&#x266B;</button>';
  document.body.appendChild(holder);

  // Inject keyframes once
  if(!document.getElementById('stBarKf')){
    var s=document.createElement('style');s.id='stBarKf';
    s.textContent=
      '@keyframes smcIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}'+
      '@keyframes smcOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(12px)}}';
    document.head.appendChild(s);
  }

  // Card close → stop music entirely
  document.getElementById('smcClose').addEventListener('click',function(){
    _stStopMusic();
  });
  // Minimise → collapse to pill
  document.getElementById('smcMinimise').addEventListener('click',function(){
    document.getElementById('stMusicCard').style.display='none';
    document.getElementById('stMusicPill').style.display='flex';
  });
  // Pill click → expand card
  document.getElementById('stMusicPill').addEventListener('click',function(){
    document.getElementById('stMusicPill').style.display='none';
    document.getElementById('stMusicCard').style.display='flex';
  });
  // Seek on range input
  var _smcSeeking=false;
  document.getElementById('smcProgress').addEventListener('mousedown',function(){_smcSeeking=true;});
  document.getElementById('smcProgress').addEventListener('touchstart',function(){_smcSeeking=true;},{passive:true});
  document.getElementById('smcProgress').addEventListener('change',function(){
    _smcSeeking=false;
    try{
      var dur=_ytPlayer.getDuration();
      if(dur>0)_ytPlayer.seekTo(dur*(this.value/100),true);
    }catch(e){}
  });

  var playerVars={autoplay:1,controls:0,modestbranding:1,rel:0,fs:0};
  var playerCfg={height:'36',width:'1',playerVars:playerVars};
  if(customList){playerVars.listType='playlist';playerVars.list=customList;}
  else{playerVars.loop=1;playerVars.playlist='jfKfPfyJRdk';playerCfg.videoId='jfKfPfyJRdk';}

  playerCfg.events={
    onReady:function(e){
      _ytPlayerReady=true;
      e.target.setVolume(70);
      if(_ytPendingList){
        e.target.loadPlaylist({listType:'playlist',list:_ytPendingList});
        _ytPendingList=null;
      } else {
        e.target.playVideo();
      }
      _stShowMusicControls(true);
      // Start progress polling
      if(_ytProgressInterval)clearInterval(_ytProgressInterval);
      _ytProgressInterval=setInterval(function(){
        if(!_ytPlayer||_smcSeeking)return;
        try{
          var cur=_ytPlayer.getCurrentTime()||0;
          var dur=_ytPlayer.getDuration()||0;
          var range=document.getElementById('smcProgress');
          var curEl=document.getElementById('smcCurrent');
          var durEl=document.getElementById('smcDuration');
          if(range&&dur>0)range.value=(cur/dur)*100;
          function fmt(s){s=Math.floor(s);return Math.floor(s/60)+':'+(s%60<10?'0':'')+(s%60);}
          if(curEl)curEl.textContent=fmt(cur);
          if(durEl)durEl.textContent=fmt(dur);
          // Update CSS fill
          if(range&&dur>0)range.style.setProperty('--pct',((cur/dur)*100)+'%');
        }catch(er){}
      },1000);
    },
    onStateChange:function(e){
      var ppBtn=document.getElementById('stMiniPlayPause');
      if(ppBtn)ppBtn.innerHTML=(e.data===1)?'&#x23F8;':'&#x25B6;';
      // Update track info when playing
      if(e.data===1){
        try{
          var vd=e.target.getVideoData();
          var t=document.getElementById('smcTitle');
          var a=document.getElementById('smcArtist');
          if(t&&vd.title)t.textContent=vd.title;
          if(a&&vd.author)a.textContent=vd.author;
        }catch(er){}
      }
      // state 0 = ended
      if(e.data===0){
        try{
          if(customList)e.target.nextVideo();
          else e.target.playVideo();
        }catch(err){}
      }
    },
    onError:function(e){
      // Any error (101/150=embedding blocked, 2=invalid id) → skip to next
      setTimeout(function(){try{e.target.nextVideo();}catch(err){}},500);
    }
  };
  _ytPlayer=new YT.Player('stYTDiv',playerCfg);
}

function _stPlayMusic(){
  if(!_stMusicEnabled||_stMusicMuted)return;
  if(_stMusicSrc==='none')return;
  if(_stMusicSrc==='spotify'){
    if(window._spIsConnected&&window._spIsConnected()){
      showToast('Spotify','Resuming your Spotify playback');
      if(window._spPlayResume)window._spPlayResume();
    } else {
      showToast('Spotify not connected','Connect Spotify in Settings → Music Services');
    }
    return;
  }
  var customList=(_stMusicSrc==='youtube'&&window._getMusicPlaylistId)?window._getMusicPlaylistId():null;

  // If player already exists and is ready, switch playlist without destroying it
  if(_ytPlayer&&_ytPlayerReady){
    try{
      if(customList){
        _ytPlayer.loadPlaylist({listType:'playlist',list:customList});
      } else {
        _ytPlayer.loadVideoById('jfKfPfyJRdk');
      }
      _ytPlayer.setVolume(70);
      _stShowMusicControls(true);
      return;
    }catch(e){
      // Player broken — fall through to recreate
      _stStopMusic();
    }
  }
  // Player exists but not ready yet — store pending list, onReady will apply it
  if(_ytPlayer&&!_ytPlayerReady){
    _ytPendingList=customList;
    return;
  }
  _ytPendingList=customList;
  _stEnsureYTApi(function(){_stCreatePlayer(customList);});
}

function _stStopMusic(){
  _stShowMusicControls(false);
  if(_ytProgressInterval){clearInterval(_ytProgressInterval);_ytProgressInterval=null;}
  if(_ytPlayer){try{_ytPlayer.stopVideo();_ytPlayer.destroy();}catch(e){}_ytPlayer=null;_ytPlayerReady=false;_ytPendingList=null;}
  var holder=document.getElementById('stYTHolder');
  if(holder)holder.remove();
}

function _stShowMusicControls(show){
  var holder=document.getElementById('stYTHolder');
  if(!holder)return;
  if(show){
    var pill=document.getElementById('stMusicPill');
    var card=document.getElementById('stMusicCard');
    // If already collapsed to pill, keep it that way; otherwise show card
    if(pill&&pill.style.display==='flex'){/* already collapsed, leave it */}
    else if(card){card.style.display='flex';}
  } else {
    // Hide everything
    var card2=document.getElementById('stMusicCard');
    var pill2=document.getElementById('stMusicPill');
    if(card2)card2.style.display='none';
    if(pill2)pill2.style.display='none';
  }
}

function _stToggleMusic(){
  _stMusicMuted=!_stMusicMuted;
  if(_stMusicMuted){
    try{if(_ytPlayer)_ytPlayer.pauseVideo();}catch(e){}
    _stShowMusicControls(false);
  } else {
    _stPlayMusic();
  }
}

function _stUpdateMini(){
  var t=document.getElementById('stMiniTime');
  var l=document.getElementById('stMiniLabel');
  if(t) t.textContent=_stFmt(_stSecondsLeft);
  if(l) l.textContent=_stPhase==='focus'?'Focus':_stPhase==='short'?'Short break':'Long break';
}

function _stShowDonePopup(isBreakEnd){
  clearInterval(_stTimer);
  var mini=document.getElementById('stMiniTimer');
  if(mini) mini.style.display='none';
  var btn=document.getElementById('studyTechBtn');
  if(btn) btn.style.display='none';

  var existing=document.getElementById('stDoneOverlay');
  if(existing) existing.remove();

  var nextBreakMin=(_stCycle+1>=_stSettings.cycles)?_stSettings.longBreak:_stSettings.shortBreak;
  var title=isBreakEnd?'Break over — ready to focus again?':'You\'ve done it! 🎉';
  var sub=isBreakEnd
    ?'Your break has ended. Start another focus session whenever you\'re ready.'
    :'Great work! Take a '+((_stCycle+1>=_stSettings.cycles)?_stSettings.longBreak+' min long break':_stSettings.shortBreak+' min short break')+'. Play some games, stretch, or just relax.';
  var breakLabel=isBreakEnd?'Start Focus':'Take a Break ('+((_stCycle+1>=_stSettings.cycles)?_stSettings.longBreak:_stSettings.shortBreak)+' min)';

  var el=document.createElement('div');
  el.id='stDoneOverlay';
  el.innerHTML=
    '<div class="st-done-popup" id="stDonePopup">'+
      '<div class="st-done-emoji">'+(isBreakEnd?'⏰':'🎉')+'</div>'+
      '<div class="st-done-title">'+title+'</div>'+
      '<div class="st-done-sub">'+sub+'</div>'+
      '<div class="st-done-actions">'+
        '<button class="st-done-btn st-done-primary" id="stDoneBreak">'+breakLabel+'</button>'+
        '<button class="st-done-btn st-done-secondary" id="stDoneRestart">Start Again</button>'+
      '</div>'+
    '</div>';
  el.style.cssText='position:fixed;inset:0;z-index:4100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(4px)';
  document.body.appendChild(el);

  document.getElementById('stDoneBreak').onclick=function(){
    el.remove();
    if(isBreakEnd){
      _stPhase='focus';_stSecondsLeft=_stSettings.focus*60;
      _stLockGames(true);_stPlayMusic();
    } else {
      _stCycle++;
      if(_stCycle>=_stSettings.cycles){_stPhase='long';_stSecondsLeft=_stSettings.longBreak*60;_stCycle=0;}
      else{_stPhase='short';_stSecondsLeft=_stSettings.shortBreak*60;}
      _stLockGames(false);_stStopMusic();
    }
    var m=document.getElementById('stMiniTimer');if(m)m.style.display='flex';
    _stUpdateMini();_stStartTimer();
  };
  document.getElementById('stDoneRestart').onclick=function(){
    el.remove();
    _stPhase='focus';_stCycle=0;_stSecondsLeft=_stSettings.focus*60;
    _stLockGames(true);_stPlayMusic();
    var m=document.getElementById('stMiniTimer');if(m)m.style.display='flex';
    _stUpdateMini();_stStartTimer();
  };
}

function _stNextPhase(){
  clearInterval(_stTimer);
  var wasBreak=(_stPhase!=='focus');
  _stShowDonePopup(wasBreak);
}

function _stStartTimer(){
  clearInterval(_stTimer);
  _stTimer=setInterval(function(){
    _stSecondsLeft--;
    _stUpdateMini();
    if(_stSecondsLeft<=0) _stNextPhase();
  },1000);
}

function _stStop(){
  clearInterval(_stTimer);
  _stRunning=false;
  _stPhase='focus';_stCycle=0;_stMusicMuted=false;
  _stStopMusic();
  _stLockGames(false);
  var mini=document.getElementById('stMiniTimer');
  if(mini) mini.style.display='none';
}

(function(){
  document.addEventListener('click',function(e){
    var btn=document.getElementById('studyTechBtn');
    var overlay=document.getElementById('stOverlay');
    var popup=document.getElementById('stPopup');
    if(!btn||!overlay||!popup) return;

    // Open popup (works whether timer is running or not)
    if(e.target.closest('#studyTechBtn')){
      overlay.style.display='block';
      popup.classList.remove('shrinking');
      popup.style.transform='';popup.style.opacity='';
      var startBtn=document.getElementById('stStart');
      if(startBtn)startBtn.textContent=_stRunning?'▶ Apply & Restart':'▶ Start';
      // Always refresh playlist dropdown
      if(window._ytRenderSelect)window._ytRenderSelect();
      var sel=document.getElementById('stPlaylistSelector');
      if(sel)sel.style.display=(_stMusicSrc==='youtube')?'block':'none';
      return;
    }

    // Music source card
    var srcCard=e.target.closest('.st-music-src');
    if(srcCard){
      document.querySelectorAll('.st-music-src').forEach(function(c){c.classList.remove('active');});
      srcCard.classList.add('active');
      _stMusicSrc=srcCard.dataset.src;
      var hints={lofi:'Lofi Girl radio — always available',youtube:'Choose a saved playlist below',spotify:'Controls your Spotify playback',none:'No music during session'};
      var hint=document.getElementById('stMusicHint');
      if(hint)hint.textContent=hints[_stMusicSrc]||'';
      var sel=document.getElementById('stPlaylistSelector');
      if(sel){
        sel.style.display=(_stMusicSrc==='youtube')?'block':'none';
        if(_stMusicSrc==='youtube')_ytRenderSelect&&_ytRenderSelect();
      }
      // Apply immediately if running
      if(_stRunning){
        _stStopMusic();
        if(_stMusicSrc!=='none'&&_stPhase==='focus')_stPlayMusic();
      }
      return;
    }

    // Close popup
    if(e.target.closest('#stClose')||(!e.target.closest('#stPopup')&&overlay.style.display==='block')){
      overlay.style.display='none';
      return;
    }

    // Technique card
    var card=e.target.closest('.st-tech-card');
    if(card){
      document.querySelectorAll('.st-tech-card').forEach(function(c){c.classList.remove('active');});
      card.classList.add('active');
      _stTech=card.dataset.tech;
      var preset=_stPresets[_stTech];
      if(preset){
        _stSettings=Object.assign({},preset);
        var fv=document.getElementById('stFocusVal');if(fv)fv.textContent=_stSettings.focus;
        var sv=document.getElementById('stShortVal');if(sv)sv.textContent=_stSettings.shortBreak;
        var lv=document.getElementById('stLongVal');if(lv)lv.textContent=_stSettings.longBreak;
        var cv=document.getElementById('stCyclesVal');if(cv)cv.textContent=_stSettings.cycles;
      }
      return;
    }

    // Stepper buttons
    var stepBtn=e.target.closest('.st-step-btn');
    if(stepBtn){
      var field=stepBtn.dataset.field;
      var dir=parseInt(stepBtn.dataset.dir);
      var min={focus:1,shortBreak:1,longBreak:1,cycles:1};
      var max={focus:180,shortBreak:60,longBreak:60,cycles:10};
      _stSettings[field]=Math.min(max[field],Math.max(min[field],(_stSettings[field]||1)+dir));
      var ids={focus:'stFocusVal',shortBreak:'stShortVal',longBreak:'stLongVal',cycles:'stCyclesVal'};
      var el=document.getElementById(ids[field]);if(el)el.textContent=_stSettings[field];
      return;
    }

    // Start button
    if(e.target.closest('#stStart')){
      clearInterval(_stTimer);
      _stStopMusic();
      _stRunning=true;
      _stPhase='focus';
      _stCycle=0;
      _stSecondsLeft=_stSettings.focus*60;
      _stMusicMuted=false;
      _stMusicEnabled=(_stMusicSrc!=='none');

      popup.classList.add('shrinking');
      setTimeout(function(){
        overlay.style.display='none';
        popup.classList.remove('shrinking');
        var mini=document.getElementById('stMiniTimer');
        if(mini)mini.style.display='flex';
        _stUpdateMini();
        _stStartTimer();
        _stLockGames(true);
        if(_stMusicEnabled)_stPlayMusic();
      },350);
      return;
    }

    // Mini music controls
    if(e.target.closest('#stMiniPrev')){
      try{if(_ytPlayer)_ytPlayer.previousVideo();}catch(e2){}
      return;
    }
    if(e.target.closest('#stMiniNext')){
      try{if(_ytPlayer)_ytPlayer.nextVideo();}catch(e2){}
      return;
    }
    if(e.target.closest('#stMiniPlayPause')){
      try{
        if(_ytPlayer){
          var state=_ytPlayer.getPlayerState();
          if(state===YT.PlayerState.PLAYING)_ytPlayer.pauseVideo();
          else _ytPlayer.playVideo();
        }
      }catch(e2){}
      return;
    }

    // Mini timer stop
    if(e.target.closest('#stMiniStop')){
      _stStop();
      return;
    }
  });
})();
