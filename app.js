/**
 * StreamView — app.js
 * Carga el embed de OK.RU / Odysee y el chat de Twitch en el sidebar.
 */

// ── Helpers ────────────────────────────────────────────────────

/**
 * Detecta la plataforma y construye la URL de embed.
 * Soporta OK.RU y Odysee.
 */
function buildStreamEmbedUrl(rawUrl) {
  rawUrl = rawUrl.trim();

  // ── ODYSEE ──────────────────────────────────────────────────
  // Formatos:
  //   https://odysee.com/@Canal:x/titulo:y
  //   https://odysee.com/$/embed/@Canal:x/titulo:y  (ya es embed)
  // El embed debe ir URL-encoded para que Safari/Chrome móvil lo resuelvan bien:
  //   https://odysee.com/%24/embed/%40Canal%3Ax%2Ftitulo%3Ay
  if (rawUrl.includes('odysee.com')) {
    // Si ya es embed (encoded o sin encodear), usar directamente
    if (rawUrl.includes('/$/embed/') || rawUrl.includes('/%24/embed/')) {
      return rawUrl;
    }
    try {
      const u = new URL(rawUrl);
      // pathname ej: /@ONIME:b/SAS:4  →  encodeURIComponent lo convierte a %40ONIME%3Ab%2FSAS%3A4
      const encodedPath = encodeURIComponent(u.pathname.replace(/^\//, ''));
      return `https://odysee.com/%24/embed/${encodedPath}`;
    } catch (_) {}
    return null;
  }

  // ── OK.RU ────────────────────────────────────────────────────
  // Formatos:
  //   https://ok.ru/live/123456789
  //   https://ok.ru/video/123456789
  //   https://ok.ru/videoembed/123456789
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
  // Si pegan la URL completa
  try {
    const url = new URL(input);
    if (url.hostname.includes('twitch.tv')) {
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[0] || null;
    }
  } catch (_) {}

  // Si es solo el nombre
  const clean = input.replace(/^@/, '').split('/')[0].trim();
  return clean || null;
}

// ── Main loader ────────────────────────────────────────────────

function loadContent() {
  const streamInput  = document.getElementById('stream-url').value;
  const twitchInput  = document.getElementById('twitch-channel').value;

  let loaded = false;

  // — Stream (OK.RU / Odysee) —
  if (streamInput.trim()) {
    const embedUrl = buildStreamEmbedUrl(streamInput);
    if (embedUrl) {
      const frame = document.getElementById('stream-frame');
      const placeholder = document.getElementById('video-placeholder');
      frame.src = embedUrl;
      frame.classList.remove('hidden');
      placeholder.classList.add('hidden');
      loaded = true;
    } else {
      showError('stream-url', 'URL no reconocida. Soportado: OK.RU y Odysee.');
    }
  }

  // — Twitch Chat —
  if (twitchInput.trim()) {
    const channel = parseTwitchChannel(twitchInput);
    if (channel) {
      // Twitch requiere que el parent sea el dominio donde está alojado el chat
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

  // Limpiar el error al escribir
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

  // Restaurar estado desde localStorage (opcional)
  const savedStream  = localStorage.getItem('sv_stream');
  const savedChannel = localStorage.getItem('sv_channel');
  if (savedStream)  document.getElementById('stream-url').value = savedStream;
  if (savedChannel) document.getElementById('twitch-channel').value = savedChannel;
});

// Guardar en localStorage al cargar
const _originalLoad = loadContent;
window.loadContent = function() {
  const s = document.getElementById('stream-url').value;
  const c = document.getElementById('twitch-channel').value;
  if (s) localStorage.setItem('sv_stream', s);
  if (c) localStorage.setItem('sv_channel', c);
  _originalLoad();
};
