// Provider page functionality
const socket = io();

let currentRoom = null;
let role = 'provider';
let mapProv = null;
let userLocation = null;
let providerMarkers = [];
let providerSelfMarker = null;
let isProviderOnline = false;
const providerAuthToken = localStorage.getItem('providerAuthToken');

function el(id){ return document.getElementById(id); }
const t = (key, params) => (window.appI18n ? window.appI18n.t(key, params) : key);

// Geocode an address using Nominatim (OpenStreetMap) — no API key required.
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'TheArcadian/1.0' } });
  const results = await res.json();
  if (!results || results.length === 0) throw new Error(t('error.addressNotFound'));
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
}

// Nominatim address autocomplete with debounce.
const _nominatimTimers = {};
function setupPlacesAutocomplete(fieldId, suggestionsId) {
  const input = el(fieldId);
  const suggestionsContainer = el(suggestionsId);
  if (!input) {
    console.warn(`setupPlacesAutocomplete: input element not found for fieldId="${fieldId}"`);
    return;
  }
  if (!suggestionsContainer) {
    console.warn(`setupPlacesAutocomplete: suggestions container not found for suggestionsId="${suggestionsId}"`);
    return;
  }

  console.log(`setupPlacesAutocomplete: initialized for ${fieldId} with suggestions container ${suggestionsId}`);

  input.addEventListener('input', () => {
    clearTimeout(_nominatimTimers[fieldId]);
    const query = input.value.trim();
    console.log(`Address input changed: "${query}" (length: ${query.length})`);
    
    if (query.length < 3) { 
      suggestionsContainer.innerHTML = '';
      console.log('Query too short, clearing suggestions');
      return;
    }

    _nominatimTimers[fieldId] = setTimeout(async () => {
      console.log(`Fetching Nominatim suggestions for: "${query}"`);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`;
        console.log(`Nominatim URL: ${url}`);
        const r = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'TheArcadian/1.0' } });
        console.log(`Nominatim response status: ${r.status}`);
        
        if (!r.ok) {
          throw new Error(`Nominatim API returned ${r.status}`);
        }
        
        const results = await r.json();
        console.log(`Nominatim returned ${results.length} results`, results);
        
        suggestionsContainer.innerHTML = '';
        if (results.length === 0) {
          const noResults = document.createElement('div');
          noResults.style.cssText = 'padding:10px;color:#999;';
          noResults.textContent = t('autocomplete.noResultsHint');
          suggestionsContainer.appendChild(noResults);
          return;
        }
        
        results.forEach(result => {
          const div = document.createElement('div');
          div.className = 'suggestion';
          div.style.cssText = 'padding:10px;background:#f5f5f5;border-bottom:1px solid #ddd;cursor:pointer;';
          div.textContent = result.display_name;
          div.addEventListener('click', () => {
            console.log(`Selected suggestion: ${result.display_name} (${result.lat}, ${result.lon})`);
            input.value = result.display_name;
            input.dataset.lat = result.lat;
            input.dataset.lon = result.lon;
            suggestionsContainer.innerHTML = '';
          });
          div.addEventListener('mouseover', () => div.style.background = '#e8e8e8');
          div.addEventListener('mouseout', () => div.style.background = '#f5f5f5');
          suggestionsContainer.appendChild(div);
        });
      } catch (err) {
        console.error('Autocomplete error:', err);
        suggestionsContainer.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'padding:10px;color:red;';
        errorDiv.textContent = `${t('error.prefix')}${err.message}`;
        suggestionsContainer.appendChild(errorDiv);
      }
    }, 350);
  });
}

function setupRadioListeners() {
  document.querySelectorAll('input[name="providerLoc"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const manual = document.querySelector('input[name="providerLoc"]:checked').value === 'manual';
      el('providerManual').style.display = manual ? 'block' : 'none';
    });
  });

  document.querySelectorAll('input[name="changeProviderLoc"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const manual = document.querySelector('input[name="changeProviderLoc"]:checked').value === 'manual';
      el('changeProviderManual').style.display = manual ? 'block' : 'none';
    });
  });
}

async function getLocation() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error(t('error.geolocationUnavailable')));
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude }), rej, { timeout: 10000 });
  });
}

function initMap(containerId, center) {
  const mapInstance = L.map(containerId).setView([center.lat, center.lon], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);
  return mapInstance;
}

async function fetchProviderProfile() {
  if (!providerAuthToken) return null;
  try {
    const res = await fetch('/api/provider/profile/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: providerAuthToken })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile || null;
  } catch {
    return null;
  }
}

async function saveProviderProfile(profile) {
  if (!providerAuthToken) return;
  try {
    await fetch('/api/provider/profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: providerAuthToken,
        name: profile.name,
        lat: profile.lat,
        lon: profile.lon,
        specialty: profile.specialty || ''
      })
    });
  } catch (err) {
    console.warn('Failed to save provider profile', err);
  }
}

function showProviderMain(statusMessage) {
  el('providerStatus').textContent = statusMessage;
  el('providerManual').style.display = 'none';
  const options = document.querySelector('.location-options');
  if (options) options.style.display = 'none';
  document.getElementById('initiateProvider').style.display = 'none';
  document.getElementById('providerMain').style.display = 'block';

  if (!mapProv && userLocation) {
    mapProv = initMap('mapProv', userLocation);
    providerSelfMarker = L.marker([userLocation.lat, userLocation.lon]).addTo(mapProv).bindPopup(t('common.you')).openPopup();
  } else if (mapProv && providerSelfMarker && userLocation) {
    providerSelfMarker.setLatLng([userLocation.lat, userLocation.lon]);
    mapProv.panTo([userLocation.lat, userLocation.lon]);
  }
}

function toggleProviderSidebar(show) {
  const sidebar = el('providerSidebar');
  const overlay = el('providerSidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('open', show);
  overlay.classList.toggle('hidden', !show);
  sidebar.setAttribute('aria-hidden', show ? 'false' : 'true');
}

async function resolveLocationFromControls(radioName, addressId) {
  const useGeo = document.querySelector(`input[name="${radioName}"]:checked`).value === 'geo';
  const addressInput = el(addressId);

  if (useGeo) {
    return getLocation();
  }

  const address = addressInput.value.trim();
  if (!address) throw new Error(t('error.enterAddress'));

  if (addressInput.dataset && addressInput.dataset.lat && addressInput.dataset.lon) {
    return { lat: parseFloat(addressInput.dataset.lat), lon: parseFloat(addressInput.dataset.lon) };
  }

  return geocodeAddress(address);
}

async function applyChangedLocation() {
  try {
    const newLoc = await resolveLocationFromControls('changeProviderLoc', 'changeProviderAddress');
    userLocation = newLoc;
    const providerName = (el('providerName').value || 'Provider').trim();
    const specialty = (el('providerSpec').value || '').trim();
    await saveProviderProfile({
      name: providerName,
      lat: userLocation.lat,
      lon: userLocation.lon,
      specialty
    });

    if (mapProv && providerSelfMarker) {
      providerSelfMarker.setLatLng([userLocation.lat, userLocation.lon]).bindPopup(t('common.you')).openPopup();
      mapProv.panTo([userLocation.lat, userLocation.lon]);
    }

    if (isProviderOnline) {
      socket.emit('announce_availability', {
        lat: userLocation.lat,
        lon: userLocation.lon,
        specialty
      });
    }

    el('providerChangeLocationPanel').classList.add('hidden');
    toggleProviderSidebar(false);
    el('providerStatus').textContent = isProviderOnline
      ? t('status.locationUpdatedRefreshed')
      : t('status.locationUpdated');
  } catch (err) {
    el('providerStatus').textContent = t('error.prefix') + err.message;
  }
}

function setupProviderSidebar() {
  const menuBtn = el('providerMenuBtn');
  const closeBtn = el('providerSidebarClose');
  const overlay = el('providerSidebarOverlay');
  const changeLocNav = el('providerChangeLocationNav');
  const saveChangedLocationBtn = el('saveChangedLocationBtn');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => toggleProviderSidebar(true));
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => toggleProviderSidebar(false));
  }
  if (overlay) {
    overlay.addEventListener('click', () => toggleProviderSidebar(false));
  }
  if (changeLocNav) {
    changeLocNav.addEventListener('click', () => {
      el('providerChangeLocationPanel').classList.remove('hidden');
      toggleProviderSidebar(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (saveChangedLocationBtn) {
    saveChangedLocationBtn.addEventListener('click', applyChangedLocation);
  }
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return t('status.soon');
  }
}

function notifyPatientRequest(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('The Arcadian', {
      body: message,
      icon: '/icons/icon-192.png'
    });
  }
}

// Handle location confirmation and proceed to main UI
document.getElementById('initiateProvider').onclick = async () => {
  try {
    const loc = await resolveLocationFromControls('providerLoc', 'providerAddress');

    userLocation = loc;
    const providerName = (el('providerName').value || 'Provider').trim();
    const specialty = (el('providerSpec').value || '').trim();
    await saveProviderProfile({
      name: providerName,
      lat: userLocation.lat,
      lon: userLocation.lon,
      specialty
    });

    el('providerName').disabled = true;
    el('providerName').value = providerName;
    el('providerAddress').disabled = true;
    document.querySelectorAll('input[name="providerLoc"]').forEach(r => r.disabled = true);
    showProviderMain(t('status.savedProfileLoaded'));
  } catch (e) {
    el('providerStatus').textContent = t('error.prefix') + e.message;
  }
};

document.getElementById('announceBtn').onclick = async () => {
  const name = el('providerName').value || t('chat.provider');
  const specialty = el('providerSpec').value || '';
  if (!userLocation) {
    el('providerStatus').textContent = t('status.noLocationSet');
    return;
  }
  socket.emit('identify', {
    role: 'provider',
    name,
    lat: userLocation.lat,
    lon: userLocation.lon,
    specialty,
    authToken: providerAuthToken
  });
  socket.emit('announce_availability', { lat: userLocation.lat, lon: userLocation.lon, specialty });
  el('providerStatus').textContent = t('status.announcingAvailability');
};

document.getElementById('sendBtnProv').onclick = () => {
  const text = el('chatInputProv').value.trim();
  if (!text) return;
  if (!currentRoom) {
    el('providerStatus').textContent = t('chat.notConnected');
    return;
  }
  socket.emit('message', { room: currentRoom, text });
  appendChat(t('chat.me'), text, el('chatLogProv'));
  el('chatInputProv').value = '';
};

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('matched_patient', data => {
  currentRoom = data.room;
  socket.emit('join_room', { room: currentRoom });
  el('providerStatus').textContent = t('status.matchedNearbyPatient');
  document.getElementById('chatAreaProv').classList.remove('hidden');
  notifyPatientRequest(t('chat.requestNow'));
  if (mapProv && data.patientLoc) {
    const marker = L.marker([data.patientLoc.lat, data.patientLoc.lon]).addTo(mapProv)
      .bindPopup(t('chat.patient')).openPopup();
    providerMarkers.push(marker);
  }
});

socket.on('patient_chat_request', (data) => {
  if (data && data.room) {
    currentRoom = data.room;
    socket.emit('join_room', { room: currentRoom });
  }
  notifyPatientRequest(t('chat.newRequest'));
});

socket.on('availability_updated', data => {
  isProviderOnline = true;
  const until = data && data.onlineUntil ? formatTime(data.onlineUntil) : t('status.soon');
  el('providerStatus').textContent = t('status.onlineUntil', { until });
});

socket.on('auth_required', () => {
  localStorage.removeItem('providerAuthToken');
  localStorage.removeItem('providerUsername');
  window.location.href = '/provider-login.html';
});

function setupProviderMediaControls() {
  const cameraBtn = document.getElementById('cameraBtnProv');
  const fileBtn = document.getElementById('fileBtnProv');
  const fileInput = document.getElementById('fileInputProv');

  if (cameraBtn) {
    cameraBtn.addEventListener('click', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.8); z-index: 1000; display: flex;
          align-items: center; justify-content: center; flex-direction: column;
        `;

        const cameraContainer = document.createElement('div');
        cameraContainer.style.cssText = `
          background: white; padding: 20px; border-radius: 10px;
          max-width: 500px; width: 90%;
        `;

        const title = document.createElement('h3');
        title.textContent = t('common.takePhoto');
        title.style.margin = '0 0 15px 0';

        video.style.cssText = 'width: 100%; max-height: 300px; border-radius: 5px;';
        cameraContainer.appendChild(title);
        cameraContainer.appendChild(video);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';

        const captureBtn = document.createElement('button');
        captureBtn.type = 'button';
        captureBtn.textContent = `📷 ${t('media.capture')}`;
        captureBtn.style.cssText = 'padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = t('common.cancel');
        cancelBtn.style.cssText = 'padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;';

        buttonContainer.appendChild(captureBtn);
        buttonContainer.appendChild(cancelBtn);
        cameraContainer.appendChild(buttonContainer);
        modal.appendChild(cameraContainer);
        document.body.appendChild(modal);

        captureBtn.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);

          canvas.toBlob((blob) => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            sendMediaMessageProv(file);
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(modal);
          }, 'image/jpeg', 0.8);
        };

        cancelBtn.onclick = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        };
      } catch (error) {
        console.error('Camera access denied or not available:', error);
        alert(t('media.cameraPermission'));
      }
    });
  }

  if (fileBtn && fileInput) {
    fileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        sendMediaMessageProv(file);
        event.target.value = '';
      }
    });
  }
}

