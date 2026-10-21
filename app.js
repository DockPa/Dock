let state = {
  isPlus: false,
  xp: 100,
  level: 1,
  lang: localStorage.getItem('dock_lang') || 'en',
  activeTitle: "Novice Scheduler",
  unlockedTitles: ["Novice Scheduler"],
  tasks: [
    { id: 1, text: "Work shift / Sole trader jobs", day: "Monday", timeSlot: "9:00 AM", duration: "3 hrs", completed: false },
    { id: 2, text: "Family dinner", day: "Tuesday", timeSlot: "5:00 PM", duration: "1.5 hrs", completed: false }
  ]
};

const translations = {
  en: {
    navTasks: "Tasks", navProfile: "Profile", navSettings: "Settings",
    smartEntry: "Quick Add", addTask: "Add Task", askTitle: "DOCK Assistant",
    askSub: "Type a task with a time", askWelcome: "👋 Hello! Tell me a task with a time and I'll schedule it.",
    activeTasks: "Active Schedule", emailExportBtn: "✉️ Export",
    completedHistory: "Completed", clearHistory: "Clear", profileHeading: "Profile & Stats",
    playerRank: "Player Rank", xpSub: "Complete tasks to earn +50 XP!",
    displayTitle: "Display Title", dispName: "Display Name", dispEmail: "Email (For Exports)", saveProfile: "Save Profile",
    plusTitle: "DOCK Plus", plusDesc: "Unlock Cloud Sync, Weekly Email Exports, and Advanced Accessibility Themes. Supercharge your workflow.",
    plusBtn: "Upgrade - £2.99/mo", settingsHeading: "Settings", langHeading: "Language",
    dataMgmt: "Data & Sync", cloudSync: "Enable Cloud Sync <span class='pro-badge'>PRO</span>"
  }
};

function changeLanguage(langKey) {
  state.lang = langKey;
  localStorage.setItem('dock_lang', langKey);
  const t = translations[langKey] || translations.en; // Fallback to EN for missing langs in this demo
  
  document.getElementById('nav-lbl-tasks').innerText = t.navTasks;
  document.getElementById('nav-lbl-profile').innerText = t.navProfile;
  document.getElementById('nav-lbl-settings').innerText = t.navSettings;
  document.getElementById('lbl-smart-entry').innerText = t.smartEntry;
  document.getElementById('btn-add-task').innerText = t.addTask;
  document.getElementById('lbl-assistant-title').innerText = t.askTitle;
  document.getElementById('lbl-assistant-sub').innerText = t.askSub;
  document.getElementById('lbl-active-tasks').innerText = t.activeTasks;
  document.getElementById('btn-email-export').innerText = t.emailExportBtn;
  document.getElementById('lbl-completed-history').innerText = t.completedHistory;
  document.getElementById('btn-clear-history').innerText = t.clearHistory;
  document.getElementById('lbl-profile-heading').innerText = t.profileHeading;
  document.getElementById('lbl-player-rank').innerText = t.playerRank;
  document.getElementById('lbl-xp-sub').innerText = t.xpSub;
  document.getElementById('lbl-display-title').innerText = t.displayTitle;
  document.getElementById('lbl-disp-name').innerText = t.dispName;
  document.getElementById('lbl-disp-email').innerText = t.dispEmail;
  document.getElementById('btn-save-profile').innerText = t.saveProfile;
  document.getElementById('lbl-plus-title').innerText = t.plusTitle;
  document.getElementById('lbl-plus-desc').innerText = t.plusDesc;
  document.getElementById('stripe-checkout-btn').innerText = t.plusBtn;
  document.getElementById('lbl-settings-heading').innerText = t.settingsHeading;
  document.getElementById('lbl-lang-heading').innerText = t.langHeading;
  document.getElementById('lbl-data-mgmt').innerText = t.dataMgmt;
  document.getElementById('lbl-cloud-sync').innerHTML = t.cloudSync;
}

const allTitlesData = [
  { name: "Novice Scheduler", reqLevel: 1 },
  { name: "Task Crusher", reqLevel: 2 },
  { name: "Time Architect", reqLevel: 3 },
  { name: "Master of DOCK", reqLevel: 5 }
];

