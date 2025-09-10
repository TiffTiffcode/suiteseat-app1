
//Reusable tools
/* ========= tiny utils ========= */
const uid = () => Math.random().toString(36).slice(2,9);
const $ = (sel, root=document) => root.querySelector(sel);
const makeEl = (tag, cls='', attrs={}) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
  return el;
};

                     /* ========= drag source (palette) ========= */
document.querySelectorAll('.item[draggable="true"]').forEach(it => {
  it.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      src: 'palette',
      type: it.dataset.type
    }));
  });

  // Mobile/click add → drop into main canvas
  it.addEventListener('click', () => addFromPalette(it.dataset.type, $('#canvas')));
});

function addFromPalette(type, target) {
  const node = createNode(type);
  if (!node) return;

  if (!accepts(target, type)) {
    // optional: give feedback instead of silently doing nothing
    // alert(`"${type}" is not allowed here`);
    return;
  }

  target.appendChild(node);
  wireDroppables(node); // make any nested .droppable inside this node active
  node.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

                      /* ========= drop targets ========= */
function accepts(target, type){
  const list = (target.dataset.accept || '').split(',').map(s=>s.trim()).filter(Boolean);
  return list.includes(type) || list.includes('*');
}

function wireDroppables(root=document){
  root.querySelectorAll('.droppable').forEach(zone=>{
    zone.addEventListener('dragover', (e)=>{
      const payload = readPayload(e);
      if (!payload) return;
      if (accepts(zone, payload.type)){ e.preventDefault(); zone.classList.add('is-over'); }
    });
    ['dragleave','drop'].forEach(ev=> zone.addEventListener(ev, ()=> zone.classList.remove('is-over')));

    zone.addEventListener('drop', (e)=>{
      const payload = readPayload(e);
      if (!payload) return;
      e.preventDefault();
      if (!accepts(zone, payload.type)) return;

      // moving an existing node?
      if (payload.src === 'move' && payload.id){
        const moving = document.querySelector(`[data-id="${payload.id}"]`);
        if (moving) zone.appendChild(moving);
        return;
      }
      // new from palette
      addFromPalette(payload.type, zone);
    });
  });

  // make existing nodes draggable (to move between containers)
  root.querySelectorAll('[data-draggable="true"]').forEach(el=>{
    if (el.__wired) return;
    el.__wired = true;
    el.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('text/plain', JSON.stringify({src:'move', id: el.dataset.id, type: el.dataset.type}));
    });
  });
}
function readPayload(e){
  try { return JSON.parse(e.dataTransfer.getData('text/plain') || '{}'); } catch { return null; }
}




  /* ========= node factories ========= */
function createNode(type){
  if (type === 'section'){
    // Section can accept rows, images, text, and bookingflow directly
    const sec = makeEl('section', 'node section droppable', {
      'data-type':'section',
      'data-id': uid(),
      'data-accept':'group2,image,text,bookingflow'
    });
    sec.innerHTML = `<div class="title">Section</div>`;
    addRemovePin(sec);
    return sec;
  }

  if (type === 'group2'){
    // A 2-column row; each slot can accept image, text, bookingflow
    const row = makeEl('div','row cols-2',{'data-type':'group','data-id':uid()});
    ['left','right'].forEach(()=> {
      const g = makeEl('div','group droppable', {
        'data-type':'group-slot',
        'data-accept':'image,text,bookingflow'
      });
      row.appendChild(g);
    });
    addRemovePin(row);
    return row;
  }

  if (type === 'text'){
    const b = makeEl('div','block text',{'data-type':'text','data-id':uid(),'data-draggable':'true'});
    b.innerHTML = `<div class="t" contenteditable="true">Type your text…</div>`;
    addRemovePin(b);
    return b;
  }

  if (type === 'image'){
    const b = makeEl('div','block image',{'data-type':'image','data-id':uid(),'data-draggable':'true'});
    const ph = makeEl('div','ph'); ph.textContent = 'Click to upload image';
    const img = new Image(); img.style.display='none';
    b.appendChild(ph); b.appendChild(img);
    b.addEventListener('click', async ()=>{
      const input = document.createElement('input');
      input.type='file'; input.accept='image/*';
      input.onchange = async ()=>{
        const file = input.files?.[0]; if (!file) return;
        const url = URL.createObjectURL(file);
        img.src = url; img.style.display='block'; ph.style.display='none';
        // Hook uploader later if you want persistence.
      };
      input.click();
    });
    addRemovePin(b);
    return b;
  }

  if (type === 'header'){
    const h = makeEl('div','block header',{'data-type':'header','data-id':uid()});
    h.innerHTML = `
      <div class="brand">
        <div class="burger">≡</div>
        <strong contenteditable="true">Brand</strong>
      </div>
      <div class="auth">
        <button class="btn">Log in</button>
        <button class="btn">Sign up</button>
      </div>
    `;
    addRemovePin(h);
    return h;
  }

  // ✅ New: Booking Flow (placeholder for now)
  if (type === 'bookingflow'){
    const wrap = makeEl('div','block bookingflow', {
      'data-type':'bookingflow',
      'data-id': uid(),
      'data-draggable':'true'
    });
    wrap.innerHTML = `
      <h3>Booking Flow</h3>
      <p>Placeholder – drop your real booking UI here later.</p>
    `;
    addRemovePin(wrap);
    return wrap;
  }

  return null;
}

