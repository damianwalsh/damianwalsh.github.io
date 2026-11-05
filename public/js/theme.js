const root = document.documentElement;
const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(mode) {
  const shouldUseDark =
    mode === 'dark' || (mode === 'auto' && themeQuery.matches);

  if (shouldUseDark) {
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.removeAttribute('data-theme');
    root.style.colorScheme = 'light';
  }
}

const initialTheme = localStorage.getItem('theme') || 'auto';
const initialHue = localStorage.getItem('hue');

applyTheme(initialTheme);
if (initialHue) {
  root.style.setProperty('--hue', initialHue);
}

document.addEventListener('DOMContentLoaded', () => {
  const themeForm = document.getElementById('theme');
  const hueSlider = document.getElementById('hueSlider');

  function updateTheme(mode) {
    localStorage.setItem('theme', mode);
    applyTheme(mode);
  }

  function updateHue(value) {
    if (!hueSlider) return;
    root.style.setProperty('--hue', value);
    localStorage.setItem('hue', value);
    hueSlider.setAttribute('aria-valuenow', value);
    hueSlider.setAttribute('aria-valuetext', `${value} degrees`);
  }

  function syncFormState() {
    const currentTheme = localStorage.getItem('theme') || 'auto';
    const currentHue = localStorage.getItem('hue');

    if (themeForm) {
      const activeRadio = themeForm.querySelector(`input[value="${currentTheme}"]`);
      if (activeRadio) activeRadio.checked = true;
    }

    if (hueSlider && currentHue) {
      hueSlider.value = currentHue;
      hueSlider.setAttribute('aria-valuenow', currentHue);
      hueSlider.setAttribute('aria-valuetext', `${currentHue} degrees`);
    }
  }

  if (themeForm) {
    const themeRadios = themeForm.querySelectorAll('input[type="radio"]');
    themeRadios.forEach(radio => {
      radio.addEventListener('change', e => updateTheme(e.target.value));
    });
  }

  if (hueSlider) {
    hueSlider.addEventListener('input', e => updateHue(e.target.value));
  }

  const handleSystemThemeChange = () => {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    if (savedTheme === 'auto') applyTheme('auto');
  };

  if (themeQuery.addEventListener) {
    themeQuery.addEventListener('change', handleSystemThemeChange);
  } else {
    themeQuery.addListener(handleSystemThemeChange);
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      applyTheme(e.newValue || 'auto');
      syncFormState();
    }
    if (e.key === 'hue' && e.newValue) {
      updateHue(e.newValue);
    }
  });

  syncFormState();
});
