
(async function() {
  const hostname = location.hostname;
  const key = 'studyGate_allowed_' + hostname;

  function getStorage(keys) {
    return new Promise(res => chrome.storage.local.get(keys, r => res(r)));
  }

  const s = await getStorage([key]);
  const allowedInfo = s[key];
  if (allowedInfo) {
    const allowedUntil = new Date(allowedInfo.until);
    if (allowedUntil > new Date()) return;
  }

  const settingsResp = await new Promise(r => chrome.runtime.sendMessage({type: 'GET_SETTINGS'}, r));
  const settings = settingsResp?.settings || {subjects:['math'], difficulty:'medium', quizSize:10, allowDurationMinutes:30, theme:'dark'};

  const quizResp = await new Promise(r => chrome.runtime.sendMessage({type:'GET_QUIZ', subjects: settings.subjects, difficulty: settings.difficulty, size: settings.quizSize}, r));
  const quiz = quizResp?.quiz || [];

  const overlay = document.createElement('div');
  overlay.id = 'study-gate-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  });

  const box = document.createElement('div');
  Object.assign(box.style, {
    width: 'min(1000px, 98%)',
    maxHeight: '90%',
    overflow: 'auto',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
  });

  function applyTheme(theme) {
    if (theme === 'light') {
      overlay.style.background = 'rgba(255,255,255,0.95)';
      overlay.style.color = '#111';
      box.style.background = '#f9f9f9';
    } else {
      overlay.style.background = 'rgba(0,0,0,0.85)';
      overlay.style.color = '#fff';
      box.style.background = '#111';
    }
  }
  applyTheme(settings.theme || 'dark');

  const title = document.createElement('h2');
  title.textContent = 'Study Gate — answer the quiz to proceed';
  box.appendChild(title);

  const info = document.createElement('p');
  info.textContent = `Subjects: ${settings.subjects.join(', ')} · Difficulty: ${settings.difficulty} · Questions: ${quiz.length}`;
  box.appendChild(info);

  const form = document.createElement('form');
  form.id = 'study-gate-form';

  quiz.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.style.margin = '12px 0';
    const qText = document.createElement('div');
    qText.innerHTML = `<strong>Q${idx+1} (${q.subject})</strong>: ${q.question}`;
    qDiv.appendChild(qText);

    (q.options || []).forEach((opt, i) => {
      const id = `sg_${idx}_${i}`;
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.marginTop = '6px';
      label.innerHTML = `<input type="radio" name="q${idx}" value="${i}" id="${id}"> ${opt}`;
      qDiv.appendChild(label);
    });

    form.appendChild(qDiv);
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Submit answers';
  Object.assign(submit.style, {
    marginTop: '10px',
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer'
  });
  form.appendChild(submit);

  box.appendChild(form);

  const feedback = document.createElement('div');
  feedback.style.marginTop = '12px';
  box.appendChild(feedback);

  overlay.appendChild(box);
  document.documentElement.appendChild(overlay);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let correct = 0;
    for (let i = 0; i < quiz.length; i++) {
      const sel = form.querySelector(`input[name="q${i}"]:checked`);
      if (sel) {
        const choice = parseInt(sel.value, 10);
        if (choice === quiz[i].answer) correct++;
      }
    }
    const score = Math.round((correct / quiz.length) * 100);
    const pass = score >= 90;
    feedback.innerHTML = `<strong>Your score: ${score}%</strong> — ${pass ? 'Pass! Redirecting...' : 'Not enough — try again.'}`;
    if (pass) {
      const until = new Date(Date.now() + settings.allowDurationMinutes * 60 * 1000);
      const obj = {};
      obj[key] = {until: until.toISOString()};
      chrome.storage.local.set(obj, () => overlay.remove());
    } else {
      feedback.style.color = 'orange';
    }
  });
})();
