// Register this template’s behavior with the loader
registerTemplate('showcase', {
  init: async ({ values, shell, elements }) => {
    // Hydrate images/text from Business values (fallbacks kept simple)
    const byId = (id) => shell.querySelector(`#${id}`);

    // Logo
    const logo = byId('tpl-logo-img');
    if (logo) {
      const src = values.logoUrl || values.heroUrl || '/qassets/img/default-hero.jpg';
      logo.src = src;
    }

    // Styles image
    const stylesImg = byId('tpl-styles-img');
    if (stylesImg) stylesImg.src = values.stylesImageUrl || '/qassets/img/placeholder-1.jpg';

    // Location banner
    const locImg = byId('tpl-location-img');
    if (locImg) locImg.src = values.locationImageUrl || '/qassets/img/placeholder-2.jpg';

    // Extra images
    const img1 = byId('tpl-image-1-img');
    if (img1) img1.src = values.promoImageUrl || '/qassets/img/placeholder-3.jpg';
    const img2 = byId('tpl-image-2-img');
    if (img2) img2.src = values.featureImageUrl || '/qassets/img/placeholder-4.jpg';

    // Policy text (allow later rename while keeping anchors stable)
    if (values.policy1) shell.querySelector('#tpl-policy-1').textContent = values.policy1;
    if (values.policy2) shell.querySelector('#tpl-policy-2').textContent = values.policy2;
    if (values.policy3) shell.querySelector('#tpl-policy-3').textContent = values.policy3;
    if (values.policy4) shell.querySelector('#tpl-policy-4').textContent = values.policy4;

    // ---------- Drawer toggle ----------
    const burger = shell.querySelector('#tpl-burger');
    const drawer = shell.querySelector('#tpl-drawer');
    const scrim  = shell.querySelector('#tpl-drawer-scrim');

    function openDrawer() {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
    }
    function closeDrawer() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
    }

    burger?.addEventListener('click', () => {
      if (drawer.classList.contains('is-open')) closeDrawer(); else openDrawer();
    });
    scrim?.addEventListener('click', closeDrawer);

    // ---------- Drawer nav actions ----------
    drawer.querySelectorAll('.tpl-drawer__item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-target');
        const action = btn.getAttribute('data-action');
        closeDrawer();

        if (action === 'contact') {
          openContact();
          return;
        }
        if (target) {
          const el = shell.querySelector(`#${target}`) || document.getElementById(target);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // ---------- Contact modal ----------
    const modal = document.getElementById('tpl-contact-modal');
    const mScr  = document.getElementById('tpl-contact-scrim');
    const mBtn  = document.getElementById('tpl-contact-close');

    function setIf(el, text, href) {
      if (!el) return;
      if (href) el.href = href;
      el.textContent = text || '';
    }

    function openContact() {
      setIf(document.getElementById('tpl-contact-phone'),
            values.phoneNumber || values.phone || '', 
            values.phoneNumber ? `tel:${values.phoneNumber}` : null);
      setIf(document.getElementById('tpl-contact-email'),
            values.businessEmail || values.email || '', 
            values.businessEmail ? `mailto:${values.businessEmail}` : null);
      const addr = [
        values.locationName, values.city, values.state, values.businessAddress
      ].filter(Boolean).join(', ');
      const addrEl = document.getElementById('tpl-contact-addr');
      if (addrEl) addrEl.textContent = addr;
      if (modal) modal.setAttribute('aria-hidden', 'false');
    }
    function closeContact() { modal?.setAttribute('aria-hidden', 'true'); }

    mScr?.addEventListener('click', closeContact);
    mBtn?.addEventListener('click', closeContact);

    // ---------- Gallery arrows (semi-hidden) ----------
    const viewport = shell.querySelector('#tpl-gallery-viewport');
    const prev = shell.querySelector('#tpl-gal-prev');
    const next = shell.querySelector('#tpl-gal-next');
    const STRIDE = 320; // px to scroll per click

    prev?.addEventListener('click', () => viewport?.scrollBy({ left: -STRIDE, behavior: 'smooth' }));
    next?.addEventListener('click', () => viewport?.scrollBy({ left:  STRIDE, behavior: 'smooth' }));

    // Optional: allow wheel to scroll horizontally
    viewport?.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return; // ignore vertical scrolls
      e.preventDefault();
      viewport.scrollBy({ left: e.deltaX, behavior: 'auto' });
    }, { passive:false });
  }
});











