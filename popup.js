/* ============================================================
   WhatsApp Privacy Blur — popup.js
   ============================================================ */

const DEFAULTS = {
  enabled: true,
  blurAmount: 8,
  blurMessages: true,
  blurPreviews: true,
  blurMedia: true,
  blurGallery: true,
  blurInput: true,
  blurNames: true,
  blurAvatars: true,
  noTransition: false,
  revealOnAppHover: false,
};

const shell = document.querySelector('.shell');
const masterToggle = document.getElementById('toggle-enabled');
const statusLine = document.getElementById('status-line');
const blurAmountInput = document.getElementById('blur-amount');
const blurAmountValue = document.getElementById('blur-amount-value');
const rows = document.querySelectorAll('.row[data-key]');

/* Load settings and render UI */
chrome.storage.sync.get(DEFAULTS, (stored) => {
  const s = { ...DEFAULTS, ...stored };

  masterToggle.checked = s.enabled;
  setDisabledState(!s.enabled);

  if (blurAmountInput) {
    blurAmountInput.value = String(s.blurAmount);
  }
  if (blurAmountValue) {
    blurAmountValue.textContent = `${s.blurAmount}px`;
  }

  rows.forEach(row => {
    const key = row.dataset.key;
    const input = row.querySelector('input[type="checkbox"]');
    if (input && key in s) {
      input.checked = s[key];
    }
  });

  updateStatus(s);
});

/* Master toggle */
masterToggle.addEventListener('change', () => {
  const enabled = masterToggle.checked;
  setDisabledState(!enabled);
  save({ enabled });
  updateStatusFromUI();
});

if (blurAmountInput && blurAmountValue) {
  blurAmountInput.addEventListener('input', () => {
    const blurAmount = Number(blurAmountInput.value);
    blurAmountValue.textContent = `${blurAmount}px`;
    save({ blurAmount });
  });
}

/* Individual row toggles */
rows.forEach(row => {
  const key = row.dataset.key;
  const input = row.querySelector('input[type="checkbox"]');
  if (!input) return;

  input.addEventListener('change', () => {
    save({ [key]: input.checked });
    updateStatusFromUI();
  });
});

function save(patch) {
  chrome.storage.sync.get(DEFAULTS, (current) => {
    const next = { ...DEFAULTS, ...current, ...patch };
    chrome.storage.sync.set(next);
  });
}

function setDisabledState(disabled) {
  if (disabled) {
    shell.classList.add('disabled');
  } else {
    shell.classList.remove('disabled');
  }
}

function getUIState() {
  const state = {};
  rows.forEach(row => {
    const key = row.dataset.key;
    const input = row.querySelector('input[type="checkbox"]');
    if (input && key) {
      state[key] = input.checked;
    }
  });
  state.enabled = masterToggle.checked;
  return state;
}

function updateStatus(s) {
  if (!s.enabled) {
    statusLine.textContent = 'Blur is OFF — everything visible';
    return;
  }
  const active = Object.entries(s)
    .filter(([k, v]) => v && k.startsWith('blur'))
    .length;
  const isHoverAppEnabled = s.revealOnAppHover === true;
  const hover = isHoverAppEnabled ? 'hover app to reveal all' : 'hover item to reveal';
  statusLine.textContent = `${active} active · ${hover}`;
}

function updateStatusFromUI() {
  const uiState = getUIState();
  updateStatus(uiState);
}

function updateStatusFromStorage() {
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    const s = { ...DEFAULTS, ...stored };
    updateStatus(s);
  });
}
