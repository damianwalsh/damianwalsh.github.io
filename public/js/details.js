document.addEventListener("DOMContentLoaded", () => {
  const mql = window.matchMedia("(min-width: 820px)");
  const apply = () => {
    document.querySelectorAll("details[data-toggle]")
    .forEach((details) => {
      if (mql.matches) {
        details.setAttribute("open", "");
      } else {
        details.removeAttribute("open");
      }
    });
  };

  apply();
  mql.addEventListener("change", apply);
});
