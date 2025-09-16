
document.addEventListener('DOMContentLoaded', () => {
  const subjectsEl = document.getElementById('subjects');
  const difficultyEl = document.getElementById('difficulty');
  const quizSizeEl = document.getElementById('quizSize');
  const allowMinutesEl = document.getElementById('allowMinutes');
  const themeEl = document.getElementById('theme');
  const status = document.getElementById('status');

  chrome.storage.local.get(['studyGateSettings'], (res) => {
    const s = res.studyGateSettings || {subjects:['math','science','history'], difficulty:'medium', quizSize:10, allowDurationMinutes:30, theme:'dark'};
    subjectsEl.value = s.subjects.join(',');
    difficultyEl.value = s.difficulty;
    quizSizeEl.value = s.quizSize;
    allowMinutesEl.value = s.allowDurationMinutes;
    themeEl.value = s.theme || 'dark';
  });

  document.getElementById('save').addEventListener('click', () => {
    const s = {
      subjects: subjectsEl.value.split(',').map(x => x.trim()).filter(x => x),
      difficulty: difficultyEl.value,
      quizSize: Math.max(5, Math.min(20, parseInt(quizSizeEl.value) || 10)),
      allowDurationMinutes: Math.max(5, Math.min(1440, parseInt(allowMinutesEl.value) || 30)),
      theme: themeEl.value
    };
    chrome.storage.local.set({studyGateSettings: s}, () => {
      status.textContent = 'Saved ✓';
      setTimeout(() => status.textContent = '', 2000);
    });
  });
});