function addRemovePin(el){
  const x = makeEl('button','x'); x.type='button'; x.textContent='×';
  x.addEventListener('click', ()=> el.remove());
  el.appendChild(x);
}







/* ========= Save / Load ========= */
function serialize(){
  const walk = (node)=>{
    const type = node.dataset.type;
    const id   = node.dataset.id || uid();
    node.dataset.id = id;

    if (type === 'section'){
      return {
        t:'section', id,
        kids: Array.from(node.children)
          .filter(c => c.classList.contains('row') || c.classList.contains('block'))
          .map(walk)
      };
    }
    if (node.classList.contains('row')){
      return {
        t:'group2', id,
        kids: Array.from(node.querySelectorAll(':scope > .group')).map(g=>({
          t:'slot', kids: Array.from(g.children).filter(c=>c.classList.contains('block')).map(walk)
        }))
      };
    }
    if (type === 'text'){
      return { t:'text', id, html: node.querySelector('[contenteditable]').innerHTML };
    }
    if (type === 'image'){
      const img = node.querySelector('img');
      return { t:'image', id, src: img?.src || '' };
    }
    if (type === 'header'){
      return { t:'header', id,
        brand: node.querySelector('strong')?.innerText || 'Brand'
      };
    }
    return null;
  };

  const doc = {
    ver:1,
    body: Array.from($('#canvas').children).map(walk).filter(Boolean)
  };
  return doc;
}

function hydrate(doc){
  $('#canvas').innerHTML = '';
  (doc.body || []).forEach(node => $('#canvas').appendChild(build(node)));
  wireDroppables(document);
}

function build(node){
  switch(node.t){
    case 'section': {
      const sec = createNode('section');
      const container = sec; // children can be row or block
      (node.kids||[]).forEach(k => container.appendChild(build(k)));
      return sec;
    }
    case 'group2': {
      const row = createNode('group2');
      const slots = Array.from(row.querySelectorAll(':scope > .group'));
      (node.kids||[]).forEach((slot, i)=>{
        const target = slots[i] || slots[0];
        (slot.kids||[]).forEach(k => target.appendChild(build(k)));
      });
      return row;
    }
    case 'text': {
      const b = createNode('text');
      b.querySelector('[contenteditable]').innerHTML = node.html || '…';
      return b;
    }
    case 'image': {
      const b = createNode('image');
      if (node.src){
        const img = b.querySelector('img');
        const ph = b.querySelector('.ph');
        img.src = node.src; img.style.display='block'; ph.style.display='none';
      }
      return b;
    }
    case 'header': {
      const h = createNode('header');
      if (node.brand) h.querySelector('strong').innerText = node.brand;
      return h;
    }
  }
  return document.createComment('unknown');
}

