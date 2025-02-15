document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle').forEach(button => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      if (target) {
        target.classList.toggle('hidden');
        target.classList.toggle('visible');
        button.setAttribute('aria-expanded', button.getAttribute('aria-expanded') !== 'true');
      }
    });
  });
});
