const socket = io();

const PENDING_PATIENT_KEY = 'pendingPatientRequest';
const PENDING_MATCH_KEY = 'pendingPatientMatch';
const WAITING_POLL_MS = 12000;
const MEDICAL_OFFICE_RADIUS_KM = 20;

const t = (key, params) => (window.appI18n ? window.appI18n.t(key, params) : key);
let hasPendingNotification = false;

function el(id) {
  return document.getElementById(id);
}

function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isValidPendingPatient(data) {
  if (!data) return false;
  if (typeof data.name !== 'string') return false;
  if (!Number.isFinite(data.lat) || !Number.isFinite(data.lon)) return false;
  return true;
}

function setStatus(message) {
  const status = el('providersAreaStatus');
  if (status) status.textContent = message;
}

function applyNotifyButtonLabel() {
  const notifyBtn = el('availabilityNotifyBtn');
  if (!notifyBtn) return;
  notifyBtn.textContent = '🔔';
  notifyBtn.setAttribute('aria-label', t('providersInArea.providerAvailable'));
  notifyBtn.setAttribute('title', t('providersInArea.providerAvailable'));
}

function applyNotifyButtonState() {
  const notifyBtn = el('availabilityNotifyBtn');
  if (!notifyBtn) return;
  notifyBtn.classList.toggle('has-notification', hasPendingNotification);
  notifyBtn.setAttribute('aria-live', 'polite');
}

function formatDistance(distanceKm) {
  return `${Math.round(Number(distanceKm))} km`;
}

function openDirections(origin, destination) {
  if (!origin || !destination) return;
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lon)) return;
  if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lon)) return;

  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lon}`,
    destination: `${destination.lat},${destination.lon}`,
    travelmode: 'driving'
  });
  window.open(`https://www.google.com/maps/dir/?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

function renderMedicalOffices(offices, pendingPatient) {
  const container = el('providersList');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(offices) || offices.length === 0) {
    const none = document.createElement('p');
    none.className = 'providers-empty';
    none.textContent = t('providersInArea.medicalOfficesNone');
    container.appendChild(none);
    return;
  }

  offices.slice(0, 25).forEach((office) => {
    const card = document.createElement('article');
    card.className = 'medical-office-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('title', t('providersInArea.openDirections'));
    card.setAttribute('aria-label', `${office.name || t('providersInArea.medicalOfficeFallbackName')} - ${t('providersInArea.openDirections')}`);

    const title = document.createElement('h3');
    title.className = 'medical-office-name';
    title.textContent = office.name || t('providersInArea.medicalOfficeFallbackName');

    const meta = document.createElement('p');
    meta.className = 'medical-office-meta';
    meta.textContent = `${t('providersInArea.categoryLabel')}: ${office.category || t('providersInArea.categoryUnknown')}`;

    const distance = document.createElement('p');
    distance.className = 'medical-office-distance';
    distance.textContent = `${t('providersInArea.distanceLabel')}: ${formatDistance(office.distanceKm)}`;

    const onActivate = () => openDirections(pendingPatient, office);
    card.addEventListener('click', onActivate);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onActivate();
      }
    });

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(distance);
    container.appendChild(card);
  });
}

async function loadMedicalOffices(pendingPatient) {
  try {
    const params = new URLSearchParams({
      lat: String(pendingPatient.lat),
      lon: String(pendingPatient.lon),
      radiusKm: String(MEDICAL_OFFICE_RADIUS_KM)
    });
    const response = await fetch(`/api/medical-offices/nearby?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const offices = Array.isArray(data.offices) ? data.offices : [];
    renderMedicalOffices(offices, pendingPatient);
  } catch (err) {
    console.warn('Unable to load nearby medical offices', err);
    const container = el('providersList');
    if (!container) return;
    container.innerHTML = `<p class="providers-empty">${t('providersInArea.medicalOfficesError')}</p>`;
  }
}

function requestMatch(pendingPatient) {
  socket.emit('identify', {
    role: 'patient',
    name: pendingPatient.name || 'Patient',
    lat: pendingPatient.lat,
    lon: pendingPatient.lon
  });
  socket.emit('request_match', {
    lat: pendingPatient.lat,
    lon: pendingPatient.lon,
    radiusKm: 50
  });
}

function showNotificationButton() {
  hasPendingNotification = true;
  applyNotifyButtonState();
}

document.addEventListener('DOMContentLoaded', () => {
  applyNotifyButtonLabel();
  if (window.appI18n && typeof window.appI18n.onLanguageChange === 'function') {
    window.appI18n.onLanguageChange(() => {
      applyNotifyButtonLabel();
    });
  }

  const pendingPatient = loadJSON(PENDING_PATIENT_KEY);
  if (!isValidPendingPatient(pendingPatient)) {
    setStatus(t('chat.notConnected'));
    return;
  }

  const notifyBtn = el('availabilityNotifyBtn');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', () => {
      if (!hasPendingNotification) {
        setStatus(t('providersInArea.waiting'));
        return;
      }
      hasPendingNotification = false;
      applyNotifyButtonState();
      window.location.href = '/patient.html?resume=1';
    });
  }

  const pendingMatch = loadJSON(PENDING_MATCH_KEY);
  if (pendingMatch && pendingMatch.room) {
    hasPendingNotification = true;
    applyNotifyButtonState();
    setStatus(t('providersInArea.providerAvailable'));
  } else {
    hasPendingNotification = false;
    applyNotifyButtonState();
  }

  socket.on('connect', () => {
    requestMatch(pendingPatient);
    loadMedicalOffices(pendingPatient);
  });

  socket.on('no_providers', () => {
    hasPendingNotification = false;
    applyNotifyButtonState();
    setStatus(t('providersInArea.waiting'));
  });

  socket.on('match_found', (data) => {
    saveJSON(PENDING_MATCH_KEY, {
      room: data.room,
      provider: data.provider,
      patient: pendingPatient,
      timestamp: Date.now()
    });
    setStatus(t('providersInArea.providerAvailable'));
    showNotificationButton();

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('The Arcadian', {
        body: t('providersInArea.providerAvailable'),
        icon: '/icons/icon-192.png'
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  });

  setInterval(() => {
    requestMatch(pendingPatient);
    loadMedicalOffices(pendingPatient);
  }, WAITING_POLL_MS);

  loadMedicalOffices(pendingPatient);
});