// /qassets/js/booking-templates/spotlight.js
(function () {
  // --- tiny helpers
  const $  = (sel, root) => (root || document).querySelector(sel);
  const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); return () => el && el.removeEventListener(ev, fn); };
  const toUrl = (val) => {
    if (!val) return "";
    if (Array.isArray(val)) val = val[0];
    if (typeof val === "object") val = val.url || val.path || val.src || val.filename || val.name || "";
    if (!val) return "";
    if (/^https?:\/\//i.test(val) || String(val).startsWith("/")) return val;
    return "/uploads/" + String(val).replace(/^\/+/, "");
  };

  async function uploadFile(file) {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method:'POST', credentials:'include', body: fd });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.url || data.path;
  }

  // ---- Logo uploader (edit mode only)
  function enableLogoUploader(shell, values) {
    const section = $('#tpl-logo', shell);
    const img     = $('#tpl-logo-img', shell);
    if (!section || !img) return;

    
    // hidden input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    section.appendChild(fileInput);

    // floating pin
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'tpl-edit-pin';
    pin.title = 'Change logo';
    pin.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    `;
    section.appendChild(pin);

    pin.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        // quick preview
        const local = URL.createObjectURL(file);
        img.style.display = '';
        img.src = local;

        const uploadedUrl = await uploadFile(file);
        if (window.saveBusinessValues) {
          await window.saveBusinessValues({ logoUrl: uploadedUrl });
        }
        img.src = toUrl(uploadedUrl);
      } catch (e) {
        alert('Upload failed: ' + (e?.message || e));
      } finally {
        fileInput.value = '';
      }
    });

    // drag & drop
    ['dragenter','dragover'].forEach(ev =>
      section.addEventListener(ev, e => { e.preventDefault(); section.classList.add('is-drop'); }));
    ['dragleave','dragend','drop'].forEach(ev =>
      section.addEventListener(ev, e => { e.preventDefault(); section.classList.remove('is-drop'); }));
    section.addEventListener('drop', async (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      try {
        const local = URL.createObjectURL(file);
        img.style.display = '';
        img.src = local;

        const uploadedUrl = await uploadFile(file);
        if (window.saveBusinessValues) {
          await window.saveBusinessValues({ logoUrl: uploadedUrl });
        }
        img.src = toUrl(uploadedUrl);
      } catch (err) {
        alert('Upload failed: ' + (err?.message || err));
      }
    });
  }

  // ---- Gallery editor + slider (overlay arrows; no bottom scrollbar)
  function enableGallery(shell, values, { edit = false } = {}) {
    const vp    = $('#tpl-gallery-viewport', shell);
    const strip = $('#tpl-gallery-strip', shell);
    const prev  = $('#tpl-gal-prev', shell);
    const next  = $('#tpl-gal-next', shell);
    if (!vp || !strip) return;

    // derive slides: business values -> existing DOM imgs -> placeholders
    const business = Array.isArray(values.galleryUrls || values.gallery)
      ? (values.galleryUrls || values.gallery)
      : [];
    const existing = Array.from(strip.querySelectorAll('img'))
      .map(im => im.getAttribute('src'))
      .filter(Boolean);
    let slides = business.length ? [...business] :
                 (existing.length ? existing : [
                   '/qassets/img/placeholder-1.jpg',
                   '/qassets/img/placeholder-2.jpg',
                   '/qassets/img/placeholder-3.jpg'
                 ]);

    // one-time styles for edit pins / add tile
    if (edit && !document.getElementById('ss-edit-gallery-style')) {
      const s = document.createElement('style');
      s.id = 'ss-edit-gallery-style';
      s.textContent = `
        .tpl-gallery__item{position:relative; flex:0 0 100%}
        .tpl-edit-pin{position:absolute; top:8px; right:8px; z-index:5; background:#111; color:#fff; border:none; border-radius:999px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; opacity:.9; cursor:pointer}
        .tpl-edit-tile{flex:0 0 100%; display:flex; align-items:center; justify-content:center; border:1px dashed #555; color:#bbb}
      `;
      document.head.appendChild(s);
    }

    // slider (no scrollbar)
    vp.style.overflow = 'hidden';
    strip.style.display = 'flex';
    strip.style.gap = '0';
    strip.style.transition = 'transform .3s ease';
    let idx = 0;

    function render() {
      strip.innerHTML = '';
      slides.forEach((u, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'tpl-gallery__item';
        wrap.style.flex = '0 0 100%';

        const im = document.createElement('img');
        im.src = toUrl(u);
        im.alt = '';
        im.style.width = '100%';
        im.style.height = 'auto';

        wrap.appendChild(im);

        if (edit) {
          const pin = document.createElement('button');
          pin.className = 'tpl-edit-pin';
          pin.title = 'Replace image';
          pin.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
          pin.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              const local = URL.createObjectURL(file);
              im.src = local;
              try {
                const uploaded = await uploadFile(file);
                slides[i] = uploaded;
                if (window.saveBusinessValues) await window.saveBusinessValues({ galleryUrls: slides });
                im.src = toUrl(uploaded);
              } catch (e) {
                alert('Upload failed: ' + (e?.message || e));
              }
            };
            input.click();
          });
          wrap.appendChild(pin);
        }

        strip.appendChild(wrap);
      });

      if (edit) {
        const addTile = document.createElement('div');
        addTile.className = 'tpl-edit-tile';
        addTile.innerHTML = '<div style="text-align:center"><div style="font-size:28px;line-height:1">＋</div><div>Add image</div></div>';
        addTile.addEventListener('click', () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
              const uploaded = await uploadFile(file);
              slides.push(uploaded);
              if (window.saveBusinessValues) await window.saveBusinessValues({ galleryUrls: slides });
              idx = slides.length - 1;
              render();
              update();
            } catch (e) {
              alert('Upload failed: ' + (e?.message || e));
            }
          };
          input.click();
        });
        strip.appendChild(addTile);
      }

      update();
    }

    function update() {
      const maxIdx = Math.max(0, slides.length - 1);
      if (idx < 0) idx = 0;
      if (idx > maxIdx) idx = maxIdx;
      strip.style.transform = `translateX(-${idx * 100}%)`;
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === maxIdx;
    }

    // overlay arrows (use your CSS to style them)
    if (prev) prev.innerHTML = '‹';
    if (next) next.innerHTML = '›';
    const offPrev = prev ? on(prev, 'click', () => { idx -= 1; update(); }) : () => {};
    const offNext = next ? on(next, 'click', () => { idx += 1; update(); }) : () => {};
    const offResize = on(window, 'resize', update);

    render();

    // return cleanup
    return () => { offPrev(); offNext(); offResize(); };
  }




// Reusable: show a "+" pin on a section and let the pro upload an image
function enableSectionImagePin(shell, {
  sectionSel,           // e.g. '#tpl-styles'
  imgSel,               // e.g. '#tpl-styles-img'
  saveKey,              // e.g. 'stylesImage'
  accept = 'image/*'
}) {
  const section = shell.querySelector(sectionSel);
  const img     = shell.querySelector(imgSel);
  if (!section || !img) return;

  // mark section editable + give it some height if empty
  section.classList.add('is-editable');

  // show dashed “empty” state when no image is set
  function syncEmptyState() {
    if (!img.getAttribute('src')) section.classList.add('is-empty');
    else                          section.classList.remove('is-empty');
  }
  img.addEventListener('load', syncEmptyState);
  syncEmptyState();

  // hidden <input type="file">
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = accept;
  fileInput.style.display = 'none';
  section.appendChild(fileInput);

  // floating "+"
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'tpl-edit-pin';
  pin.title = 'Add/replace image';
  pin.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  `;
  section.appendChild(pin);

  // click → picker
  pin.addEventListener('click', () => fileInput.click());

  // picker → preview → upload → save
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const local = URL.createObjectURL(file);
      img.style.display = '';
      img.src = local;
      syncEmptyState();

      const uploadedUrl = await uploadFile(file);
      if (window.saveBusinessValues) {
        await window.saveBusinessValues({ [saveKey]: uploadedUrl });
      }
      img.src = (typeof toUrl === 'function') ? toUrl(uploadedUrl) : uploadedUrl;
    } catch (err) {
      alert('Upload failed: ' + (err?.message || err));
    } finally {
      fileInput.value = '';
    }
  });

  // drag & drop
  ['dragenter','dragover'].forEach(ev =>
    section.addEventListener(ev, e => { e.preventDefault(); section.classList.add('is-drop'); }));
  ['dragleave','dragend','drop'].forEach(ev =>
    section.addEventListener(ev, e => { e.preventDefault(); section.classList.remove('is-drop'); }));
  section.addEventListener('drop', async (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      const local = URL.createObjectURL(file);
      img.style.display = '';
      img.src = local;
      syncEmptyState();

      const uploadedUrl = await uploadFile(file);
      if (window.saveBusinessValues) {
        await window.saveBusinessValues({ [saveKey]: uploadedUrl });
      }
      img.src = (typeof toUrl === 'function') ? toUrl(uploadedUrl) : uploadedUrl;
    } catch (err) {
      alert('Upload failed: ' + (err?.message || err));
    }
  });
}
// ——— THEME HELPERS ———
function _tplRoot() {
  // Put vars on :root so every page/file (booking flow too) can read them
  return document.documentElement;
}

