/**
 * StreamView — app.js
 * Carga el embed de múltiples plataformas y el chat de Twitch en el sidebar.
 */

// ── Helpers ────────────────────────────────────────────────────

/**
 * Detecta la plataforma y construye la URL de embed correcta para el iframe.
 */
function buildStreamEmbedUrl(rawUrl) {
  rawUrl = rawUrl.trim();
  if (!rawUrl) return null;

  // ── VK VIDEO / VK LIVE ─────────────────────────────────────────
  // Formato: https://live.vkvideo.ru/iserveri/stream/default
  if (rawUrl.includes('vkvideo.ru') || rawUrl.includes('vk.com')) {
    try {
      const urlObj = new URL(rawUrl);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      
      if (parts.length >= 1) {
        // En tu formato es 'iserveri'
        const channel = parts[0];
        return `https://vkvideo.ru/video_ext.php?oid=-${channel}&id=live&autoplay=1`;
      }
    } catch (_) {}
    return null;
  }

  // ── SOOP (AFREECA TV) ──────────────────────────────────────────
  // Formato: https://play.sooplive.com/loltyler1/294793225
  if (rawUrl.includes('sooplive.com') || rawUrl.includes('afreecatv.com')) {
    try {
      const urlObj = new URL(rawUrl);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      
      const username = parts[0];
      const streamId = parts[1];
      if (username && streamId) {
        return `https://play.sooplive.com/${username}/${streamId}/embed`;
      } else if (username) {
        return `https://play.sooplive.com/${username}/embed`;
      }
    } catch (_) {}
    return null;
  }

  // ── TROVO LIVE ─────────────────────────────────────────────────
  // Formato: https://trovo.live/s/SK1LL_TV
  if (rawUrl.includes('trovo.live')) {
    try {
      const urlObj = new URL(rawUrl);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      
      let username = null;
      if (parts[0] === 's' && parts[1]) {
        username = parts[1];
      } else {
        username = parts[parts.length - 1];
      }
      
      if (username) {
        return `https://trovo.live/embed/${username}?autoplay=1`;
      }
    } catch (_) {}
    return null;
  }

  // ── GOODGAME.RU ────────────────────────────────────────────────
  // Formato: https://goodgame.ru/Nikichar#autoplay o https://goodgame.ru/channel/Nikichar
  if (rawUrl.includes('goodgame.ru')) {
    try {
      const urlObj = new URL(rawUrl);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      
      let channelName = null;
      if (parts[0] === 'channel' && parts[1]) {
        channelName = parts[1];
      } else if (parts[0]) {
        channelName = parts[0];
      }
      
      if (channelName) {
        return `https://goodgame.ru/player?channel=${channelName}&autoplay=1`;
      }
    } catch (_) {}
    return null;
  }

  // ── ODYSEE ─────────────────────────────────────────────────────
  if (rawUrl.includes('odysee.com')) {
    if (rawUrl.includes('/$/embed/') || rawUrl.includes('/%24/embed/')) {
      return rawUrl;
    }
    try {
      const u = new URL(rawUrl);
      const encodedPath = encodeURIComponent(u.pathname.replace(/^\//, ''));
      return `https://odysee.com/%24/embed/${encodedPath}`;
    } catch (_) {}
    return null;
  }

  // ── OK.RU ──────────────────────────────────────────────────────
  if (rawUrl.includes('ok.ru')) {
    if (rawUrl.includes('ok.ru/videoembed/')) {
      try {
        const url = new URL(rawUrl);
        url.searchParams.set('autoplay', '1');
        return url.toString();
      } catch (_) { return null; }
    }

    const match = rawUrl.match(/ok\.ru\/(?:live|video|videoembed)\/(\d+)/i);
    if (match) return `https://ok.ru/videoembed/${match[1]}?autoplay=1`;

    try {
      const urlObj = new URL(rawUrl);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      if (id && /\d+/.test(id)) return `https://ok.ru/videoembed/${id}?autoplay=1`;
    } catch (_) {}

    return null;
  }

  // Solo ID numérico → asumimos OK.RU
  if (/^\d+$/.test(rawUrl)) {
    return `https://ok.ru/videoembed/${rawUrl}?autoplay=1`;
  }

  return null;
}

/**
 * Limpia el nombre del canal de Twitch (elimina URL si la pegan completa).
 */
function parseTwitchChannel(input) {
  input = input.trim();
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.hostname.includes('twitch.tv')) {
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[0] || null;
    }
  } catch (_) {}

  const clean = input.replace(/^@/, '').split('/')[0].trim();
  return clean || null;
}

// ── Main loader ────────────────────────────────────────────────

function loadContent() {
  const streamInput  = document.getElementById('stream-url').value;
  const twitchInput  = document.getElementById('twitch-channel').value;

  let loaded = false;

  const frame = document.getElementById('stream-frame');
  const placeholder = document.getElementById('video-placeholder');

  if (streamInput.trim()) {
    const embedUrl = buildStreamEmbedUrl(streamInput);
    if (embedUrl) {
      frame.src = embedUrl;
      frame.classList.remove('hidden');
      placeholder.classList.add('hidden');
      loaded = true;
    } else {
      frame.classList.add('hidden');
      placeholder.classList.remove('hidden');
      showError('stream-url', 'URL no reconocida o plataforma no soportada.');
    }
  }

  if (twitchInput.trim()) {
    const channel = parseTwitchChannel(twitchInput);
    if (channel) {
      const parent = window.location.hostname || 'localhost';
      const chatUrl = `https://www.twitch.tv/embed/${channel}/chat?darkpopout&parent=${parent}`;

      const chatFrame = document.getElementById('chat-frame');
      const chatPlaceholder = document.getElementById('chat-placeholder');
      const label = document.getElementById('chat-channel-label');

      chatFrame.src = chatUrl;
      chatFrame.classList.remove('hidden');
      chatPlaceholder.classList.add('hidden');
      label.textContent = channel;
      loaded = true;
    } else {
      showError('twitch-channel', 'Nombre de canal no válido.');
    }
  }

  if (!loaded && !streamInput.trim() && !twitchInput.trim()) {
    showError('stream-url', 'Introduce al menos una URL o canal.');
  }
}

// ── Error feedback ─────────────────────────────────────────────

function showError(inputId, msg) {
  const input = document.getElementById(inputId);
  input.style.borderColor = '#ef4444';
  input.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
  input.title = msg;

  input.addEventListener('input', function clear() {
    input.style.borderColor = '';
    input.style.boxShadow = '';
    input.title = '';
    input.removeEventListener('input', clear);
  });
}

// ── Enter key support ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  ['stream-url', 'twitch-channel'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') loadContent();
    });
  });

  const savedStream  = localStorage.getItem('sv_stream');
  const savedChannel = localStorage.getItem('sv_channel');
  if (savedStream)  document.getElementById('stream-url').value = savedStream;
  if (savedChannel) document.getElementById('twitch-channel').value = savedChannel;
});

const _originalLoad = loadContent;
window.loadContent = function() {
  const s = document.getElementById('stream-url').value;
  const c = document.getElementById('twitch-channel').value;
  if (s) localStorage.setItem('sv_stream', s);
  if (c) localStorage.setItem('sv_channel', c);
  _originalLoad();
};
