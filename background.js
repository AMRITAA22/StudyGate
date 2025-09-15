
const DEFAULT_SETTINGS = {
  subjects: ['math','science','history'],
  difficulty: 'medium',
  quizSize: 10,
  allowDurationMinutes: 30,
  theme: 'dark'
};

let questionsDB = {};

async function loadQuestions() {
  try {
    const resp = await fetch(chrome.runtime.getURL('questions.json'));
    questionsDB = await resp.json();
  } catch (e) {
    console.error('Failed to load questions.json', e);
  }
}
loadQuestions();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'GET_SETTINGS') {
    chrome.storage.local.get(['studyGateSettings'], (res) => {
      const s = res.studyGateSettings || DEFAULT_SETTINGS;
      sendResponse({settings: s});
    });
    return true;
  }

  if (msg?.type === 'GET_QUIZ') {
    const subjects = msg.subjects || DEFAULT_SETTINGS.subjects;
    const difficulty = msg.difficulty || DEFAULT_SETTINGS.difficulty;
    const size = msg.size || DEFAULT_SETTINGS.quizSize;

    let pool = [];
    for (const sub of subjects) {
      if (questionsDB[sub]) {
        for (const q of questionsDB[sub]) {
          if (!difficulty || q.difficulty === difficulty) pool.push({...q, subject: sub});
        }
      }
    }
    if (pool.length < size) {
      for (const sub in questionsDB) {
        for (const q of questionsDB[sub]) {
          if (!pool.includes(q)) pool.push({...q, subject: sub});
        }
      }
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    sendResponse({quiz: pool.slice(0, size)});
    return true;
  }
});