function _toHexColor(c) {
  // accepts "rgb(15, 18, 32)" or "#0f1220" → returns a hex "#rrggbb"
  if (!c) return '#000000';
  c = String(c).trim();
  if (c.startsWith('#')) return c.length === 4
    ? '#' + c[1]+c[1] + c[2]+c[2] + c[3]+c[3]
    : c.slice(0,7);
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return '#000000';
  const toHex = (n) => Number(n).toString(16).padStart(2,'0');
  return '#' + toHex(m[1]) + toHex(m[2]) + toHex(m[3]);
}

function applySavedThemeColors(shell, values = {}) {
  const root = _tplRoot();
  const saved = {
    bg:     values.themeBg,
    paper:  values.themePaper,
    ink:    values.themeInk,
    accent: values.themeAccent
  };
  Object.entries(saved).forEach(([k,v]) => {
    if (v) root.style.setProperty(`--${k === 'bg' ? 'bg' : k}`, v);
  });
}

function enableThemeEditor(shell, values = {}) {
  const root = _tplRoot();
  if (document.getElementById('ss-theme-bar')) return; // one only

  // one-off styles for the bar
  if (!document.getElementById('ss-theme-bar-style')) {
    const st = document.createElement('style');
    st.id = 'ss-theme-bar-style';
    st.textContent = `
      #ss-theme-bar{position:sticky;top:0;z-index:80;background:#fff;color:#111;border-bottom:1px solid #eee}
      #ss-theme-bar .wrap{max-width:1200px;margin:0 auto;display:flex;gap:14px;align-items:center;justify-content:flex-end;padding:8px 12px}
      #ss-theme-bar label{display:inline-flex;align-items:center;gap:6px;font-weight:600}
      #ss-theme-bar input[type="color"]{inline-size:32px; block-size:24px; border:1px solid #ddd; border-radius:6px; padding:0}
      #ss-theme-bar button{border:1px solid #ddd;border-radius:8px;background:#fafafa;padding:6px 10px;cursor:pointer}
      #ss-theme-bar button:hover{background:#f0f0f0}
    `;
    document.head.appendChild(st);
  }

  // current (computed) colors to initialize pickers
  const cs = getComputedStyle(root);
  const curBg     = _toHexColor(cs.getPropertyValue('--bg')     || '#0f1220');
  const curPaper  = _toHexColor(cs.getPropertyValue('--paper')  || '#151a2b');
  const curInk    = _toHexColor(cs.getPropertyValue('--ink')    || '#e7ecf7');
  const curAccent = _toHexColor(cs.getPropertyValue('--accent') || '#7c8aff');

  // UI
  const bar = document.createElement('div');
  bar.id = 'ss-theme-bar';
  bar.innerHTML = `
    <div class="wrap">
      <label>Background <input id="th-bg" type="color" value="${curBg}"></label>
      <label>Paper <input id="th-paper" type="color" value="${curPaper}"></label>
      <label>Text <input id="th-ink" type="color" value="${curInk}"></label>
      <label>Accent <input id="th-accent" type="color" value="${curAccent}"></label>
      <button id="th-reset" type="button">Reset</button>
    </div>
  `;
  document.body.prepend(bar);

async function setVarSave(k, val, keyName) {
  root.style.setProperty(k, val);
  await window.saveBusinessValues?.({ [keyName]: val });
  try { localStorage.setItem('ss:' + keyName, val); } catch {}
}


  // events
  bar.querySelector('#th-bg')    .addEventListener('input', (e)=> setVarSave('--bg',     e.target.value, 'themeBg'));
  bar.querySelector('#th-paper') .addEventListener('input', (e)=> setVarSave('--paper',  e.target.value, 'themePaper'));
  bar.querySelector('#th-ink')   .addEventListener('input', (e)=> setVarSave('--ink',    e.target.value, 'themeInk'));
  bar.querySelector('#th-accent').addEventListener('input', (e)=> setVarSave('--accent', e.target.value, 'themeAccent'));

// inside enableThemeEditor(...)
bar.querySelector('#th-reset').addEventListener('click', async () => {
  // 1) remove inline overrides → revert to CSS defaults
  ['--bg','--paper','--ink','--accent','--muted','--line']
    .forEach(v => root.style.removeProperty(v));

  // 2) clear persisted values in your backend
  await window.saveBusinessValues?.({
    themeBg:'', themePaper:'', themeInk:'', themeAccent:'',
    themeMuted:'', themeLine:''
  });

  // 3) ⬇️ CLEAR THE MIRROR in localStorage (put it RIGHT HERE)
  try {
    ['themeBg','themePaper','themeInk','themeAccent','themeMuted','themeLine']
      .forEach(k => localStorage.removeItem('ss:' + k));
  } catch {}

  // 4) reset pickers to computed defaults
  const cs2 = getComputedStyle(root);
  bar.querySelector('#th-bg')    .value = _toHexColor(cs2.getPropertyValue('--bg')     || '#0f1220');
  bar.querySelector('#th-paper') .value = _toHexColor(cs2.getPropertyValue('--paper')  || '#151a2b');
  bar.querySelector('#th-ink')   .value = _toHexColor(cs2.getPropertyValue('--ink')    || '#e7ecf7');
  bar.querySelector('#th-accent').value = _toHexColor(cs2.getPropertyValue('--accent') || '#7c8aff');
});

}


