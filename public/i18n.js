(function () {
  const STORAGE_KEY = 'appLanguage';
  const SUPPORTED = ['en', 'es', 'hi'];

  const translations = {
    en: {
      'lang.english': 'English',
      'lang.spanish': 'Spanish',
      'lang.hindi': 'Hindi',
      'lang.title': 'Select language',
      'assistant.chatCta': 'Chat with AI',

      'intro.title': 'The Arcadian',
      'intro.subtitle': 'Connect with healthcare providers instantly',
      'intro.description': 'Quality care, anytime, anywhere. Find matches within 50 km and start a chat instantly.',
      'intro.description.strong': 'No waiting. No hassle.',
      'intro.patientBtn': "I'm a Patient",
      'intro.providerBtn': "I'm a Provider",

      'patient.title': 'Patient - Enter Your Location',
      'common.yourName': 'Your name',
      'common.useCurrentLocation': 'Use current location',
      'common.enterAddressManually': 'Enter address manually',
      'patient.searchAddress': 'Search address (e.g., 123 Main St, Springfield, USA)',
      'common.continue': 'Continue',
      'patient.nearbyProviders': 'Nearby Providers',
      'common.message': 'Message...',
      'common.send': 'Send',
      'common.takePhoto': 'Take Photo',
      'common.uploadFile': 'Upload File',
      'common.you': 'You',

      'provider.title': 'Provider - Enter Your Location',
      'provider.specialtyPlaceholder': 'Specialty (e.g., General Practice, Pediatrics)',
      'provider.searchAddress': 'Search address (e.g., 456 Oak Ave, Springfield, USA)',
      'provider.announceAvailability': 'Announce Your Availability',
      'provider.goOnline': 'Go Online',
      'provider.menu': 'Menu',
      'provider.close': 'Close',
      'provider.changeLocation': 'Change Location',
      'provider.updateLocation': 'Update Location',
      'provider.saveNewLocation': 'Save New Location',

      'providerLogin.title': 'Provider Login',
      'providerLogin.subtitle': 'Use your provider username and password to continue.',
      'providerLogin.username': 'Username',
      'providerLogin.password': 'Password',
      'providerLogin.login': 'Log In',
      'providerLogin.createAccount': 'Create Account',

      'providersInArea.title': 'Providers in Your Area',
      'providersInArea.waiting': 'No providers are online right now. We will keep checking for you.',
      'providersInArea.hint': 'Keep this page open. When a provider is available, use the notification button to jump to chat.',
      'providersInArea.providerAvailable': 'Provider available. Tap the notification button to open chat.',
      'providersInArea.notifyBtn': '🔔 Provider Available',
      'providersInArea.medicalOfficesNone': 'No medical offices found near this location right now.',
      'providersInArea.medicalOfficesError': 'Unable to load nearby medical offices at the moment.',
      'providersInArea.medicalOfficeFallbackName': 'Medical Office',
      'providersInArea.categoryLabel': 'Category',
      'providersInArea.categoryUnknown': 'General healthcare',
      'providersInArea.distanceLabel': 'Distance',
      'providersInArea.openDirections': 'Open directions',

      'error.geolocationUnavailable': 'Geolocation unavailable',
      'error.addressNotFound': 'Address not found. Please try a more specific address.',
      'error.enterAddress': 'Please enter an address',
      'error.networkUnavailable': 'Network unavailable. Please check your connection and try again.',
      'error.requestFailed': 'Request failed',
      'error.prefix': 'Error: ',

      'status.locationConfirmed': 'Location confirmed! Searching for providers...',
      'status.matchedWith': 'Matched with {name} ({dist} km).',
      'status.matchedNearbyPatient': 'Matched with a patient nearby.',
      'status.locationUpdatedRefreshed': 'Location updated and online availability refreshed.',
      'status.locationUpdated': 'Location updated successfully.',
      'status.savedProfileLoaded': 'Saved profile loaded. You can announce availability now.',
      'status.noLocationSet': 'Error: No location set',
      'status.announcingAvailability': 'Announcing availability...',
      'status.soon': 'soon',
      'status.onlineUntil': 'You are online until {until} (or until login expires).',
      'status.welcomeBack': 'Welcome back. Using your saved name and location.',

      'chat.me': 'Me',
      'chat.provider': 'Provider',
      'chat.patient': 'Patient',
      'chat.requestNow': 'A patient wants to chat now. Open The Arcadian to respond.',
      'chat.newRequest': 'New patient chat request received.',
      'chat.notConnected': 'Chat is not connected yet. Please wait for a match.',
      'chat.sendFailed': 'Message could not be sent. Please try again.',

      'autocomplete.noResultsHint': 'No results found. Try entering your city name or nearby landmark.',
      'autocomplete.errorPrefix': 'Autocomplete error: ',

      'auth.loggedInAs': 'Logged in as {username}',
      'auth.logOut': 'Log out',
      'auth.usernamePasswordRequired': 'Username and password are required.',
      'auth.loggingIn': 'Logging in...',
      'auth.createNeedCredentials': 'Please enter a username and password in the fields above to create your account.',
      'auth.creatingAccount': 'Creating account...',
      'auth.accountCreated': 'Account created. You can now log in.',

      'media.capture': 'Capture',
      'common.cancel': 'Cancel',
      'media.cameraPermission': 'Camera access is required to take photos. Please allow camera access and try again.',
      'media.download': 'Download'
    },
    es: {
      'lang.english': 'Ingles',
      'lang.spanish': 'Espanol',
      'lang.hindi': 'Hindi',
      'lang.title': 'Seleccionar idioma',
      'assistant.chatCta': 'Chatear con IA',

      'intro.title': 'The Arcadian',
      'intro.subtitle': 'Conectate con proveedores de salud al instante',
      'intro.description': 'Atencion de calidad, en cualquier momento y lugar. Encuentra coincidencias en 50 km e inicia un chat al instante.',
      'intro.description.strong': 'Sin esperas. Sin complicaciones.',
      'intro.patientBtn': 'Soy Paciente',
      'intro.providerBtn': 'Soy Proveedor',

      'patient.title': 'Paciente - Ingresa tu ubicacion',
      'common.yourName': 'Tu nombre',
      'common.useCurrentLocation': 'Usar ubicacion actual',
      'common.enterAddressManually': 'Ingresar direccion manualmente',
      'patient.searchAddress': 'Buscar direccion (ej., Calle Principal 123, Springfield, USA)',
      'common.continue': 'Continuar',
      'patient.nearbyProviders': 'Proveedores cercanos',
      'common.message': 'Mensaje...',
      'common.send': 'Enviar',
      'common.takePhoto': 'Tomar foto',
      'common.uploadFile': 'Subir archivo',
      'common.you': 'Tu',

      'provider.title': 'Proveedor - Ingresa tu ubicacion',
      'provider.specialtyPlaceholder': 'Especialidad (ej., Medicina General, Pediatria)',
      'provider.searchAddress': 'Buscar direccion (ej., Av. Roble 456, Springfield, USA)',
      'provider.announceAvailability': 'Anuncia tu disponibilidad',
      'provider.goOnline': 'Conectarse',
      'provider.menu': 'Menu',
      'provider.close': 'Cerrar',
      'provider.changeLocation': 'Cambiar ubicacion',
      'provider.updateLocation': 'Actualizar ubicacion',
      'provider.saveNewLocation': 'Guardar nueva ubicacion',

      'providerLogin.title': 'Ingreso de proveedor',
      'providerLogin.subtitle': 'Usa tu usuario y contrasena para continuar.',
      'providerLogin.username': 'Usuario',
      'providerLogin.password': 'Contrasena',
      'providerLogin.login': 'Iniciar sesion',
      'providerLogin.createAccount': 'Crear cuenta',

      'providersInArea.title': 'Proveedores en tu zona',
      'providersInArea.waiting': 'No hay proveedores en linea en este momento. Seguiremos buscando por ti.',
      'providersInArea.hint': 'Mantén esta pagina abierta. Cuando haya un proveedor disponible, usa el boton de notificacion para ir al chat.',
      'providersInArea.providerAvailable': 'Proveedor disponible. Toca el boton de notificacion para abrir el chat.',
      'providersInArea.notifyBtn': '🔔 Proveedor disponible',
      'providersInArea.medicalOfficesNone': 'No se encontraron consultorios medicos cerca de esta ubicacion por ahora.',
      'providersInArea.medicalOfficesError': 'No se pudieron cargar los consultorios medicos cercanos en este momento.',
      'providersInArea.medicalOfficeFallbackName': 'Consultorio medico',
      'providersInArea.categoryLabel': 'Categoria',
      'providersInArea.categoryUnknown': 'Atencion general',
      'providersInArea.distanceLabel': 'Distancia',
      'providersInArea.openDirections': 'Abrir direcciones',

      'error.geolocationUnavailable': 'Geolocalizacion no disponible',
      'error.addressNotFound': 'No se encontro la direccion. Prueba con una direccion mas especifica.',
      'error.enterAddress': 'Ingresa una direccion',
      'error.networkUnavailable': 'La red no esta disponible. Verifica tu conexion e intentalo de nuevo.',
      'error.requestFailed': 'La solicitud fallo',
      'error.prefix': 'Error: ',

      'status.locationConfirmed': 'Ubicacion confirmada. Buscando proveedores...',
      'status.matchedWith': 'Conectado con {name} ({dist} km).',
      'status.matchedNearbyPatient': 'Conectado con un paciente cercano.',
      'status.locationUpdatedRefreshed': 'Ubicacion actualizada y disponibilidad en linea renovada.',
      'status.locationUpdated': 'Ubicacion actualizada correctamente.',
      'status.savedProfileLoaded': 'Perfil guardado cargado. Ya puedes anunciar disponibilidad.',
      'status.noLocationSet': 'Error: No hay ubicacion configurada',
      'status.announcingAvailability': 'Anunciando disponibilidad...',
      'status.soon': 'pronto',
      'status.onlineUntil': 'Estas en linea hasta {until} (o hasta que expire tu sesion).',
      'status.welcomeBack': 'Bienvenido de nuevo. Usando tu nombre y ubicacion guardados.',

      'chat.me': 'Yo',
      'chat.provider': 'Proveedor',
      'chat.patient': 'Paciente',
      'chat.requestNow': 'Un paciente quiere chatear ahora. Abre The Arcadian para responder.',
      'chat.newRequest': 'Nueva solicitud de chat de paciente.',
      'chat.notConnected': 'El chat aun no esta conectado. Espera a que se complete la conexion.',
      'chat.sendFailed': 'No se pudo enviar el mensaje. Intentalo de nuevo.',

      'autocomplete.noResultsHint': 'No se encontraron resultados. Prueba con el nombre de tu ciudad o un punto de referencia cercano.',
      'autocomplete.errorPrefix': 'Error de autocompletado: ',

      'auth.loggedInAs': 'Sesion iniciada como {username}',
      'auth.logOut': 'Cerrar sesion',
      'auth.usernamePasswordRequired': 'Se requieren usuario y contrasena.',
      'auth.loggingIn': 'Iniciando sesion...',
      'auth.createNeedCredentials': 'Ingresa usuario y contrasena para crear tu cuenta.',
      'auth.creatingAccount': 'Creando cuenta...',
      'auth.accountCreated': 'Cuenta creada. Ahora puedes iniciar sesion.',

      'media.capture': 'Capturar',
      'common.cancel': 'Cancelar',
      'media.cameraPermission': 'Se requiere acceso a la camara para tomar fotos. Permite el acceso e intentalo de nuevo.',
      'media.download': 'Descargar'
    },
    hi: {
      'lang.english': 'English',
      'lang.spanish': 'Spanish',
      'lang.hindi': 'Hindi',
      'lang.title': 'Bhasha chune',
      'assistant.chatCta': 'AI se chat karein',

      'intro.title': 'The Arcadian',
      'intro.subtitle': 'Swasthya seva pradataon se turant juden',
      'intro.description': 'Gunvatta purn dekhbhal, kabhi bhi, kahin bhi. 50 km ke andar match paen aur turant chat shuru karen.',
      'intro.description.strong': 'Bina intezar. Bina pareshani.',
      'intro.patientBtn': 'Main Patient hoon',
      'intro.providerBtn': 'Main Provider hoon',

      'patient.title': 'Patient - Apni location darj karein',
      'common.yourName': 'Aapka naam',
      'common.useCurrentLocation': 'Maujooda location ka upyog karein',
      'common.enterAddressManually': 'Pata manually darj karein',
      'patient.searchAddress': 'Pata khojein (jaise: 123 Main St, Springfield, USA)',
      'common.continue': 'Jaari rakhein',
      'patient.nearbyProviders': 'Nazdiki Providers',
      'common.message': 'Sandesh...',
      'common.send': 'Bhejen',
      'common.takePhoto': 'Photo lein',
      'common.uploadFile': 'File upload karein',
      'common.you': 'Aap',

      'provider.title': 'Provider - Apni location darj karein',
      'provider.specialtyPlaceholder': 'Visheshagya (jaise: General Practice, Pediatrics)',
      'provider.searchAddress': 'Pata khojein (jaise: 456 Oak Ave, Springfield, USA)',
      'provider.announceAvailability': 'Apni upalabdhata ghoshit karein',
      'provider.goOnline': 'Online jayen',
      'provider.menu': 'Menu',
      'provider.close': 'Band karein',
      'provider.changeLocation': 'Location badlein',
      'provider.updateLocation': 'Location update karein',
      'provider.saveNewLocation': 'Nayi location save karein',

      'providerLogin.title': 'Provider login',
      'providerLogin.subtitle': 'Aage badhne ke liye apna username aur password istemal karein.',
      'providerLogin.username': 'Username',
      'providerLogin.password': 'Password',
      'providerLogin.login': 'Log in',
      'providerLogin.createAccount': 'Account banayein',

      'providersInArea.title': 'Aapke kshetra ke providers',
      'providersInArea.waiting': 'Abhi koi provider online nahi hai. Hum aapke liye check karte rahenge.',
      'providersInArea.hint': 'Is page ko khula rakhein. Provider milte hi notification button se seedha chat par jayen.',
      'providersInArea.providerAvailable': 'Provider available hai. Chat kholne ke liye notification button dabayen.',
      'providersInArea.notifyBtn': '🔔 Provider available',
      'providersInArea.medicalOfficesNone': 'Is location ke paas abhi koi medical office nahi mila.',
      'providersInArea.medicalOfficesError': 'Nazdeeki medical offices abhi load nahi ho pa rahe hain.',
      'providersInArea.medicalOfficeFallbackName': 'Medical Office',
      'providersInArea.categoryLabel': 'Category',
      'providersInArea.categoryUnknown': 'General healthcare',
      'providersInArea.distanceLabel': 'Distance',
      'providersInArea.openDirections': 'Directions kholen',

      'error.geolocationUnavailable': 'Geolocation uplabdh nahi hai',
      'error.addressNotFound': 'Pata nahi mila. Kripya aur vistar se pata darj karein.',
      'error.enterAddress': 'Kripya pata darj karein',
      'error.networkUnavailable': 'Network uplabdh nahi hai. Apni connection check karke phir se koshish karein.',
      'error.requestFailed': 'Request asafal raha',
      'error.prefix': 'Error: ',

      'status.locationConfirmed': 'Location pusht ho gayi. Providers khoje ja rahe hain...',
      'status.matchedWith': '{name} se match hua ({dist} km).',
      'status.matchedNearbyPatient': 'Nazdik ke patient se match hua.',
      'status.locationUpdatedRefreshed': 'Location update ho gayi aur online availability refresh ho gayi.',
      'status.locationUpdated': 'Location safalta se update hui.',
      'status.savedProfileLoaded': 'Saved profile load ho gayi. Ab aap availability announce kar sakte hain.',
      'status.noLocationSet': 'Error: Koi location set nahi hai',
      'status.announcingAvailability': 'Availability announce ki ja rahi hai...',
      'status.soon': 'jaldi',
      'status.onlineUntil': 'Aap {until} tak online hain (ya login expire hone tak).',
      'status.welcomeBack': 'Dobara swagat hai. Aapka saved naam aur location use ho raha hai.',

      'chat.me': 'Main',
      'chat.provider': 'Provider',
      'chat.patient': 'Patient',
      'chat.requestNow': 'Ek patient abhi chat karna chahta hai. Jawab dene ke liye The Arcadian kholen.',
      'chat.newRequest': 'Nayi patient chat request mili hai.',
      'chat.notConnected': 'Chat abhi connected nahi hai. Kripya match ka intezar karein.',
      'chat.sendFailed': 'Message bheja nahi ja saka. Kripya dubara koshish karein.',

      'autocomplete.noResultsHint': 'Koi result nahi mila. Apne shehar ka naam ya paas ka landmark darj karein.',
      'autocomplete.errorPrefix': 'Autocomplete error: ',

      'auth.loggedInAs': '{username} ke roop mein login hai',
      'auth.logOut': 'Log out',
      'auth.usernamePasswordRequired': 'Username aur password zaruri hain.',
      'auth.loggingIn': 'Log in ho raha hai...',
      'auth.createNeedCredentials': 'Account banane ke liye username aur password darj karein.',
      'auth.creatingAccount': 'Account banaya ja raha hai...',
      'auth.accountCreated': 'Account ban gaya. Ab aap log in kar sakte hain.',

      'media.capture': 'Capture',
      'common.cancel': 'Cancel',
      'media.cameraPermission': 'Photo lene ke liye camera access zaruri hai. Kripya access allow karke dubara koshish karein.',
      'media.download': 'Download'
    }
  };

  function detectLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || 'en').toLowerCase();
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('hi')) return 'hi';
    return 'en';
  }

  let currentLanguage = detectLanguage();

  function interpolate(template, params) {
    if (!params) return template;
    return String(template).replace(/\{(\w+)\}/g, (_, key) => {
      return params[key] == null ? '' : String(params[key]);
    });
  }

  function t(key, params) {
    const langPack = translations[currentLanguage] || translations.en;
    const enPack = translations.en;
    const value = langPack[key] || enPack[key] || key;
    return interpolate(value, params);
  }

  function applyPageTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (key) node.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (key) node.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      const key = node.getAttribute('data-i18n-title');
      if (key) node.setAttribute('title', t(key));
    });
  }

  const listeners = [];

  function setLanguage(language) {
    const next = SUPPORTED.includes(language) ? language : 'en';
    currentLanguage = next;
    localStorage.setItem(STORAGE_KEY, next);
    applyPageTranslations();
    listeners.forEach((listener) => {
      try {
        listener(next);
      } catch (err) {
        console.warn('Language listener failed', err);
      }
    });
  }

  function onLanguageChange(listener) {
    listeners.push(listener);
  }

  function createLanguageWidget() {
    const wrapper = document.createElement('div');
    wrapper.className = 'lang-switcher';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'lang-toggle';
    toggle.setAttribute('aria-label', t('lang.title'));
    toggle.title = t('lang.title');
    toggle.textContent = '🌐';

    const menu = document.createElement('div');
    menu.className = 'lang-menu hidden';

    const options = [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Espanol' },
      { code: 'hi', label: 'Hindi' }
    ];

    options.forEach((option) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-option';
      btn.dataset.lang = option.code;
      btn.textContent = option.label;
      if (option.code === currentLanguage) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        setLanguage(option.code);
        menu.classList.add('hidden');
        menu.querySelectorAll('.lang-option').forEach((node) => {
          node.classList.toggle('active', node.dataset.lang === option.code);
        });
      });
      menu.appendChild(btn);
    });

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) {
        menu.classList.add('hidden');
      }
    });

    wrapper.appendChild(toggle);
    wrapper.appendChild(menu);
    document.body.appendChild(wrapper);
  }

  window.appI18n = {
    t,
    setLanguage,
    getLanguage: () => currentLanguage,
    onLanguageChange,
    applyPageTranslations
  };

  document.addEventListener('DOMContentLoaded', () => {
    createLanguageWidget();
    applyPageTranslations();
  });
})();
