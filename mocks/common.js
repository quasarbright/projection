// Shared helpers for the facelift mocks. Each mock renders the real portfolio data from data.js.
(function () {
  const P = window.PROJECTS;
  const BG = window.BACKGROUNDS;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const tagCounts = {};
  P.forEach(p => p.tags.forEach(t => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
  // "web" and "mobile-friendly" are on most projects and don't help anyone browse
  const browseTags = Object.keys(tagCounts)
    .filter(t => t !== 'web' && t !== 'mobile-friendly')
    .sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b));

  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

  // Rough "what kind of thing is it" from tags, for layouts that group projects.
  const KINDS = [
    ['Games', p => p.tags.includes('game')],
    ['Image and video effects', p => p.tags.some(t => ['upload-image', 'webcam', 'video-effect'].includes(t))],
    ['Simulations', p => p.tags.some(t => ['cellular-automata', 'physics', 'shader', 'fractal', 'genetic-algorithm'].includes(t))],
    ['Languages and compilers', p => p.tags.some(t => ['programming-languages', 'dsl', 'compiler', 'macros', 'type-system', 'esolang'].includes(t))],
    ['AI and bots', p => p.tags.some(t => ['ai', 'neural-networks'].includes(t))],
    ['Tools and everything else', () => true],
  ];
  function kind(p) { return KINDS.find(([, f]) => f(p))[0]; }

  function matches(p, q, tag) {
    if (tag && tag !== 'all' && !(tag === 'featured' ? p.f : p.tags.includes(tag))) return false;
    if (!q) return true;
    q = q.toLowerCase();
    return (p.t + ' ' + p.d + ' ' + p.tags.join(' ')).toLowerCase().includes(q);
  }
  function filter(q, tag) { return P.filter(p => matches(p, q, tag)); }

  function bgName(url) {
    const slug = url.replace(/\/?\?.*$/, '').replace(/\/$/, '').split('/').pop();
    return slug.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
  }

  // Live background iframe, like projection's dynamic-background.js. Returns { el, name, shuffle }.
  function background(container, start) {
    let i = start ?? 0;
    const f = document.createElement('iframe');
    f.className = 'bg-frame';
    f.setAttribute('tabindex', '-1');
    f.setAttribute('aria-hidden', 'true');
    f.loading = 'eager';
    container.appendChild(f);
    const api = {
      el: f,
      url: () => BG[i],
      name: () => bgName(BG[i]),
      shuffle() { i = (i + 1) % BG.length; f.src = BG[i]; api.onchange?.(api.name()); },
    };
    f.src = BG[i];
    return api;
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  window.M = {
    P, BG, tagCounts, browseTags, kind, KINDS: KINDS.map(k => k[0]), filter, hash, background, bgName, esc,
    featured: P.filter(p => p.f),
    year: p => p.date.slice(0, 4),
    month: p => MONTHS[+p.date.slice(5, 7) - 1],
    fmt: p => MONTHS[+p.date.slice(5, 7) - 1] + ' ' + p.date.slice(0, 4),
    footer: '<footer class="m-footer">Made with ♥ by <a href="https://quasarbright.github.io/">Mike Delmonaco</a></footer>',
  };
})();
