// /qassets/js/template-loader.js
(function () {
  // ---------- Registry ----------
  const TEMPLATE_REGISTRY = {
  'basic-hero': { html: null, css: null, js: null },

    'spotlight': {
      html: '/qassets/booking-templates/spotlight.html',
      css:  '/qassets/css/booking-templates/spotlight.css',
      js:   '/qassets/js/booking-templates/spotlight.js'
    },

    'showcase': {
      html: '/qassets/booking-templates/showcase.html',
      css:  '/qassets/css/booking-templates/showcase.css',
      js:   '/qassets/js/booking-templates/showcase.js'
    },

    'drag-and-drop': {
      html: '/qassets/booking-templates/drag-and-drop.html',
      css:  '/qassets/css/booking-templates/drag-and-drop.css',
      js:   '/qassets/js/booking-templates/drag-and-drop.js'
    },
  };

  // Expose hook registry for per-template scripts
  window.__TEMPLATES__ = {};
  window.registerTemplate = function (name, hooks) {
    window.__TEMPLATES__[name] = hooks || {};
  };

  // ---------- Helpers ----------
  function ensureCss(href, key) {
    if (!href) return;
    if (document.querySelector(`link[data-tpl="${key}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.tpl = key;
    document.head.appendChild(link);
  }

  function ensureScript(src, key) {
    if (!src) return Promise.resolve();
    if (document.querySelector(`script[data-tpl="${key}"]`)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `${src}?v=${Date.now()}`;
      s.async = true;
      s.dataset.tpl = key;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  async function loadHtml(url) {
    const res = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    return res.text();
  }

  function moveFlowInto(targetEl) {
    if (!targetEl) return;
    const container = document.querySelector('.container');
    if (!container) return;
    const frag = document.createDocumentFragment();
    container.querySelectorAll('section.section').forEach(sec => frag.appendChild(sec));
    targetEl.appendChild(frag);
  }

  function hydrateBasicHero(values = {}) {
    const heroImg = document.getElementById('heroImg');
    const bizName = document.getElementById('bizName');
    const bizSub  = document.getElementById('bizSub');
    if (bizName) bizName.textContent = values.businessName || values.Name || 'Business';
    if (bizSub)  bizSub.textContent  = values.tagline || values.subtitle || '';
    if (heroImg) heroImg.src         = values.heroUrl || '/qassets/img/default-hero.jpg';
  }

  // Edit toggle (white bar)
  function injectEditToggleBar(isOn) {
    if (document.getElementById('ss-edit-toggle')) return;
    const css = `
      #ss-edit-toggle{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid #eee;}
      #ss-edit-toggle .ss-editbar{max-width:1200px;margin:0 auto;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:8px 12px;color:#111;font-weight:600;}
      #ss-edit-toggle .ss-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #ddd;border-radius:999px;padding:4px 8px;background:#fff;}
      #ss-edit-toggle .ss-pill input{appearance:none;width:44px;height:24px;border-radius:999px;background:#ddd;position:relative;outline:0;cursor:pointer;transition:background .15s;}
      #ss-edit-toggle .ss-pill input:checked{background:#111;}
      #ss-edit-toggle .ss-pill input::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s;}
      #ss-edit-toggle .ss-pill input:checked::after{left:22px;}
      #ss-edit-toggle .ss-yesno{min-width:26px;text-align:center;font-weight:700;}
    `;
    if (!document.getElementById('ss-edit-toggle-style')) {
      const s = document.createElement('style');
      s.id = 'ss-edit-toggle-style';
      s.textContent = css;
      document.head.appendChild(s);
    }
    const bar = document.createElement('div');
    bar.id = 'ss-edit-toggle';
    bar.innerHTML = `
      <div class="ss-editbar">
        <span>Edit mode</span>
        <label class="ss-pill">
          <input type="checkbox" id="ss-edit-switch" ${isOn ? 'checked' : ''} />
          <span class="ss-yesno">${isOn ? 'Yes' : 'No'}</span>
        </label>
      </div>
    `;
    document.body.prepend(bar);

    const sw = bar.querySelector('#ss-edit-switch');
    const yn = bar.querySelector('.ss-yesno');
    sw.addEventListener('change', () => {
      yn.textContent = sw.checked ? 'Yes' : 'No';
      const url = new URL(location.href);
      if (sw.checked) url.searchParams.set('edit','1');
      else url.searchParams.delete('edit');
      location.href = url.toString();
    });
  }

  // Generic save helper (optional, used by editor)
  window.saveBusinessValues = async function(updatedValues) {
    const bizId = window.selectedBusinessId;
    const res = await fetch(`/api/records/Business/${encodeURIComponent(bizId)}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','Accept':'application/json'},
      credentials: 'include',
      body: JSON.stringify({ values: updatedValues })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // ---------- MAIN: called from booking-page2.js ----------
  window.applyTemplate = async function (templateKey, values = {}) {
    const key = String(templateKey || 'basic-hero').toLowerCase().trim();
    const def = TEMPLATE_REGISTRY[key];

    document.body.dataset.template = key;

    // No external shell? just hydrate basic and return
    if (!def || !def.html) {
      hydrateBasicHero(values);
      injectEditToggleBar(new URLSearchParams(location.search).get('edit') === '1');
      return;
    }

    // Load CSS + per-template JS
    ensureCss(def.css, key);
    await ensureScript(def.js, key);

    // Ensure shell exists
    let shell = document.getElementById('template-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.id = 'template-shell';
      document.body.insertBefore(shell, document.body.firstChild);
    }

    // Inject HTML
    const html = await loadHtml(def.html);
    shell.innerHTML = html;

    // Move booking flow into slot
    const flowSlot = shell.querySelector('[data-slot="flow"]');
    moveFlowInto(flowSlot);

    // Run template init
    const hooks = window.__TEMPLATES__[key];
    if (hooks && typeof hooks.init === 'function') {
      await hooks.init({ values, shell, flowRoot: flowSlot });
    }

    // Hydrate hero
    hydrateBasicHero(values);

    // Show edit toggle + optionally load editor
    const isEditMode = new URLSearchParams(location.search).get('edit') === '1';
    injectEditToggleBar(isEditMode);

    if (isEditMode) {
      ensureCss('/qassets/css/template-editor.css', 'editor');
      if (!document.querySelector('script[data-tpl="editor"]')) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = '/qassets/js/template-editor.js?v=' + Date.now();
          s.async = true;
          s.dataset.tpl = 'editor';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Failed to load template-editor.js'));
          document.head.appendChild(s);
        });
      }
      window.TemplateEditor?.init({
        root: shell,
        values,
        getKey: el => el.dataset.key,
        onSave: window.saveBusinessValues
      });
    }
  };
})();
