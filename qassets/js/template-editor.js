(function () {
  const css = `
  .te-toolbar {
    position: fixed; top: 16px; right: 16px; z-index: 9999;
    display:flex; gap:8px; background:#0b0e1a; color:#e7ecf7;
    border:1px solid #2a3350; border-radius:12px; padding:8px 10px;
    box-shadow:0 8px 24px rgba(0,0,0,.25); font: 500 14px/1.2 system-ui, sans-serif;
  }
  .te-btn {
    border:1px solid #2a3350; background:#151a2b; color:#e7ecf7;
    border-radius:8px; padding:6px 10px; cursor:pointer;
  }
  .te-sidebar {
    position: fixed; top:0; right:0; width:min(360px, 90vw); height:100vh;
    background:#0b0e1a; color:#e7ecf7; border-left:1px solid #2a3350; z-index: 9998;
    transform: translateX(100%); transition: transform .2s;
    display:flex; flex-direction:column;
  }
  .te-sidebar.is-open { transform: none; }
  .te-side-head { padding:12px 14px; border-bottom:1px solid #2a3350; font-weight:700; }
  .te-side-body { padding:12px 14px; overflow:auto; display:grid; gap:12px; }
  .te-field { display:grid; gap:6px; }
  .te-label { font-size:12px; color:#9aa7bd; }
  .te-input, .te-textarea {
    width:100%; background:#151a2b; color:#e7ecf7; border:1px solid #2a3350;
    border-radius:8px; padding:8px 10px;
  }
  .te-drop {
    border:2px dashed #2a3350; border-radius:10px; padding:10px; text-align:center; color:#9aa7bd;
  }
  .te-highlight {
    outline: 2px dashed #7c8aff; outline-offset: 2px; border-radius:6px;
  }
  `;

  function injectStyles() {
    if (document.getElementById('te-styles')) return;
    const s = document.createElement('style');
    s.id = 'te-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function el(tag, props={}, children=[]) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    children.forEach(c => n.appendChild(c));
    return n;
  }

  function findImage(el) {
    if (!el) return null;
    if (el.tagName === 'IMG') return el;
    return el.querySelector('img');
  }

  // naive upload stub – adapt to your endpoint
  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/uploads', { method:'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    // accept { url } or { path } or plain string
    return json.url || json.path || json.filename || json.name || '';
  }

  function makeSidebar() {
    const root = el('aside', { className: 'te-sidebar', id: 'te-sidebar' }, [
      el('div', { className: 'te-side-head', textContent: 'Template Editor' }),
      el('div', { className: 'te-side-body', id: 'te-side-body' }),
    ]);
    document.body.appendChild(root);
    return root;
  }

  function makeToolbar() {
    const bar = el('div', { className:'te-toolbar' }, [
      el('button', { className:'te-btn', id:'te-toggle-side', textContent:'Fields' }),
      el('button', { className:'te-btn', id:'te-save', textContent:'Save' }),
      el('button', { className:'te-btn', id:'te-exit', textContent:'Exit Edit' })
    ]);
    document.body.appendChild(bar);
    return bar;
  }

  function buildFields(sideBody, nodes, state) {
    sideBody.innerHTML = '';
    nodes.forEach(node => {
      const type = node.dataset.edit;
      const key  = node.dataset.key || '';
      const label= node.dataset.label || key || '(unnamed)';
      const field = el('div', { className:'te-field' }, [
        el('div', { className:'te-label', textContent: label })
      ]);

      if (type === 'text' || type === 'icon') {
        const ta = el('textarea', { className:'te-textarea', rows:2, value: node.textContent });
        ta.addEventListener('input', () => {
          node.textContent = ta.value;
          state.values[key] = ta.value;
        });
        field.appendChild(ta);
      }

      if (type === 'image') {
        const drop = el('div', { className:'te-drop', innerHTML:'Drop image here or <b>click to choose</b>' });
        drop.addEventListener('click', async () => {
          const inp = el('input', { type:'file', accept:'image/*' });
          inp.onchange = async () => {
            const file = inp.files?.[0]; if (!file) return;
            const url = await uploadFile(file);
            const img = findImage(node);
            if (img) img.src = url;
            state.values[key] = url;
          };
          inp.click();
        });
        ;['dragover','dragenter'].forEach(ev => drop.addEventListener(ev, e=>{ e.preventDefault(); drop.style.borderColor='#7c8aff'; }));
        ;['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e=>{ e.preventDefault(); drop.style.borderColor=''; }));
        drop.addEventListener('drop', async e => {
          e.preventDefault();
          const file = e.dataTransfer?.files?.[0]; if (!file) return;
          const url = await uploadFile(file);
          const img = findImage(node);
          if (img) img.src = url;
          state.values[key] = url;
        });
        field.appendChild(drop);
      }

      sideBody.appendChild(field);
    });
  }

  function attachInlineEditing(nodes, state) {
    nodes.forEach(node => {
      const type = node.dataset.edit;
      const key  = node.dataset.key;
      node.classList.add('te-highlight');

      if (type === 'text' || type === 'icon') {
        node.addEventListener('dblclick', () => {
          node.contentEditable = 'true';
          node.focus();
        });
        node.addEventListener('blur', () => {
          node.contentEditable = 'false';
          state.values[key] = node.textContent;
        });
      }

      if (type === 'image') {
        const img = findImage(node);
        const onDrop = async (e) => {
          e.preventDefault();
          const file = e.dataTransfer?.files?.[0]; if (!file) return;
          const url = await uploadFile(file);
          if (img) img.src = url;
          state.values[key] = url;
        };
        ;['dragover','dragenter'].forEach(ev => node.addEventListener(ev, e=>{ e.preventDefault(); node.style.outlineColor='#7c8aff'; }));
        ;['dragleave','drop'].forEach(ev => node.addEventListener(ev, e=>{ e.preventDefault(); node.style.outlineColor=''; }));
        node.addEventListener('drop', onDrop);
      }
    });
  }

  window.TemplateEditor = {
    async init({ root=document, values={}, getKey=(el)=>el.dataset.key, onSave=async()=>{} } = {}) {
      injectStyles();

      // Collect editable nodes inside the template shell
      const nodes = Array.from(root.querySelectorAll('[data-edit]'))
        .filter(n => getKey(n));

      // Local state (copy of values to mutate)
      const state = { values: { ...(values||{}) } };

      // Sidebar + toolbar
      const sidebar = makeSidebar();
      const sideBody = sidebar.querySelector('#te-side-body');
      buildFields(sideBody, nodes, state);
      attachInlineEditing(nodes, state);

      const toolbar = makeToolbar();
      toolbar.querySelector('#te-toggle-side').onclick = () => {
        sidebar.classList.toggle('is-open');
      };
      toolbar.querySelector('#te-exit').onclick = () => {
        // simply remove editor UI highlights
        nodes.forEach(n => n.classList.remove('te-highlight'));
        sidebar.remove();
        toolbar.remove();
      };
      toolbar.querySelector('#te-save').onclick = async () => {
        try {
          toolbar.querySelector('#te-save').textContent = 'Saving…';
          await onSave(state.values);
        } finally {
          toolbar.querySelector('#te-save').textContent = 'Save';
        }
      };
    }
  };
})();
