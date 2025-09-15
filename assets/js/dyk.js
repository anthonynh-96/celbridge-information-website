/* Reusable Did You Know widget
 * Usage: dykWidget.init({ facts: [...], storageKey: 'dyk-home' });
 * No dependencies; safely namespaced.
 */
const dykWidget = (() => {
  let state = {
    i: 0,
    timer: null,
    pinned: false,
    hidden: false,
    facts: [],
    storageKey: 'dyk-default'
  };

  // Elements
  let $pill, $msg, $prev, $next, $pin, $close, $bubble;

  function save() {
    try {
      localStorage.setItem(state.storageKey, JSON.stringify({
        i: state.i, pinned: state.pinned, hidden: state.hidden
      }));
    } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(state.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.i === 'number') state.i = data.i;
        if (typeof data.pinned === 'boolean') state.pinned = data.pinned;
        if (typeof data.hidden === 'boolean') state.hidden = data.hidden;
      }
    } catch (_) {}
  }

  function show(idx) {
    state.i = (idx + state.facts.length) % state.facts.length;
    if ($msg) $msg.textContent = 'Did you know? ' + state.facts[state.i];
    save();
  }

  function start() {
    if (state.timer || state.pinned || state.hidden) return;
    state.timer = setInterval(() => show(state.i + 1), 5000);
  }

  function stop() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function buildDOM(rootId = 'dyk-root') {
    const root = document.getElementById(rootId);
    if (!root) return;

    // Pill
    $pill = document.createElement('div');
    $pill.className = 'dyk';
    $pill.setAttribute('role', 'status');
    $pill.setAttribute('aria-live', 'polite');

    const dot = document.createElement('div');
    dot.className = 'dyk__dot';

    $msg = document.createElement('div');
    $msg.className = 'dyk__msg';
    $msg.textContent = 'Did you know?';

    const actions = document.createElement('div');
    actions.className = 'dyk__actions';

    $prev = document.createElement('button');
    $prev.className = 'dyk__btn';
    $prev.title = 'Previous fact';
    $prev.textContent = '‹';

    $next = document.createElement('button');
    $next.className = 'dyk__btn';
    $next.title = 'Next fact';
    $next.textContent = '›';

    $pin = document.createElement('button');
    $pin.className = 'dyk__btn';
    $pin.title = 'Pin/unpin';
    $pin.textContent = '📌';

    $close = document.createElement('button');
    $close.className = 'dyk__btn';
    $close.title = 'Close';
    $close.textContent = '✕';

    actions.append($prev, $next, $pin, $close);
    $pill.append(dot, $msg, actions);

    // Bubble
    $bubble = document.createElement('div');
    $bubble.className = 'dyk-bubble';
    $bubble.id = 'dykBubble';
    $bubble.title = 'Show facts';
    $bubble.textContent = '💡';

    // Insert
    root.appendChild($pill);
    root.appendChild($bubble);
  }

  function wireEvents() {
    // Clicks
    $prev.addEventListener('click', () => { show(state.i - 1); });
    $next.addEventListener('click', () => { show(state.i + 1); });

    $pin.addEventListener('click', () => {
      state.pinned = !state.pinned;
      $pill.classList.toggle('dyk--pinned', state.pinned);
      save();
      if (state.pinned) stop(); else start();
    });

    $close.addEventListener('click', () => {
      stop();
      state.hidden = true;
      $pill.style.display = 'none';
      $bubble.style.display = 'flex';
      save();
    });

    $bubble.addEventListener('click', () => {
      state.hidden = false;
      $bubble.style.display = 'none';
      $pill.style.display = 'flex';
      save();
      start();
    });

    // Pause on hover/focus
    $pill.addEventListener('mouseenter', stop);
    $pill.addEventListener('mouseleave', start);
    $pill.addEventListener('focusin', stop);
    $pill.addEventListener('focusout', start);
  }

  function applyInitialVisibility() {
    if (state.pinned) $pill.classList.add('dyk--pinned');
    if (state.hidden) {
      $pill.style.display = 'none';
      $bubble.style.display = 'flex';
    } else {
      $pill.style.display = 'flex';
      $bubble.style.display = 'none';
    }
  }

  function init(opts = {}) {
    state.facts = Array.isArray(opts.facts) ? opts.facts.slice() : [];
    state.storageKey = opts.storageKey || state.storageKey;

    load();
    buildDOM(opts.rootId || 'dyk-root');
    if (!$pill) return;
    wireEvents();
    show(state.i || 0);
    applyInitialVisibility();
    start();
  }

  return { init };
})();
