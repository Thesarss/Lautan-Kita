window.API = (function(){
  const base = 'http://localhost:4000';
  const getToken = () => localStorage.getItem('auth_token');
  const setToken = (t) => localStorage.setItem('auth_token', t);
  const clearToken = () => localStorage.removeItem('auth_token');
  async function authFetch(path, options={}){
    const headers = Object.assign({}, options.headers || {});
    const t = getToken();
    if (t) headers.Authorization = 'Bearer ' + t;
    return fetch(base + path, Object.assign({}, options, { headers }));
  }
  function ensureModalStyle(){
    if (document.getElementById('app-modal-style')) return;
    const css = `
      .app-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:none;align-items:center;justify-content:center;z-index:3000}
      .app-modal{background:#fff;border-radius:12px;padding:20px;width:92%;max-width:420px;box-shadow:0 12px 28px rgba(0,0,0,0.2)}
      .app-modal h3{margin:0 0 8px;font-size:18px;color:#07304A}
      .app-modal p{margin:0;color:#4b6a84}
      .app-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
      .btn-primary{background:#0077B6;color:#fff;border:none;border-radius:10px;padding:10px 16px;cursor:pointer}
      .btn-secondary{background:#e5e7eb;color:#111827;border:none;border-radius:10px;padding:10px 16px;cursor:pointer}
    `;
    const style = document.createElement('style');
    style.id = 'app-modal-style';
    style.textContent = css;
    document.head.appendChild(style);
  }
  function showModal(opts){
    ensureModalStyle();
    const old = document.getElementById('appModalBackdrop');
    if (old) old.remove();
    const bd = document.createElement('div');
    bd.id = 'appModalBackdrop';
    bd.className = 'app-modal-backdrop';
    const box = document.createElement('div');
    box.className = 'app-modal';
    const h = document.createElement('h3');
    h.id = 'appModalTitle';
    h.textContent = (opts && opts.title) || 'Informasi';
    const p = document.createElement('p');
    p.id = 'appModalMessage';
    p.textContent = (opts && opts.message) || '';
    const actions = document.createElement('div');
    actions.id = 'appModalActions';
    actions.className = 'app-modal-actions';
    const acts = (opts && opts.actions) || [{ label: 'OK', variant: 'primary', handler: hideModal }];
    acts.forEach(function(act){
      const btn = document.createElement('button');
      btn.className = act.variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
      btn.textContent = act.label || 'OK';
      btn.onclick = function(){ if (typeof act.handler === 'function') act.handler(); };
      actions.appendChild(btn);
    });
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(actions);
    bd.appendChild(box);
    document.body.appendChild(bd);
    bd.style.display = 'flex';
  }
  function hideModal(){
    const bd = document.getElementById('appModalBackdrop');
    if (bd) bd.remove();
  }
  return { base, getToken, setToken, clearToken, authFetch, showModal, hideModal };
})();
