(async () => {
  const t = (key, params) => (window.appI18n ? window.appI18n.t(key, params) : key);

  const token = localStorage.getItem('providerAuthToken');
  if (!token) {
    window.location.href = '/provider-login.html';
    return;
  }

  try {
    const res = await fetch('/api/provider/session/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!res.ok) {
      localStorage.removeItem('providerAuthToken');
      localStorage.removeItem('providerUsername');
      window.location.href = '/provider-login.html';
      return;
    }

    const header = document.createElement('div');
    header.className = 'provider-auth-banner';
    const username = localStorage.getItem('providerUsername') || 'provider';
    header.innerHTML = '<span id="providerAuthBannerText"></span><button id="providerLogoutBtn" type="button"></button>';
    document.body.prepend(header);

    const bannerText = document.getElementById('providerAuthBannerText');
    const logoutBtn = document.getElementById('providerLogoutBtn');

    const applyBannerText = () => {
      if (bannerText) {
        bannerText.textContent = t('auth.loggedInAs', { username });
      }
      if (logoutBtn) {
        logoutBtn.textContent = t('auth.logOut');
      }
    };

    applyBannerText();
    if (window.appI18n && typeof window.appI18n.onLanguageChange === 'function') {
      window.appI18n.onLanguageChange(applyBannerText);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const currentToken = localStorage.getItem('providerAuthToken');
        try {
          await fetch('/api/provider/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: currentToken })
          });
        } catch {}

        localStorage.removeItem('providerAuthToken');
        localStorage.removeItem('providerUsername');
        window.location.href = '/provider-login.html';
      });
    }
  } catch {
    localStorage.removeItem('providerAuthToken');
    localStorage.removeItem('providerUsername');
    window.location.href = '/provider-login.html';
  }
})();
