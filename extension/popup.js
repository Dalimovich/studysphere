const LECTURE_PATTERNS = [
  /youtube\.com\/watch/,
  /opencast/,
  /zoom\.us\/rec/,
  /zoom\.us\/j\//
];

function isLecturePage(url) {
  return LECTURE_PATTERNS.some(p => p.test(url));
}

async function ensureContentScript(tabId) {
  try {
    // Try sending a ping first
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    return true;
  } catch (e) {
    // Content script not loaded — inject it now
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content.css']
      });
      // Wait a moment for it to initialise
      await new Promise(r => setTimeout(r, 600));
      return true;
    } catch (err) {
      console.error('Could not inject content script:', err);
      return false;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url || '';
  const lectureUI  = document.getElementById('lecture-ui');
  const notLecture = document.getElementById('not-lecture');
  const pageStatus = document.getElementById('page-status');
  const captStatus = document.getElementById('capture-status');
  const btnCapture = document.getElementById('btn-capture');
  const btnSumm    = document.getElementById('btn-summarize');
  const lastDiv    = document.getElementById('last-summary');
  const lastTitle  = document.getElementById('last-title');

  if (!isLecturePage(url)) {
    lectureUI.style.display  = 'none';
    notLecture.style.display = 'block';
    return;
  }

  lectureUI.style.display  = 'block';
  notLecture.style.display = 'none';

  if (url.includes('youtube.com'))     pageStatus.textContent = '▶ YouTube lecture detected';
  else if (url.includes('opencast'))   pageStatus.textContent = '🎓 Opencast lecture detected';
  else if (url.includes('zoom.us'))    pageStatus.textContent = '📹 Zoom recording detected';

  // Ensure content script is injected
  captStatus.textContent = 'Connecting…';
  const ok = await ensureContentScript(tab.id);
  if (!ok) {
    captStatus.textContent = '⚠️ Could not connect. Try refreshing the page.';
    return;
  }

  // Get status
  try {
    const status = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
    if (status) {
      if (status.isCapturing) {
        captStatus.textContent = `🔴 Capturing — ${status.captureCount} captions`;
        btnCapture.textContent = '⏹ Stop Capturing';
        btnCapture.className   = 'btn btn-stop';
      } else {
        captStatus.textContent = status.captureCount > 0
          ? `✅ ${status.captureCount} captions ready`
          : 'Ready — press Start Capturing';
      }
      if (status.title) pageStatus.textContent += ` — "${status.title.slice(0,25)}…"`;
    }
  } catch (e) {
    captStatus.textContent = 'Ready — press Start Capturing';
  }

  // Load last summary
  chrome.storage.local.get('lastSummary', ({ lastSummary }) => {
    if (lastSummary) {
      lastDiv.style.display = 'block';
      lastTitle.textContent = lastSummary.title.slice(0, 50) + (lastSummary.title.length > 50 ? '…' : '');
    }
  });

  // Capture button
  btnCapture.addEventListener('click', async () => {
    const ok2 = await ensureContentScript(tab.id);
    if (!ok2) { captStatus.textContent = '⚠️ Refresh the page and try again'; return; }
    try {
      const status = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
      if (status && status.isCapturing) {
        await chrome.tabs.sendMessage(tab.id, { action: 'stopCapture' });
        btnCapture.textContent = '⏺ Start Capturing';
        btnCapture.className   = 'btn btn-primary';
        captStatus.textContent = 'Stopped — press ✨ to summarize';
      } else {
        await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
        btnCapture.textContent = '⏹ Stop Capturing';
        btnCapture.className   = 'btn btn-stop';
        captStatus.textContent = '🔴 Capturing subtitles…';
      }
    } catch (e) {
      captStatus.textContent = '⚠️ Error: ' + e.message;
    }
  });

  // Show panel button (reopens if closed)
  const btnShow = document.createElement('button');
  btnShow.className = 'btn btn-secondary';
  btnShow.textContent = '👁 Show Panel';
  btnShow.style.marginBottom = '7px';
  btnSumm.parentNode.insertBefore(btnShow, btnSumm.nextSibling);
  btnShow.addEventListener('click', async () => {
    await ensureContentScript(tab.id);
    await chrome.tabs.sendMessage(tab.id, { action: 'showPanel' });
    window.close();
  });

  // Summarize button
  btnSumm.addEventListener('click', async () => {
    const ok2 = await ensureContentScript(tab.id);
    if (!ok2) { captStatus.textContent = '⚠️ Refresh the page and try again'; return; }
    try {
      btnSumm.textContent = '⏳ Summarizing…';
      btnSumm.disabled    = true;
      await chrome.tabs.sendMessage(tab.id, { action: 'showPanel' });
      await chrome.tabs.sendMessage(tab.id, { action: 'summarize' });
      btnSumm.textContent = '✨ Summarize Lecture';
      btnSumm.disabled    = false;
      window.close();
    } catch (e) {
      btnSumm.textContent = '✨ Summarize Lecture';
      btnSumm.disabled    = false;
      captStatus.textContent = '⚠️ ' + e.message;
    }
  });
});
