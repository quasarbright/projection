/**
 * Dynamic background: loads a random page from config.dynamicBackgrounds into a full-screen
 * iframe behind the site and lets it react to the mouse.
 *
 * How the mouse gets to the background:
 * - The page content has `pointer-events: none` (see main.css, body.has-dynamic-background),
 *   and only cards and controls turn it back on. Everywhere else the pointer goes straight
 *   through to the iframe, so the background gets real, native events, clicks included.
 * - Over a card or control the page gets the event instead. If the iframe is same-origin,
 *   forwardMove dispatches a synthetic pointermove + mousemove at the same spot inside it.
 *   Sketches (p5 included) read clientX/clientY from whatever event arrives, so they follow
 *   the cursor as if it were theirs.
 * - Forwarding needs the background on the same origin as this page (same scheme and host),
 *   for example a portfolio at user.github.io/portfolio/ with backgrounds at user.github.io/...
 * - If the iframe is cross-origin, the move is sent with postMessage instead, for backgrounds
 *   that listen for { type: 'mousemove', x, y }.
 */

(function () {
  function withBackgroundParam(url) {
    if (/[?&]background\b/.test(url)) return url;
    return url + (url.includes('?') ? '&' : '?') + 'background=true';
  }

  // A readable name from the URL's last path segment: ".../p5js/hex-random-walk/?background" -> "Hex random walk"
  function backgroundName(url) {
    const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
    const slug = decodeURIComponent(path.slice(path.lastIndexOf('/') + 1)).replace(/\.html?$/, '');
    const words = slug.replace(/[-_]+/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  // The iframe's window and document, or null when it is cross-origin (or not loaded yet).
  function sameOriginFrame(iframe) {
    try {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument; // null or throws when cross-origin
      if (win && doc) return { win, doc };
    } catch {
      // cross-origin
    }
    return null;
  }

  // Dispatch a synthetic pointermove + mousemove on whatever is under the pointer in the iframe,
  // built with the iframe window's own constructors so the events belong to it.
  function forwardMove(iframe, e) {
    const r = iframe.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    const frame = sameOriginFrame(iframe);
    if (!frame) {
      iframe.contentWindow?.postMessage({ type: 'mousemove', x, y, pageX: e.pageX, pageY: e.pageY }, '*');
      return;
    }

    const { win, doc } = frame;
    const target = doc.elementFromPoint(x, y) || doc.body || doc.documentElement;
    if (!target) return;
    const init = {
      bubbles: true, cancelable: true, composed: true, view: win,
      clientX: x, clientY: y, screenX: e.screenX, screenY: e.screenY,
      movementX: e.movementX, movementY: e.movementY, buttons: e.buttons,
    };
    target.dispatchEvent(new win.PointerEvent('pointermove', {
      ...init, pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: e.isPrimary,
    }));
    target.dispatchEvent(new win.MouseEvent('mousemove', init));
  }

  function init() {
    const iframe = document.getElementById('dynamic-background');
    const config = window.PROJECTS_DATA?.config;
    const backgrounds = config?.dynamicBackgrounds || [];
    if (!iframe || !backgrounds.length) return;

    iframe.addEventListener('error', () => {
      console.warn('Failed to load dynamic background');
      iframe.style.display = 'none';
    });

    // Wheel and touch scrolls that start over the background only reach this page if the
    // background's own document can't scroll. Some sketches are a few pixels taller than the
    // window (an inline canvas leaves room for a text descender), which captures the scroll,
    // so pin them. Only possible when the iframe is same-origin.
    iframe.addEventListener('load', () => {
      const frame = sameOriginFrame(iframe);
      if (!frame) return;
      const style = frame.doc.createElement('style');
      style.textContent = 'html { overflow: hidden !important; }';
      (frame.doc.head || frame.doc.documentElement).append(style);
    });

    // The pill in the top bar names the background, and Shuffle loads a different one
    const nameEl = document.getElementById('bg-name');
    let current = Math.floor(Math.random() * backgrounds.length);
    function load(index) {
      current = index;
      iframe.src = withBackgroundParam(backgrounds[index]);
      if (nameEl) nameEl.textContent = backgroundName(backgrounds[index]);
    }
    load(current);
    document.getElementById('bg-shuffle')?.addEventListener('click', () => {
      const next = (current + 1 + Math.floor(Math.random() * (backgrounds.length - 1))) % backgrounds.length;
      load(next);
    });

    // This only fires where the page is on top (cards and controls); elsewhere the event
    // goes to the iframe directly.
    document.addEventListener('pointermove', (e) => forwardMove(iframe, e));
  }

  window.dynamicBackground = { withBackgroundParam };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
