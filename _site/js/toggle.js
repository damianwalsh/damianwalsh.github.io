document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle').forEach(button => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      if (target && target.getAttribute('role') === 'tooltip') {
        // First hide any visible tooltips
        document.querySelectorAll('[role="tooltip"]:not(.hidden)').forEach(tooltip => {
          if (tooltip !== target) {
            tooltip.classList.add('hidden');
            tooltip.classList.remove('visible');
            // Find and update the associated toggle button
            const toggleButton = document.querySelector(`[data-target="${tooltip.id}"]`);
            if (toggleButton) {
              toggleButton.setAttribute('aria-expanded', 'false');
            }
          }
        });

        // Then toggle the clicked tooltip
        target.classList.toggle('hidden');
        target.classList.toggle('visible');
        button.setAttribute('aria-expanded', button.getAttribute('aria-expanded') !== 'true');
      } else {
        // Handle non-tooltip toggles as before
        target.classList.toggle('hidden');
        target.classList.toggle('visible');
        button.setAttribute('aria-expanded', button.getAttribute('aria-expanded') !== 'true');
      }
    });
  });
});