let pendingSuggestion = null;
let userEmail = "user@example.com";
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let bannerTimeout = null;

function initApp() {
  loadSavedData();
  renderTasks();
  updateXpUI();
  renderTitleChips();
  
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = state.lang;
    changeLanguage(state.lang);
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('upgrade') === 'success') {
    state.isPlus = true;
    localStorage.setItem('dock_isPlus', 'true');
    alert("Payment Successful! Welcome to DOCK Plus. Premium features are unlocked.");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (state.isPlus) {
    const toggle = document.getElementById('cloud-sync-toggle');
    if (toggle) toggle.checked = localStorage.getItem('dock_cloud_sync') === 'true';
  }
}

function loadSavedData() {
  state.isPlus = localStorage.getItem('dock_isPlus') === 'true';
  const savedXp = localStorage.getItem('dock_user_xp');
  if(savedXp !== null) state.xp = parseInt(savedXp, 10);
  const savedTitle = localStorage.getItem('dock_active_title');
  if(savedTitle) state.activeTitle = savedTitle;
  const savedTasks = localStorage.getItem('dock_tasks_v15');
  if(savedTasks) { try { state.tasks = JSON.parse(savedTasks); } catch(e) {} }
  calculateLevel();
}

function saveTasksToStorage() { localStorage.setItem('dock_tasks_v15', JSON.stringify(state.tasks)); }

function handleProFeature(featureName) {
  if (!state.isPlus) {
    if (featureName === 'cloud-sync') document.getElementById('cloud-sync-toggle').checked = false;
    alert(`This feature requires DOCK Plus (£2.99/mo). Redirecting...`);
    switchView('plus');
    return false;
  }
  if (featureName === 'cloud-sync') localStorage.setItem('dock_cloud_sync', document.getElementById('cloud-sync-toggle').checked);
  return true;
}

function triggerEmailExport() {
  if (handleProFeature('email-export')) {
    const container = document.getElementById('email-items-container');
    container.innerHTML = '<strong>DOCK Dispatch:</strong><br><br>';
    state.tasks.forEach(t => {
      container.innerHTML += `${t.completed ? '✅' : '📌'} ${t.text} (${t.day} @ ${t.timeSlot})<br>`;
    });
    openModal('email-preview-modal');
  }
}

function calculateLevel() {
  let lvl = 1; let remainingXp = state.xp; let nextLevelCost = 150;
  while (remainingXp >= nextLevelCost) { remainingXp -= nextLevelCost; lvl++; nextLevelCost += 50; }
  state.level = lvl;
  allTitlesData.forEach(t => { if (state.level >= t.reqLevel && !state.unlockedTitles.includes(t.name)) state.unlockedTitles.push(t.name); });
}

function updateXpUI() {
  calculateLevel();
  const currentLevelCost = 100 + (state.level - 1) * 50;
  let progressInLevel = (state.xp % currentLevelCost);
  let pct = Math.min(100, Math.round((progressInLevel / currentLevelCost) * 100));

  document.getElementById('profile-level-title').innerText = `Level ${state.level}: ${state.activeTitle}`;
  document.getElementById('header-level-badge').innerText = `Lvl ${state.level}`;
  document.getElementById('profile-xp-text').innerText = `${state.xp} XP`;
  document.getElementById('xp-bar-fill').style.width = pct + '%';
  document.getElementById('mini-xp-fill').style.width = pct + '%';
}

