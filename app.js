/**
 * StreamView — app.js
 * Carga el embed de OK.RU y el chat de Twitch en el sidebar.
 */

// ── Helpers ────────────────────────────────────────────────────

/**
 * Extrae el ID de vídeo/live de una URL de OK.RU.
 * Formatos soportados:
 *   https://ok.ru/live/123456789
 *   https://ok.ru/video/123456789
 *   https://ok.ru/videoembed/123456789
 */
function buildOkruEmbedUrl(rawUrl) {
  rawUrl = rawUrl.trim();

  // Si ya es un embed, lo usamos directamente
  if (rawUrl.includes('ok.ru/videoembed/')) {
    // Asegurar que tiene los params necesarios
    const url = new URL(rawUrl);
    url.searchParams.set('autoplay', '1');
    return url.toString();
  }

  // Intentar extraer el ID numérico del path
  const match = rawUrl.match(/ok\.ru\/(?:live|video|videoembed)\/(\d+)/i);
  if (match) {
    return `https://ok.ru/videoembed/${match[1]}?autoplay=1`;
  }

  // Si el usuario pegó solo el ID numérico
  if (/^\d+$/.test(rawUrl)) {
    return `https://ok.ru/videoembed/${rawUrl}?autoplay=1`;
  }

  // Fallback: intentar construir desde cualquier URL de ok.ru
  try {
    const urlObj = new URL(rawUrl);
    if (urlObj.hostname.includes('ok.ru')) {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      if (id && /\d+/.test(id)) {
        return `https://ok.ru/videoembed/${id}?autoplay=1`;
      }
    }
  } catch (_) {}

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

  // — OK.RU Stream —
  if (streamInput.trim()) {
    const embedUrl = buildOkruEmbedUrl(streamInput);
    if (embedUrl) {
      const frame = document.getElementById('stream-frame');
      const placeholder = document.getElementById('video-placeholder');
      frame.src = embedUrl;
      frame.classList.remove('hidden');
      placeholder.classList.add('hidden');
      loaded = true;
    } else {
      showError('stream-url', 'URL de OK.RU no reconocida. Prueba con: https://ok.ru/live/ID');
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