function sendMediaMessageProv(file) {
  if (!currentRoom) return;

  // Convert file to base64 for transmission
  const reader = new FileReader();
  reader.onload = () => {
    const mediaData = {
      room: currentRoom,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      data: reader.result // base64 encoded file
    };
    socket.emit('media_message', mediaData);

    // Display locally
    displayMediaMessageProv(t('chat.me'), mediaData);
  };
  reader.readAsDataURL(file);
}

function displayMediaMessageProv(sender, mediaData) {
  const container = document.getElementById('chatLogProv');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'media-message';

  const senderDiv = document.createElement('div');
  senderDiv.style.fontWeight = 'bold';
  senderDiv.style.marginBottom = '5px';
  senderDiv.textContent = sender + ':';
  messageDiv.appendChild(senderDiv);

  if (mediaData.fileType.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = mediaData.data;
    img.onclick = () => window.open(mediaData.data, '_blank');
    messageDiv.appendChild(img);
  } else if (mediaData.fileType.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = mediaData.data;
    video.controls = true;
    video.style.maxWidth = '100%';
    messageDiv.appendChild(video);
  } else if (mediaData.fileType.startsWith('audio/')) {
    const audio = document.createElement('audio');
    audio.src = mediaData.data;
    audio.controls = true;
    messageDiv.appendChild(audio);
  } else {
    // Generic file
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-info';

    const icon = document.createElement('div');
    icon.className = 'file-icon';
    icon.textContent = '📄';
    fileDiv.appendChild(icon);

    const details = document.createElement('div');
    details.className = 'file-details';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = mediaData.fileName;
    details.appendChild(name);

    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = formatFileSize(mediaData.fileSize);
    details.appendChild(size);

    fileDiv.appendChild(details);

    const downloadLink = document.createElement('a');
    downloadLink.href = mediaData.data;
    downloadLink.download = mediaData.fileName;
    downloadLink.textContent = t('media.download');
    downloadLink.style.marginLeft = '10px';
    fileDiv.appendChild(downloadLink);

    messageDiv.appendChild(fileDiv);
  }

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function appendChat(who, text, container) {
  if (!container) return;
  const d = document.createElement('div');
  d.className = 'chat-line';
  d.textContent = `${who}: ${text}`;
  container.appendChild(d);
  container.scrollTop = container.scrollHeight;
}

socket.on('message', msg => {
  document.getElementById('chatAreaProv').classList.remove('hidden');
  appendChat(t('chat.patient'), msg.text, el('chatLogProv'));
});

socket.on('media_message', mediaData => {
  document.getElementById('chatAreaProv').classList.remove('hidden');
  displayMediaMessageProv(t('chat.patient'), mediaData);
});

socket.on('message_error', payload => {
  const errorMessage = payload && payload.error ? payload.error : t('chat.sendFailed');
  el('providerStatus').textContent = errorMessage;
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Provider page loaded');
  setupRadioListeners();
  setupProviderSidebar();

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }

  setupPlacesAutocomplete('providerAddress', 'providerAddrList');
  setupPlacesAutocomplete('changeProviderAddress', 'changeProviderAddrList');

  const savedProfile = await fetchProviderProfile();
  if (savedProfile && savedProfile.name && Number.isFinite(savedProfile.lat) && Number.isFinite(savedProfile.lon)) {
    el('providerName').value = savedProfile.name;
    el('providerName').disabled = true;
    if (savedProfile.specialty) {
      el('providerSpec').value = savedProfile.specialty;
    }
    userLocation = { lat: Number(savedProfile.lat), lon: Number(savedProfile.lon) };
    el('providerAddress').disabled = true;
    document.querySelectorAll('input[name="providerLoc"]').forEach(r => r.disabled = true);
    showProviderMain(t('status.welcomeBack'));
  }

  setupProviderMediaControls();
});