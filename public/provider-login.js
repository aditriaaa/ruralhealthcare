function el(id) { return document.getElementById(id); }
const t = (key, params) => (window.appI18n ? window.appI18n.t(key, params) : key);

function setStatus(message, isError) {
  const status = el('providerLoginStatus');
  status.textContent = message;
  status.style.color = isError ? '#8d2626' : '#2b4c20';
}

async function sendAuth(path, payload) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error(t('error.networkUnavailable'));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || t('error.requestFailed'));
  }
  return data;
}

async function loginProvider() {
  const username = el('providerLoginUsername').value.trim();
  const password = el('providerLoginPassword').value;
  if (!username || !password) {
    setStatus(t('auth.usernamePasswordRequired'), true);
    return;
  }

  setStatus(t('auth.loggingIn'), false);
  try {
    const data = await sendAuth('/api/provider/login', { username, password });
    localStorage.setItem('providerAuthToken', data.token);
    localStorage.setItem('providerUsername', data.username || username.toLowerCase());
    window.location.href = '/provider.html';
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function registerProvider() {
  const username = el('providerLoginUsername').value.trim();
  const password = el('providerLoginPassword').value;
  if (!username || !password) {
    setStatus(t('auth.createNeedCredentials'), true);
    return;
  }

  setStatus(t('auth.creatingAccount'), false);
  try {
    await sendAuth('/api/provider/register', { username, password });
    setStatus(t('auth.accountCreated'), false);
  } catch (err) {
    setStatus(err.message, true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  el('providerLoginBtn').addEventListener('click', loginProvider);
  el('providerRegisterBtn').addEventListener('click', registerProvider);
  el('providerLoginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginProvider();
  });
});
