// Patient page functionality
const socket = io();

let currentRoom = null;
let role = 'patient';
let map = null;
let userLocation = null;
let providerMarkers = [];
function el(id){ return document.getElementById(id); }
const t = (key, params) => (window.appI18n ? window.appI18n.t(key, params) : key);
const PENDING_PATIENT_KEY = 'pendingPatientRequest';
const PENDING_MATCH_KEY = 'pendingPatientMatch';
const PENDING_MATCH_MAX_AGE_MS = 20 * 60 * 1000;

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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

function clearPendingMatch() {
  localStorage.removeItem(PENDING_MATCH_KEY);
}

function savePendingPatientRequest(name, loc) {
  saveJSON(PENDING_PATIENT_KEY, {
    name,
    lat: loc.lat,
    lon: loc.lon,
    timestamp: Date.now()
  });
}

function hidePatientSetupAndShowMain() {
  el('patientManual').style.display = 'none';
  const options = document.querySelector('.location-options');
  if (options) options.style.display = 'none';
  el('patientName').disabled = true;
  el('patientAddress').disabled = true;
  document.querySelectorAll('input[name="patientLoc"]').forEach(r => r.disabled = true);
  document.getElementById('initiatePatient').style.display = 'none';
  document.getElementById('patientMain').style.display = 'block';
}

function restorePendingMatchIfAvailable() {
  const pendingMatch = loadJSON(PENDING_MATCH_KEY);
  if (!pendingMatch || !pendingMatch.room || !pendingMatch.provider || !pendingMatch.patient) {
    return false;
  }
  if (!pendingMatch.timestamp || Date.now() - pendingMatch.timestamp > PENDING_MATCH_MAX_AGE_MS) {
    clearPendingMatch();
    return false;
  }

  const patient = pendingMatch.patient;
  if (!Number.isFinite(patient.lat) || !Number.isFinite(patient.lon)) {
    clearPendingMatch();
    return false;
  }

  userLocation = { lat: Number(patient.lat), lon: Number(patient.lon) };
  el('patientName').value = patient.name || 'Patient';
  hidePatientSetupAndShowMain();

  if (!map) {
    map = initMap('map', userLocation);
    L.marker([userLocation.lat, userLocation.lon]).addTo(map).bindPopup(t('common.you')).openPopup();
  }

  currentRoom = pendingMatch.room;
  socket.emit('identify', {
    role: 'patient',
    name: patient.name || 'Patient',
    lat: userLocation.lat,
    lon: userLocation.lon
  });
  socket.emit('join_room', { room: currentRoom });

  document.getElementById('chatArea').classList.remove('hidden');
  el('patientStatus').textContent = t('status.matchedWith', {
    name: pendingMatch.provider.name || t('chat.provider'),
    dist: Math.round(Number(pendingMatch.provider.dist || 0))
  });

  if (pendingMatch.provider.lat && pendingMatch.provider.lon) {
    const marker = L.marker([pendingMatch.provider.lat, pendingMatch.provider.lon]).addTo(map)
      .bindPopup(`${pendingMatch.provider.name} (${pendingMatch.provider.specialty || ''})`).openPopup();
    providerMarkers.push(marker);
  }

  clearPendingMatch();
  return true;
}

function setupRadioListeners() {
  document.querySelectorAll('input[name="patientLoc"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const manual = document.querySelector('input[name="patientLoc"]:checked').value === 'manual';
      el('patientManual').style.display = manual ? 'block' : 'none';
    });
  });
}

async function getLocation() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error(t('error.geolocationUnavailable')));
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude }), rej, { timeout: 10000 });
  });
}

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
    }, 350); // 350 ms debounce — respects Nominatim rate limits
  });
}



function initMap(containerId, center) {
  const mapInstance = L.map(containerId).setView([center.lat, center.lon], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);
  return mapInstance;
}

function updateMapWithProviders(providers) {
  providerMarkers.forEach(marker => map.removeLayer(marker));
  providerMarkers = [];
  providers.forEach(prov => {
    if (prov.lat && prov.lon) {
      const marker = L.marker([prov.lat, prov.lon]).addTo(map)
        .bindPopup(`${prov.name} (${prov.specialty})`);
      providerMarkers.push(marker);
    }
  });
}

