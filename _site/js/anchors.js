document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('#main-nav a');
  let defaultAnchor = null;

  links.forEach((a, i) => {
    if (a.classList.contains('active') || a.getAttribute('aria-current') === 'page') {
      defaultAnchor = `--nav-${i + 1}`;
    }
    a.addEventListener('mouseenter', () => {
      document.documentElement.style.setProperty('--active-anchor', `--nav-${i + 1}`);
    });
    a.addEventListener('mouseleave', () => {
      if (defaultAnchor) {
        document.documentElement.style.setProperty('--active-anchor', defaultAnchor);
      } else {
        document.documentElement.style.removeProperty('--active-anchor');
      }
    });
  });

  // Set the default on page load
  if (defaultAnchor) {
    document.documentElement.style.setProperty('--active-anchor', defaultAnchor);
  } else {
    document.documentElement.style.removeProperty('--active-anchor');
  }
});
