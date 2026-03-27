// ── StudySphere Lecture Assistant — Content Script ────────────────────────
(function () {
  if (window.__studySphereInjected) return;
  window.__studySphereInjected = true;

  const BACKEND = 'https://studysphere-backend-production.up.railway.app';

  // ── State ──────────────────────────────────────────────────────────────
  let transcript      = [];
  let isCapturing     = false;
  let captureInterval = null;
  let lastCapture     = '';
  let videoTitle      = '';
  let mediaRecorder   = null;
  let audioChunks     = [];
  let isRecordingAudio = false;

  const isYouTube  = location.hostname.includes('youtube.com');
  const isOpencast = location.hostname.includes('opencast');
  const isZoom     = location.hostname.includes('zoom.us');

  // ── Panel ──────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'ss-panel';
  panel.innerHTML = `
    <div id="ss-header">
      <span id="ss-logo">📚 StudySphere</span>
      <div id="ss-controls">
        <button id="ss-toggle-capture" title="Start capturing">⏺</button>
        <button id="ss-summarize" title="Summarize lecture">✨</button>
        <button id="ss-minimize" title="Minimize">−</button>
        <button id="ss-close" title="Close panel">✕</button>
      </div>
    </div>
    <div id="ss-body">
      <div id="ss-mode-bar">
        <span id="ss-mode-label">Mode: Auto-detect</span>
        <span id="ss-mode-indicator"></span>
      </div>
      <div id="ss-status">Move to a lecture video and press ⏺ to start</div>
      <div id="ss-transcript-count"></div>
      <div id="ss-result"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // ── Drag ───────────────────────────────────────────────────────────────
  let dragging = false, dragX = 0, dragY = 0;
  panel.querySelector('#ss-header').addEventListener('mousedown', e => {
    if (e.target.tagName === 'BUTTON') return;
    dragging = true; dragX = e.clientX - panel.offsetLeft; dragY = e.clientY - panel.offsetTop;
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    panel.style.left = (e.clientX - dragX) + 'px';
    panel.style.top  = (e.clientY - dragY) + 'px';
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => dragging = false);

  // ── Minimize ───────────────────────────────────────────────────────────
  const minimizeBtn = panel.querySelector('#ss-minimize');
  const body = panel.querySelector('#ss-body');
  minimizeBtn.addEventListener('click', () => {
    const hidden = body.style.display === 'none';
    body.style.display = hidden ? 'block' : 'none';
    minimizeBtn.textContent = hidden ? '−' : '+';
  });

  // Close button — hides panel, click extension icon to reopen
  panel.querySelector('#ss-close').addEventListener('click', () => {
    panel.style.display = 'none';
    chrome.storage.local.set({ panelHidden: true });
  });

  // Restore panel if previously hidden
  chrome.storage.local.get('panelHidden', ({ panelHidden }) => {
    if (panelHidden) panel.style.display = 'none';
  });

  const captureBtn = panel.querySelector('#ss-toggle-capture');
  const statusEl   = panel.querySelector('#ss-status');
  const countEl    = panel.querySelector('#ss-transcript-count');
  const resultEl   = panel.querySelector('#ss-result');
  const modeLabel  = panel.querySelector('#ss-mode-label');
  const modeIndicator = panel.querySelector('#ss-mode-indicator');

  captureBtn.addEventListener('click', () => {
    if (!isCapturing) startCapture(); else stopCapture();
  });
  panel.querySelector('#ss-summarize').addEventListener('click', summarize);

  // ── Start capture — picks best available method ─────────────────────────
  async function startCapture() {
    isCapturing = true;
    captureBtn.textContent = '⏹';
    transcript = []; audioChunks = [];
    videoTitle = getVideoTitle();

    // Priority 1: YouTube hidden transcript (instant, best quality)
    if (isYouTube) {
      setStatus('📡 Fetching YouTube transcript…', 'loading');
      const ytT = await fetchYouTubeTranscript();
      if (ytT && ytT.length > 10) {
        transcript = ytT;
        setMode('📄 YouTube transcript', '#06D6A0');
        setStatus(`✅ Got ${ytT.length} transcript entries. Press ✨ to summarize!`, 'done');
        countEl.textContent = `📝 ${ytT.length} entries`;
        isCapturing = false;
        captureBtn.textContent = '⏺';
        return;
      }
    }

    // Priority 2: Live subtitle capture (if subtitles enabled)
    const hasSubs = hasSubtitles();
    if (hasSubs) {
      setMode('💬 Live subtitles', '#4CC9F0');
      setStatus('🔴 Capturing live subtitles…', 'capturing');
      captureInterval = setInterval(captureSubtitle, 800);
      return;
    }

    // Priority 3: Audio capture via tab (no subtitles available)
    setMode('🎙 Audio transcription', '#FF6B35');
    setStatus('🎙 Starting audio capture…', 'loading');
    const audioOk = await startAudioCapture();
    if (!audioOk) {
      // Fallback to subtitle polling anyway
      setMode('💬 Subtitle polling', '#FFD93D');
      setStatus('🔴 Listening for subtitles…', 'capturing');
      captureInterval = setInterval(captureSubtitle, 800);
    }
  }

  function stopCapture() {
    isCapturing = false;
    captureBtn.textContent = '⏺';
    if (captureInterval) { clearInterval(captureInterval); captureInterval = null; }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    setStatus(`✅ ${transcript.length} entries captured. Press ✨ to summarize.`, 'done');
  }

  // ── YouTube hidden transcript ──────────────────────────────────────────
  async function fetchYouTubeTranscript() {
    try {
      const videoId = new URLSearchParams(location.search).get('v');
      if (!videoId) return null;

      // Method 1: timedtext API (German first, then English)
      for (const lang of ['de', 'en', 'en-US', 'de-DE', '']) {
        try {
          const url = lang
            ? `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=json3`
            : `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3&kind=asr`;
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.events && data.events.length > 5) {
            return data.events
              .filter(e => e.segs)
              .map(e => ({
                t: msToTime(e.tStartMs),
                text: e.segs.map(s => s.utf8 || '').join('').trim()
              }))
              .filter(e => e.text.length > 1);
          }
        } catch (e) { continue; }
      }

      // Method 2: Extract from page source (YouTube embeds transcript data)
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        const txt = s.textContent;
        if (txt.includes('playerCaptionsTracklistRenderer')) {
          const match = txt.match(/"captionTracks":\s*(\[.*?\])/);
          if (match) {
            try {
              const tracks = JSON.parse(match[1]);
              if (tracks.length > 0) {
                const trackUrl = tracks[0].baseUrl + '&fmt=json3';
                const res = await fetch(trackUrl);
                const data = await res.json();
                if (data.events) {
                  return data.events
                    .filter(e => e.segs)
                    .map(e => ({
                      t: msToTime(e.tStartMs),
                      text: e.segs.map(s => s.utf8 || '').join('').trim()
                    }))
                    .filter(e => e.text.length > 1);
                }
              }
            } catch (e) { continue; }
          }
        }
      }
      return null;
    } catch (e) { return null; }
  }

  function msToTime(ms) {
    const s = Math.floor((ms || 0) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // ── Live subtitle capture ──────────────────────────────────────────────
  function hasSubtitles() {
    if (document.querySelector('.ytp-caption-segment')) return true;
    const videos = document.querySelectorAll('video');
    for (const v of videos) {
      for (let i = 0; i < v.textTracks.length; i++) {
        if (v.textTracks[i].mode !== 'disabled') return true;
      }
    }
    return false;
  }

  function captureSubtitle() {
    const text = getSubtitleText();
    if (text && text !== lastCapture && text.trim().length > 2) {
      lastCapture = text;
      const ts = getCurrentTime();
      transcript.push({ t: ts, text: text.trim() });
      countEl.textContent = `📝 ${transcript.length} captions`;
    }
  }

  function getSubtitleText() {
    let el = document.querySelector('.ytp-caption-segment');
    if (el) return el.innerText;
    el = document.querySelector('.caption-window span');
    if (el) return el.innerText;
    const videos = document.querySelectorAll('video');
    for (const v of videos) {
      for (let i = 0; i < v.textTracks.length; i++) {
        const track = v.textTracks[i];
        if (track.mode === 'showing' && track.activeCues && track.activeCues.length > 0) {
          return track.activeCues[0].text.replace(/<[^>]+>/g, '');
        }
      }
    }
    el = document.querySelector('.transcript-text, .caption-text, [class*="caption"]');
    if (el) return el.innerText;
    return '';
  }

  // ── Audio capture ──────────────────────────────────────────────────────
  async function startAudioCapture() {
    try {
      // Request tab audio via chrome.tabCapture (via background)
      const streamId = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getTabAudioStream' }, res => {
          if (res && res.streamId) resolve(res.streamId);
          else reject(new Error('No stream ID'));
        });
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId
          }
        },
        video: false
      });

      isRecordingAudio = true;
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.start(5000); // collect in 5s chunks

      setStatus('🎙 Recording audio — press ⏹ when done', 'capturing');
      countEl.textContent = '🎙 Audio recording in progress…';
      return true;
    } catch (e) {
      console.warn('Audio capture failed:', e.message);
      isRecordingAudio = false;
      return false;
    }
  }

  async function transcribeAudio() {
    if (audioChunks.length === 0) return null;
    setStatus('📡 Transcribing audio with Whisper…', 'loading');

    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', blob, 'lecture.webm');
    formData.append('title', videoTitle);

    try {
      const res = await fetch(`${BACKEND}/api/transcribe`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.text) {
        return data.text;
      }
      return null;
    } catch (e) {
      console.warn('Transcription failed:', e.message);
      return null;
    }
  }

  // ── Summarize ──────────────────────────────────────────────────────────
  async function summarize() {
    resultEl.innerHTML = '<div class="ss-loading"><span></span><span></span><span></span></div>';
    setStatus('🤖 Generating summary…', 'loading');

    let transcriptText = '';

    // If audio was recorded, transcribe it first
    if (isRecordingAudio || (audioChunks.length > 0)) {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      await new Promise(r => setTimeout(r, 500));
      const audioText = await transcribeAudio();
      if (audioText) {
        transcriptText = audioText;
        setMode('🎙 Audio transcribed', '#06D6A0');
      }
    }

    // Use subtitle transcript if no audio
    if (!transcriptText && transcript.length > 0) {
      transcriptText = transcript.map(e => `[${e.t}] ${e.text}`).join('\n');
    }

    // Last resort: try YouTube transcript now
    if (!transcriptText && isYouTube) {
      setStatus('📡 Fetching YouTube transcript…', 'loading');
      const ytT = await fetchYouTubeTranscript();
      if (ytT && ytT.length > 0) {
        transcriptText = ytT.map(e => `[${e.t}] ${e.text}`).join('\n');
      }
    }

    if (!transcriptText) {
      setStatus('⚠️ No transcript available. Enable subtitles or use audio capture.', 'error');
      resultEl.innerHTML = '';
      return;
    }

    const title = videoTitle || getVideoTitle();
    const capped = transcriptText.slice(0, 14000);

    try {
      const res = await fetch(`${BACKEND}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: 'You are StudySphere, an AI tutor for TU Braunschweig engineering students. Analyze the lecture transcript and produce a structured study summary. Use the same language as the transcript (German or English).',
          messages: [{
            role: 'user',
            content: `Lecture: "${title}"\n\nTranscript:\n${capped}\n\n---\nProvide:\n\n## 📝 Summary\nClear summary (6-10 sentences).\n\n## 🔑 Key Concepts\nBullet list of the most important concepts explained in detail.\n\n## 🔢 Formulas & Definitions\nAll formulas, equations or key definitions mentioned.\n\n## ❓ Quiz Questions\n5 questions with answers to test understanding.`
          }]
        })
      });

      const data = await res.json();
      if (data.error) {
        setStatus('❌ ' + (data.error.message || JSON.stringify(data.error)), 'error');
        resultEl.innerHTML = '';
        return;
      }

      const text = data.content ? data.content.map(b => b.text || '').join('') : 'No response';
      setStatus(`✅ Summary ready!`, 'done');
      resultEl.innerHTML = renderMarkdown(text);

      // Save to lastSummary (popup uses this)
      chrome.storage.local.set({ lastSummary: { title, text, date: new Date().toISOString() } });

      // ── Save to lecture history (website uses this) ──────────────────────
      chrome.storage.local.get('ss_lecture_summaries', ({ ss_lecture_summaries }) => {
        const summaries = ss_lecture_summaries || [];
        summaries.unshift({ title, text, date: new Date().toISOString(), url: location.href });
        if (summaries.length > 30) summaries.pop();
        chrome.storage.local.set({ ss_lecture_summaries: summaries });
      });

    } catch (e) {
      setStatus('❌ ' + e.message, 'error');
      resultEl.innerHTML = '';
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function getVideoTitle() {
    let el = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
    if (el) return el.innerText;
    el = document.querySelector('h1');
    if (el) return el.innerText.slice(0, 100);
    return document.title.slice(0, 100);
  }

  function getCurrentTime() {
    const v = document.querySelector('video');
    if (!v) return '0:00';
    const s = Math.floor(v.currentTime);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'ss-status-' + (type || '');
  }

  function setMode(label, color) {
    modeLabel.textContent = 'Mode: ' + label;
    modeIndicator.style.background = color;
  }

  function renderMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    text = text.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>');
    text = text.replace(/\n\n/g, '<br>');
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  // Auto-stop when video ends
  const video = document.querySelector('video');
  if (video) {
    video.addEventListener('ended', () => {
      if (isCapturing) { stopCapture(); setStatus('🎬 Video ended! Press ✨ to summarize.', 'done'); }
    });
  }

  // ── Message handler ────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    if (msg.action === 'ping')        { reply({ ok: true }); return true; }
    if (msg.action === 'showPanel')    { panel.style.display='block'; chrome.storage.local.set({panelHidden:false}); reply({ ok: true }); return true; }
    if (msg.action === 'getStatus')   { reply({ isCapturing, captureCount: transcript.length, title: videoTitle }); return true; }
    if (msg.action === 'summarize')   { summarize(); reply({ ok: true }); return true; }
    if (msg.action === 'startCapture'){ startCapture(); reply({ ok: true }); return true; }
    if (msg.action === 'stopCapture') { stopCapture(); reply({ ok: true }); return true; }
  });

  // ── Website postMessage bridge ─────────────────────────────────────────
  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'SS_REQUEST_SUMMARIES') {
      chrome.storage.local.get('ss_lecture_summaries', function({ ss_lecture_summaries }) {
        window.postMessage({ type: 'SS_SUMMARIES_DATA', summaries: ss_lecture_summaries || [] }, '*');
      });
    }
    if (e.data.type === 'SS_DELETE_SUMMARY') {
      chrome.storage.local.set({ ss_lecture_summaries: e.data.summaries || [] });
    }
  });

  // Also push summaries whenever a new one is saved (for live updates)
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.ss_lecture_summaries) {
      window.postMessage({
        type: 'SS_SUMMARIES_DATA',
        summaries: changes.ss_lecture_summaries.newValue || []
      }, '*');
    }
  });

})();
