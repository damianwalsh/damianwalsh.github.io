document.addEventListener('DOMContentLoaded', () => {
  function toggleDetails() {
    const details = document.querySelector('details');
    if (details) {
      if (window.innerWidth >= 820) {
        details.setAttribute('open', '');
      } else {
        details.removeAttribute('open');
      }
    }
  }

  window.addEventListener('load', toggleDetails);
  window.addEventListener('resize', toggleDetails);
});
