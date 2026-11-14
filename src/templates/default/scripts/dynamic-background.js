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

  // Fisher–Yates, on a copy
  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Strip query, hash and trailing slash so a background URL can be matched to a project's pageLink
  function normalizeUrl(u) {
    try {
      const url = new URL(u, location.href);
      return (url.origin + url.pathname).replace(/\/+$/, '');
    } catch {
      return u;
    }
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
    // Also, like the home page: the background fades in once loaded, and keeps the normal
    // cursor (some sketches set a crosshair, which looks broken behind a page of links).
    iframe.addEventListener('load', () => {
      iframe.classList.add('ready');
      const frame = sameOriginFrame(iframe);
      if (!frame) return;
      const style = frame.doc.createElement('style');
      style.textContent = 'html { overflow: hidden !important; } *, *::before, *::after { cursor: auto !important; }';
      (frame.doc.head || frame.doc.documentElement).append(style);
    });

    // Same as the home page: shuffle the list once per visit, and Shuffle walks through it in
    // that order, so every background shows once before any repeats.
    // ?bg=<text> moves the first background whose URL contains <text> to the front.
    const order = shuffled(backgrounds);
    const want = new URLSearchParams(location.search).get('bg');
    const picked = want ? order.findIndex(url => url.includes(want)) : -1;
    if (picked > 0) order.unshift(...order.splice(picked, 1));

    // The pill in the top bar names the background: the title of the project it belongs to
    // when this portfolio lists it, otherwise a name made from the URL
    const titles = new Map((window.PROJECTS_DATA?.projects || []).map(p => [normalizeUrl(p.pageLink), p.title]));
    const nameEl = document.getElementById('bg-name');
    let current = 0;
    function load(index) {
      current = index;
      iframe.classList.remove('ready');
      iframe.src = withBackgroundParam(order[index]);
      if (nameEl) nameEl.textContent = titles.get(normalizeUrl(order[index])) || backgroundName(order[index]);
    }
    load(0);
    document.getElementById('bg-shuffle')?.addEventListener('click', () => load((current + 1) % order.length));

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