function renderTitleChips() {
  const container = document.getElementById('title-chips-container');
  container.innerHTML = '';
  allTitlesData.forEach(t => {
    const isUnlocked = state.unlockedTitles.includes(t.name);
    const isActive = state.activeTitle === t.name;
    const chip = document.createElement('div');
    chip.className = `title-chip ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
    chip.innerHTML = `${t.name} ${!isUnlocked ? '🔒' : ''}`;
    if (isUnlocked) {
      chip.onclick = () => {
        state.activeTitle = t.name; localStorage.setItem('dock_active_title', t.name);
        updateXpUI(); renderTitleChips();
      };
    }
    container.appendChild(chip);
  });
}

// NATIVE APP BOTTOM NAVIGATION SWITCHING
window.switchView = function(viewName) {
  // Hide all sections
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  // Show target
  document.getElementById('view-' + viewName).classList.add('active');
  
  // Update bottom nav active state
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-item[data-target="${viewName}"]`);
  if(activeBtn) activeBtn.classList.add('active');
  
  window.scrollTo(0,0);
}

function triggerDopamineHit(taskText) {
  state.xp += 50; localStorage.setItem('dock_user_xp', state.xp);
  let oldLevel = state.level; calculateLevel(); updateXpUI(); renderTitleChips();

  const banner = document.getElementById('celebration-banner');
  document.getElementById('banner-title').innerText = state.level > oldLevel ? `⭐ Level ${state.level} Reached!` : `Task Completed!`;
  
  if (bannerTimeout) clearTimeout(bannerTimeout);
  banner.classList.add('show');
  bannerTimeout = setTimeout(() => banner.classList.remove('show'), 3000);
}

function addQuickTask() {
  const input = document.getElementById('quick-task-input');
  const text = input.value.trim(); if (!text) return;
  state.tasks.unshift({ id: Date.now(), text, day: document.getElementById('task-day-select').value, timeSlot: document.getElementById('task-time-select').value, completed: false });
  input.value = ''; saveTasksToStorage(); renderTasks();
}
function handleTaskKey(e) { if (e.key === 'Enter') addQuickTask(); }

function toggleTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if(t) { t.completed = !t.completed; saveTasksToStorage(); renderTasks(); if(t.completed) triggerDopamineHit(t.text); }
}

function deleteTask(id) { state.tasks = state.tasks.filter(x => x.id !== id); saveTasksToStorage(); renderTasks(); }
function clearCompleted() { state.tasks = state.tasks.filter(x => !x.completed); saveTasksToStorage(); renderTasks(); }

function renderTasks() {
  const activeContainer = document.getElementById('task-container');
  const completedContainer = document.getElementById('completed-container');
  const completedSection = document.getElementById('completed-section');
  activeContainer.innerHTML = ''; completedContainer.innerHTML = '';

  const activeTasks = state.tasks.filter(t => !t.completed);
  const completedTasks = state.tasks.filter(t => t.completed);

  if (activeTasks.length === 0) {
    activeContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">All caught up! 🎉</div>`;
  } else {
    activeTasks.forEach(task => {
      activeContainer.innerHTML += `
        <div class="task-item">
          <div class="task-left">
            <input type="checkbox" class="custom-checkbox" onchange="toggleTask(${task.id})">
            <div>
              <span class="task-text">${task.text}</span>
              <div class="task-badges"><span class="badge">${task.day}</span><span class="badge time">${task.timeSlot}</span></div>
            </div>
          </div>
          <button class="delete-btn" onclick="deleteTask(${task.id})">✕</button>
        </div>`;
    });
  }

  if (completedTasks.length > 0) {
    completedSection.style.display = 'block';
    completedTasks.forEach(task => {
      completedContainer.innerHTML += `
        <div class="task-item">
          <div class="task-left">
            <input type="checkbox" class="custom-checkbox" checked onchange="toggleTask(${task.id})">
            <div><span class="task-text">${task.text}</span></div>
          </div>
          <button class="delete-btn" onclick="deleteTask(${task.id})">✕</button>
        </div>`;
    });
  } else { completedSection.style.display = 'none'; }
}

// Full AI Chat Logic Restoration
function parseExactTime(query) {
  let timeMatch = query.match(/(\d{1,2})[\.:](\d{2})\s*(am|pm)?/i) || query.match(/(\d{1,2})\s*(am|pm)/i);
  if (timeMatch) {
    if (timeMatch[2] && (timeMatch[2].toLowerCase() === 'am' || timeMatch[2].toLowerCase() === 'pm')) {
      return timeMatch[1] + ":00 " + timeMatch[2].toUpperCase();
    } else if (timeMatch[2] && timeMatch[3]) {
      return timeMatch[1] + ":" + timeMatch[2] + " " + timeMatch[3].toUpperCase();
    } else if (timeMatch[1] && timeMatch[2]) {
      let h = parseInt(timeMatch[1]);
      let m = timeMatch[2];
      let ampm = h < 8 ? "PM" : "AM";
      if (query.toLowerCase().includes('pm')) ampm = "PM";
      if (query.toLowerCase().includes('am')) ampm = "AM";
      return h + ":" + m + " " + ampm;
    }
  }
  return null;
}

