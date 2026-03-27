// Background service worker — handles tab audio stream ID
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.action === 'getTabAudioStream') {
    chrome.tabCapture.capture({ audio: true, video: false }, stream => {
      if (chrome.runtime.lastError || !stream) {
        reply({ error: chrome.runtime.lastError?.message || 'No stream' });
        return;
      }
      // Get stream ID from the track
      const track = stream.getAudioTracks()[0];
      reply({ streamId: track ? track.id : null });
    });
    return true; // async
  }
});
