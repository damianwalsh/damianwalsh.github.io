function setInitialTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

setInitialTheme();

document.addEventListener('DOMContentLoaded', () => {
  const themeForm = document.getElementById('theme');
  const themeRadios = themeForm.querySelectorAll('input[type="radio"]');
  const hueSlider = document.getElementById('hueSlider');
  const hueValueOutput = document.getElementById('hueValue');

  function updateTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function updateHue() {
    const hueValue = hueSlider.value;
    document.documentElement.style.setProperty('--hue', hueValue);
    hueValueOutput.textContent = hueValue;
    localStorage.setItem('hue', hueValue);
    hueSlider.setAttribute('aria-valuenow', hueValue);
    hueSlider.setAttribute('aria-valuetext', `${hueValue} degrees`);
  }

  function initializeControls() {
    const savedTheme = localStorage.getItem('theme');
    const savedHue = localStorage.getItem('hue');

    if (savedTheme) {
      document.querySelector(`input[value="${savedTheme}"]`).checked = true;
    } else {
      document.querySelector('input[value="auto"]').checked = true;
    }

    if (savedHue) {
      hueSlider.value = savedHue;
      updateHue();
    }
  }

  themeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'auto') {
        updateTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        updateTheme(e.target.value);
      }
    });
  });

  hueSlider.addEventListener('input', updateHue);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (document.querySelector('input[value="auto"]').checked) {
      updateTheme(e.matches ? 'dark' : 'light');
    }
  });

  initializeControls();
});
