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
  return { base, getToken, setToken, clearToken, authFetch };
})();