function findTimeForDuration(query) {
  let lower = query.toLowerCase();
  let requestedDay = days.find(d => lower.includes(d.toLowerCase())) || "Wednesday";
  let exactTime = parseExactTime(query);
  let timeSlotForSave = exactTime ? exactTime : "9:00 AM";
  let timeDisplayText = exactTime ? `${requestedDay} at ${exactTime}` : `${requestedDay}, Morning`;

  let cleanTitle = query.replace(/(\d{1,2})[\.:](\d{2})\s*(am|pm)?/gi, '')
    .replace(/(\d{1,2})\s*(am|pm)/gi, '')
    .replace(/^(can you find me|find me|i need to find time to|i need to find time for|i need to|i need time to|i need time|i need|find time for|find time|find|schedule) /gi, '')
    .replace(/ (on monday|on tuesday|on wednesday|on thursday|on friday|on saturday|on sunday|monday|tuesday|wednesday|thursday|friday|saturday|sunday) /gi, '')
    .replace(/ (at) /gi, '')
    .trim().replace(/^(to|for|a|an|the|my|me|put)\s+/gi, '').trim();

  if (cleanTitle.length < 2 || cleanTitle.toLowerCase() === 'it') cleanTitle = 'Task';
  let taskTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  pendingSuggestion = { taskTitle, day: requestedDay, duration: "30 mins", timeDisplayText, timeSlotForSave };
  const html = `I found a slot on <strong>${timeDisplayText}</strong>.<br><br>Schedule <strong>"${taskTitle}"</strong>?
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn primary-gradient" style="padding:8px;font-size:12px;" onclick="confirmSchedule()">Yes</button>
      <button class="btn secondary-btn" style="padding:8px;font-size:12px;" onclick="cancelSchedule()">No</button>
    </div>`;
  return { html };
}

function confirmSchedule() {
  if (!pendingSuggestion) return;
  const { taskTitle, day, duration, timeDisplayText, timeSlotForSave } = pendingSuggestion;
  state.tasks.unshift({ id: Date.now(), text: taskTitle, day, timeSlot: timeSlotForSave, duration, completed: false });
  saveTasksToStorage(); renderTasks();
  appendChat(`✅ Scheduled <strong>"${taskTitle}"</strong> for ${timeDisplayText}.`, 'assistant');
  pendingSuggestion = null;
}
function cancelSchedule() {
  pendingSuggestion = null;
  appendChat("No problem. Tell me when you need something else scheduled.", 'assistant');
}

function sendAssistantMsg() {
  const input = document.getElementById('assistant-input');
  const raw = input.value.trim(); if (!raw) return;
  appendChat(raw, 'user'); input.value = '';
  
  setTimeout(() => {
    let lower = raw.toLowerCase();
    if (pendingSuggestion && (lower.includes('yes') || lower.includes('sure') || lower.includes('do it'))) {
      confirmSchedule(); return;
    }
    const res = findTimeForDuration(raw);
    appendChat(res.html, 'assistant');
  }, 500);
}
function handleAssistantKey(e) { if (e.key === 'Enter') sendAssistantMsg(); }
function appendChat(msg, type) {
  const log = document.getElementById('chat-log');
  log.innerHTML += `<div class="chat-msg ${type}">${msg}</div>`;
  log.scrollTop = log.scrollHeight;
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function sendSimulatedDockEmail() { closeModal('email-preview-modal'); alert(`🚀 Dispatched from DOCK!`); }
function copyEmailHtmlToClipboard() { closeModal('email-preview-modal'); alert('📋 Copied!'); }

document.getElementById('stripe-checkout-btn')?.addEventListener('click', async () => {
  const btn = document.getElementById('stripe-checkout-btn');
  btn.innerText = "Loading...";
  try {
    const res = await fetch('/api/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url; 
    else { alert("API not detected locally."); btn.innerText = "Upgrade - £2.99/mo"; }
  } catch (error) { alert("Checkout error."); btn.innerText = "Upgrade - £2.99/mo"; }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(()=>{}); });
}

window.onload = initApp;