/* ========= wire global droppables + buttons ========= */
wireDroppables(document);

$('#btn-save').addEventListener('click', ()=>{
  const doc = serialize();
  localStorage.setItem('builder:doc', JSON.stringify(doc));
  // optional: also persist with your API
  // window.saveBusinessValues?.({ dragdropDocument: doc });
  alert('Saved!');
});

$('#btn-load').addEventListener('click', ()=>{
  try {
    const raw = localStorage.getItem('builder:doc');
    if (!raw) return alert('Nothing saved yet.');
    hydrate(JSON.parse(raw));
  } catch (e) { alert('Load failed.'); }
});

$('#btn-clear').addEventListener('click', ()=>{
  if (!confirm('Clear canvas?')) return;
  $('#canvas').innerHTML = '';
});
// ===== drag-and-drop.js =====

// 1) Node factory (add new element types here)
function createNode(type) {
  const node = document.createElement('div');
  node.classList.add('node', type);

  switch (type) {
    case 'header':
      node.innerHTML = `
        <div class="block header">
          <div class="brand"><strong>Your Brand</strong></div>
          <div class="auth">
            <button class="btn ghost">Login</button>
            <button class="btn">Book</button>
          </div>
        </div>
      `;
      break;

    case 'section':
      node.innerHTML = `
        <div class="section node section">
          <div class="title">Section</div>
          <div class="group droppable" data-accept="group2,image,text,bookingflow"></div>
        </div>
      `;
      break;

    case 'group2':
      node.innerHTML = `
        <div class="row cols-2">
          <div class="group droppable" data-accept="image,text,bookingflow"></div>
          <div class="group droppable" data-accept="image,text,bookingflow"></div>
        </div>
      `;
      break;

    case 'image':
      node.innerHTML = `
        <div class="block image">
          <div class="ph">Click to upload image</div>
        </div>
      `;
      break;

    case 'text':
      node.innerHTML = `
        <div class="block text">
          <div contenteditable="true">Edit this text…</div>
        </div>
      `;
      break;

    // ✅ Your new element
    case 'bookingflow':
      node.innerHTML = `
        <div class="block bookingflow">
          <h3>Booking Flow</h3>
          <p>This is a placeholder. The full booking UI will load here.</p>
        </div>
      `;
      break;

    default:
      node.innerHTML = `<div class="block">Unknown: ${type}</div>`;
  }
  return node;
}

// 2) Palette drag logic
document.querySelectorAll('.palette .item').forEach(el => {
  el.addEventListener('dragstart', e => {
    e.dataTransfer.setData('type', el.dataset.type);
  });
});

// 3) Make any .droppable accept drops
function wireDroppable(el) {
  el.addEventListener('dragover', e => {
    e.preventDefault();
    el.classList.add('is-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('is-over'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('is-over');

    const type = e.dataTransfer.getData('type');
    if (!type) return;

    // Respect allowed children if data-accept is present
    const accept = (el.dataset.accept || '').split(',').map(s => s.trim()).filter(Boolean);
    if (accept.length && !accept.includes(type)) return;

    const node = createNode(type);
    el.appendChild(node);

    // New droppable areas inside the node need wiring too
    node.querySelectorAll('.droppable').forEach(wireDroppable);
  });
}

// 4) Wire the main canvas and any existing droppables
document.querySelectorAll('.droppable').forEach(wireDroppable);

// (Optional) simple Save/Load/Clear (if your buttons exist)
const canvas = document.getElementById('canvas');
document.getElementById('btn-save')?.addEventListener('click', () => {
  localStorage.setItem('builder-html', canvas.innerHTML);
});
document.getElementById('btn-load')?.addEventListener('click', () => {
  const html = localStorage.getItem('builder-html');
  if (!html) return;
  canvas.innerHTML = html;
  // re-wire droppables after load
  canvas.querySelectorAll('.droppable').forEach(wireDroppable);
});
document.getElementById('btn-clear')?.addEventListener('click', () => {
  canvas.innerHTML = '';
});