// Make a <figure> (wrapper) with an inner <img> resizable via side handles.
// Saves width/height to the given keys (e.g., 'policyImage1W' / 'policyImage1H').
function makeImageResizable(fig, img, { wKey, hKey }) {
  if (!fig || !img) return;

  fig.classList.add('ss-resizable');

  // Ensure the figure has explicit size; make the image fill it.
  if (!fig.style.width)  fig.style.width  = (img.clientWidth  || 320) + 'px';
  if (!fig.style.height) fig.style.height = (img.clientHeight || 180) + 'px';
  img.style.width  = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';

  // Create 4 handles
  ['e','w','n','s'].forEach(dir => {
    const h = document.createElement('div');
    h.className = 'ss-rh ss-rh-' + dir;
    fig.appendChild(h);
    h.addEventListener('mousedown', start(dir));
  });

  function start(dir) {
    return (e) => {
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const startW = fig.offsetWidth, startH = fig.offsetHeight;

      function onMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let w = startW, h = startH;
        if (dir === 'e') w = Math.max(80, startW + dx);
        if (dir === 'w') w = Math.max(80, startW - dx);
        if (dir === 's') h = Math.max(80, startH + dy);
        if (dir === 'n') h = Math.max(80, startH - dy);
        fig.style.width  = w + 'px';
        fig.style.height = h + 'px';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        window.saveBusinessValues?.({ [wKey]: fig.style.width, [hKey]: fig.style.height });
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
  }
}

// Hide sections that were previously removed (persisted in Business.values.hiddenSections)
// Hide sections that were previously removed (persisted in Business.values.hiddenSections)
function applyHiddenSections(shell, values = {}) {
  let hidden = [];
  try {
    hidden = Array.isArray(values.hiddenSections)
      ? values.hiddenSections
      : JSON.parse(values.hiddenSections || '[]');
  } catch (_) { hidden = []; }

  hidden.forEach(id => {
    const el = id && shell.querySelector('#' + id);
    if (el) {
      el.dataset.hidden = '1';
      el.style.display = 'none'; // hide instead of remove
    }
  });
}

// Map which saved keys belong to which section (used for "Restore empty")
const SECTION_IMAGE_KEYS = {
  'tpl-styles':   ['stylesImage'],
  'tpl-gallery':  ['galleryUrls'], 
  'tpl-location': ['locationImage'],
  'tpl-image-1':  ['promoImage','image1'],
  'tpl-image-2':  ['featureImage','image2'],
  'tpl-policy':   ['policyImage1','policyImage2','policyImage3']
};

// Small restore bar that lists hidden sections with two buttons
function enableRestoreBar(shell, values = {}) {
  // one-off styles
  if (!document.getElementById('ss-restore-style')) {
    const st = document.createElement('style');
    st.id = 'ss-restore-style';
    st.textContent = `
      #ss-restore-bar{position:sticky;top:44px;z-index:81;background:#fff;color:#111;border-bottom:1px solid #eee}
      #ss-restore-bar .wrap{max-width:1200px;margin:0 auto;padding:8px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
      #ss-restore-bar .pill{display:flex;gap:6px;align-items:center;background:#f7f7f7;border:1px solid #e5e5e5;border-radius:999px;padding:4px 8px}
      #ss-restore-bar .pill strong{font-weight:700}
      #ss-restore-bar button{border:1px solid #ddd;border-radius:999px;background:#fafafa;padding:4px 8px;cursor:pointer}
      #ss-restore-bar button:hover{background:#f0f0f0}
    `;
    document.head.appendChild(st);
  }

  let hidden = [];
  try {
    hidden = Array.isArray(values.hiddenSections)
      ? values.hiddenSections
      : JSON.parse(values.hiddenSections || '[]');
  } catch (_) { hidden = []; }

  if (!hidden.length) return;

  const bar = document.createElement('div');
  bar.id = 'ss-restore-bar';
  bar.innerHTML = `<div class="wrap"></div>`;
  document.body.prepend(bar);
  const wrap = bar.querySelector('.wrap');

  const saveHidden = async (arr) => {
    const uniq = Array.from(new Set(arr));
    await window.saveBusinessValues?.({ hiddenSections: JSON.stringify(uniq) });
    hidden = uniq;
  };

  hidden.forEach(id => {
    const pill = document.createElement('div');
    pill.className = 'pill';
    pill.innerHTML = `<strong>${id}</strong>`;

    const keepBtn  = document.createElement('button');
    keepBtn.type = 'button';
    keepBtn.textContent = 'Restore';

    const emptyBtn = document.createElement('button');
    emptyBtn.type = 'button';
    emptyBtn.textContent = 'Restore empty';

    keepBtn.addEventListener('click', async () => {
      const sec = shell.querySelector('#' + id);
      if (!sec) return;
      sec.style.display = '';
      delete sec.dataset.hidden;
      await saveHidden(hidden.filter(x => x !== id));
      pill.remove();
      if (!wrap.children.length) bar.remove();
    });

    emptyBtn.addEventListener('click', async () => {
      // clear saved image keys
      const keys = SECTION_IMAGE_KEYS[id] || [];
      const payload = {};
      keys.forEach(k => payload[k] = '');
      if (Object.keys(payload).length) {
        await window.saveBusinessValues?.(payload);
      }
      const sec = shell.querySelector('#' + id);
      if (sec) { sec.style.display = ''; delete sec.dataset.hidden; }
      await saveHidden(hidden.filter(x => x !== id));
      pill.remove();
      if (!wrap.children.length) bar.remove();
    });

    pill.appendChild(keepBtn);
    pill.appendChild(emptyBtn);
    wrap.appendChild(pill);
  });
}

// Add an "×" button to removable sections in edit mode and persist hide/show
function enableSectionRemover(shell, values = {}) {
  const removableIds = [
    'tpl-styles',
    'tpl-gallery', 
    'tpl-location',
    'tpl-image-1',
    'tpl-image-2',
    'tpl-policy',   // ← the whole 3-image section
    // 'tpl-logo',   // include if you really want the logo removable
  ];

  let hidden = [];
  try {
    hidden = Array.isArray(values.hiddenSections)
      ? values.hiddenSections
      : JSON.parse(values.hiddenSections || '[]');
  } catch (_) { hidden = []; }

  const saveHidden = async (arr) => {
    const uniq = Array.from(new Set(arr));
    await window.saveBusinessValues?.({ hiddenSections: JSON.stringify(uniq) });
    hidden = uniq;
    // refresh the restore bar after changes
    enableRestoreBar(shell, { ...values, hiddenSections: uniq });
  };

  removableIds.forEach(id => {
    const sec = shell.querySelector('#' + id);
    if (!sec) return;

    // already hidden? keep hidden and skip pin
    if (hidden.includes(id)) {
      sec.dataset.hidden = '1';
      sec.style.display = 'none';
      return;
    }

    // anchor + put the X on LEFT so it doesn't collide with the "+" upload pin on the right
    if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tpl-remove-pin';
    btn.title = 'Remove section';
    btn.innerHTML = '×';
    btn.setAttribute('aria-label','Remove section');
    btn.style.left = '10px';
    btn.style.right = 'auto';
    btn.style.zIndex = '50';
    sec.appendChild(btn);

    btn.addEventListener('click', async () => {
      if (!confirm('Remove this section? You can restore it from the bar at the top.')) return;
      sec.dataset.hidden = '1';
      sec.style.display = 'none';
      await saveHidden([...hidden, id]);
    });
  });

  // render the bar if anything is already hidden
  enableRestoreBar(shell, values);
}

//////////////////////////////////////////////////////////////////////////
// ---- Template init/destroy
registerTemplate("spotlight", {
  init({ values = {}, shell }) {
    const off = [];
    const isEdit = new URLSearchParams(location.search).get('edit') === '1';
    if (isEdit) document.body.dataset.edit = '1';

    // theme + previously removed sections
    applySavedThemeColors(shell, values);
    applyHiddenSections?.(shell, values); // requires the helpers we added earlier

    // ---- edit-only affordances (pins, theme bar, section remover)
    if (isEdit) {
      // image pins
      enableSectionImagePin(shell, { sectionSel:'#tpl-styles',   imgSel:'#tpl-styles-img',   saveKey:'stylesImage'   });
      enableSectionImagePin(shell, { sectionSel:'#tpl-location', imgSel:'#tpl-location-img', saveKey:'locationImage' });
      enableSectionImagePin(shell, { sectionSel:'#tpl-image-1',  imgSel:'#tpl-image-1-img',  saveKey:'promoImage'    });
      enableSectionImagePin(shell, { sectionSel:'#tpl-image-2',  imgSel:'#tpl-image-2-img',  saveKey:'featureImage'  });
      enableSectionImagePin(shell, { sectionSel:'#tpl-policy-fig-1', imgSel:'#tpl-policy-img-1', saveKey:'policyImage1' });
      enableSectionImagePin(shell, { sectionSel:'#tpl-policy-fig-2', imgSel:'#tpl-policy-img-2', saveKey:'policyImage2' });
      enableSectionImagePin(shell, { sectionSel:'#tpl-policy-fig-3', imgSel:'#tpl-policy-img-3', saveKey:'policyImage3' });

      enableThemeEditor(shell, values);
if (typeof enableSectionRemover === 'function') {
  enableSectionRemover(shell, values);
}


    }

    // ---- elements
    const burger  = $("#tpl-burger", shell);
    const drawer  = $("#tpl-drawer", shell);
    const scrim   = $("#tpl-drawer-scrim", shell);
    const contactModal = $("#tpl-contact-modal", shell);
    const contactClose = $("#tpl-contact-close", shell);
    const contactScrim = $("#tpl-contact-scrim", shell);

    // drawer
    const openDrawer  = () => drawer?.classList.add("is-open");
    const closeDrawer = () => drawer?.classList.remove("is-open");
    off.push(on(burger, "click", () => (drawer?.classList.contains("is-open") ? closeDrawer() : openDrawer())));
    off.push(on(scrim, "click", closeDrawer));
    shell.querySelectorAll('.tpl-drawer__item[data-target]').forEach(btn => {
      off.push(on(btn, "click", () => {
        const id = btn.getAttribute("data-target");
        const sec = id && document.getElementById(id);
        closeDrawer();
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    });

    // contact modal
    const contactBtn = shell.querySelector('.tpl-drawer__item[data-action="contact"]');
    const openContact  = () => contactModal?.setAttribute("aria-hidden", "false");
    const closeContact = () => contactModal?.setAttribute("aria-hidden", "true");
    off.push(on(contactBtn, "click", () => { closeDrawer(); openContact(); }));
    off.push(on(contactClose, "click", closeContact));
    off.push(on(contactScrim, "click", closeContact));
    off.push(on(document, "keydown", (e) => { if (e.key === "Escape") closeContact(); }));

    // ---- hydrate static images
    const setImg = (el, val) => { if (!el) return; const u = toUrl(val); if (u) { el.src = u; el.style.display = ""; } else { el.style.display = "none"; } };
    setImg($("#tpl-logo-img", shell),      values.logoUrl || values.Logo || values.logo);
    setImg($("#tpl-styles-img", shell),    values.stylesImage || values.stylesImg || values.stylesUrl);
    setImg($("#tpl-location-img", shell),  values.locationImage || values.cityStateImg || values.locationBanner);
    setImg($("#tpl-image-1-img", shell),   values.promoImage || values.promoImg || values.image1 || values["Image 1"]);
    setImg($("#tpl-image-2-img", shell),   values.featureImage || values.featureImg || values.image2 || values["Image 2"]);
    setImg($("#tpl-policy-img-1", shell),  values.policyImage1);
    setImg($("#tpl-policy-img-2", shell),  values.policyImage2);
    setImg($("#tpl-policy-img-3", shell),  values.policyImage3);

    // ---- policy-image resizers (edit mode)
    const fig1 = $('#tpl-policy-fig-1', shell), img1 = $('#tpl-policy-img-1', shell);
    const fig2 = $('#tpl-policy-fig-2', shell), img2 = $('#tpl-policy-img-2', shell);
    const fig3 = $('#tpl-policy-fig-3', shell), img3 = $('#tpl-policy-img-3', shell);

    // apply saved sizes
    if (fig1) { if (values.policyImage1W) fig1.style.width  = values.policyImage1W;
                if (values.policyImage1H) fig1.style.height = values.policyImage1H; }
    if (fig2) { if (values.policyImage2W) fig2.style.width  = values.policyImage2W;
                if (values.policyImage2H) fig2.style.height = values.policyImage2H; }
    if (fig3) { if (values.policyImage3W) fig3.style.width  = values.policyImage3W;
                if (values.policyImage3H) fig3.style.height = values.policyImage3H; }

    if (isEdit) {
      if (fig1 && img1) makeImageResizable(fig1, img1, { wKey:'policyImage1W', hKey:'policyImage1H' });
      if (fig2 && img2) makeImageResizable(fig2, img2, { wKey:'policyImage2W', hKey:'policyImage2H' });
      if (fig3 && img3) makeImageResizable(fig3, img3, { wKey:'policyImage3W', hKey:'policyImage3H' });
    }

    // ---- gallery
    const cleanupGallery = enableGallery(shell, values, { edit: isEdit });
    if (cleanupGallery) off.push(cleanupGallery);

    // ---- logo uploader
    if (isEdit) enableLogoUploader(shell, values);

    this.__off = off;
  },

  destroy() {
    (this.__off || []).forEach(fn => { try { fn(); } catch {} });
    this.__off = [];
  }
});

})();