// Handle location confirmation and proceed to main UI
document.getElementById('initiatePatient').addEventListener('click', async () => {
  try {
    const useGeo = document.querySelector('input[name="patientLoc"]:checked').value === 'geo';
    const addressInput = el('patientAddress');

    let loc;
    if (useGeo) {
      loc = await getLocation();
    } else {
      const address = addressInput.value.trim();
      if (!address) throw new Error(t('error.enterAddress'));

      // Prefer coordinates already stored from the autocomplete dropdown.
      if (addressInput.dataset && addressInput.dataset.lat && addressInput.dataset.lon) {
        loc = { lat: parseFloat(addressInput.dataset.lat), lon: parseFloat(addressInput.dataset.lon) };
      } else {
        // Geocode via Nominatim if the user typed without picking from the dropdown.
        loc = await geocodeAddress(address);
      }
    }

    userLocation = loc;
    const name = el('patientName').value || 'Patient';
    savePendingPatientRequest(name, userLocation);
    clearPendingMatch();

    el('patientStatus').textContent = t('status.locationConfirmed');
    hidePatientSetupAndShowMain();

    map = initMap('map', userLocation);
    L.marker([userLocation.lat, userLocation.lon]).addTo(map).bindPopup(t('common.you')).openPopup();

    // Automatically search for providers after location confirmation
    socket.emit('identify', { role: 'patient', name, lat: userLocation.lat, lon: userLocation.lon });
    socket.emit('request_match', { lat: userLocation.lat, lon: userLocation.lon, radiusKm: 50 });
  } catch (e) {
    el('patientStatus').textContent = t('error.prefix') + e.message;
  }
});

document.getElementById('sendBtn').onclick = () => {
  const text = el('chatInput').value.trim();
  if (!text) return;
  if (!currentRoom) {
    el('patientStatus').textContent = t('chat.notConnected');
    return;
  }
  socket.emit('message', { room: currentRoom, text });
  appendChat(t('chat.me'), text, el('chatLog'));
  el('chatInput').value = '';
};

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('no_providers', () => {
  // Redirect to providers in area page when no providers are currently available
  window.location.href = '/providers-in-area.html';
});

socket.on('match_found', data => {
  clearPendingMatch();
  localStorage.removeItem(PENDING_PATIENT_KEY);
  el('patientStatus').textContent = t('status.matchedWith', {
    name: data.provider.name,
    dist: Math.round(data.provider.dist)
  });
  currentRoom = data.room;
  socket.emit('join_room', { room: currentRoom });
  document.getElementById('chatArea').classList.remove('hidden');
  if (map && data.provider.lat && data.provider.lon) {
    const marker = L.marker([data.provider.lat, data.provider.lon]).addTo(map)
      .bindPopup(`${data.provider.name} (${data.provider.specialty})`).openPopup();
    providerMarkers.push(marker);
  }
});

socket.on('message', msg => {
  appendChat(t('chat.provider'), msg.text, el('chatLog'));
});

socket.on('media_message', mediaData => {
  displayMediaMessage(t('chat.provider'), mediaData);
});

socket.on('message_error', payload => {
  const errorMessage = payload && payload.error ? payload.error : t('chat.sendFailed');
  el('patientStatus').textContent = errorMessage;
});

function appendChat(who, text, container) {
  const d = document.createElement('div');
  d.className = 'chat-line';
  d.textContent = `${who}: ${text}`;
  container.appendChild(d);
  container.scrollTop = container.scrollHeight;
}

function setupPatientMediaControls() {
  const cameraBtn = document.getElementById('cameraBtn');
  const fileBtn = document.getElementById('fileBtn');
  const fileInput = document.getElementById('fileInput');

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
            sendMediaMessage(file);
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
        sendMediaMessage(file);
        event.target.value = '';
      }
    });
  }
}

function sendMediaMessage(file) {
  if (!currentRoom) return;

  const reader = new FileReader();
  reader.onload = () => {
    const mediaData = {
      room: currentRoom,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      data: reader.result
    };
    socket.emit('media_message', mediaData);
    displayMediaMessage(t('chat.me'), mediaData);
  };
  reader.readAsDataURL(file);
}

function displayMediaMessage(sender, mediaData) {
  const container = document.getElementById('chatLog');
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Patient page loaded');
  setupRadioListeners();
  setupPlacesAutocomplete('patientAddress', 'patientAddrList');
  setupPatientMediaControls();
  restorePendingMatchIfAvailable();
});