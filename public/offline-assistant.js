(function () {
  function getLanguage() {
    if (window.appI18n && typeof window.appI18n.getLanguage === 'function') {
      return window.appI18n.getLanguage();
    }
    return 'en';
  }

  function getContent() {
    const lang = getLanguage();
    const content = {
      en: {
        title: 'Offline Health Assistant',
        subtitle: 'Runs on your device',
        placeholder: 'Ask a health question...',
        send: 'Send',
        openLabel: 'Open offline assistant',
        closeLabel: 'Close assistant',
        welcome: 'I am your offline health assistant. I can give basic guidance, but I am not a doctor.',
        unknown: 'I can help with common symptoms, hydration, medicines, and when to seek care. Try: flu, stomach ache, food poisoning, cholera, malaria, dengue, fever, or emergency signs.',
        emergency: 'If there is chest pain, trouble breathing, severe bleeding, confusion, or signs of stroke, seek emergency care now or call local emergency services immediately. Prevention steps you can do: keep emergency numbers saved, learn basic first aid/CPR, control blood pressure and sugar, avoid tobacco, and keep a home oral rehydration kit and clean drinking water.',
        fever: 'For fever: rest, fluids, and monitor temperature. Seek urgent care if fever is very high, lasts more than 3 days, or includes confusion, breathing trouble, or severe weakness.',
        cough: 'For cough: stay hydrated, rest, and avoid smoke. Seek care if cough lasts over 2 weeks, includes blood, chest pain, high fever, or breathing difficulty.',
        dehydration: 'Signs of dehydration include dark urine, dizziness, dry mouth, and low urine output. Sip oral rehydration fluids often. Seek care if unable to keep fluids down.',
        meds: 'Use medicines exactly as labeled. Do not mix medicines without guidance. If someone has a rash, swelling, or breathing issues after medicine, seek urgent help.',
        pregnancy: 'During pregnancy, seek care quickly for bleeding, severe headache, high fever, severe abdominal pain, or reduced fetal movement.',
        mental: 'If someone may harm themselves or others, contact emergency services immediately. For stress and anxiety, practice slow breathing and connect with trusted support.',
        wound: 'Clean minor wounds with clean water, apply gentle pressure to stop bleeding, and keep covered. Seek care for deep wounds, heavy bleeding, or signs of infection.',
        urgentCare: 'Seek urgent care for worsening symptoms, inability to drink fluids, high fever in children, severe pain, breathing trouble, or confusion.',
        flu: 'Flu symptoms: fever, chills, body aches, headache, sore throat, cough, fatigue, and runny nose. Advice: rest, drink plenty of fluids, and use fever medicine as labeled. Seek urgent care for breathing difficulty, chest pain, dehydration, confusion, or if symptoms worsen after initial improvement.',
        stomachAche: 'Stomach ache symptoms: abdominal pain/cramps, bloating, nausea, reduced appetite, and sometimes vomiting or loose stool. Advice: drink clear fluids, avoid oily/spicy foods, and rest. Seek care if pain is severe, one-sided, persistent over 24 hours, with fever, vomiting blood, black stool, or pregnancy.',
        foodPoisoning: 'Food poisoning symptoms: nausea, vomiting, diarrhea, stomach cramps, fever, and weakness after unsafe food/water. Advice: drink oral rehydration solution frequently, rest, and avoid dairy/oily food temporarily. Seek care for blood in stool, high fever, persistent vomiting, or dehydration signs.',
        cholera: 'Cholera symptoms: sudden frequent watery diarrhea, vomiting, intense thirst, leg cramps, and dehydration. Advice: start oral rehydration immediately and seek medical care quickly, especially with frequent watery diarrhea, vomiting, or weakness. Prevention steps: drink boiled/treated water, wash hands with soap, eat freshly cooked food, and keep toilets/water sources clean.',
        malaria: 'Malaria symptoms: fever with chills, sweating, headache, body ache, nausea, and fatigue (often after mosquito exposure). Advice: get tested soon at a clinic. Do not delay if symptoms are severe or recurring. Prevention steps: use mosquito nets, apply repellents, wear long sleeves at dusk/night, and remove standing water near home.',
        dengue: 'Dengue symptoms: high fever, severe headache, pain behind eyes, body/joint pain, rash, nausea, and weakness. Warning signs: abdominal pain, persistent vomiting, bleeding, drowsiness, breathing trouble. Advice: hydrate well and seek urgent care for warning signs. Prevention steps: prevent mosquito bites, cover water containers, empty standing water regularly, and use screens/nets.',
        migraine: 'Migraine symptoms: one-sided throbbing headache, nausea, vomiting, sensitivity to light/sound, and sometimes visual aura. Advice: rest in a dark quiet room, hydrate, and use prescribed pain medicine. Seek urgent care for sudden worst headache, weakness, confusion, or speech problems.',
        heartAttack: 'Heart attack symptoms: chest pressure/pain, pain in arm/jaw/back, shortness of breath, sweating, nausea, or faintness. Advice: this is an emergency. Call local emergency services immediately and seek urgent medical help now. Prevention steps: avoid smoking, reduce salt/fried food, stay active daily, manage stress, and monitor blood pressure, sugar, and cholesterol.',
        stroke: 'Stroke symptoms: face droop, arm weakness, speech difficulty, sudden confusion, vision loss, severe headache, or trouble walking. Advice: this is an emergency. Use FAST signs and call local emergency services immediately. Prevention steps: control blood pressure/diabetes, avoid tobacco and excess alcohol, stay active, maintain a healthy diet, and take prescribed medicines regularly.'
      },
      es: {
        title: 'Asistente de Salud Offline',
        subtitle: 'Funciona en tu dispositivo',
        placeholder: 'Haz una pregunta de salud...',
        send: 'Enviar',
        openLabel: 'Abrir asistente offline',
        closeLabel: 'Cerrar asistente',
        welcome: 'Soy tu asistente de salud offline. Puedo dar orientacion basica, pero no soy medico.',
        unknown: 'Puedo ayudar con sintomas comunes, hidratacion, medicinas y cuando buscar atencion. Prueba: gripe, dolor de estomago, intoxicacion alimentaria, colera, malaria, dengue, fiebre o signos de emergencia.',
        emergency: 'Si hay dolor de pecho, dificultad para respirar, sangrado severo, confusion o signos de derrame cerebral, busca atencion de emergencia ahora. Prevencion en casa: guarda numeros de emergencia, aprende primeros auxilios/RCP, controla presion y azucar, evita tabaco y manten agua segura y suero oral en casa.',
        fever: 'Para fiebre: descanso, liquidos y controlar temperatura. Busca atencion urgente si es muy alta, dura mas de 3 dias o hay confusion o dificultad para respirar.',
        cough: 'Para tos: hidratacion, descanso y evitar humo. Busca atencion si dura mas de 2 semanas, hay sangre, dolor de pecho, fiebre alta o dificultad para respirar.',
        dehydration: 'Signos de deshidratacion: orina oscura, mareo, boca seca y poca orina. Toma sueros de rehidratacion en sorbos frecuentes.',
        meds: 'Usa medicamentos segun la etiqueta. No mezcles medicinas sin orientacion. Si hay sarpullido, hinchazon o dificultad para respirar, busca ayuda urgente.',
        pregnancy: 'En embarazo, busca atencion rapidamente por sangrado, dolor abdominal fuerte, fiebre alta o disminucion de movimiento fetal.',
        mental: 'Si alguien puede hacerse dano o danar a otros, llama a emergencias de inmediato. Para estres y ansiedad, respira lento y busca apoyo de confianza.',
        wound: 'Lava heridas leves con agua limpia, presiona para frenar sangrado y cubre la herida. Busca atencion por heridas profundas o sangrado abundante.',
        urgentCare: 'Busca atencion urgente si los sintomas empeoran, no puedes tomar liquidos, hay fiebre alta en ninos, dolor severo o confusion.',
        flu: 'Sintomas de gripe: fiebre, escalofrios, dolor muscular, dolor de cabeza, dolor de garganta, tos y cansancio. Consejo: descanso, muchos liquidos y medicina para fiebre segun etiqueta. Busca urgencias por dolor de pecho, falta de aire, confusion o deshidratacion.',
        stomachAche: 'Sintomas de dolor de estomago: dolor abdominal, colicos, hinchazon, nausea y a veces vomito o diarrea. Consejo: toma liquidos claros, evita comida grasosa/picante y descansa. Busca atencion si el dolor es severo, dura mas de 24 horas o hay sangre.',
        foodPoisoning: 'Sintomas de intoxicacion alimentaria: nausea, vomito, diarrea, colicos, fiebre y debilidad despues de comer algo contaminado. Consejo: usa suero oral en sorbos frecuentes, descansa y evita lacteos/grasas temporalmente. Busca atencion por fiebre alta, vomitos persistentes o sangre en heces.',
        cholera: 'Sintomas de colera: diarrea acuosa intensa, vomitos, mucha sed, calambres y deshidratacion. Consejo: inicia suero oral de inmediato y busca atencion medica urgente. Prevencion: bebe agua hervida/tratada, lavate las manos con jabon, come comida bien cocida y manten limpios banos/fuentes de agua.',
        malaria: 'Sintomas de malaria: fiebre con escalofrios, sudoracion, dolor de cabeza, dolor corporal, nausea y cansancio. Consejo: requiere prueba pronto en clinica, especialmente tras picaduras de mosquitos. Prevencion: usa mosquiteros, repelente, ropa de manga larga y elimina agua estancada.',
        dengue: 'Sintomas de dengue: fiebre alta, dolor de cabeza fuerte, dolor detras de los ojos, dolor muscular/articular, nausea y erupcion. Senales de alarma: dolor abdominal intenso, vomito persistente, sangrado o somnolencia. Busca urgencias. Prevencion: evita picaduras, tapa recipientes de agua, elimina agua estancada y usa mosquiteros.',
        migraine: 'Sintomas de migrana: dolor de cabeza pulsatil (a menudo de un lado), nausea, vomito, sensibilidad a luz/sonido y a veces aura visual. Consejo: descansa en lugar oscuro y silencioso, hidrata y usa medicamento indicado.',
        heartAttack: 'Sintomas de infarto: dolor/presion en pecho, dolor en brazo/mandibula/espalda, falta de aire, sudor frio, nausea o mareo. Consejo: es una emergencia. Llama a emergencias de inmediato. Prevencion: no fumar, menos sal y fritos, actividad diaria, controlar estres y vigilar presion/azucar/colesterol.',
        stroke: 'Sintomas de derrame cerebral: caida facial, debilidad de brazo, dificultad para hablar, confusion, perdida de vision o dificultad para caminar. Consejo: es una emergencia. Usa senales FAST y llama a emergencias de inmediato. Prevencion: controlar presion y diabetes, evitar tabaco/alcohol en exceso, actividad fisica y dieta saludable.'
      },
      hi: {
        title: 'Offline Health Assistant',
        subtitle: 'Aapke device par chalta hai',
        placeholder: 'Health sawal puchhiye...',
        send: 'Send',
        openLabel: 'Offline assistant kholen',
        closeLabel: 'Assistant band karein',
        welcome: 'Main aapka offline health assistant hoon. Main basic guidance de sakta hoon, lekin doctor nahi hoon.',
        unknown: 'Main common symptoms, hydration, medicines aur urgent care ke baare mein madad kar sakta hoon. Try karein: flu, stomach ache, food poisoning, cholera, malaria, dengue, fever, emergency signs.',
        emergency: 'Agar chest pain, saans lene mein dikkat, bahut bleeding, confusion, ya stroke ke signs hon to turant emergency care lein. Prevention steps: emergency numbers save rakhein, basic first aid/CPR sikhein, BP aur sugar control rakhein, tobacco avoid karein, aur ghar me safe pani + ORS rakhein.',
        fever: 'Fever mein rest karein, fluids lein, aur temperature monitor karein. Fever bahut high ho, 3 din se zyada rahe, ya breathing problem ho to urgent care lein.',
        cough: 'Cough ke liye hydration, rest, aur smoke se door rahen. 2 hafte se zyada cough, blood, chest pain, ya breathing issue ho to doctor se milen.',
        dehydration: 'Dehydration signs: dark urine, chakkar, dry mouth, kam urine. Oral rehydration fluids baar baar piyen.',
        meds: 'Dawai label ke hisab se lein. Bina guidance ke medicines mix na karein. Rash, swelling, ya breathing issue ho to urgent help lein.',
        pregnancy: 'Pregnancy mein bleeding, severe headache, high fever, severe abdominal pain, ya fetal movement kam ho to turant care lein.',
        mental: 'Agar kisi ko khud ko ya dusron ko nuksan ka risk ho to emergency services ko turant call karein.',
        wound: 'Chhoti wound ko saaf paani se saaf karein, bleeding rokne ke liye pressure dein, aur cover rakhein. Deep wound ya heavy bleeding mein care lein.',
        urgentCare: 'Symptoms worsen hon, fluids na ruk rahe hon, severe pain, breathing trouble, ya confusion ho to urgent care lein.',
        flu: 'Flu symptoms: fever, chills, body ache, headache, sore throat, cough, weakness. Advice: rest karein, fluids lein, fever medicine label ke hisab se lein. Saans ki dikkat, chest pain, confusion, ya dehydration ho to turant care lein.',
        stomachAche: 'Stomach ache symptoms: pet dard, cramps, bloating, nausea, kabhi vomiting/loose motion. Advice: clear fluids lein, teekha/tela khana avoid karein, rest karein. Severe pain ya blood ho to doctor ko dikhaein.',
        foodPoisoning: 'Food poisoning symptoms: nausea, vomiting, diarrhea, stomach cramps, fever, weakness. Advice: ORS baar baar lein, rest karein, heavy food avoid karein. High fever, persistent vomiting, blood stool, ya dehydration ho to care lein.',
        cholera: 'Cholera symptoms: bahut watery diarrhea, vomiting, zyada pyaas, weakness, dehydration. Advice: ORS turant shuru karein aur jaldi clinic/hospital jayen. Prevention: ubla/treated pani piyen, haath sabun se dhoyen, taja paka khana khayen, toilet aur pani source saaf rakhein.',
        malaria: 'Malaria symptoms: fever with chills, sweating, headache, body ache, nausea, weakness. Advice: jaldi test karana zaruri hai, clinic mein check karwaein. Prevention: mosquito net use karein, repellent lagayen, full sleeves pehnen, aur ghar ke aas-paas pani jama na hone dein.',
        dengue: 'Dengue symptoms: high fever, severe headache, eye pain, body/joint pain, rash, nausea. Warning signs: severe abdominal pain, persistent vomiting, bleeding, drowsiness, breathing issue. Urgent care lein. Prevention: mosquito bites se bachen, pani ke bartans dhak kar rakhein, standing water hataate rahen, nets/screens use karein.',
        migraine: 'Migraine symptoms: ek side dhadakta headache, nausea/vomiting, light ya sound sensitivity, kabhi visual aura. Advice: dark quiet room mein rest karein, hydrate karein, prescribed medicine lein.',
        heartAttack: 'Heart attack symptoms: chest pain/pressure, arm/jaw/back pain, saans ki dikkat, sweating, nausea, chakkar. Advice: yeh emergency hai. Turant emergency services ko call karein. Prevention: smoking se bachen, kam namak/tela khayen, daily walk/exercise karein, stress kam karein, BP-sugar-cholesterol monitor karein.',
        stroke: 'Stroke symptoms: chehre ka ek side jhukna, haath kamzor hona, bolne mein dikkat, achanak confusion/vision issue/walking issue. Advice: yeh emergency hai. FAST signs par turant emergency call karein. Prevention: BP/diabetes control rakhein, tobacco aur zyada alcohol avoid karein, healthy diet aur regular activity rakhein.'
      }
    };

    return content[lang] || content.en;
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
  }

  function classify(input) {
    const q = normalizeText(input);
    if (!q) return 'unknown';

    const emergencyPattern = /can't breathe|cannot breathe|trouble breathing|breathing trouble|seizure|bleeding heavily|severe bleeding|suicid|self harm|harm myself|harm others|emergency/;
    const feverPattern = /fever|temperature|hot body|high temp|pyrexia|fiebre|bukhar/;
    const coughPattern = /cough|cold|throat|sore throat|khansi|tos/;
    const fluPattern = /flu|influenza|gripe|viral fever|viral infection/;
    const stomachPattern = /stomach ache|stomach pain|abdominal pain|pet dard|dolor de estomago|gastric/;
    const foodPoisoningPattern = /food poisoning|bad food|contaminated food|intoxicacion|khana kharab|ulati dast|vomiting and diarrhea/;
    const choleraPattern = /cholera|watery diarrhea|rice water stool|haija|haiza|colera/;
    const malariaPattern = /malaria|chills and fever|mosquito fever|malaria ke lakshan/;
    const denguePattern = /dengue|platelet|breakbone fever|dengue ke lakshan/;
    const migrainePattern = /migraine|one sided headache|throbbing headache|aura headache|migrena/;
    const heartAttackPattern = /heart attack|cardiac arrest|chest pressure|infarto/;
    const strokePattern = /stroke|face droop|arm weakness|slurred speech|fast signs|derrame cerebral/;
    const dehydrationPattern = /dehydrat|dry mouth|dark urine|dizzy|vomit|diarrhea|diarrhoea|loose motion|pani ki kami/;
    const medsPattern = /medicine|medication|tablet|dose|drug|side effect|dawai|medicina/;
    const pregnancyPattern = /pregnan|fetal|baby move|embarazo|garbh|garbhvati/;
    const mentalPattern = /anxiety|stress|depress|panic|suicide|self harm|mental|chinta|tanav/;
    const woundPattern = /wound|cut|injury|bleeding|burn|ghav|chot|herida/;
    const urgentPattern = /urgent|doctor now|hospital now|when to go|severe|danger/;

    if (emergencyPattern.test(q)) return 'emergency';
    if (fluPattern.test(q)) return 'flu';
    if (stomachPattern.test(q)) return 'stomachAche';
    if (foodPoisoningPattern.test(q)) return 'foodPoisoning';
    if (choleraPattern.test(q)) return 'cholera';
    if (malariaPattern.test(q)) return 'malaria';
    if (denguePattern.test(q)) return 'dengue';
    if (migrainePattern.test(q)) return 'migraine';
    if (heartAttackPattern.test(q)) return 'heartAttack';
    if (strokePattern.test(q)) return 'stroke';
    if (feverPattern.test(q)) return 'fever';
    if (coughPattern.test(q)) return 'cough';
    if (dehydrationPattern.test(q)) return 'dehydration';
    if (medsPattern.test(q)) return 'meds';
    if (pregnancyPattern.test(q)) return 'pregnancy';
    if (mentalPattern.test(q)) return 'mental';
    if (woundPattern.test(q)) return 'wound';
    if (urgentPattern.test(q)) return 'urgentCare';
    return 'unknown';
  }

  function createBubble(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `oa-bubble oa-${role}`;
    bubble.textContent = text;
    return bubble;
  }

  function runAssistant() {
    let content = getContent();

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'oa-toggle';
    toggle.setAttribute('aria-label', content.openLabel);
    toggle.title = content.openLabel;
    toggle.textContent = 'AI';

    const panel = document.createElement('section');
    panel.className = 'oa-panel hidden';

    const header = document.createElement('header');
    header.className = 'oa-header';

    const headingWrap = document.createElement('div');
    headingWrap.className = 'oa-heading-wrap';

    const title = document.createElement('h3');
    title.className = 'oa-title';
    title.textContent = content.title;

    const subtitle = document.createElement('p');
    subtitle.className = 'oa-subtitle';
    subtitle.textContent = content.subtitle;

    headingWrap.appendChild(title);
    headingWrap.appendChild(subtitle);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'oa-close';
    closeBtn.setAttribute('aria-label', content.closeLabel);
    closeBtn.title = content.closeLabel;
    closeBtn.textContent = 'x';

    header.appendChild(headingWrap);
    header.appendChild(closeBtn);

    const feed = document.createElement('div');
    feed.className = 'oa-feed';

    const composer = document.createElement('div');
    composer.className = 'oa-composer';

    const input = document.createElement('input');
    input.className = 'oa-input';
    input.placeholder = content.placeholder;

    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'oa-send';
    send.textContent = content.send;

    composer.appendChild(input);
    composer.appendChild(send);

    panel.appendChild(header);
    panel.appendChild(feed);
    panel.appendChild(composer);

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    let history = [];

    function refreshLocalizedUi() {
      content = getContent();
      toggle.setAttribute('aria-label', content.openLabel);
      toggle.title = content.openLabel;
      title.textContent = content.title;
      subtitle.textContent = content.subtitle;
      closeBtn.setAttribute('aria-label', content.closeLabel);
      closeBtn.title = content.closeLabel;
      input.placeholder = content.placeholder;
      send.textContent = content.send;

      // If only the initial welcome message exists, update it to the new language.
      if (history.length === 1 && history[0].role === 'bot') {
        history[0].text = content.welcome;
        renderHistory();
      }
    }

    function renderHistory() {
      feed.innerHTML = '';
      history.forEach((entry) => {
        feed.appendChild(createBubble(entry.role, entry.text));
      });
      feed.scrollTop = feed.scrollHeight;
    }

    function pushMessage(role, text) {
      history.push({ role, text, ts: Date.now() });
      renderHistory();
    }

    function getReply(userText) {
      const topic = classify(userText);
      return content[topic] || content.unknown;
    }

    function submitMessage() {
      const userText = input.value.trim();
      if (!userText) return;
      pushMessage('user', userText);
      input.value = '';
      const reply = getReply(userText);
      pushMessage('bot', reply);
    }

    send.addEventListener('click', submitMessage);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitMessage();
    });

    function isOpen() {
      return !panel.classList.contains('hidden');
    }

    function setOpen(nextOpen) {
      panel.classList.toggle('hidden', !nextOpen);
      if (nextOpen) input.focus();
    }

    function toggleAssistant() {
      setOpen(!isOpen());
    }

    toggle.addEventListener('click', () => {
      toggleAssistant();
    });

    document.querySelectorAll('[data-open-offline-assistant]').forEach((btn) => {
      btn.addEventListener('click', toggleAssistant);
    });

    closeBtn.addEventListener('click', () => setOpen(false));

    history = [{ role: 'bot', text: content.welcome, ts: Date.now() }];

    renderHistory();

    if (window.appI18n && typeof window.appI18n.onLanguageChange === 'function') {
      window.appI18n.onLanguageChange(() => {
        refreshLocalizedUi();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', runAssistant);
})();
