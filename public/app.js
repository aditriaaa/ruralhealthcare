// No import needed - socket.io is loaded separately in HTML

const socket = io();

let currentRoom = null;
let role = null;
let map = null;
let mapProv = null;
let userMarker = null;
let userLocation = null;
let providerMarkers = [];

function el(id){ return document.getElementById(id); }

function setupRadioListeners() {
  // Toggle address input visibility for patient
  document.querySelectorAll('input[name="patientLoc"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const manual = document.querySelector('input[name="patientLoc"]:checked').value === 'manual';
      el('patientManual').style.display = manual ? 'block' : 'none';
    });
  });

  // Toggle address input visibility for provider
  document.querySelectorAll('input[name="providerLoc"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const manual = document.querySelector('input[name="providerLoc"]:checked').value === 'manual';
      el('providerManual').style.display = manual ? 'block' : 'none';
    });
  });
}

async function getLocation() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('Geolocation unavailable'));
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude }), rej, { timeout: 10000 });
  });
}

// Geocode an address using Nominatim (OpenStreetMap) — no API key required.
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'TheArcadian/1.0' } });
  const results = await res.json();
  if (!results || results.length === 0) throw new Error('Address not found. Please try a more specific address.');
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
}

// Nominatim address autocomplete with debounce.
const _nominatimTimers = {};
function setupPlacesAutocomplete(fieldId, suggestionsId) {
  const input = el(fieldId);
  const suggestionsContainer = el(suggestionsId);
  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(_nominatimTimers[fieldId]);
    const query = input.value.trim();
    if (query.length < 3) { suggestionsContainer.innerHTML = ''; return; }

    _nominatimTimers[fieldId] = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`;
        const r = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'TheArcadian/1.0' } });
        const results = await r.json();
        suggestionsContainer.innerHTML = '';
        results.forEach(result => {
          const div = document.createElement('div');
          div.className = 'suggestion';
          div.style.cssText = 'padding:10px;background:#f5f5f5;border-bottom:1px solid #ddd;cursor:pointer;';
          div.textContent = result.display_name;
          div.addEventListener('click', () => {
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
      }
    }, 350);
  });
}

async function getUserLocation(useGeo, addressInput) {
  if (useGeo) {
    return await getLocation();
  } else {
    const address = addressInput.value.trim();
    if (!address) throw new Error('Please enter an address');
    return await geocodeAddress(address);
  }
}

function initMap(containerId, center) {
  const mapInstance = L.map(containerId).setView([center.lat, center.lon], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);
  return mapInstance;
}

function updateMapWithProviders(providers) {
  // Clear existing markers
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

function setupPatientButton() {
  document.getElementById('patientBtn').onclick = () => {
    role = 'patient';
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('patient-ui').classList.remove('hidden');
    console.log('Showing patient location entry');
  };
}

function setupProviderButton() {
  document.getElementById('providerBtn').onclick = () => {
    role = 'provider';
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('provider-ui').classList.remove('hidden');
    console.log('Showing provider location entry');
  };
}

// Handle location confirmation and proceed to main UI
function setupLocationButtons() {
  document.getElementById('initiatePatient').onclick = async () => {
    try {
      const useGeo = document.querySelector('input[name="patientLoc"]:checked').value === 'geo';
      const addressInput = el('patientAddress');
      
      let loc;
      if (useGeo) {
        loc = await getLocation();
      } else {
        const address = addressInput.value.trim();
        if (!address) throw new Error('Please enter an address');
        if (addressInput.dataset && addressInput.dataset.lat && addressInput.dataset.lon) {
          loc = { lat: parseFloat(addressInput.dataset.lat), lon: parseFloat(addressInput.dataset.lon) };
        } else {
          throw new Error('Please select an address from the dropdown');
        }
      }

      userLocation = loc;
      el('patientStatus').textContent = 'Location confirmed!';
      el('patientManual').style.display = 'none';
      document.querySelector('.location-options').style.display = 'none';
      el('patientName').disabled = true;
      el('patientAddress').disabled = true;
      document.querySelectorAll('input[name="patientLoc"]').forEach(r => r.disabled = true);
      document.getElementById('initiatePatient').style.display = 'none';
      document.getElementById('patientMain').style.display = 'block';
      
      map = initMap('map', userLocation);
      userMarker = L.marker([userLocation.lat, userLocation.lon]).addTo(map).bindPopup('You').openPopup();
    } catch (e) {
      el('patientStatus').textContent = 'Error: ' + e.message;
    }
  };

  document.getElementById('initiateProvider').onclick = async () => {
    try {
      const useGeo = document.querySelector('input[name="providerLoc"]:checked').value === 'geo';
      const addressInput = el('providerAddress');
      
      let loc;
      if (useGeo) {
        loc = await getLocation();
      } else {
        const address = addressInput.value.trim();
        if (!address) throw new Error('Please enter an address');
        if (addressInput.dataset && addressInput.dataset.lat && addressInput.dataset.lon) {
          loc = { lat: parseFloat(addressInput.dataset.lat), lon: parseFloat(addressInput.dataset.lon) };
        } else {
          throw new Error('Please select an address from the dropdown');
        }
      }

      userLocation = loc;
      el('providerStatus').textContent = 'Location confirmed!';
      el('providerManual').style.display = 'none';
      document.querySelectorAll('.location-options')[1].style.display = 'none';
      el('providerName').disabled = true;
      el('providerSpec').disabled = true;
      el('providerAddress').disabled = true;
      document.querySelectorAll('input[name="providerLoc"]').forEach(r => r.disabled = true);
      document.getElementById('initiateProvider').style.display = 'none';
      document.getElementById('providerMain').style.display = 'block';
      
      mapProv = initMap('mapProv', userLocation);
      userMarker = L.marker([userLocation.lat, userLocation.lon]).addTo(mapProv).bindPopup('You').openPopup();
    } catch (e) {
      el('providerStatus').textContent = 'Error: ' + e.message;
    }
  };
}

function setupActionButtons() {
  document.getElementById('requestHelp').onclick = async () => {
    const name = el('patientName').value || 'Patient';
    if (!userLocation) {
      el('patientStatus').textContent = 'Error: No location set';
      return;
    }
    socket.emit('identify', { role: 'patient', name, lat: userLocation.lat, lon: userLocation.lon });
    socket.emit('request_match', { lat: userLocation.lat, lon: userLocation.lon, radiusKm: 50 });
    el('patientStatus').textContent = 'Searching for providers...';
  };

  document.getElementById('announceBtn').onclick = async () => {
    const name = el('providerName').value || 'Provider';
    const specialty = el('providerSpec').value || '';
    if (!userLocation) {
      el('providerStatus').textContent = 'Error: No location set';
      return;
    }
    socket.emit('identify', { role: 'provider', name, lat: userLocation.lat, lon: userLocation.lon, specialty });
    socket.emit('announce_availability', { lat: userLocation.lat, lon: userLocation.lon, specialty });
    el('providerStatus').textContent = 'Available and announced.';
  };

  document.getElementById('sendBtn').onclick = () => {
    const text = el('chatInput').value;
    if (!text || !currentRoom) return;
    socket.emit('message', { room: currentRoom, text });
    appendChat('Me', text, el('chatLog'));
    el('chatInput').value = '';
  };

  document.getElementById('sendBtnProv').onclick = () => {
    const text = el('chatInputProv').value;
    if (!text || !currentRoom) return;
    socket.emit('message', { room: currentRoom, text });
    appendChat('Me', text, el('chatLogProv'));
    el('chatInputProv').value = '';
  };
}

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('no_providers', () => {
  el('patientStatus').textContent = 'No nearby providers found.';
});

socket.on('match_found', data => {
  el('patientStatus').textContent = `Matched with ${data.provider.name} (${Math.round(data.provider.dist)} km).`;
  currentRoom = data.room;
  socket.emit('join_room', { room: currentRoom });
  document.getElementById('chatArea').classList.remove('hidden');
  // Add provider marker to map
  if (map && data.provider.lat && data.provider.lon) {
    const marker = L.marker([data.provider.lat, data.provider.lon]).addTo(map)
      .bindPopup(`${data.provider.name} (${data.provider.specialty})`).openPopup();
    providerMarkers.push(marker);
  }
});

socket.on('matched_patient', data => {
  currentRoom = data.room;
  socket.emit('join_room', { room: currentRoom });
  el('providerStatus').textContent = 'Matched with a patient nearby.';
  document.getElementById('chatAreaProv').classList.remove('hidden');
  // Add patient marker to provider map
  if (mapProv && data.patientLoc) {
    const marker = L.marker([data.patientLoc.lat, data.patientLoc.lon]).addTo(mapProv)
      .bindPopup('Patient').openPopup();
    providerMarkers.push(marker);
  }
});

socket.on('message', msg => {
  // display message in whichever chat area is visible
  if (document.getElementById('chatArea').classList.contains('hidden')) {
    appendChat('Patient', msg.text, el('chatLogProv'));
  } else {
    appendChat('Provider', msg.text, el('chatLog'));
  }
});

// Initialize all event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded: setting up all listeners');
  setupRadioListeners();
  console.log('Radio listeners set up');
  setupPatientButton();
  console.log('Patient button set up');
  setupProviderButton();
  console.log('Provider button set up');
  setupLocationButtons();
  console.log('Location buttons set up');
  setupActionButtons();
  console.log('Action buttons set up');
  
  // Setup Google Places Autocomplete for address fields
  setupPlacesAutocomplete('patientAddress', 'patientAddrList');
  setupPlacesAutocomplete('providerAddress', 'providerAddrList');
  console.log('Google Places Autocomplete set up');
});

function appendChat(who, text, container) {
  const d = document.createElement('div');
  d.className = 'chat-line';
  d.textContent = `${who}: ${text}`;
  container.appendChild(d);
  container.scrollTop = container.scrollHeight;
}