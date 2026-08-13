const root = document.documentElement;
const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(mode) {
  const shouldUseDark =
    mode === 'dark' ||
    (mode === 'auto' && themeQuery.matches);

  if (shouldUseDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
}

function setInitialTheme() {
  const savedTheme = localStorage.getItem('theme') || 'auto';
  applyTheme(savedTheme);
}

setInitialTheme();

document.addEventListener('DOMContentLoaded', () => {
  const themeForm = document.getElementById('theme');

  if (!themeForm) return;

  const themeRadios = themeForm.querySelectorAll('input[type="radio"]');
  const hueSlider = document.getElementById('hueSlider');

  function updateTheme(mode) {
    localStorage.setItem('theme', mode);
    applyTheme(mode);
  }

  function updateHue() {
    if (!hueSlider) return;

    const hueValue = hueSlider.value;
    root.style.setProperty('--hue', hueValue);
    localStorage.setItem('hue', hueValue);
    hueSlider.setAttribute('aria-valuenow', hueValue);
    hueSlider.setAttribute('aria-valuetext', `${hueValue} degrees`);
  }

  function initializeControls() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    const savedHue = localStorage.getItem('hue');
    const savedThemeRadio = themeForm.querySelector(`input[value="${savedTheme}"]`);

    if (savedThemeRadio) {
      savedThemeRadio.checked = true;
    }

    if (savedHue && hueSlider) {
      hueSlider.value = savedHue;
      updateHue();
    }
  }

  themeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateTheme(e.target.value);
    });
  });

  if (hueSlider) {
    hueSlider.addEventListener('input', updateHue);
  }

  themeQuery.addEventListener('change', () => {
    const savedTheme = localStorage.getItem('theme') || 'auto';

    if (savedTheme === 'auto') {
      applyTheme('auto');
    }
  });

  initializeControls();
});
